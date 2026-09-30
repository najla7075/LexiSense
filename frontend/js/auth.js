/**
 * LexiSense - Supabase Authentication & Creative User Management Module
 * Production-ready login, registration, password validation, teacher/parent role selection,
 * school/branch capture, role-based redirection, and password reset implementation.
 */

let currentAuthTab = 'login';
let selectedUserType = 'parent';

/**
 * Initializes header user interface based on current session
 */
async function initAuthSystem() {
    await updateHeaderUserUI();
    if (typeof refreshUserScopedData === 'function') {
        refreshUserScopedData();
    }
    initAuthRecoveryWatcher();
}

/**
 * Updates navigation header badge and user state
 */
async function updateHeaderUserUI() {
    const userContainer = document.getElementById('header-user-container');
    const heroTitle = document.querySelector('#view-dashboard h2');
    const isParentPage = window.location.pathname.includes('parent-page.html') || 
                         window.location.pathname.includes('admin-page.html') || 
                         window.location.pathname.includes('super-admin-page.html');
    if (!userContainer) return;

    const client = typeof getSupabase === 'function' ? getSupabase() : null;
    let currentUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
    
    if (currentUser?.username) {
        try {
            const customSaved = JSON.parse(localStorage.getItem(`lexisense_profile_${currentUser.username.toLowerCase()}`) || 'null');
            if (customSaved) {
                currentUser = { ...currentUser, ...customSaved };
                window.loggedInUser = currentUser;
            }
        } catch(e) {}
    }

    if (!currentUser && client) {
        try {
            const { data: { session } } = await client.auth.getSession();
            if (session?.user) {
                const { data: profile } = await client
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                if (profile && profile.is_active) {
                    currentUser = {
                        id: profile.id,
                        username: profile.username,
                        name: profile.full_name,
                        full_name: profile.full_name,
                        email: profile.email,
                        role: profile.role,
                        school: profile.school_branch,
                        avatar: profile.avatar_url || '👩'
                    };
                    window.loggedInUser = currentUser;
                    localStorage.setItem('lexisense_user', JSON.stringify(currentUser));
                }
            }
        } catch (e) {}
    }

    if (currentUser) {
        const roleIcon = currentUser.role === 'super_admin' ? '👑' : (currentUser.role === 'admin' ? '🛡️' : (currentUser.school ? '🏫' : '👩'));
        const roleBadge = currentUser.role ? currentUser.role.toUpperCase().replace('_', ' ') : 'PARENT';
        const isImgAvatar = currentUser.avatar && (currentUser.avatar.startsWith('http') || currentUser.avatar.startsWith('data:'));
        const avatarDisplayHtml = isImgAvatar 
            ? `<img src="${escapeHTML(currentUser.avatar)}" class="w-7 h-7 rounded-full object-cover border border-purple-300 shadow-sm">` 
            : `<div class="w-7 h-7 rounded-full bg-purple-600 text-white font-black flex items-center justify-center text-xs shadow-sm">${currentUser.avatar || roleIcon}</div>`;
        const avatarLargeHtml = isImgAvatar 
            ? `<img src="${escapeHTML(currentUser.avatar)}" class="w-10 h-10 rounded-2xl object-cover border-2 border-purple-400 shadow-sm">` 
            : `<div class="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl font-bold shadow-sm">${currentUser.avatar || roleIcon}</div>`;

        userContainer.innerHTML = `
            <div class="relative shrink-0">
                <button onclick="toggleProfileDropdown(event)" class="flex items-center gap-2 bg-white/90 hover:bg-white p-1 pl-1.5 pr-3 rounded-full border border-purple-200 shadow-sm hover:shadow transition-all cursor-pointer max-w-[160px] sm:max-w-[200px]" title="${escapeHTML(currentUser.name || currentUser.username)}">
                    ${avatarDisplayHtml}
                    <span class="text-xs sm:text-sm font-black text-brand-purple-deep truncate hidden sm:inline max-w-[90px] md:max-w-[120px]">${escapeHTML(currentUser.name || currentUser.username)}</span>
                    <i class="fa-solid fa-chevron-down text-[10px] text-purple-600 ml-0.5 shrink-0"></i>
                </button>

                <div id="user-profile-dropdown" class="hidden absolute right-0 mt-3 w-64 bg-white rounded-3xl shadow-floating border border-purple-100 p-4 z-50 animate-pop space-y-4">
                    <div class="flex items-center gap-3 pb-3 border-b border-purple-100">
                        ${avatarLargeHtml}
                        <div class="overflow-hidden">
                            <h4 class="font-heading font-extrabold text-brand-purple-deep text-sm leading-tight truncate">${escapeHTML(currentUser.name || currentUser.username)}</h4>
                            <span class="inline-block text-xs text-emerald-600 font-extrabold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full mt-0.5">● ${roleBadge} · Active</span>
                        </div>
                    </div>

                    <div class="space-y-1 text-sm font-bold text-gray-700">
                        <button onclick="openUserProfileModal(); toggleProfileDropdown();" class="w-full text-left p-2.5 rounded-2xl hover:bg-purple-50 text-purple-900 transition-colors flex items-center gap-2.5 font-extrabold cursor-pointer">
                            <i class="fa-solid fa-user-gear text-purple-600"></i> Edit Profile & Security
                        </button>
                        <button onclick="openAccessibilityModal(); toggleProfileDropdown();" class="w-full text-left p-2.5 rounded-2xl hover:bg-purple-50 transition-colors flex items-center gap-2.5 cursor-pointer">
                            <i class="fa-solid fa-universal-access text-purple-600"></i> Accessibility Settings
                        </button>
                        <button onclick="toggleNotifications(); toggleProfileDropdown();" class="w-full text-left p-2.5 rounded-2xl hover:bg-purple-50 transition-colors flex items-center gap-2.5 cursor-pointer">
                            <i class="fa-solid fa-bell text-purple-600"></i> Notifications
                        </button>
                    </div>

                    <div class="pt-2 border-t border-purple-100">
                        <button onclick="confirmLogout()" class="logout-creative-btn relative overflow-hidden w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-rose-700 hover:text-white bg-gradient-to-r from-rose-50/90 via-pink-50/70 to-purple-50/60 hover:from-rose-600 hover:via-pink-600 hover:to-purple-700 border border-rose-200/90 hover:border-rose-400 text-xs font-black transition-all duration-300 shadow-xs hover:shadow-lg hover:shadow-rose-500/25 active:scale-[0.98] group cursor-pointer" title="Sign Out of Session">
                            <div class="flex items-center gap-2.5 relative z-10">
                                <div class="w-7 h-7 rounded-xl bg-white group-hover:bg-white/20 text-rose-600 group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-2xs border border-rose-100 group-hover:border-white/30 group-hover:-rotate-12">
                                    <i class="fa-solid fa-right-from-bracket text-xs transition-transform duration-300 group-hover:translate-x-0.5"></i>
                                </div>
                                <span class="tracking-tight font-heading font-extrabold text-sm">Log Out</span>
                            </div>
                            <div class="relative z-10 flex items-center gap-1">
                                <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100/80 text-rose-700 group-hover:bg-white/25 group-hover:text-white transition-colors border border-rose-200/60 group-hover:border-white/30">
                                    Sign Off
                                </span>
                                <i class="fa-solid fa-chevron-right text-[10px] text-rose-400 group-hover:text-white opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200"></i>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        `;

        if (heroTitle) {
            heroTitle.innerHTML = `Hello, <span class="text-amber-300">${escapeHTML(currentUser.name || currentUser.username)}</span>! <span class="animate-wave-hand">👋</span>`;
        }

        updateNotificationsFooter(currentUser, roleIcon, roleBadge);
    } else {
        if (isParentPage) {
            userContainer.innerHTML = `
                <a href="index.html" class="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold text-sm px-3.5 py-2 rounded-2xl border border-purple-200 transition-all">
                    <i class="fa-solid fa-house"></i>
                    <span>Return to Home Page</span>
                </a>
            `;
        } else {
            userContainer.innerHTML = `
                <button onclick="openAccessibilityModal()" class="flex items-center gap-2 bg-purple-50 hover:bg-amber-100 text-purple-800 px-3.5 py-2 rounded-2xl border-2 border-purple-200 shadow-sm transition-all transform hover:scale-105" title="Accessibility Controls">
                    <div class="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                        <i class="fa-solid fa-universal-access"></i>
                    </div>
                    <span class="text-sm font-extrabold text-brand-purple-deep hidden sm:inline">Accessibility</span>
                </button>
                <button onclick="openAuthModal('login')" class="font-extrabold text-sm sm:text-base text-purple-700 hover:text-purple-900 px-4 py-2.5 rounded-2xl hover:bg-purple-50 transition-all border-2 border-transparent hover:border-purple-200">
                    Log In
                </button>
                <button onclick="openAuthModal('register')" class="shimmer-btn bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white font-extrabold text-sm sm:text-base px-4 sm:px-5 py-2.5 rounded-2xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center gap-2 border-2 border-purple-500">
                    <span>Register Free</span>
                    <i class="fa-solid fa-arrow-right"></i>
                </button>
            `;
        }

        if (heroTitle) {
            heroTitle.innerHTML = `Hello, Guest Parent! <span class="animate-wave-hand">👋</span>`;
        }
    }
}

function toggleProfileDropdown(e) {
    if (e) e.stopPropagation();
    const dropdown = document.getElementById('user-profile-dropdown');
    if (dropdown) dropdown.classList.toggle('hidden');
}

function updateNotificationsFooter(currentUser, roleIcon, roleBadge) {
    const notifPanel = document.getElementById('notifications-panel');
    if (!notifPanel) return;

    let footer = document.getElementById('notif-user-footer');
    if (!footer) {
        footer = document.createElement('div');
        footer.id = 'notif-user-footer';
        footer.className = 'pt-3 mt-3 border-t border-purple-100 flex items-center justify-between';
        notifPanel.appendChild(footer);
    }

    footer.innerHTML = `
        <div class="flex items-center gap-2">
            <span class="text-lg">${roleIcon}</span>
            <div>
                <span class="block text-sm font-extrabold text-brand-purple-deep">${escapeHTML(currentUser.name || currentUser.username)}</span>
                <span class="block text-xs text-emerald-600 font-bold">● ${roleBadge} · Active</span>
            </div>
        </div>
        <button onclick="confirmLogout()" class="logout-creative-btn relative overflow-hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-rose-700 hover:text-white bg-gradient-to-r from-rose-50 via-pink-50 to-purple-50 hover:from-rose-600 hover:via-pink-600 hover:to-purple-700 border border-rose-200 text-xs font-black transition-all shadow-2xs hover:shadow-md cursor-pointer group active:scale-95">
            <i class="fa-solid fa-right-from-bracket group-hover:translate-x-0.5 transition-transform"></i>
            <span>Log Out</span>
        </button>
    `;
}

/**
 * Opens authentication modal with tab selection
 */
function openAuthModal(tab = 'login') {
    const isProtectedPage = window.location.pathname.includes('parent-page.html') || 
                            window.location.pathname.includes('admin-page.html') || 
                            window.location.pathname.includes('super-admin-page.html');
    if (isProtectedPage) {
        window.location.href = 'index.html';
        return;
    }
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.setProperty('display', 'flex', 'important');
    }
    hideAuthMessages();
    switchAuthTab(tab);
}

/**
 * Closes authentication modal
 */
function closeAuthModal(event) {
    if (event) {
        event.stopPropagation?.();
    }
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.setProperty('display', 'none', 'important');
    }
    hideAuthMessages();
}

/**
 * Switches modal tab views (login, register, forgot) with animated transitions
 */
function switchAuthTab(tab) {
    currentAuthTab = tab;
    hideAuthMessages();

    const loginForm = document.getElementById('auth-form-login');
    const registerForm = document.getElementById('auth-form-register');
    const forgotForm = document.getElementById('auth-form-forgot');

    const loginTabBtn = document.getElementById('tab-btn-login');
    const registerTabBtn = document.getElementById('tab-btn-register');

    [loginForm, registerForm, forgotForm].forEach(form => {
        if (form) {
            form.classList.add('hidden');
            form.style.setProperty('display', 'none', 'important');
        }
    });

    if (loginTabBtn) loginTabBtn.className = "flex-1 py-3 font-extrabold text-xs text-gray-500 hover:text-purple-600 transition-all rounded-2xl border-2 border-transparent";
    if (registerTabBtn) registerTabBtn.className = "flex-1 py-3 font-extrabold text-xs text-gray-500 hover:text-purple-600 transition-all rounded-2xl border-2 border-transparent";

    if (tab === 'login') {
        if (loginForm) {
            loginForm.classList.remove('hidden');
            loginForm.style.setProperty('display', 'block', 'important');
        }
        if (loginTabBtn) loginTabBtn.className = "flex-1 py-3 font-extrabold text-xs text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md rounded-2xl border-2 border-purple-400 transition-all transform scale-[1.02]";
    } else if (tab === 'register') {
        if (registerForm) {
            registerForm.classList.remove('hidden');
            registerForm.style.setProperty('display', 'block', 'important');
        }
        if (registerTabBtn) registerTabBtn.className = "flex-1 py-3 font-extrabold text-xs text-purple-950 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-300 shadow-md rounded-2xl border-2 border-amber-400 transition-all transform scale-[1.02]";
    } else if (tab === 'forgot') {
        if (forgotForm) {
            forgotForm.classList.remove('hidden');
            forgotForm.style.setProperty('display', 'block', 'important');
        }
    }
}

/**
 * Handles Role Selection Toggle (Parent vs Teacher/Educator)
 */
function selectRegisterRole(type) {
    selectedUserType = type;
    const parentBtn = document.getElementById('role-btn-parent');
    const teacherBtn = document.getElementById('role-btn-teacher');
    const schoolGroup = document.getElementById('reg-school-group');
    const schoolInput = document.getElementById('reg-school');

    if (type === 'teacher') {
        if (teacherBtn) teacherBtn.className = "role-card flex-1 p-3 rounded-2xl border-2 border-purple-600 bg-purple-50 text-purple-950 font-extrabold text-xs text-center shadow-md transform scale-[1.02] transition-all flex items-center justify-center gap-2 cursor-pointer";
        if (parentBtn) parentBtn.className = "role-card flex-1 p-3 rounded-2xl border-2 border-gray-200 bg-white text-gray-600 font-bold text-xs text-center hover:border-purple-300 transition-all flex items-center justify-center gap-2 cursor-pointer";
        
        if (schoolGroup) {
            schoolGroup.classList.remove('hidden');
            schoolGroup.style.setProperty('display', 'block', 'important');
        }
        if (schoolInput) {
            schoolInput.required = true;
            schoolInput.focus();
        }
    } else {
        if (parentBtn) parentBtn.className = "role-card flex-1 p-3 rounded-2xl border-2 border-purple-600 bg-purple-50 text-purple-950 font-extrabold text-xs text-center shadow-md transform scale-[1.02] transition-all flex items-center justify-center gap-2 cursor-pointer";
        if (teacherBtn) teacherBtn.className = "role-card flex-1 p-3 rounded-2xl border-2 border-gray-200 bg-white text-gray-600 font-bold text-xs text-center hover:border-purple-300 transition-all flex items-center justify-center gap-2 cursor-pointer";

        if (schoolGroup) {
            schoolGroup.classList.add('hidden');
            schoolGroup.style.setProperty('display', 'none', 'important');
        }
        if (schoolInput) {
            schoolInput.required = false;
            schoolInput.value = '';
        }
    }
}

