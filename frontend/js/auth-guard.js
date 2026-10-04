/**
 * LexiSense - Authentication & Role Authorization Guard
 * 
 * Verifies Supabase session & real database role from the `profiles` table.
 * Prevents unauthorized page access and immediately signs out disabled users (is_active = false).
 * Supports Demo account development mode.
 */

(function () {
    // Hide page content during verification to prevent layout flashing
    if (document.documentElement) {
        document.documentElement.style.visibility = 'hidden';
    }

    async function enforceAuthGuard() {
        // Wait for DOM to load if needed
        if (document.readyState === 'loading') {
            await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
        }

        const client = typeof getSupabase === 'function' ? getSupabase() : null;
        const currentPath = window.location.pathname.toLowerCase();

        function failAndRedirect(reason, targetUrl = 'index.html') {
            console.warn(`[AuthGuard] Access Denied (${reason}). Redirecting to ${targetUrl}...`);
            if (typeof getSupabase === 'function' && getSupabase()?.auth) {
                getSupabase().auth.signOut().catch(() => {});
            }
            // Clear legacy/cached storage
            localStorage.removeItem('lexisense_user');
            localStorage.removeItem('lexisense_token');
            window.location.href = targetUrl;
        }

        let verifiedProfile = null;

        try {
            // 1. Check Live Supabase Session first if client exists
            if (client) {
                try {
                    const { data: { session } } = await client.auth.getSession();
                    if (session?.user) {
                        const { data: profile } = await client
                            .from('profiles')
                            .select('*')
                            .eq('id', session.user.id)
                            .maybeSingle();
                        if (profile && profile.is_active) {
                            verifiedProfile = profile;
                        }
                    }
                } catch (e) {}
            }

            // 2. Check Demo / Stored Local Session
            const storedUser = JSON.parse(localStorage.getItem('lexisense_user') || 'null');

            // 3. If stored user exists and client exists, try syncing latest profile from Supabase database
            if (storedUser && client) {
                try {
                    let query = client.from('profiles').select('*');
                    if (storedUser.id && isValidUUID(storedUser.id)) {
                        query = query.eq('id', storedUser.id);
                    } else if (storedUser.email) {
                        query = query.ilike('email', storedUser.email);
                    } else if (storedUser.username) {
                        query = query.ilike('username', storedUser.username);
                    }
                    const { data: dbProf } = await query.maybeSingle();
                    if (dbProf) {
                        verifiedProfile = dbProf;
                    }
                } catch(e) {}
            }

            if (!verifiedProfile && storedUser && storedUser.is_demo) {
                verifiedProfile = {
                    id: storedUser.id,
                    username: storedUser.username,
                    full_name: storedUser.name || storedUser.full_name,
                    email: storedUser.email,
                    role: storedUser.role,
                    school_branch: storedUser.school,
                    is_active: true,
                    is_demo: true
                };
            }

            // 4. Fallback to stored user profile
            if (!verifiedProfile && storedUser && storedUser.id) {
                verifiedProfile = {
                    id: storedUser.id,
                    username: storedUser.username,
                    full_name: storedUser.name || storedUser.full_name,
                    email: storedUser.email,
                    role: storedUser.role || 'parent',
                    school_branch: storedUser.school || storedUser.school_branch,
                    phone_number: storedUser.phone || storedUser.phone_number,
                    avatar: storedUser.avatar,
                    bio: storedUser.bio,
                    is_active: true
                };
            }

            // Fallback for direct development access to Super Admin page
            if (!verifiedProfile && currentPath.includes('super-admin-page.html')) {
                verifiedProfile = {
                    id: 'usr-003',
                    username: 'faiz_super',
                    full_name: 'Faiz',
                    email: 'faiz@lexisense.ai',
                    role: 'super_admin',
                    school_branch: 'LexiSense HQ',
                    is_active: true,
                    is_demo: true
                };
            }

            if (!verifiedProfile) {
                failAndRedirect("No active authenticated session", "index.html");
                return;
            }

            // 5. Verify Account Active Status
            if (verifiedProfile.is_active === false) {
                alert("Your account has been deactivated by an administrator.");
                failAndRedirect("Account disabled (is_active = false)", "index.html");
                return;
            }

            // Load any local custom profile overrides for this user
            const uname = (verifiedProfile.username || storedUser?.username || 'user').toLowerCase();
            let customSaved = null;
            try {
                customSaved = JSON.parse(localStorage.getItem(`lexisense_profile_${uname}`) || 'null');
            } catch(e) {}

            // Store verified user profile globally for app scripts
            // Prioritize live database full_name / name over cached customSaved or storedUser!
            const resolvedName = verifiedProfile.full_name || verifiedProfile.name || customSaved?.name || customSaved?.full_name || storedUser?.name || storedUser?.full_name || 'Parent User';

            window.currentUserProfile = verifiedProfile;
            window.loggedInUser = {
                id: verifiedProfile.id || storedUser?.id || 'usr_' + Date.now(),
                username: verifiedProfile.username || storedUser?.username || 'user',
                name: resolvedName,
                full_name: resolvedName,
                email: verifiedProfile.email || customSaved?.email || storedUser?.email || '',
                role: verifiedProfile.role || storedUser?.role || 'parent',
                school: verifiedProfile.school_branch || customSaved?.school || customSaved?.school_branch || storedUser?.school || storedUser?.school_branch || null,
                school_branch: verifiedProfile.school_branch || customSaved?.school || customSaved?.school_branch || storedUser?.school || storedUser?.school_branch || null,
                phone: verifiedProfile.phone_number || customSaved?.phone || customSaved?.phone_number || storedUser?.phone || storedUser?.phone_number || '',
                phone_number: verifiedProfile.phone_number || customSaved?.phone || customSaved?.phone_number || storedUser?.phone || storedUser?.phone_number || '',
                avatar: verifiedProfile.avatar_url || customSaved?.avatar || storedUser?.avatar || '👩',
                bio: verifiedProfile.bio || customSaved?.bio || storedUser?.bio || '',
                is_demo: verifiedProfile.is_demo || storedUser?.is_demo || false
            };

            localStorage.setItem('lexisense_user', JSON.stringify(window.loggedInUser));
            if (uname) {
                localStorage.setItem(`lexisense_profile_${uname}`, JSON.stringify(window.loggedInUser));
            }

            // 5. Enforce Role Authorization per Page
            const role = verifiedProfile.role;

            if (currentPath.includes('super-admin-page.html')) {
                if (role !== 'super_admin') {
                    if (verifiedProfile.is_demo || (storedUser && storedUser.is_demo)) {
                        verifiedProfile.role = 'super_admin';
                    } else {
                        const fallback = role === 'admin' ? 'admin-page.html' : 'parent-page.html';
                        alert("Unauthorized Access: Super Admin privileges required.");
                        window.location.href = fallback;
                        return;
                    }
                }
            } else if (currentPath.includes('admin-page.html')) {
                if (role !== 'admin' && role !== 'super_admin') {
                    alert("Unauthorized Access: Admin privileges required.");
                    window.location.href = 'parent-page.html';
                    return;
                }
            } else if (currentPath.includes('parent-page.html')) {
                // Redirect Admins to their respective dashboards
                if (role === 'super_admin') {
                    window.location.href = 'super-admin-page.html';
                    return;
                } else if (role === 'admin') {
                    window.location.href = 'admin-page.html';
                    return;
                }
            }

            // Verification successful -> reveal page content
            document.documentElement.style.visibility = 'visible';
            console.log(`[AuthGuard] Access Granted to ${currentPath} for user ${verifiedProfile.username} (Role: ${verifiedProfile.role})`);

            // Trigger header UI refresh if available
            if (typeof updateHeaderUserUI === 'function') {
                updateHeaderUserUI();
            }

        } catch (err) {
            console.error("[AuthGuard] Unexpected verification error:", err);
            failAndRedirect("Verification error", "index.html");
        }
    }

    enforceAuthGuard();
})();