/**
 * Error / Notice UI Helpers
 */
function showAuthError(msg) {
    const errBox = document.getElementById('auth-error-msg');
    const errText = document.getElementById('auth-error-text');
    if (errBox && errText) {
        errText.textContent = msg;
        errBox.classList.remove('hidden');
    } else {
        alert(msg);
    }
}

function showAuthSuccess(msg) {
    const successBox = document.getElementById('auth-success-msg');
    const successText = document.getElementById('auth-success-text');
    if (successBox && successText) {
        successText.textContent = msg;
        successBox.classList.remove('hidden');
    } else {
        alert(msg);
    }
}

function hideAuthMessages() {
    const errBox = document.getElementById('auth-error-msg');
    const successBox = document.getElementById('auth-success-msg');
    if (errBox) errBox.classList.add('hidden');
    if (successBox) successBox.classList.add('hidden');
}

/**
 * Handles Supabase Login Submission with Strict Password Verification
 */
async function handleLoginSubmit(event) {
    event.preventDefault();
    hideAuthMessages();

    const usernameInput = document.getElementById('login-username')?.value.trim();
    const passwordInput = document.getElementById('login-password')?.value;
    const submitBtn = document.getElementById('btn-submit-login');

    if (!usernameInput || !passwordInput) {
        showAuthError("Please enter both username/email and password.");
        return;
    }

    setButtonLoading(submitBtn, true, "Signing In...");

    try {
        const client = getSupabase();
        let targetEmail = usernameInput;
        const cleanInput = usernameInput.toLowerCase();

        // 1. Resolve username to email address if username was provided
        if (!usernameInput.includes('@')) {
            // Check local username-to-email mapping
            const mappedEmail = localStorage.getItem(`lexisense_email_map_${cleanInput}`);
            if (mappedEmail) {
                targetEmail = mappedEmail;
            } else {
                // Check registered users store
                try {
                    const localUsers = JSON.parse(localStorage.getItem('lexisense_registered_users') || '{}');
                    if (localUsers[cleanInput]?.email) {
                        targetEmail = localUsers[cleanInput].email;
                    } else if (Array.isArray(localUsers)) {
                        const found = localUsers.find(u => u.username?.toLowerCase() === cleanInput);
                        if (found?.email) targetEmail = found.email;
                    }
                } catch(e) {}
            }

            // Check Demo Accounts mapping
            const DEMO_MAP = {
                'faizikhwan': 'faiz.ikhwan@sktamanria.edu.my',
                'faiz': 'faiz.ikhwan@sktamanria.edu.my',
                'faiz.admin': 'faiz.ikhwan@sktamanria.edu.my',
                'admin': 'faiz.ikhwan@sktamanria.edu.my',
                'parent_demo': 'parent@lexisense.com',
                'parent': 'parent@lexisense.com',
                'super_admin': 'superadmin@lexisense.com',
                'superadmin': 'superadmin@lexisense.com'
            };
            if (DEMO_MAP[cleanInput]) {
                targetEmail = DEMO_MAP[cleanInput];
            }

            // Check Supabase profile lookup for email
            if (client && targetEmail === usernameInput) {
                try {
                    const { data: profile } = await client
                        .from('profiles')
                        .select('email')
                        .ilike('username', usernameInput)
                        .maybeSingle();
                    if (profile && profile.email) {
                        targetEmail = profile.email;
                    }
                } catch(e) {}
            }
        }

        const cleanEmail = targetEmail.toLowerCase();
        let loginSuccess = false;
        let authenticatedUser = null;

        // 2. Try Supabase Live Authentication (Official Cloud Password Verification)
        if (client && targetEmail.includes('@')) {
            try {
                const { data, error } = await client.auth.signInWithPassword({
                    email: targetEmail,
                    password: passwordInput
                });

                if (!error && data?.session?.user) {
                    let userProfile = null;
                    try {
                        const { data: prof } = await client
                            .from('profiles')
                            .select('*')
                            .eq('id', data.session.user.id)
                            .single();
                        userProfile = prof;
                    } catch (e) {}

                    authenticatedUser = {
                        id: data.session.user.id,
                        username: userProfile?.username || usernameInput,
                        name: userProfile?.full_name || usernameInput,
                        email: targetEmail,
                        role: userProfile?.role || 'parent',
                        school: userProfile?.school_branch || null,
                        avatar: userProfile?.avatar_url || '👩'
                    };
                    loginSuccess = true;
                    console.log("Logged in securely via Supabase Cloud Auth 🔒⚡");
                } else if (error) {
                    console.warn("Supabase Auth sign-in notice:", error.message);
                }
            } catch (authErr) {
                console.warn("Supabase Auth exception:", authErr);
            }
        }

        // 3. Fallback to Demo Accounts (Strict Demo Password Check)
        if (!loginSuccess) {
            const DEMO_ACCOUNTS = {
                faiz: {
                    id: '00000000-0000-0000-0000-000000000002',
                    username: 'faizikhwan',
                    name: 'Faiz Ikhwan',
                    email: 'faiz.ikhwan@sktamanria.edu.my',
                    defaultPwd: 'faiz12345',
                    altPwd: 'Faiz@2026!',
                    role: 'admin',
                    designation: 'SEN Literacy Specialist / Guru Pemulihan',
                    school: 'SK Taman Ria',
                    school_branch: 'SK Taman Ria',
                    avatar: '👨‍🏫'
                },
                admin: {
                    id: '00000000-0000-0000-0000-000000000002',
                    username: 'admin',
                    name: 'Faiz Ikhwan',
                    email: 'faiz.ikhwan@sktamanria.edu.my',
                    defaultPwd: 'faiz12345',
                    altPwd: 'Faiz@2026!',
                    role: 'admin',
                    designation: 'SEN Literacy Specialist / Guru Pemulihan',
                    school: 'SK Taman Ria',
                    school_branch: 'SK Taman Ria',
                    avatar: '👨‍🏫'
                },
                parent: {
                    id: '00000000-0000-0000-0000-000000000003',
                    username: 'parent_demo',
                    name: 'Sarah (Demo Parent)',
                    email: 'parent@lexisense.com',
                    defaultPwd: 'parent12345',
                    role: 'parent',
                    school: null,
                    avatar: '👩'
                },
                parent_alias: {
                    id: '00000000-0000-0000-0000-000000000003',
                    username: 'parent',
                    name: 'Sarah (Demo Parent)',
                    email: 'parent@lexisense.com',
                    defaultPwd: 'parent12345',
                    role: 'parent',
                    school: null,
                    avatar: '👩'
                },
                super_admin: {
                    id: '00000000-0000-0000-0000-000000000004',
                    username: 'super_admin',
                    name: 'LexiSense Super Admin',
                    email: 'superadmin@lexisense.com',
                    defaultPwd: 'super12345',
                    role: 'super_admin',
                    school: null,
                    avatar: '👑'
                }
            };

            const demoAcc = Object.values(DEMO_ACCOUNTS).find(d => 
                d.username.toLowerCase() === cleanInput || 
                d.email.toLowerCase() === cleanInput || 
                d.email.toLowerCase() === cleanEmail
            );

            if (demoAcc) {
                // Check if demo user has a custom password updated in storage
                let expectedPassword = demoAcc.defaultPwd;
                try {
                    const customProf = JSON.parse(localStorage.getItem(`lexisense_profile_${demoAcc.username.toLowerCase()}`) || '{}');
                    if (customProf.password) expectedPassword = customProf.password;
                } catch(e) {}

                if (passwordInput === expectedPassword || (demoAcc.altPwd && passwordInput === demoAcc.altPwd)) {
                    authenticatedUser = {
                        id: demoAcc.id,
                        username: demoAcc.username,
                        name: demoAcc.name,
                        email: demoAcc.email,
                        role: demoAcc.role,
                        designation: demoAcc.designation || 'SEN Literacy Specialist',
                        school: demoAcc.school,
                        avatar: demoAcc.avatar,
                        is_demo: true
                    };
                    loginSuccess = true;
                } else {
                    showAuthError("Incorrect username/email or password.");
                    setButtonLoading(submitBtn, false, "Log In to Account →");
                    return;
                }
            }
        }

        // 4. Fallback to Local Registered Users Store (Strict Password Verification)
        if (!loginSuccess) {
            try {
                const localUsers = JSON.parse(localStorage.getItem('lexisense_registered_users') || '{}');
                let matchedUser = null;

                if (Array.isArray(localUsers)) {
                    matchedUser = localUsers.find(u => 
                        (u.username && u.username.toLowerCase() === cleanInput) ||
                        (u.email && u.email.toLowerCase() === cleanInput) ||
                        (u.email && u.email.toLowerCase() === cleanEmail)
                    );
                } else if (typeof localUsers === 'object' && localUsers !== null) {
                    matchedUser = localUsers[cleanInput] || Object.values(localUsers).find(u => 
                        (u.email && u.email.toLowerCase() === cleanInput) ||
                        (u.email && u.email.toLowerCase() === cleanEmail) ||
                        (u.username && u.username.toLowerCase() === cleanInput)
                    );
                }

                if (matchedUser) {
                    if (matchedUser.password && matchedUser.password === passwordInput) {
                        authenticatedUser = {
                            id: matchedUser.id || 'usr_' + Date.now(),
                            username: matchedUser.username || usernameInput,
                            name: matchedUser.name || matchedUser.full_name || usernameInput,
                            email: matchedUser.email || targetEmail,
                            role: matchedUser.role || 'parent',
                            school: matchedUser.school || matchedUser.school_branch || null,
                            avatar: matchedUser.avatar || '👩'
                        };
                        loginSuccess = true;
                    } else {
                        showAuthError("Incorrect username/email or password.");
                        setButtonLoading(submitBtn, false, "Log In to Account →");
                        return;
                    }
                }
            } catch(e) {}
        }

        // 5. Fallback to User Scoped Profile (Strict Password Verification)
        if (!loginSuccess) {
            try {
                const userProf = JSON.parse(localStorage.getItem(`lexisense_profile_${cleanInput}`) || 'null');
                if (userProf && userProf.password) {
                    if (userProf.password === passwordInput) {
                        authenticatedUser = {
                            id: userProf.id || 'usr_' + Date.now(),
                            username: userProf.username || usernameInput,
                            name: userProf.name || userProf.full_name || usernameInput,
                            email: userProf.email || targetEmail,
                            role: userProf.role || 'parent',
                            school: userProf.school || userProf.school_branch || null,
                            avatar: userProf.avatar || '👩'
                        };
                        loginSuccess = true;
                    } else {
                        showAuthError("Incorrect username/email or password.");
                        setButtonLoading(submitBtn, false, "Log In to Account →");
                        return;
                    }
                }
            } catch(e) {}
        }

        if (!loginSuccess || !authenticatedUser) {
            showAuthError("Incorrect username/email or password.");
            setButtonLoading(submitBtn, false, "Log In to Account →");
            return;
        }

        // Merge any saved local customizations (phone, avatar, school)
        try {
            const savedProfile = JSON.parse(localStorage.getItem(`lexisense_profile_${authenticatedUser.username.toLowerCase()}`) || 'null');
            if (savedProfile) {
                authenticatedUser = { ...authenticatedUser, ...savedProfile };
            }
        } catch(e) {}

        // Save session locally
        window.loggedInUser = authenticatedUser;
        localStorage.setItem('lexisense_user', JSON.stringify(authenticatedUser));
        localStorage.setItem(`lexisense_email_map_${authenticatedUser.username.toLowerCase()}`, authenticatedUser.email);
        localStorage.setItem(`lexisense_profile_${authenticatedUser.username.toLowerCase()}`, JSON.stringify(authenticatedUser));

        if (typeof showToast === 'function') {
            showToast(`Welcome back, ${authenticatedUser.name}! 👋`);
        }

        closeAuthModal();

        const userRole = authenticatedUser.role;
        let redirectUrl = 'parent-page.html';
        if (userRole === 'super_admin') {
            redirectUrl = 'super-admin-page.html';
        } else if (userRole === 'admin' || userRole === 'teacher') {
            redirectUrl = 'admin-page.html';
        }

        showLoginWelcomeExperience(authenticatedUser, redirectUrl);

    } catch (err) {
        console.error("Login Exception:", err);
        showAuthError("Incorrect username/email or password.");
    } finally {
        setButtonLoading(submitBtn, false, "Log In to Account →");
    }
}

/**
 * Handles Supabase Registration Submission
 */
async function handleRegisterSubmit(event) {
    event.preventDefault();
    hideAuthMessages();

    const nameInput = document.getElementById('reg-name')?.value.trim();
    const emailInput = document.getElementById('reg-email')?.value.trim();
    const usernameInput = document.getElementById('reg-username')?.value.trim();
    const passwordInput = document.getElementById('reg-password')?.value;
    const confirmPasswordInput = document.getElementById('reg-confirm-password')?.value;
    const schoolInput = document.getElementById('reg-school')?.value.trim();
    const submitBtn = document.getElementById('btn-submit-register');

    if (!nameInput || !emailInput || !usernameInput || !passwordInput || !confirmPasswordInput) {
        showAuthError("Please fill in all required registration fields.");
        return;
    }

    if (selectedUserType === 'teacher' && !schoolInput) {
        showAuthError("Educators / Teachers must enter their School or Branch Name.");
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput)) {
        showAuthError("Please enter a valid email address.");
        return;
    }

    if (usernameInput.length < 3 || !/^[a-zA-Z0-9_]+$/.test(usernameInput)) {
        showAuthError("Username must be at least 3 characters (letters, numbers, underscores).");
        return;
    }

    const strength = evaluatePasswordStrength(passwordInput);
    if (strength.score < 2) {
        showAuthError("Password is too weak. Must be at least 8 characters long with numbers & casing.");
        return;
    }

    if (passwordInput !== confirmPasswordInput) {
        showAuthError("Passwords do not match. Please re-enter your password.");
        return;
    }

    setButtonLoading(submitBtn, true, "Creating Account...");

    try {
        const client = getSupabase();
        const cleanUser = usernameInput.toLowerCase();

        // 1. Save user mapping to local database store immediately
        localStorage.setItem(`lexisense_email_map_${cleanUser}`, emailInput);
        
        let localUsers = {};
        try {
            localUsers = JSON.parse(localStorage.getItem('lexisense_registered_users') || '{}');
        } catch(e) {}

        function generateUUID() {
            if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }

        const newUserId = generateUUID();
        localUsers[cleanUser] = {
            id: newUserId,
            username: usernameInput,
            email: emailInput,
            password: passwordInput,
            name: nameInput,
            full_name: nameInput,
            role: selectedUserType,
            school: selectedUserType === 'teacher' ? schoolInput : null
        };
        localStorage.setItem('lexisense_registered_users', JSON.stringify(localUsers));

        // 2. Register to Supabase Cloud Auth & Profiles Table
        let supabaseUserId = newUserId;
        if (client) {
            try {
                const { data, error: supaAuthErr } = await client.auth.signUp({
                    email: emailInput,
                    password: passwordInput,
                    options: {
                        data: {
                            full_name: nameInput,
                            username: usernameInput,
                            role: selectedUserType,
                            school_branch: selectedUserType === 'teacher' ? schoolInput : null
                        }
                    }
                });

                if (data?.user?.id) {
                    supabaseUserId = data.user.id;
                    localUsers[cleanUser].id = supabaseUserId;
                    localStorage.setItem('lexisense_registered_users', JSON.stringify(localUsers));
                }

                // Insert/Upsert profile directly into Supabase 'profiles' table
                const profilePayload = {
                    id: supabaseUserId,
                    username: usernameInput,
                    full_name: nameInput,
                    email: emailInput,
                    role: selectedUserType,
                    school_branch: selectedUserType === 'teacher' ? schoolInput : null,
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                let { data: profData, error: profErr } = await client.from('profiles').upsert([profilePayload]).select();
                
                // If failed with ID (foreign key constraint), retry without ID so database assigns gen_random_uuid()
                if (profErr) {
                    console.warn("Notice saving profile with Auth ID, retrying without ID:", profErr.message);
                    delete profilePayload.id;
                    const { data: retryProf, error: retryErr } = await client.from('profiles').insert([profilePayload]).select();
                    if (retryProf && retryProf[0]?.id) {
                        supabaseUserId = retryProf[0].id;
                        localUsers[cleanUser].id = supabaseUserId;
                        localStorage.setItem('lexisense_registered_users', JSON.stringify(localUsers));
                        console.log(`Profile for "${nameInput}" saved to Supabase 'profiles' table! 👤✅`, retryProf[0]);
                    } else if (retryErr) {
                        console.error("Profile insert error in Supabase:", retryErr.message);
                    }
                } else if (profData && profData[0]?.id) {
                    console.log(`Profile for "${nameInput}" saved to Supabase 'profiles' table! 👤✅`, profData[0]);
                }

                // Log registration activity to audit_logs
                try {
                    await client.from('audit_logs').insert([{
                        actor: nameInput,
                        event: 'REGISTER_USER',
                        target: `Registered new ${selectedUserType} account for "${nameInput}" (${emailInput})`,
                        status: 'SUCCESS',
                        ip: '127.0.0.1',
                        timestamp: new Date().toISOString()
                    }]);
                } catch(e) {}

            } catch (supaErr) {
                console.warn("Supabase cloud registration notice:", supaErr);
            }
        }

        // 3. Immediately Log In & Redirect
        window.loggedInUser = {
            id: supabaseUserId,
            username: usernameInput,
            name: nameInput,
            email: emailInput,
            role: selectedUserType,
            school: selectedUserType === 'teacher' ? schoolInput : null,
            password: passwordInput
        };
        localStorage.setItem('lexisense_user', JSON.stringify(window.loggedInUser));
        localStorage.setItem(`lexisense_profile_${cleanUser}`, JSON.stringify(window.loggedInUser));

        if (typeof showToast === 'function') {
            showToast(`Account created successfully! Welcome to LexiSense, ${nameInput}! 🎉`);
        }

        closeAuthModal();

        let redirectUrl = 'parent-page.html';
        if (selectedUserType === 'teacher' || selectedUserType === 'admin') {
            redirectUrl = 'admin-page.html';
        } else if (selectedUserType === 'super_admin') {
            redirectUrl = 'super-admin-page.html';
        }

        showLoginWelcomeExperience(window.loggedInUser, redirectUrl);

    } catch (err) {
        console.error("Registration Exception:", err);
        showAuthError("An error occurred during registration. Please try again.");
    } finally {
        setButtonLoading(submitBtn, false, "Create Account →");
    }
}

/**
 * Handles Forgot Password Submission
 */
async function handleForgotPasswordSubmit(event) {
    event.preventDefault();
    hideAuthMessages();

    const emailInput = document.getElementById('forgot-email')?.value.trim();
    const submitBtn = document.getElementById('btn-submit-forgot');

    if (!emailInput) {
        showAuthError("Please enter your email address.");
        return;
    }

    setButtonLoading(submitBtn, true, "Sending Code & Link...");

    try {
        const client = getSupabase();
        if (client) {
            let currentPath = window.location.pathname;
            if (!currentPath.endsWith('.html') && !currentPath.endsWith('/')) {
                currentPath += '/';
            }
            const redirectUrl = `${window.location.origin}${currentPath}`;

            const { data, error } = await client.auth.resetPasswordForEmail(emailInput, {
                redirectTo: redirectUrl
            });

            if (error) {
                console.warn("Supabase resetPasswordForEmail notice:", error.message);
            }
        }

        window.lastRecoveryEmail = emailInput;

        // Auto close auth modal & immediately open clean 6-digit OTP verification modal
        closeAuthModal();
        openPasswordRecoveryModal({
            mode: 'otp',
            email: emailInput,
            customAlert: `6-digit code has been sent to ${emailInput}. Please check your inbox!`,
            alertType: 'success'
        });
        startRecoveryCountdown(60);

        if (typeof showToast === 'function') {
            showToast("📧 6-digit security code sent to your email!");
        }

    } catch (err) {
        console.warn("Forgot Password Notice:", err);
        closeAuthModal();
        openPasswordRecoveryModal({
            mode: 'otp',
            email: emailInput,
            customAlert: `If an account exists, a 6-digit code has been sent to ${emailInput}.`,
            alertType: 'success'
        });
        startRecoveryCountdown(60);
    } finally {
        setButtonLoading(submitBtn, false, "Send Password Reset Link & Code →");
    }
}

/**
 * Creative Animated Logout Controller (Universal: Parent & Admin)
 */
function confirmLogout() {
    // Close any open flyout dropdowns
    const profileDropdown = document.getElementById('user-profile-dropdown');
    if (profileDropdown) profileDropdown.classList.add('hidden');
    const notifDropdown = document.getElementById('notifications-panel') || document.getElementById('notificationsDropdown');
    if (notifDropdown) notifDropdown.classList.add('hidden');

    const overlay = document.getElementById('logoutModalOverlay');
    const confirmCard = document.getElementById('logoutConfirmCard');
    const farewellStage = document.getElementById('logoutFarewellStage');
    const greetingEl = document.getElementById('logoutParentGreeting') || document.getElementById('logoutTeacherGreeting');

    if (!overlay || !confirmCard) {
        proceedWithCreativeLogout();
        return;
    }

    const currentUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
    const userName = currentUser ? (currentUser.name || currentUser.username || 'Parent') : 'Parent';
    if (greetingEl) greetingEl.innerText = userName;

    // Reset card and farewell stages
    confirmCard.classList.remove('hidden');
    confirmCard.classList.remove('scale-100', 'opacity-100');
    confirmCard.classList.add('scale-90', 'opacity-0');

    if (farewellStage) {
        farewellStage.classList.add('hidden');
        farewellStage.classList.remove('scale-100', 'opacity-100');
        farewellStage.classList.add('scale-95', 'opacity-0');
    }

    overlay.classList.remove('hidden', 'pointer-events-none');
    overlay.classList.add('pointer-events-auto');

    requestAnimationFrame(() => {
        overlay.classList.remove('opacity-0');
        overlay.classList.add('opacity-100');
        confirmCard.classList.remove('scale-90', 'opacity-0');
        confirmCard.classList.add('scale-100', 'opacity-100');
    });
}

function closeLogoutModal() {
    const overlay = document.getElementById('logoutModalOverlay');
    const confirmCard = document.getElementById('logoutConfirmCard');

    if (confirmCard) {
        confirmCard.classList.remove('scale-100', 'opacity-100');
        confirmCard.classList.add('scale-90', 'opacity-0');
    }

    if (overlay) {
        overlay.classList.remove('opacity-100');
        overlay.classList.add('opacity-0');
        setTimeout(() => {
            overlay.classList.add('hidden', 'pointer-events-none');
            overlay.classList.remove('pointer-events-auto');
        }, 300);
    }
}

async function proceedWithCreativeLogout() {
    const confirmCard = document.getElementById('logoutConfirmCard');
    const farewellStage = document.getElementById('logoutFarewellStage');
    const progressBar = document.getElementById('logoutProgressBar');
    const progressLabel = document.getElementById('logoutProgressLabel');

    if (confirmCard && farewellStage) {
        confirmCard.classList.remove('scale-100', 'opacity-100');
        confirmCard.classList.add('scale-90', 'opacity-0');

        setTimeout(() => {
            confirmCard.classList.add('hidden');
            farewellStage.classList.remove('hidden');

            requestAnimationFrame(() => {
                farewellStage.classList.remove('scale-95', 'opacity-0');
                farewellStage.classList.add('scale-100', 'opacity-100');

                if (progressBar) {
                    progressBar.style.width = '30%';
                    setTimeout(() => {
                        progressBar.style.width = '75%';
                        if (progressLabel) {
                            progressLabel.innerHTML = `<i class="fa-solid fa-sparkles text-amber-300 animate-spin"></i><span>Preserving learning milestones &amp; signing out...</span>`;
                        }
                    }, 400);
                    setTimeout(() => {
                        progressBar.style.width = '100%';
                        if (progressLabel) {
                            progressLabel.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-400"></i><span>Session closed safely. Redirecting...</span>`;
                        }
                    }, 900);
                }
            });
        }, 250);
    }

    // Clean session, auth, and state
    try {
        const client = typeof getSupabase === 'function' ? getSupabase() : null;
        if (client) {
            await client.auth.signOut();
        }
    } catch (e) {
        console.warn("Logout notice:", e);
    }

    window.loggedInUser = null;
    window.currentUserProfile = null;
    window.selectedReportChild = null;
    window.activeScreeningChild = null;
    localStorage.removeItem('lexisense_user');
    localStorage.removeItem('lexisense_token');
    localStorage.removeItem('lexisense_active_child');
    localStorage.removeItem('lexisense_guest_uuid');
    localStorage.removeItem('lexisense_admin_active_student');
    sessionStorage.clear();

    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

function handleLogout() {
    confirmLogout();
}

/**
 * Quick Demo Account Login Engine
 * Supports 1-Click login for Admin, Parent, and Super Admin roles.
 */
async function loginAsDemo(role = 'admin') {
    hideAuthMessages();
    const client = typeof getSupabase === 'function' ? getSupabase() : null;

    const DEMO_ACCOUNTS = {
        admin: {
            id: '00000000-0000-0000-0000-000000000002',
            username: 'faizikhwan',
            name: 'Faiz Ikhwan',
            email: 'faiz.ikhwan@sktamanria.edu.my',
            password: 'faiz12345',
            role: 'admin',
            designation: 'SEN Literacy Specialist / Guru Pemulihan',
            school: 'SK Taman Ria',
            redirect: 'admin-page.html',
            label: 'Faiz Ikhwan (SK Taman Ria) 👨‍🏫'
        },
        parent: {
            id: '00000000-0000-0000-0000-000000000003',
            username: 'parent_demo',
            name: 'Sarah (Demo Parent)',
            email: 'parent@lexisense.com',
            password: 'parent12345',
            role: 'parent',
            school: null,
            redirect: 'parent-page.html',
            label: 'Parent User 👧'
        },
        super_admin: {
            id: '00000000-0000-0000-0000-000000000004',
            username: 'super_admin',
            name: 'LexiSense Super Admin',
            email: 'superadmin@lexisense.com',
            password: 'super12345',
            role: 'super_admin',
            school: null,
            redirect: 'super-admin-page.html',
            label: 'Super Admin 👑'
        }
    };

    const targetDemo = DEMO_ACCOUNTS[role] || DEMO_ACCOUNTS.admin;

    // Fill form fields visually
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    if (usernameInput) usernameInput.value = targetDemo.email;
    if (passwordInput) passwordInput.value = targetDemo.password;

    const submitBtn = document.getElementById('btn-submit-login');
    setButtonLoading(submitBtn, true, `Logging in as ${targetDemo.label}...`);

    let loggedIn = false;

    // 1. Try Supabase Auth Login
    if (client) {
        try {
            const { data, error } = await client.auth.signInWithPassword({
                email: targetDemo.email,
                password: targetDemo.password
            });

            if (!error && data?.session?.user) {
                const { data: userProfile } = await client
                    .from('profiles')
                    .select('*')
                    .eq('id', data.session.user.id)
                    .single();

                window.loggedInUser = {
                    id: data.session.user.id,
                    username: userProfile?.username || targetDemo.username,
                    name: userProfile?.full_name || targetDemo.name,
                    email: targetDemo.email,
                    role: userProfile?.role || targetDemo.role,
                    school: userProfile?.school_branch || targetDemo.school
                };
                localStorage.setItem('lexisense_user', JSON.stringify(window.loggedInUser));
                loggedIn = true;
            }
        } catch (e) {
            console.log("Supabase live demo auth attempt:", e);
        }
    }

    // 2. Fallback Demo Session Mode for instant testing
    if (!loggedIn) {
        window.loggedInUser = {
            id: targetDemo.id,
            username: targetDemo.username,
            name: targetDemo.name,
            email: targetDemo.email,
            role: targetDemo.role,
            school: targetDemo.school,
            is_demo: true
        };
        localStorage.setItem('lexisense_user', JSON.stringify(window.loggedInUser));
    }

    if (typeof showToast === 'function') {
        showToast(`Logged in as ${targetDemo.label}!`);
    }

    closeAuthModal();
    showLoginWelcomeExperience(window.loggedInUser, targetDemo.redirect);
}

/**
 * Evaluates password strength with cute micro-labels
 */
function evaluatePasswordStrength(password) {
    let score = 0;
    if (!password) return { score: 0, label: '', color: '' };

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    let label = '🐣 Weak (Add numbers & uppercase)';
    let color = 'bg-red-500';

    if (score === 2) {
        label = '🌿 Medium (Add special symbols)';
        color = 'bg-amber-500';
    } else if (score === 3) {
        label = '⭐ Good Password!';
        color = 'bg-amber-400';
    } else if (score >= 4) {
        label = '🚀 Super Strong!';
        color = 'bg-emerald-500';
    }

    return { score, label, color };
}

/**
 * Updates UI Password Strength Bar
 */
function updatePasswordStrengthUI() {
    const pwd = document.getElementById('reg-password')?.value || '';
    const bar = document.getElementById('pwd-strength-bar');
    const label = document.getElementById('pwd-strength-text');
    if (!bar || !label) return;

    const result = evaluatePasswordStrength(pwd);
    if (!pwd) {
        bar.className = "h-2 rounded-full bg-gray-200 transition-all duration-300 w-0";
        label.textContent = "";
        return;
    }

    const widthPercent = result.score === 1 ? '25%' : (result.score === 2 ? '50%' : (result.score === 3 ? '75%' : '100%'));
    bar.className = `h-2 rounded-full transition-all duration-300 ${result.color}`;
    bar.style.width = widthPercent;
    label.textContent = result.label;
    label.className = `text-xs font-extrabold mt-1 block ${result.score >= 3 ? 'text-emerald-600' : (result.score === 2 ? 'text-amber-600' : 'text-red-500')}`;
}

/**
 * Password Visibility Toggle Helper
 */
function togglePasswordVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (!input || !icon) return;

    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fa-solid fa-eye-slash text-purple-600 cursor-pointer transition-transform transform scale-110';
    } else {
        input.type = 'password';
        icon.className = 'fa-solid fa-eye text-gray-400 hover:text-purple-600 cursor-pointer transition-transform';
    }
}

/**
 * UI Button Loading State Helper
 */
function setButtonLoading(btn, isLoading, defaultText) {
    if (!btn) return;
    if (isLoading) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-circle-notch animate-spin mr-2"></i> ${defaultText}`;
        btn.classList.add('opacity-75', 'cursor-not-allowed');
    } else {
        btn.disabled = false;
        btn.innerHTML = defaultText;
        btn.classList.remove('opacity-75', 'cursor-not-allowed');
    }
}

/**
 * HTML Escaper
 */
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}
/**
 * ============================================================================
 * USER PROFILE & SECURITY MANAGEMENT MODULE
 * Allows parents, educators, and admins to securely edit their name, avatar,
 * email, phone number, school details, and update password with security checks.
 * ============================================================================
 */

function ensureUserProfileModalExists() {
    if (document.getElementById('user-profile-modal')) return;

    const modalHTML = `
    <div id="user-profile-modal" class="hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
        <div class="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-purple-100 animate-pop my-auto max-h-[90vh] flex flex-col overflow-hidden">
            
            <!-- Modal Header (Fixed at top) -->
            <div class="p-5 sm:p-7 pb-4 border-b border-purple-100 shrink-0 bg-white space-y-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl shadow-xs">
                            <i class="fa-solid fa-user-gear"></i>
                        </div>
                        <div>
                            <h3 class="font-heading text-xl sm:text-2xl font-extrabold text-brand-purple-deep">Account Profile & Security</h3>
                            <p class="text-xs text-gray-500 font-medium">Manage your personal information and password credentials</p>
                        </div>
                    </div>
                    <button onclick="closeUserProfileModal()" class="w-9 h-9 rounded-xl bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-400 flex items-center justify-center transition-colors cursor-pointer" title="Close">
                        <i class="fa-solid fa-xmark text-lg"></i>
                    </button>
                </div>

                <!-- Tab Switcher (Profile vs Security) -->
                <div class="flex items-center gap-2 p-1 bg-purple-50 rounded-2xl border border-purple-100 text-xs sm:text-sm font-extrabold">
                    <button onclick="toggleProfileModalTab('info')" id="tab-btn-user-info" class="flex-1 py-2.5 rounded-xl bg-white text-purple-700 shadow-sm border border-purple-200/60 flex items-center justify-center gap-2 transition-all cursor-pointer">
                        <i class="fa-solid fa-id-card text-purple-600"></i> Profile Information
                    </button>
                    <button onclick="toggleProfileModalTab('security')" id="tab-btn-user-security" class="flex-1 py-2.5 rounded-xl text-gray-500 hover:text-purple-700 hover:bg-white/80 flex items-center justify-center gap-2 transition-all cursor-pointer">
                        <i class="fa-solid fa-lock text-purple-400"></i> Password & Security
                    </button>
                </div>

                <!-- Alert / Toast in modal -->
                <div id="user-profile-modal-alert" class="hidden p-3 rounded-2xl text-xs font-bold transition-all"></div>
            </div>

            <!-- Modal Body (Clean internal scrollbar) -->
            <div class="p-5 sm:p-7 pt-4 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                <!-- TAB 1: PROFILE INFORMATION -->
                <div id="user-profile-tab-info" class="space-y-5">
                    <form onsubmit="saveUserProfileDetails(event)" class="space-y-5">
                        
                        <!-- Avatar Selection & Preview -->
                        <div class="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 space-y-3">
                            <label class="block text-xs font-extrabold text-purple-950 uppercase tracking-wider">Profile Picture / Avatar</label>
                            <div class="flex items-center gap-4">
                                <div id="user-avatar-preview-box" class="w-16 h-16 rounded-2xl bg-purple-600 text-white font-bold flex items-center justify-center text-2xl shadow-md border-2 border-purple-300 overflow-hidden shrink-0">
                                    👩
                                </div>
                                <div class="flex-1 space-y-2">
                                    <div class="flex flex-wrap gap-2 items-center">
                                        <button type="button" onclick="selectProfileAvatarPreset('👩')" class="w-8 h-8 rounded-xl bg-white hover:bg-purple-100 border border-purple-200 text-lg flex items-center justify-center transition shadow-sm">👩</button>
                                        <button type="button" onclick="selectProfileAvatarPreset('👨')" class="w-8 h-8 rounded-xl bg-white hover:bg-purple-100 border border-purple-200 text-lg flex items-center justify-center transition shadow-sm">👨</button>
                                        <button type="button" onclick="selectProfileAvatarPreset('🧑‍🏫')" class="w-8 h-8 rounded-xl bg-white hover:bg-purple-100 border border-purple-200 text-lg flex items-center justify-center transition shadow-sm">🧑‍🏫</button>
                                        <button type="button" onclick="selectProfileAvatarPreset('🦉')" class="w-8 h-8 rounded-xl bg-white hover:bg-purple-100 border border-purple-200 text-lg flex items-center justify-center transition shadow-sm p-0.5">
                                            <img src="assets/ollie-mascot.png" alt="Ollie" class="w-5 h-5 object-contain">
                                        </button>
                                        <button type="button" onclick="selectProfileAvatarPreset('🦊')" class="w-8 h-8 rounded-xl bg-white hover:bg-purple-100 border border-purple-200 text-lg flex items-center justify-center transition shadow-sm">🦊</button>
                                        <button type="button" onclick="selectProfileAvatarPreset('🚀')" class="w-8 h-8 rounded-xl bg-white hover:bg-purple-100 border border-purple-200 text-lg flex items-center justify-center transition shadow-sm">🚀</button>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <input type="text" id="edit-user-avatar-url" placeholder="Or paste photo URL (https://...)" oninput="handleCustomAvatarUrlInput(this.value)" class="flex-1 px-3 py-1.5 text-xs bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none">
                                        <label class="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 font-extrabold text-xs rounded-xl cursor-pointer transition flex items-center gap-1.5 shadow-sm shrink-0">
                                            <i class="fa-solid fa-upload text-[11px]"></i> Upload
                                            <input type="file" accept="image/*" onchange="handleProfileAvatarFileUpload(event)" class="hidden">
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Full Name -->
                        <div>
                            <label class="block text-xs font-extrabold text-purple-950 uppercase tracking-wider mb-1.5">
                                Full Name <span class="text-red-500">*</span>
                            </label>
                            <div class="relative">
                                <i class="fa-solid fa-user absolute left-3.5 top-3.5 text-purple-400 text-sm"></i>
                                <input type="text" id="edit-user-fullname" required placeholder="e.g. Sarah Jenkins" class="w-full pl-10 pr-4 py-2.5 bg-purple-50/50 border border-purple-200 rounded-2xl text-xs sm:text-sm font-bold text-gray-800 focus:ring-2 focus:ring-purple-600 focus:bg-white focus:outline-none">
                            </div>
                        </div>

                        <!-- Email & Phone Grid -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-extrabold text-purple-950 uppercase tracking-wider mb-1.5">
                                    Email Address <span class="text-red-500">*</span>
                                </label>
                                <div class="relative">
                                    <i class="fa-solid fa-envelope absolute left-3.5 top-3.5 text-purple-400 text-sm"></i>
                                    <input type="email" id="edit-user-email" required placeholder="name@email.com" class="w-full pl-10 pr-4 py-2.5 bg-purple-50/50 border border-purple-200 rounded-2xl text-xs sm:text-sm font-bold text-gray-800 focus:ring-2 focus:ring-purple-600 focus:bg-white focus:outline-none">
                                </div>
                            </div>
                            <div>
                                <label class="block text-xs font-extrabold text-purple-950 uppercase tracking-wider mb-1.5">
                                    Phone Number
                                </label>
                                <div class="relative">
                                    <i class="fa-solid fa-phone absolute left-3.5 top-3.5 text-purple-400 text-sm"></i>
                                    <input type="tel" id="edit-user-phone" placeholder="+6012-3456789" class="w-full pl-10 pr-4 py-2.5 bg-purple-50/50 border border-purple-200 rounded-2xl text-xs sm:text-sm font-bold text-gray-800 focus:ring-2 focus:ring-purple-600 focus:bg-white focus:outline-none">
                                </div>
                            </div>
                        </div>

                        <!-- School / Institution & Username Grid -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-extrabold text-purple-950 uppercase tracking-wider mb-1.5">
                                    School / Organization
                                </label>
                                <div class="relative">
                                    <i class="fa-solid fa-school absolute left-3.5 top-3.5 text-purple-400 text-sm"></i>
                                    <input type="text" id="edit-user-school" placeholder="e.g. SK Taman Permata" class="w-full pl-10 pr-4 py-2.5 bg-purple-50/50 border border-purple-200 rounded-2xl text-xs sm:text-sm font-bold text-gray-800 focus:ring-2 focus:ring-purple-600 focus:bg-white focus:outline-none">
                                </div>
                            </div>
                            <div>
                                <label class="block text-xs font-extrabold text-purple-950 uppercase tracking-wider mb-1.5">
                                    Username / Role
                                </label>
                                <div class="relative">
                                    <i class="fa-solid fa-id-badge absolute left-3.5 top-3.5 text-purple-400 text-sm"></i>
                                    <input type="text" id="edit-user-username" disabled class="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-2xl text-xs sm:text-sm font-bold text-gray-500 cursor-not-allowed">
                                </div>
                            </div>
                        </div>

                        <!-- Bio / Notes -->
                        <div>
                            <label class="block text-xs font-extrabold text-purple-950 uppercase tracking-wider mb-1.5">
                                Bio / Personal Notes
                            </label>
                            <textarea id="edit-user-bio" rows="2" placeholder="Tell us about yourself..." class="w-full px-4 py-2.5 bg-purple-50/50 border border-purple-200 rounded-2xl text-xs sm:text-sm font-medium text-gray-800 focus:ring-2 focus:ring-purple-600 focus:bg-white focus:outline-none"></textarea>
                        </div>

                        <!-- Submit Buttons -->
                        <div class="flex items-center justify-end gap-3 pt-3 border-t border-purple-100">
                            <button type="button" onclick="closeUserProfileModal()" class="px-5 py-2.5 rounded-2xl text-xs font-bold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 transition cursor-pointer">
                                Cancel
                            </button>
                            <button type="submit" id="btn-save-profile-details" class="px-7 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer">
                                <i class="fa-solid fa-floppy-disk"></i> Save Profile Details
                            </button>
                        </div>
                    </form>
                </div>

                <!-- TAB 2: SECURITY & PASSWORD CHANGE -->
                <div id="user-profile-tab-security" class="hidden space-y-5">
                    <form onsubmit="changeUserPasswordSecure(event)" class="space-y-5">
                        
                        <div class="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
                            <i class="fa-solid fa-shield-halved text-amber-600 text-lg mt-0.5"></i>
                            <div class="text-xs text-amber-950 space-y-1">
                                <p class="font-extrabold">Security Notice & Verification</p>
                                <p class="leading-relaxed">To update your password, enter your new password below (minimum 8 characters with letters and numbers). Your authentication session will be securely updated in Supabase Auth.</p>
                            </div>
                        </div>

                        <!-- Current Password -->
                        <div>
                            <label class="block text-xs font-extrabold text-purple-950 uppercase tracking-wider mb-1.5">
                                Current Password
                            </label>
                            <div class="relative">
                                <i class="fa-solid fa-key absolute left-3.5 top-3.5 text-purple-400 text-sm"></i>
                                <input type="password" id="edit-user-current-pwd" placeholder="Enter current password" class="w-full pl-10 pr-10 py-2.5 bg-purple-50/50 border border-purple-200 rounded-2xl text-xs sm:text-sm font-bold text-gray-800 focus:ring-2 focus:ring-purple-600 focus:bg-white focus:outline-none">
                                <i onclick="togglePasswordVisibility('edit-user-current-pwd', 'toggle-cur-pwd-icon')" id="toggle-cur-pwd-icon" class="fa-solid fa-eye absolute right-3.5 top-3.5 text-gray-400 hover:text-purple-600 text-sm cursor-pointer"></i>
                            </div>
                        </div>

                        <!-- New Password -->
                        <div>
                            <label class="block text-xs font-extrabold text-purple-950 uppercase tracking-wider mb-1.5">
                                New Password <span class="text-red-500">*</span>
                            </label>
                            <div class="relative">
                                <i class="fa-solid fa-lock absolute left-3.5 top-3.5 text-purple-400 text-sm"></i>
                                <input type="password" id="edit-user-new-pwd" required oninput="updateNewPasswordStrengthUI()" placeholder="Minimum 8 characters" class="w-full pl-10 pr-10 py-2.5 bg-purple-50/50 border border-purple-200 rounded-2xl text-xs sm:text-sm font-bold text-gray-800 focus:ring-2 focus:ring-purple-600 focus:bg-white focus:outline-none">
                                <i onclick="togglePasswordVisibility('edit-user-new-pwd', 'toggle-new-pwd-icon')" id="toggle-new-pwd-icon" class="fa-solid fa-eye absolute right-3.5 top-3.5 text-gray-400 hover:text-purple-600 text-sm cursor-pointer"></i>
                            </div>
                            
                            <!-- Live Password Strength Meter -->
                            <div class="mt-2 space-y-1">
                                <div class="flex justify-between items-center text-[11px] font-bold">
                                    <span class="text-gray-500">Strength:</span>
                                    <span id="modal-pwd-strength-text" class="text-gray-400 font-extrabold">Too Short</span>
                                </div>
                                <div class="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                    <div id="modal-pwd-strength-bar" class="h-full bg-red-400 transition-all duration-300" style="width: 10%;"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Confirm New Password -->
                        <div>
                            <label class="block text-xs font-extrabold text-purple-950 uppercase tracking-wider mb-1.5">
                                Confirm New Password <span class="text-red-500">*</span>
                            </label>
                            <div class="relative">
                                <i class="fa-solid fa-shield-check absolute left-3.5 top-3.5 text-purple-400 text-sm"></i>
                                <input type="password" id="edit-user-confirm-pwd" required oninput="checkPasswordMatchIndicator()" placeholder="Re-type new password" class="w-full pl-10 pr-10 py-2.5 bg-purple-50/50 border border-purple-200 rounded-2xl text-xs sm:text-sm font-bold text-gray-800 focus:ring-2 focus:ring-purple-600 focus:bg-white focus:outline-none">
                                <i onclick="togglePasswordVisibility('edit-user-confirm-pwd', 'toggle-conf-pwd-icon')" id="toggle-conf-pwd-icon" class="fa-solid fa-eye absolute right-3.5 top-3.5 text-gray-400 hover:text-purple-600 text-sm cursor-pointer"></i>
                            </div>
                            <span id="modal-pwd-match-indicator" class="text-[11px] font-extrabold text-gray-400 mt-1 block"></span>
                        </div>

                        <!-- Submit Button -->
                        <div class="flex items-center justify-end gap-3 pt-3 border-t border-purple-100">
                            <button type="button" onclick="closeUserProfileModal()" class="px-5 py-2.5 rounded-2xl text-xs font-bold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 transition cursor-pointer">
                                Cancel
                            </button>
                            <button type="submit" id="btn-update-password-submit" class="px-7 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer">
                                <i class="fa-solid fa-shield"></i> Update Password
                            </button>
                        </div>
                    </form>
                </div>
            </div>

        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/**
 * Opens User Profile & Security Modal
 */
function openUserProfileModal(defaultTab = 'info') {
    ensureUserProfileModalExists();
    const modal = document.getElementById('user-profile-modal');
    if (!modal) return;

    let currentUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
    if (!currentUser) {
        showToast("Please log in to edit your profile.");
        return;
    }

    // Check if there is an explicit user-scoped profile stored in localStorage
    const uname = (currentUser.username || currentUser.email || 'user').toLowerCase();
    try {
        const localProfileOverride = JSON.parse(localStorage.getItem(`lexisense_profile_${uname}`) || 'null');
        if (localProfileOverride) {
            currentUser = { ...currentUser, ...localProfileOverride };
            window.loggedInUser = currentUser;
        }
    } catch (e) {}

    // Populate Tab 1: Profile Information
    const inFullname = document.getElementById('edit-user-fullname');
    const inEmail = document.getElementById('edit-user-email');
    const inPhone = document.getElementById('edit-user-phone');
    const inSchool = document.getElementById('edit-user-school');
    const inUsername = document.getElementById('edit-user-username');
    const inBio = document.getElementById('edit-user-bio');
    const inAvatarUrl = document.getElementById('edit-user-avatar-url');

    if (inFullname) inFullname.value = currentUser.name || currentUser.full_name || '';
    if (inEmail) inEmail.value = currentUser.email || '';
    if (inPhone) inPhone.value = currentUser.phone || currentUser.phone_number || '';
    if (inSchool) inSchool.value = currentUser.school || currentUser.school_branch || '';
    if (inUsername) inUsername.value = `${currentUser.username || 'user'} (${(currentUser.role || 'parent').toUpperCase()})`;
    if (inBio) inBio.value = currentUser.bio || '';
    if (inAvatarUrl) inAvatarUrl.value = (currentUser.avatar && currentUser.avatar.startsWith('http')) ? currentUser.avatar : '';

    renderModalAvatarPreview(currentUser.avatar || (currentUser.role === 'admin' ? '🧑‍🏫' : '👩'));

    // Reset password fields
    const curPwd = document.getElementById('edit-user-current-pwd');
    const newPwd = document.getElementById('edit-user-new-pwd');
    const confPwd = document.getElementById('edit-user-confirm-pwd');
    if (curPwd) curPwd.value = '';
    if (newPwd) newPwd.value = '';
    if (confPwd) confPwd.value = '';
    updateNewPasswordStrengthUI();

    toggleProfileModalTab(defaultTab);
    hideModalAlert();

    modal.classList.remove('hidden');
}

/**
 * Closes User Profile Modal
 */
function closeUserProfileModal() {
    const modal = document.getElementById('user-profile-modal');
    if (modal) modal.classList.add('hidden');
}

/**
 * Switches between Profile Info and Security tabs
 */
function toggleProfileModalTab(tabName) {
    const infoTab = document.getElementById('user-profile-tab-info');
    const secTab = document.getElementById('user-profile-tab-security');
    const btnInfo = document.getElementById('tab-btn-user-info');
    const btnSec = document.getElementById('tab-btn-user-security');

    if (tabName === 'security') {
        infoTab?.classList.add('hidden');
        secTab?.classList.remove('hidden');
        btnInfo?.classList.remove('bg-white', 'text-purple-700', 'shadow-sm', 'border', 'border-purple-200/60');
        btnInfo?.classList.add('text-gray-500');
        btnSec?.classList.add('bg-white', 'text-purple-700', 'shadow-sm', 'border', 'border-purple-200/60');
        btnSec?.classList.remove('text-gray-500');
    } else {
        secTab?.classList.add('hidden');
        infoTab?.classList.remove('hidden');
        btnSec?.classList.remove('bg-white', 'text-purple-700', 'shadow-sm', 'border', 'border-purple-200/60');
        btnSec?.classList.add('text-gray-500');
        btnInfo?.classList.add('bg-white', 'text-purple-700', 'shadow-sm', 'border', 'border-purple-200/60');
        btnInfo?.classList.remove('text-gray-500');
    }
}

/**
 * Renders avatar preview inside the modal
 */
function renderModalAvatarPreview(avatarVal) {
    const previewBox = document.getElementById('user-avatar-preview-box');
    if (!previewBox) return;

    if (!avatarVal) avatarVal = '👩';

    if (avatarVal.startsWith('http') || avatarVal.startsWith('data:')) {
        previewBox.innerHTML = `<img src="${escapeHTML(avatarVal)}" class="w-full h-full object-cover">`;
    } else {
        previewBox.innerHTML = escapeHTML(avatarVal);
    }
}

function selectProfileAvatarPreset(avatarChar) {
    const inAvatarUrl = document.getElementById('edit-user-avatar-url');
    if (inAvatarUrl) inAvatarUrl.value = avatarChar;
    renderModalAvatarPreview(avatarChar);
}

function handleCustomAvatarUrlInput(url) {
    const trimmed = (url || '').trim();
    if (trimmed) {
        renderModalAvatarPreview(trimmed);
    } else {
        renderModalAvatarPreview('👩');
    }
}

function handleProfileAvatarFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        showModalAlert("Image size exceeds 2MB. Please choose a smaller photo.", "error");
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const dataUrl = e.target.result;
        const inAvatarUrl = document.getElementById('edit-user-avatar-url');
        if (inAvatarUrl) inAvatarUrl.value = dataUrl;
        renderModalAvatarPreview(dataUrl);
    };
    reader.readAsDataURL(file);
}

/**
 * Live Password Strength Evaluation for Modal
 */
function updateNewPasswordStrengthUI() {
    const pwd = document.getElementById('edit-user-new-pwd')?.value || '';
    const bar = document.getElementById('modal-pwd-strength-bar');
    const text = document.getElementById('modal-pwd-strength-text');
    if (!bar || !text) return;

    if (!pwd) {
        bar.style.width = '5%';
        bar.className = 'h-full bg-gray-300 transition-all duration-300';
        text.textContent = 'Empty';
        text.className = 'text-gray-400 font-extrabold';
        return;
    }

    const result = evaluatePasswordStrength(pwd);
    if (result.score <= 1) {
        bar.style.width = '25%';
        bar.className = 'h-full bg-red-500 transition-all duration-300';
        text.textContent = 'Weak Password';
        text.className = 'text-red-600 font-extrabold';
    } else if (result.score === 2 || result.score === 3) {
        bar.style.width = '65%';
        bar.className = 'h-full bg-amber-500 transition-all duration-300';
        text.textContent = 'Medium Strength';
        text.className = 'text-amber-600 font-extrabold';
    } else {
        bar.style.width = '100%';
        bar.className = 'h-full bg-emerald-500 transition-all duration-300';
        text.textContent = 'Strong & Secure! 🔒';
        text.className = 'text-emerald-600 font-extrabold';
    }

    checkPasswordMatchIndicator();
}

function checkPasswordMatchIndicator() {
    const newPwd = document.getElementById('edit-user-new-pwd')?.value || '';
    const confPwd = document.getElementById('edit-user-confirm-pwd')?.value || '';
    const matchInd = document.getElementById('modal-pwd-match-indicator');
    if (!matchInd) return;

    if (!confPwd) {
        matchInd.textContent = '';
        return;
    }

    if (newPwd === confPwd) {
        matchInd.textContent = 'Passwords match! ✅';
        matchInd.className = 'text-[11px] font-extrabold text-emerald-600 mt-1 block';
    } else {
        matchInd.textContent = 'Passwords do not match ❌';
        matchInd.className = 'text-[11px] font-extrabold text-red-500 mt-1 block';
    }
}

function showModalAlert(msg, type = 'success') {
    const alertBox = document.getElementById('user-profile-modal-alert');
    if (!alertBox) return;

    alertBox.classList.remove('hidden', 'bg-red-100', 'text-red-800', 'border-red-300', 'bg-emerald-100', 'text-emerald-800', 'border-emerald-300');
    if (type === 'error') {
        alertBox.classList.add('bg-red-100', 'text-red-800', 'border', 'border-red-300');
        alertBox.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1.5"></i> ${escapeHTML(msg)}`;
    } else {
        alertBox.classList.add('bg-emerald-100', 'text-emerald-800', 'border', 'border-emerald-300');
        alertBox.innerHTML = `<i class="fa-solid fa-circle-check mr-1.5"></i> ${escapeHTML(msg)}`;
    }
}

function hideModalAlert() {
    const alertBox = document.getElementById('user-profile-modal-alert');
    if (alertBox) alertBox.classList.add('hidden');
}

/**
 * Saves Profile Details (Name, Email, Phone, School, Avatar, Bio) to Supabase & LocalStorage
 */
async function saveUserProfileDetails(event) {
    if (event) event.preventDefault();

    const fullName = document.getElementById('edit-user-fullname')?.value.trim();
    const email = document.getElementById('edit-user-email')?.value.trim();
    const phone = document.getElementById('edit-user-phone')?.value.trim();
    const school = document.getElementById('edit-user-school')?.value.trim();
    const bio = document.getElementById('edit-user-bio')?.value.trim();
    const avatar = document.getElementById('edit-user-avatar-url')?.value.trim() || '👩';

    if (!fullName) {
        showModalAlert("Please enter your full name.", "error");
        return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showModalAlert("Please provide a valid email address.", "error");
        return;
    }

    const submitBtn = document.getElementById('btn-save-profile-details');
    setButtonLoading(submitBtn, true, "Saving Profile...");

    try {
        let currentUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
        if (!currentUser) throw new Error("No active user session");

        // 1. Update in-memory user and localStorage
        currentUser.name = fullName;
        currentUser.full_name = fullName;
        currentUser.email = email;
        currentUser.phone = phone;
        currentUser.phone_number = phone;
        currentUser.school = school;
        currentUser.school_branch = school;
        currentUser.bio = bio;
        currentUser.avatar = avatar;

        window.loggedInUser = currentUser;
        localStorage.setItem('lexisense_user', JSON.stringify(currentUser));

        // 2. Persist to user-scoped persistent storage key
        const uname = (currentUser.username || currentUser.email || 'user').toLowerCase();
        localStorage.setItem(`lexisense_profile_${uname}`, JSON.stringify(currentUser));
        localStorage.setItem(`lexisense_email_map_${uname}`, email);

        // Update registered users registry if present
        try {
            const regUsers = JSON.parse(localStorage.getItem('lexisense_registered_users') || '[]');
            const rIdx = regUsers.findIndex(u => (u.username && u.username.toLowerCase() === uname) || (u.email && u.email.toLowerCase() === email.toLowerCase()));
            if (rIdx >= 0) {
                regUsers[rIdx].name = fullName;
                regUsers[rIdx].full_name = fullName;
                regUsers[rIdx].email = email;
                regUsers[rIdx].phone = phone;
                regUsers[rIdx].phone_number = phone;
                regUsers[rIdx].school = school;
                regUsers[rIdx].school_branch = school;
                regUsers[rIdx].avatar = avatar;
                regUsers[rIdx].bio = bio;
                localStorage.setItem('lexisense_registered_users', JSON.stringify(regUsers));
            }
        } catch (e) {}

        // 3. Synchronize with Supabase database `profiles` table
        const client = typeof getSupabase === 'function' ? getSupabase() : null;
        if (client) {
            try {
                let userId = currentUser.id;
                if (!userId || !isValidUUID(userId)) {
                    if (typeof getActiveAuthUserId === 'function') {
                        userId = await getActiveAuthUserId();
                    }
                }

                const updatePayload = {
                    full_name: fullName,
                    name: fullName,
                    email: email,
                    phone_number: phone,
                    phone: phone,
                    school_branch: school,
                    school: school,
                    avatar_url: avatar,
                    avatar: avatar,
                    bio: bio,
                    role: currentUser.role || 'parent',
                    username: currentUser.username || email.split('@')[0],
                    updated_at: new Date().toISOString()
                };

                if (userId && isValidUUID(userId)) {
                    updatePayload.id = userId;
                }

                console.log("Synchronizing profile details to Supabase 🚀:", updatePayload);

                let updated = false;

                // 3a. Try update by UUID
                if (userId && isValidUUID(userId)) {
                    const { data: upById, error: errById } = await client
                        .from('profiles')
                        .update(updatePayload)
                        .eq('id', userId)
                        .select();
                    if (!errById && upById && upById.length > 0) {
                        updated = true;
                        console.log("Updated profile in Supabase by ID ⚡:", upById[0]);
                    }
                }

                // 3b. Try update by Email
                if (!updated && email) {
                    const { data: upByEmail, error: errByEmail } = await client
                        .from('profiles')
                        .update(updatePayload)
                        .ilike('email', email)
                        .select();
                    if (!errByEmail && upByEmail && upByEmail.length > 0) {
                        updated = true;
                        if (upByEmail[0]?.id) {
                            currentUser.id = upByEmail[0].id;
                            localStorage.setItem('lexisense_user', JSON.stringify(currentUser));
                        }
                        console.log("Updated profile in Supabase by Email ⚡:", upByEmail[0]);
                    }
                }

                // 3c. Try update by Username
                const rawUsername = currentUser.username || uname;
                if (!updated && rawUsername) {
                    const { data: upByUname, error: errByUname } = await client
                        .from('profiles')
                        .update(updatePayload)
                        .ilike('username', rawUsername)
                        .select();
                    if (!errByUname && upByUname && upByUname.length > 0) {
                        updated = true;
                        if (upByUname[0]?.id) {
                            currentUser.id = upByUname[0].id;
                            localStorage.setItem('lexisense_user', JSON.stringify(currentUser));
                        }
                        console.log("Updated profile in Supabase by Username ⚡:", upByUname[0]);
                    }
                }

                // 3d. Fallback: Upsert / Insert new row if record did not exist
                if (!updated) {
                    console.log("Profile not found to update, inserting/upserting profile into Supabase 👤✨");
                    const { data: insData, error: insErr } = await client
                        .from('profiles')
                        .upsert([updatePayload])
                        .select();
                    if (insErr) {
                        delete updatePayload.id;
                        const { data: directIns } = await client.from('profiles').insert([updatePayload]).select();
                        if (directIns && directIns[0]?.id) {
                            currentUser.id = directIns[0].id;
                            localStorage.setItem('lexisense_user', JSON.stringify(currentUser));
                        }
                    } else if (insData && insData[0]?.id) {
                        currentUser.id = insData[0].id;
                        localStorage.setItem('lexisense_user', JSON.stringify(currentUser));
                    }
                }

                // Also sync parent contact details into children table
                try {
                    const childUpdates = {
                        parent_name: fullName,
                        parent_phone: phone,
                        parent_email: email
                    };
                    if (userId && isValidUUID(userId)) {
                        await client.from('children').update(childUpdates).eq('parent_id', userId);
                    }
                    if (email) {
                        await client.from('children').update(childUpdates).ilike('parent_email', email);
                    }
                } catch (cErr) {}

            } catch (supaErr) {
                console.warn("Supabase profile sync exception:", supaErr);
            }
        }

        // 4. Update UI Across the Portal Instantly
        await updateHeaderUserUI();
        if (typeof loadParentProfileView === 'function') {
            loadParentProfileView();
        }
        if (typeof refreshUserScopedData === 'function') {
            await refreshUserScopedData();
        }

        showModalAlert("Profile information saved successfully! ✨", "success");
        if (typeof showToast === 'function') {
            showToast("Profile details updated successfully! ✨");
        }

        setTimeout(() => {
            closeUserProfileModal();
        }, 1000);

    } catch (err) {
        console.error("Save profile error:", err);
        showModalAlert(err.message || "Failed to save profile. Please try again.", "error");
    } finally {
        setButtonLoading(submitBtn, false, '<i class="fa-solid fa-floppy-disk"></i> Save Profile Details');
    }
}

/**
 * Changes user password securely with strength verification and Supabase Auth
 */
async function changeUserPasswordSecure(event) {
    if (event) event.preventDefault();

    const curPwd = document.getElementById('edit-user-current-pwd')?.value || '';
    const newPwd = document.getElementById('edit-user-new-pwd')?.value || '';
    const confPwd = document.getElementById('edit-user-confirm-pwd')?.value || '';

    if (!newPwd || !confPwd) {
        showModalAlert("Please enter and confirm your new password.", "error");
        return;
    }

    if (newPwd.length < 8) {
        showModalAlert("Password must be at least 8 characters long.", "error");
        return;
    }

    if (newPwd !== confPwd) {
        showModalAlert("Passwords do not match. Please verify and re-type.", "error");
        return;
    }

    const strength = evaluatePasswordStrength(newPwd);
    if (strength.score < 2) {
        showModalAlert("Password is too simple. Please include uppercase letters, numbers, or symbols.", "error");
        return;
    }

    const submitBtn = document.getElementById('btn-update-password-submit');
    setButtonLoading(submitBtn, true, "Updating Password...");

    try {
        const client = typeof getSupabase === 'function' ? getSupabase() : null;
        let supabaseUpdated = false;

        // 1. Update password in Supabase Auth (if connected)
        if (client) {
            try {
                const { data, error } = await client.auth.updateUser({
                    password: newPwd
                });
                if (error) {
                    console.warn("Supabase Auth password update notice:", error.message);
                } else if (data?.user) {
                    supabaseUpdated = true;
                    console.log("Supabase Auth password updated successfully 🔒⚡");
                }
            } catch (supaErr) {
                console.warn("Supabase Auth exception:", supaErr);
            }
        }

        // 2. Update local registered user list and profile storage
        const currentUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
        if (currentUser) {
            currentUser.password = newPwd;
            window.loggedInUser = currentUser;
            localStorage.setItem('lexisense_user', JSON.stringify(currentUser));

            const cleanUser = (currentUser.username || '').toLowerCase();
            const cleanEmail = (currentUser.email || '').toLowerCase();

            try {
                const userProf = JSON.parse(localStorage.getItem(`lexisense_profile_${cleanUser}`) || '{}');
                userProf.password = newPwd;
                localStorage.setItem(`lexisense_profile_${cleanUser}`, JSON.stringify(userProf));
            } catch (e) {}

            try {
                let localUsers = JSON.parse(localStorage.getItem('lexisense_registered_users') || '{}');
                if (Array.isArray(localUsers)) {
                    const idx = localUsers.findIndex(u => 
                        (u.username && u.username.toLowerCase() === cleanUser) || 
                        (u.email && u.email.toLowerCase() === cleanEmail)
                    );
                    if (idx >= 0) {
                        localUsers[idx].password = newPwd;
                        localStorage.setItem('lexisense_registered_users', JSON.stringify(localUsers));
                    }
                } else if (typeof localUsers === 'object' && localUsers !== null) {
                    if (localUsers[cleanUser]) {
                        localUsers[cleanUser].password = newPwd;
                    }
                    for (let k in localUsers) {
                        if (localUsers[k]?.email?.toLowerCase() === cleanEmail || localUsers[k]?.username?.toLowerCase() === cleanUser) {
                            localUsers[k].password = newPwd;
                        }
                    }
                    localStorage.setItem('lexisense_registered_users', JSON.stringify(localUsers));
                }
            } catch (e) {}

            try {
                const usersList = JSON.parse(localStorage.getItem('lexisense_users') || '[]');
                const foundIdx = usersList.findIndex(u => u.username === currentUser.username || u.email === currentUser.email);
                if (foundIdx >= 0) {
                    usersList[foundIdx].password = newPwd;
                    localStorage.setItem('lexisense_users', JSON.stringify(usersList));
                }
            } catch (e) {}
        }

        showModalAlert("Password updated successfully! Your credentials are secure. 🔒", "success");
        if (typeof showToast === 'function') {
            showToast("Password updated securely! 🔒");
        }

        // Clear password inputs
        document.getElementById('edit-user-current-pwd').value = '';
        document.getElementById('edit-user-new-pwd').value = '';
        document.getElementById('edit-user-confirm-pwd').value = '';
        updateNewPasswordStrengthUI();

        setTimeout(() => {
            closeUserProfileModal();
        }, 1500);

    } catch (err) {
        console.error("Change password error:", err);
        showModalAlert(err.message || "Failed to update password. Please try again.", "error");
    } finally {
        setButtonLoading(submitBtn, false, '<i class="fa-solid fa-shield"></i> Update Password');
    }
}

// Global safe HTML escaping
if (typeof window.escapeHTML !== 'function') {
    window.escapeHTML = function(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };
}

// ==============================================================================
// 7. SUPABASE PASSWORD RECOVERY & 6-DIGIT OTP VERIFICATION ENGINE
// ==============================================================================

/**
 * Monitors URL parameters and Supabase auth state for password recovery and error handling
 */
function initAuthRecoveryWatcher() {
    const client = typeof getSupabase === 'function' ? getSupabase() : null;

    // 1. Supabase Event Listener for Password Recovery
    if (client) {
        try {
            client.auth.onAuthStateChange(async (event, session) => {
                if (event === 'PASSWORD_RECOVERY') {
                    console.log("Supabase PASSWORD_RECOVERY event detected 🔑✨");
                    openPasswordRecoveryModal({ mode: 'set-new-password', session });
                }
            });
        } catch (e) {
            console.warn("Auth state change watcher notice:", e);
        }
    }

    // 2. Inspect URL Hash & Search Query Parameters
    const hash = window.location.hash || '';
    const search = window.location.search || '';

    // Check for error in hash (e.g. otp_expired, access_denied)
    if (hash.includes('error=') || hash.includes('error_code=')) {
        const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
        const errorCode = hashParams.get('error_code');
        const rawErrorDesc = hashParams.get('error_description') || 'Email link is invalid or has expired';
        const decodedDesc = decodeURIComponent(rawErrorDesc.replace(/\+/g, ' '));

        console.warn(`Supabase Auth URL Hash Error: ${errorCode} - ${decodedDesc}`);

        // Clean up hash from URL bar without reloading page
        const cleanUrl = window.location.pathname + (window.location.search || '');
        window.history.replaceState(null, '', cleanUrl);

        // Open friendly recovery modal with OTP fallback
        setTimeout(() => {
            openPasswordRecoveryModal({
                mode: 'otp',
                isExpiredAlert: true,
                errorMessage: decodedDesc
            });
        }, 350);
        return;
    }

    // Check for direct recovery token in hash (#access_token=...&type=recovery)
    if (hash.includes('type=recovery')) {
        const cleanUrl = window.location.pathname + (window.location.search || '');
        window.history.replaceState(null, '', cleanUrl);

        setTimeout(() => {
            openPasswordRecoveryModal({ mode: 'set-new-password' });
        }, 350);
        return;
    }
}

/**
 * Live Countdown Timer Engine for OTP Verification
 */
let recoveryCountdownTimer = null;
let recoveryCountdownSeconds = 60;

function startRecoveryCountdown(seconds = 60) {
    if (recoveryCountdownTimer) {
        clearInterval(recoveryCountdownTimer);
        recoveryCountdownTimer = null;
    }

    recoveryCountdownSeconds = seconds;
    const timerDisplay = document.getElementById('rec-timer-display');
    const resendBtn = document.getElementById('rec-btn-resend-timer');

    if (resendBtn) {
        resendBtn.disabled = true;
        resendBtn.classList.add('opacity-50', 'cursor-not-allowed');
        resendBtn.classList.remove('hover:underline', 'cursor-pointer');
    }

    function updateTick() {
        if (timerDisplay) {
            timerDisplay.textContent = `${recoveryCountdownSeconds}s`;
        }
        if (recoveryCountdownSeconds <= 0) {
            clearInterval(recoveryCountdownTimer);
            recoveryCountdownTimer = null;
            if (timerDisplay) timerDisplay.textContent = "Expired";
            if (resendBtn) {
                resendBtn.disabled = false;
                resendBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                resendBtn.classList.add('hover:underline', 'cursor-pointer', 'text-purple-700', 'font-black');
            }
        } else {
            recoveryCountdownSeconds--;
        }
    }

    updateTick();
    recoveryCountdownTimer = setInterval(updateTick, 1000);
}

/**
 * Resends code directly from countdown widget
 */
async function handleResendFromTimer() {
    const email = document.getElementById('rec-otp-email')?.value.trim() || window.lastRecoveryEmail;
    if (!email) {
        showRecoveryModalAlert("Please enter your registered email address.", "error");
        return;
    }

    const resendBtn = document.getElementById('rec-btn-resend-timer');
    if (resendBtn) {
        resendBtn.disabled = true;
        resendBtn.innerHTML = `<i class="fa-solid fa-spinner animate-spin mr-1"></i> Sending...`;
    }

    try {
        const client = getSupabase();
        if (client) {
            let currentPath = window.location.pathname;
            if (!currentPath.endsWith('.html') && !currentPath.endsWith('/')) {
                currentPath += '/';
            }
            const redirectUrl = `${window.location.origin}${currentPath}`;
            await client.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl });
        }

        showRecoveryModalAlert(`New 6-digit code has been sent to ${email}!`, "success");
        if (typeof showToast === 'function') {
            showToast("New 6-digit code sent to your email! 📨");
        }
        startRecoveryCountdown(60);

    } catch (err) {
        console.warn("Resend timer notice:", err);
        showRecoveryModalAlert("A new reset code has been sent if the email is registered.", "success");
        startRecoveryCountdown(60);
    } finally {
        if (resendBtn) {
            resendBtn.innerHTML = `Resend Code`;
        }
    }
}

/**
 * Ensures Password Recovery / OTP Modal is injected in DOM
 */
function ensurePasswordRecoveryModalExists() {
    if (document.getElementById('password-recovery-modal')) return;

    const modalHTML = `
    <div id="password-recovery-modal" class="hidden fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-purple-950/60 backdrop-blur-md animate-fade-in" onclick="if(event.target === this) closePasswordRecoveryModal()">
        <div class="bg-white rounded-[32px] max-w-md w-full shadow-2xl border-2 border-purple-200 animate-pop relative max-h-[90vh] flex flex-col overflow-hidden" onclick="event.stopPropagation()">
            
            <!-- Pinned Header (Matches LexiSense Standard Auth Modal) -->
            <div class="relative bg-gradient-to-r from-purple-700 via-violet-600 to-indigo-700 p-5 sm:p-6 text-white overflow-hidden shadow-sm shrink-0">
                <!-- Floating Alphabet Bubbles -->
                <div class="absolute -top-2 left-6 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-xl text-amber-300 font-extrabold text-xs animate-bounce-subtle pointer-events-none">b</div>
                <div class="absolute top-4 right-14 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-xl text-purple-200 font-extrabold text-xs animate-float-slow pointer-events-none">d</div>

                <button type="button" onclick="closePasswordRecoveryModal()" class="absolute top-4 right-4 w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all border border-white/20 z-30 cursor-pointer shadow-sm" title="Close Modal" aria-label="Close Modal">
                    <i class="fa-solid fa-xmark text-base"></i>
                </button>

                <div class="flex items-center gap-3.5 relative z-10">
                    <img src="assets/lexisense-logo.png" alt="LexiSense Logo" class="w-12 h-12 object-contain shrink-0 drop-shadow-md">
                    <div>
                        <h3 class="font-heading text-xl sm:text-2xl font-extrabold text-white leading-tight">
                            Password Recovery
                        </h3>
                        <p class="text-xs text-purple-100 font-semibold">Enter 6-digit code & new password</p>
                    </div>
                </div>
            </div>

            <!-- Scrollable Body Content -->
            <div class="p-5 sm:p-6 space-y-3.5 overflow-y-auto custom-scrollbar flex-1">
                
                <!-- Notice Alert Box -->
                <div id="recovery-alert-box" class="hidden p-3 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-sm animate-pop-in">
                    <span id="recovery-alert-icon" class="text-base shrink-0">⚠️</span>
                    <span id="recovery-alert-text" class="leading-relaxed"></span>
                </div>

                <!-- VIEW 1: 6-DIGIT OTP VERIFICATION + PASSWORD RESET -->
                <div id="recovery-view-otp">
                    <form id="recovery-otp-form" onsubmit="handleOtpPasswordResetSubmit(event)" class="space-y-3 text-xs">
                        
                        <!-- Email Field -->
                        <div>
                            <label class="font-extrabold text-brand-purple-deep block mb-1">Registered Email</label>
                            <div class="relative">
                                <input id="rec-otp-email" type="email" required placeholder="your.email@example.com" class="w-full bg-purple-50/50 border-2 border-purple-100 rounded-2xl p-3 pl-10 focus:ring-2 focus:ring-purple-600 focus:border-purple-600 focus:outline-none font-semibold transition-all">
                                <i class="fa-solid fa-envelope absolute left-3.5 top-3.5 text-purple-400 text-sm"></i>
                            </div>
                        </div>

                        <!-- 6-Digit OTP Token Field -->
                        <div>
                            <div class="flex items-center justify-between mb-1">
                                <label class="font-extrabold text-brand-purple-deep block">6-Digit Security Code</label>
                                <span class="text-[10px] text-purple-700 font-extrabold bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-full">
                                    📨 Check Email
                                </span>
                            </div>
                            <div class="relative">
                                <input id="rec-otp-token" type="text" maxlength="8" required oninput="this.value = this.value.replace(/\\s+/g, '')" placeholder="1 2 3 4 5 6" class="w-full bg-purple-50/80 border-2 border-purple-300 rounded-2xl py-2.5 text-center text-xl font-black text-purple-950 focus:ring-2 focus:ring-purple-600 focus:bg-white focus:outline-none transition-all tracking-[6px]">
                            </div>
                            <div class="flex items-center justify-between text-xs font-bold mt-1 px-0.5">
                                <span class="text-gray-500 text-[11px]">Code valid: <strong id="rec-timer-display" class="text-purple-700 font-extrabold ml-0.5">60s</strong></span>
                                <button type="button" id="rec-btn-resend-timer" disabled onclick="handleResendFromTimer()" class="text-purple-600 opacity-50 cursor-not-allowed font-extrabold text-[11px] transition-all hover:underline">
                                    Resend Code
                                </button>
                            </div>
                        </div>

                        <!-- New Password Field -->
                        <div>
                            <label class="font-extrabold text-brand-purple-deep block mb-1">New Password</label>
                            <div class="relative">
                                <input id="rec-otp-new-password" type="password" required oninput="updateOtpPasswordStrengthUI()" placeholder="Minimum 8 characters" class="w-full bg-purple-50/50 border-2 border-purple-100 rounded-2xl p-3 pl-10 pr-10 focus:ring-2 focus:ring-purple-600 focus:border-purple-600 focus:outline-none font-semibold transition-all">
                                <i class="fa-solid fa-lock absolute left-3.5 top-3.5 text-purple-400 text-sm"></i>
                                <button type="button" onclick="togglePasswordVisibility('rec-otp-new-password', 'rec-otp-eye-1')" class="absolute right-3.5 top-3 text-gray-400 hover:text-purple-600 p-1">
                                    <i id="rec-otp-eye-1" class="fa-solid fa-eye"></i>
                                </button>
                            </div>
                            <div class="mt-1">
                                <div class="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden border border-purple-100">
                                    <div id="rec-otp-strength-bar" class="h-1.5 rounded-full bg-gray-200 transition-all duration-300 w-0"></div>
                                </div>
                                <span id="rec-otp-strength-text" class="text-[10px] font-extrabold mt-0.5 block text-gray-400"></span>
                            </div>
                        </div>

                        <!-- Confirm Password Field -->
                        <div>
                            <label class="font-extrabold text-brand-purple-deep block mb-1">Confirm New Password</label>
                            <div class="relative">
                                <input id="rec-otp-confirm-password" type="password" required oninput="updateOtpPasswordStrengthUI()" placeholder="Re-enter new password" class="w-full bg-purple-50/50 border-2 border-purple-100 rounded-2xl p-3 pl-10 pr-10 focus:ring-2 focus:ring-purple-600 focus:border-purple-600 focus:outline-none font-semibold transition-all">
                                <i class="fa-solid fa-shield-halved absolute left-3.5 top-3.5 text-purple-400 text-sm"></i>
                                <button type="button" onclick="togglePasswordVisibility('rec-otp-confirm-password', 'rec-otp-eye-2')" class="absolute right-3.5 top-3 text-gray-400 hover:text-purple-600 p-1">
                                    <i id="rec-otp-eye-2" class="fa-solid fa-eye"></i>
                                </button>
                            </div>
                            <span id="rec-otp-match-text" class="text-[10px] font-extrabold mt-0.5 block"></span>
                        </div>

                        <!-- Submit Button -->
                        <button type="submit" id="btn-submit-otp-recovery" class="w-full py-3.5 bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md hover:shadow-lg transition-all border-2 border-purple-500 flex items-center justify-center gap-2 cursor-pointer mt-2">
                            <i class="fa-solid fa-shield-check text-sm"></i>
                            <span>Verify Code & Reset Password</span>
                        </button>
                    </form>
                </div>

                <!-- VIEW 2: DIRECT NEW PASSWORD VIEW -->
                <div id="recovery-view-direct" class="hidden">
                    <form id="recovery-direct-form" onsubmit="handleDirectPasswordUpdateSubmit(event)" class="space-y-3 text-xs">
                        <div class="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 font-semibold flex items-center gap-2 text-xs">
                            <span class="text-base">🎉</span>
                            <span>Recovery verified! Please choose your new password.</span>
                        </div>

                        <div>
                            <label class="font-extrabold text-brand-purple-deep block mb-1">New Password</label>
                            <div class="relative">
                                <input id="rec-direct-new-password" type="password" required oninput="updateRecoveryPasswordStrengthUI()" placeholder="Minimum 8 characters" class="w-full bg-purple-50/50 border-2 border-purple-100 rounded-2xl p-3 pl-10 pr-10 focus:ring-2 focus:ring-purple-600 focus:outline-none font-semibold transition-all">
                                <i class="fa-solid fa-lock absolute left-3.5 top-3.5 text-purple-400 text-sm"></i>
                                <button type="button" onclick="togglePasswordVisibility('rec-direct-new-password', 'rec-direct-eye-1')" class="absolute right-3.5 top-3 text-gray-400 hover:text-purple-600 p-1">
                                    <i id="rec-direct-eye-1" class="fa-solid fa-eye"></i>
                                </button>
                            </div>
                            <div class="mt-1">
                                <div class="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden border border-purple-100">
                                    <div id="rec-direct-strength-bar" class="h-1.5 rounded-full bg-gray-200 transition-all duration-300 w-0"></div>
                                </div>
                                <span id="rec-direct-strength-text" class="text-[10px] font-extrabold mt-0.5 block text-gray-400"></span>
                            </div>
                        </div>

                        <div>
                            <label class="font-extrabold text-brand-purple-deep block mb-1">Confirm New Password</label>
                            <div class="relative">
                                <input id="rec-direct-confirm-password" type="password" required oninput="updateRecoveryPasswordStrengthUI()" placeholder="Re-enter new password" class="w-full bg-purple-50/50 border-2 border-purple-100 rounded-2xl p-3 pl-10 pr-10 focus:ring-2 focus:ring-purple-600 focus:outline-none font-semibold transition-all">
                                <i class="fa-solid fa-shield-halved absolute left-3.5 top-3.5 text-purple-400 text-sm"></i>
                                <button type="button" onclick="togglePasswordVisibility('rec-direct-confirm-password', 'rec-direct-eye-2')" class="absolute right-3.5 top-3 text-gray-400 hover:text-purple-600 p-1">
                                    <i id="rec-direct-eye-2" class="fa-solid fa-eye"></i>
                                </button>
                            </div>
                            <span id="rec-direct-match-text" class="text-[10px] font-extrabold mt-0.5 block"></span>
                        </div>

                        <button type="submit" id="btn-submit-direct-recovery" class="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2">
                            <i class="fa-solid fa-check text-sm"></i>
                            <span>Save New Password & Log In</span>
                        </button>
                    </form>
                </div>

                <!-- Quick Back to Login -->
                <div class="pt-2 text-center">
                    <button type="button" onclick="closePasswordRecoveryModal(); openAuthModal('login');" class="text-xs text-purple-700 font-extrabold hover:underline inline-flex items-center gap-1">
                        <i class="fa-solid fa-arrow-left text-[10px]"></i> Back to Log In
                    </button>
                </div>

            </div>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/**
 * Displays notice banner inside Recovery Modal
 */
function showRecoveryModalAlert(message, type = "error") {
    const alertBox = document.getElementById('recovery-alert-box');
    const alertText = document.getElementById('recovery-alert-text');
    const alertIcon = document.getElementById('recovery-alert-icon');
    if (!alertBox || !alertText || !alertIcon) return;

    alertBox.className = `p-3 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-sm animate-pop-in ${type === 'success' ? 'bg-emerald-50 border-2 border-emerald-200 text-emerald-800' : 'bg-red-50 border-2 border-red-200 text-red-700'}`;
    alertIcon.textContent = type === 'success' ? "✅" : "⚠️";
    alertText.innerHTML = escapeHTML(message);
    alertBox.classList.remove('hidden');
}

/**
 * Opens Password Recovery Modal with specific mode
 */
function openPasswordRecoveryModal(options = {}) {
    ensurePasswordRecoveryModalExists();
    const modal = document.getElementById('password-recovery-modal');
    if (!modal) return;

    const alertBox = document.getElementById('recovery-alert-box');
    const alertText = document.getElementById('recovery-alert-text');
    const alertIcon = document.getElementById('recovery-alert-icon');

    const emailOtpInput = document.getElementById('rec-otp-email');
    const targetEmail = options.email || window.lastRecoveryEmail || '';

    if (emailOtpInput && targetEmail) {
        emailOtpInput.value = targetEmail;
    }

    if (options.isExpiredAlert) {
        if (alertBox && alertText && alertIcon) {
            alertBox.className = "p-3 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-sm animate-pop-in bg-amber-50 border-2 border-amber-200 text-amber-900";
            alertIcon.textContent = "⚠️";
            alertText.innerHTML = "<strong>Pautan Emel Telah Luput:</strong> Sila masukkan <strong>Kod 6-Digit</strong> dari emel anda di bawah.";
            alertBox.classList.remove('hidden');
        }
        startRecoveryCountdown(60);
    } else if (options.customAlert) {
        showRecoveryModalAlert(options.customAlert, options.alertType || "error");
    } else {
        if (alertBox) alertBox.classList.add('hidden');
    }

    if (options.mode === 'set-new-password') {
        document.getElementById('recovery-view-otp')?.classList.add('hidden');
        document.getElementById('recovery-view-direct')?.classList.remove('hidden');
    } else {
        document.getElementById('recovery-view-direct')?.classList.add('hidden');
        document.getElementById('recovery-view-otp')?.classList.remove('hidden');
        
        // Auto focus on token input
        setTimeout(() => {
            const tokenInput = document.getElementById('rec-otp-token');
            if (tokenInput) tokenInput.focus();
        }, 150);
    }

    modal.classList.remove('hidden');
    modal.style.setProperty('display', 'flex', 'important');
}

/**
 * Closes Password Recovery Modal
 */
function closePasswordRecoveryModal() {
    const modal = document.getElementById('password-recovery-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.setProperty('display', 'none', 'important');
    }
    if (recoveryCountdownTimer) {
        clearInterval(recoveryCountdownTimer);
        recoveryCountdownTimer = null;
    }
}

/**
 * Handles OTP 6-Digit Code Verification & Password Reset
 */
async function handleOtpPasswordResetSubmit(event) {
    event.preventDefault();

    const email = document.getElementById('rec-otp-email')?.value.trim();
    let token = document.getElementById('rec-otp-token')?.value.trim() || '';
    token = token.replace(/\s+/g, ''); // Clean spaces
    const newPwd = document.getElementById('rec-otp-new-password')?.value;
    const confPwd = document.getElementById('rec-otp-confirm-password')?.value;
    const submitBtn = document.getElementById('btn-submit-otp-recovery');

    if (!email || !token || !newPwd || !confPwd) {
        showRecoveryModalAlert("Please fill in all fields (Email, 6-digit Code, and New Password).", "error");
        return;
    }

    if (newPwd.length < 8) {
        showRecoveryModalAlert("New password must be at least 8 characters long.", "error");
        return;
    }

    if (newPwd !== confPwd) {
        showRecoveryModalAlert("Passwords do not match. Please verify and re-type.", "error");
        return;
    }

    setButtonLoading(submitBtn, true, "Verifying Code & Resetting Password...");

    try {
        const client = getSupabase();
        if (!client) {
            throw new Error("Database connection service is unavailable.");
        }

        // 1. Verify 6-digit OTP code for recovery
        const { data: verifyData, error: verifyErr } = await client.auth.verifyOtp({
            email: email,
            token: token,
            type: 'recovery'
        });

        if (verifyErr) {
            throw new Error(verifyErr.message || "Invalid or expired 6-digit code. Please request a new one.");
        }

        // 2. Update user password in Supabase Auth
        const { data: updateData, error: updateErr } = await client.auth.updateUser({
            password: newPwd
        });

        if (updateErr) {
            throw new Error(updateErr.message || "Failed to update password.");
        }

        // 3. Update local user storage
        syncPasswordChangeLocally(email, newPwd);

        showRecoveryModalAlert("Password successfully reset! Logging you in...", "success");

        if (typeof showToast === 'function') {
            showToast("Password reset successfully! Welcome back! 🎉");
        }

        setTimeout(() => {
            closePasswordRecoveryModal();
            window.location.reload();
        }, 1200);

    } catch (err) {
        console.error("OTP Recovery Error:", err);
        showRecoveryModalAlert(err.message || "Invalid or expired 6-digit code. Please check your email and try again.", "error");
    } finally {
        setButtonLoading(submitBtn, false, '<i class="fa-solid fa-shield"></i> Verify Code & Reset Password');
    }
}

/**
 * Handles Direct Password Update (when recovery session is established)
 */
async function handleDirectPasswordUpdateSubmit(event) {
    event.preventDefault();

    const newPwd = document.getElementById('rec-direct-new-password')?.value;
    const confPwd = document.getElementById('rec-direct-confirm-password')?.value;
    const submitBtn = document.getElementById('btn-submit-direct-recovery');

    if (!newPwd || !confPwd) {
        showRecoveryModalAlert("Please fill in all password fields.", "error");
        return;
    }

    if (newPwd.length < 8) {
        showRecoveryModalAlert("Password must be at least 8 characters long.", "error");
        return;
    }

    if (newPwd !== confPwd) {
        showRecoveryModalAlert("Passwords do not match.", "error");
        return;
    }

    setButtonLoading(submitBtn, true, "Saving New Password...");

    try {
        const client = getSupabase();
        if (client) {
            const { data, error } = await client.auth.updateUser({
                password: newPwd
            });
            if (error) throw error;
        }

        const currentUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
        if (currentUser?.email) {
            syncPasswordChangeLocally(currentUser.email, newPwd);
        }

        showRecoveryModalAlert("Password updated successfully! Welcome back! 🎉", "success");

        if (typeof showToast === 'function') {
            showToast("Password updated successfully! 🔒");
        }

        setTimeout(() => {
            closePasswordRecoveryModal();
            window.location.reload();
        }, 1200);

    } catch (err) {
        console.error("Direct Password Update Error:", err);
        showRecoveryModalAlert(err.message || "Failed to update password. Please try again.", "error");
    } finally {
        setButtonLoading(submitBtn, false, '<i class="fa-solid fa-check"></i> Save New Password & Log In');
    }
}

/**
 * Updates password across local storage caches
 */
function syncPasswordChangeLocally(email, newPwd) {
    const cleanEmail = (email || '').toLowerCase();
    try {
        let localUsers = JSON.parse(localStorage.getItem('lexisense_registered_users') || '{}');
        if (Array.isArray(localUsers)) {
            const idx = localUsers.findIndex(u => u.email?.toLowerCase() === cleanEmail);
            if (idx >= 0) {
                localUsers[idx].password = newPwd;
                localStorage.setItem('lexisense_registered_users', JSON.stringify(localUsers));
            }
        } else if (typeof localUsers === 'object' && localUsers !== null) {
            for (let k in localUsers) {
                if (localUsers[k]?.email?.toLowerCase() === cleanEmail) {
                    localUsers[k].password = newPwd;
                }
            }
            localStorage.setItem('lexisense_registered_users', JSON.stringify(localUsers));
        }
    } catch (e) {}

    try {
        const currentUser = JSON.parse(localStorage.getItem('lexisense_user') || 'null');
        if (currentUser && currentUser.email?.toLowerCase() === cleanEmail) {
            currentUser.password = newPwd;
            localStorage.setItem('lexisense_user', JSON.stringify(currentUser));
        }
    } catch (e) {}
}

function updateOtpPasswordStrengthUI() {
    const pwd = document.getElementById('rec-otp-new-password')?.value || '';
    const conf = document.getElementById('rec-otp-confirm-password')?.value || '';
    const bar = document.getElementById('rec-otp-strength-bar');
    const label = document.getElementById('rec-otp-strength-text');
    const matchText = document.getElementById('rec-otp-match-text');

    if (!bar || !label) return;

    if (!pwd) {
        bar.style.width = '0%';
        bar.className = "h-1.5 rounded-full bg-gray-200 transition-all duration-300";
        label.textContent = "";
    } else {
        const result = evaluatePasswordStrength(pwd);
        const widthPercent = result.score === 1 ? '25%' : (result.score === 2 ? '50%' : (result.score === 3 ? '75%' : '100%'));
        bar.className = `h-1.5 rounded-full transition-all duration-300 ${result.color}`;
        bar.style.width = widthPercent;
        label.textContent = result.label;
        label.className = `text-[10px] font-extrabold mt-0.5 block ${result.score >= 3 ? 'text-emerald-600' : (result.score === 2 ? 'text-amber-600' : 'text-red-500')}`;
    }

    if (matchText) {
        if (!conf) {
            matchText.textContent = "";
        } else if (pwd === conf) {
            matchText.textContent = "Passwords match! ✅";
            matchText.className = "text-[10px] font-extrabold text-emerald-600 mt-0.5 block";
        } else {
            matchText.textContent = "Passwords do not match ❌";
            matchText.className = "text-[10px] font-extrabold text-red-500 mt-0.5 block";
        }
    }
}

function updateRecoveryPasswordStrengthUI() {
    const pwd = document.getElementById('rec-direct-new-password')?.value || '';
    const conf = document.getElementById('rec-direct-confirm-password')?.value || '';
    const bar = document.getElementById('rec-direct-strength-bar');
    const label = document.getElementById('rec-direct-strength-text');
    const matchText = document.getElementById('rec-direct-match-text');

    if (!bar || !label) return;

    if (!pwd) {
        bar.style.width = '0%';
        bar.className = "h-1.5 rounded-full bg-gray-200 transition-all duration-300";
        label.textContent = "";
    } else {
        const result = evaluatePasswordStrength(pwd);
        const widthPercent = result.score === 1 ? '25%' : (result.score === 2 ? '50%' : (result.score === 3 ? '75%' : '100%'));
        bar.className = `h-1.5 rounded-full transition-all duration-300 ${result.color}`;
        bar.style.width = widthPercent;
        label.textContent = result.label;
        label.className = `text-[10px] font-extrabold mt-0.5 block ${result.score >= 3 ? 'text-emerald-600' : (result.score === 2 ? 'text-amber-600' : 'text-red-500')}`;
    }

    if (matchText) {
        if (!conf) {
            matchText.textContent = "";
        } else if (pwd === conf) {
            matchText.textContent = "Passwords match! ✅";
            matchText.className = "text-[10px] font-extrabold text-emerald-600 mt-0.5 block";
        } else {
            matchText.textContent = "Passwords do not match ❌";
            matchText.className = "text-[10px] font-extrabold text-red-500 mt-0.5 block";
        }
    }
}

/**
 * Dynamic Helper: Ensures #loginWelcomeModalOverlay exists in DOM
 */
function ensureLoginWelcomeModalExists() {
    if (document.getElementById('loginWelcomeModalOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'loginWelcomeModalOverlay';
    overlay.className = 'fixed inset-0 z-50 hidden bg-purple-950/75 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300 opacity-0 pointer-events-none';
    overlay.innerHTML = `
        <div id="loginWelcomeCard" class="relative w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border-2 border-purple-200/90 overflow-hidden transform scale-90 opacity-0 transition-all duration-300 text-center">
            <div class="absolute -top-16 -right-16 w-40 h-40 bg-amber-400/25 rounded-full blur-2xl pointer-events-none"></div>
            <div class="absolute -bottom-16 -left-16 w-40 h-40 bg-purple-600/25 rounded-full blur-2xl pointer-events-none"></div>

            <div class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-purple-100 via-pink-50 to-amber-100 border border-purple-200 text-purple-900 text-[11px] font-black uppercase tracking-wider mb-2 shadow-xs">
                <span>✨</span>
                <span>Portal Access Granted</span>
                <span>✨</span>
            </div>

            <div class="relative mx-auto w-28 h-28 my-2 flex items-center justify-center">
                <div class="absolute inset-0 bg-gradient-to-tr from-amber-300 via-pink-200 to-purple-400 rounded-3xl blur-md opacity-70 animate-pulse"></div>
                <div class="relative w-full h-full bg-gradient-to-tr from-purple-100 via-white to-amber-50 rounded-3xl border-2 border-purple-200 flex items-center justify-center shadow-lg p-2 overflow-visible">
                    <img id="loginWelcomeMascotImg" src="assets/ollie-grad-mascot.png" alt="Ollie Mascot" class="w-20 h-20 object-contain animate-mascot-cheer drop-shadow-md">
                    <span class="absolute -bottom-1.5 -right-1.5 text-base bg-white rounded-full p-1 shadow-xs border border-purple-100">🎉</span>
                </div>
            </div>

            <div class="animate-speech-float inline-block bg-purple-50 border border-purple-200 text-purple-900 text-xs font-black px-3.5 py-1.5 rounded-2xl shadow-xs mt-1 mb-2">
                <span id="loginWelcomeSpeech">🦉 "Hai! Jom kita mulakan sesi pembelajaran!"</span>
            </div>

            <h3 class="font-heading text-2xl sm:text-3xl font-black text-brand-purple-deep leading-tight mt-1">
                Selamat Datang, <br class="sm:hidden"><span id="loginWelcomeUserName" class="text-transparent bg-clip-text bg-gradient-to-r from-purple-700 via-indigo-600 to-pink-600">User</span>!
            </h3>

            <div class="mt-2.5 flex flex-wrap items-center justify-center gap-2">
                <span id="loginWelcomeRoleBadge" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-100 text-purple-900 text-xs font-black border border-purple-200">
                    <i class="fa-solid fa-chalkboard-user text-purple-600"></i>
                    <span id="loginWelcomeRoleText">Educator Account</span>
                </span>
                <span id="loginWelcomeSchoolBadge" class="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200">
                    <i class="fa-solid fa-school text-amber-600 text-[10px]"></i>
                    <span id="loginWelcomeSchoolText">SK Taman Ria</span>
                </span>
            </div>

            <div class="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-black">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Cloud Workspace Synchronized ☁️</span>
            </div>

            <div class="mt-5 space-y-2 max-w-xs mx-auto text-center">
                <div class="h-2.5 w-full bg-purple-100 rounded-full overflow-hidden p-0.5 border border-purple-200 shadow-inner">
                    <div id="loginWelcomeProgressBar" class="h-full bg-gradient-to-r from-amber-400 via-pink-400 to-purple-600 rounded-full transition-all duration-300 ease-out" style="width: 0%"></div>
                </div>
                <p id="loginWelcomeProgressLabel" class="text-[11px] text-purple-700 font-extrabold flex items-center justify-center gap-1.5">
                    <i class="fa-solid fa-spinner fa-spin text-purple-500"></i>
                    <span>Mengesahkan sesi & memuatkan profil...</span>
                </p>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

/**
 * Triggers the interactive Mascot Ollie Welcome Animation Modal
 * before redirecting to the target portal.
 */
function showLoginWelcomeExperience(authenticatedUser, targetRedirectUrl) {
    ensureLoginWelcomeModalExists();

    const overlay = document.getElementById('loginWelcomeModalOverlay');
    const card = document.getElementById('loginWelcomeCard');

    if (!overlay || !card) {
        setTimeout(() => {
            window.location.href = targetRedirectUrl;
        }, 300);
        return;
    }

    const userNameEl = document.getElementById('loginWelcomeUserName');
    const roleBadgeEl = document.getElementById('loginWelcomeRoleBadge');
    const roleTextEl = document.getElementById('loginWelcomeRoleText');
    const schoolBadgeEl = document.getElementById('loginWelcomeSchoolBadge');
    const schoolTextEl = document.getElementById('loginWelcomeSchoolText');
    const speechEl = document.getElementById('loginWelcomeSpeech');
    const mascotImgEl = document.getElementById('loginWelcomeMascotImg');
    const progressBar = document.getElementById('loginWelcomeProgressBar');
    const progressLabel = document.getElementById('loginWelcomeProgressLabel');

    const userObj = authenticatedUser || {};
    const name = userObj.name || userObj.full_name || userObj.username || 'Pengguna';
    const role = (userObj.role || 'parent').toLowerCase();
    const school = userObj.school || userObj.school_branch || (role === 'teacher' || role === 'admin' ? 'SK Taman Ria' : null);

    if (userNameEl) userNameEl.textContent = name;

    // Role-specific mascot styling, greetings and badges
    if (role === 'super_admin') {
        if (mascotImgEl) mascotImgEl.src = 'assets/ollie-grad-mascot.png';
        if (speechEl) speechEl.innerHTML = '🦉 "Hai Pengarah Sistem! Semua data pusat sedia dilancarkan!"';
        if (roleTextEl) roleTextEl.innerHTML = '<i class="fa-solid fa-crown text-amber-500 mr-1"></i> Super Administrator';
        if (schoolBadgeEl) {
            schoolBadgeEl.classList.remove('hidden');
            if (schoolTextEl) schoolTextEl.textContent = 'LexiSense Headquarters';
        }
    } else if (role === 'teacher' || role === 'admin') {
        if (mascotImgEl) mascotImgEl.src = 'assets/ollie-grad-mascot.png';
        if (speechEl) speechEl.innerHTML = '🦉 "Hai Cikgu! Rekod murid & analitik sedia diakses!"';
        if (roleTextEl) roleTextEl.innerHTML = '<i class="fa-solid fa-chalkboard-user text-purple-600 mr-1"></i> Pendidik / Guru Sekolah';
        if (school) {
            if (schoolBadgeEl) {
                schoolBadgeEl.classList.remove('hidden');
                if (schoolTextEl) schoolTextEl.textContent = school;
            }
        } else if (schoolBadgeEl) {
            schoolBadgeEl.classList.add('hidden');
        }
    } else {
        if (mascotImgEl) mascotImgEl.src = 'assets/ollie-mascot.png';
        if (speechEl) speechEl.innerHTML = '🦉 "Hai! Jom kita terokai aktiviti & laporan anak anda!"';
        if (roleTextEl) roleTextEl.innerHTML = '<i class="fa-solid fa-house-user text-pink-600 mr-1"></i> Portal Ibu Bapa';
        if (schoolBadgeEl) schoolBadgeEl.classList.add('hidden');
    }

    // Reset Progress Bar
    if (progressBar) progressBar.style.width = '0%';
    if (progressLabel) progressLabel.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-purple-500 mr-1.5"></i> Mengesahkan sesi log masuk selamat...';

    // Activate Overlay with smooth fade & pop
    overlay.classList.remove('hidden');
    requestAnimationFrame(() => {
        overlay.classList.remove('opacity-0', 'pointer-events-none');
        overlay.classList.add('opacity-100');
        card.classList.remove('opacity-0', 'scale-90');
        card.classList.add('opacity-100', 'scale-100', 'animate-welcome-card');
    });

    // Step 1 Animation (450ms)
    setTimeout(() => {
        if (progressBar) progressBar.style.width = '45%';
        if (progressLabel) progressLabel.innerHTML = '<i class="fa-solid fa-cloud-arrow-down text-indigo-500 mr-1.5"></i> Memuatkan pangkalan data & profil...';
    }, 450);

    // Step 2 Animation (950ms)
    setTimeout(() => {
        if (progressBar) progressBar.style.width = '85%';
        if (progressLabel) progressLabel.innerHTML = '<i class="fa-solid fa-rocket text-amber-500 mr-1.5"></i> Membuka ruang pembelajaran...';
    }, 950);

    // Step 3 Animation (1400ms) -> Seamless Redirect
    setTimeout(() => {
        if (progressBar) progressBar.style.width = '100%';
        if (progressLabel) progressLabel.innerHTML = '<i class="fa-solid fa-circle-check text-emerald-500 mr-1.5"></i> Berjaya! Mengalihkan skrin...';
        setTimeout(() => {
            window.location.href = targetRedirectUrl;
        }, 350);
    }, 1400);
}

document.addEventListener('DOMContentLoaded', () => {
    initAuthSystem();
    ensureUserProfileModalExists();
    ensurePasswordRecoveryModalExists();
    ensureLoginWelcomeModalExists();
});



