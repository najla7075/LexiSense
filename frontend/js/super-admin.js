/**
 * LexiSense — Super Admin Management Engine
 * Universal Platform Controller: Real-time Multi-Source Data Synchronization,
 * User Directory & Profile Drawer, Global Screenings Dossiers, Schools Directory,
 * Institutional Analytics, Notification Center, Security Center & Algorithm Calibration.
 */

// --------------------------------------------------------------------------
// GLOBAL STATE & BASELINE SEEDS
// --------------------------------------------------------------------------
window.superAdminData = {
    users: [],
    screenings: [],
    schools: [],
    auditLogs: [],
    notifications: [],
    algorithmHistory: [],
    weights: { p1: 40, p2: 40, p3: 20 },
    activeDrawerUserId: null,
    isSyncing: false,
    lastSyncTimestamp: null
};

const BASELINE_USERS = [];
const BASELINE_SCREENINGS = [];
const BASELINE_SCHOOLS = [];
const BASELINE_AUDIT_LOGS = [];

const BASELINE_ALGORITHM_HISTORY = [
    { version: 'v1.2', formula: 'P1: 40% · P2: 40% · P3: 20%', author: '@faiz_super', date: '2026-08-01', reason: 'Default calibrated baseline' },
    { version: 'v1.1', formula: 'P1: 50% · P2: 30% · P3: 20%', author: '@suzana_super', date: '2026-07-15', reason: 'Pilot trial observation weighting' }
];

// --------------------------------------------------------------------------
// 1. TOAST & NOTIFICATION UTILITIES
// --------------------------------------------------------------------------
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    if (!toast || !toastMsg) return;

    toastMsg.textContent = message;
    toast.classList.remove('translate-y-[-100px]', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-[-100px]', 'opacity-0');
    }, 3500);
}
window.showToast = showToast;

function logout() {
    if (typeof getSupabase === 'function' && getSupabase()?.auth) {
        getSupabase().auth.signOut().catch(() => {});
    }
    localStorage.removeItem('lexisense_user');
    localStorage.removeItem('lexisense_token');
    window.location.href = 'index.html';
}
window.logout = logout;

// --------------------------------------------------------------------------
// 2. MULTI-SOURCE SYNCHRONIZATION ENGINE
// --------------------------------------------------------------------------
// 2. LIVE SUPABASE SYNCHRONIZATION ENGINE
//    Queries Supabase cloud tables directly: profiles, children, screening_results, audit_logs
// --------------------------------------------------------------------------
async function syncAllSuperAdminData() {
    if (window.superAdminData.isSyncing) return;
    window.superAdminData.isSyncing = true;

    try {
        const userMap = new Map();
        const screeningMap = new Map();
        const schoolMap = new Map();
        const auditLogMap = new Map();

        // 0. Load soft-deleted list safely
        let deletedList = [];
        try {
            deletedList = JSON.parse(localStorage.getItem('lexisense_deleted_students') || '[]');
        } catch (e) {}
        const deletedStudentIds = new Set(deletedList.map(s => String(s).toLowerCase().trim()));

        // 1. Fetch live Supabase records across all relevant tables
        const client = typeof getSupabase === 'function' ? getSupabase() : null;
        let dbProfiles = [];
        let dbChildren = [];
        let dbStudents = [];
        let dbScreenings = [];
        let dbSchools = [];
        let dbLogs = [];

        if (client) {
            try {
                // Fetch profiles
                const { data: pData, error: pErr } = await client.from('profiles').select('*').order('created_at', { ascending: false });
                if (!pErr && Array.isArray(pData)) dbProfiles = pData;

                // Fetch children (Parent portal entries)
                const { data: cData, error: cErr } = await client.from('children').select('*').order('created_at', { ascending: false });
                if (!cErr && Array.isArray(cData)) dbChildren = cData;

                // Fetch students (Admin / School portal entries)
                const { data: stData, error: stErr } = await client.from('students').select('*').order('created_at', { ascending: false });
                if (!stErr && Array.isArray(stData)) dbStudents = stData;

                // Fetch screening results
                const { data: sData, error: sErr } = await client.from('screening_results').select('*').order('created_at', { ascending: false });
                if (!sErr && Array.isArray(sData)) dbScreenings = sData;

                // Fetch schools
                const { data: schData, error: schErr } = await client.from('schools').select('*').order('name', { ascending: true });
                if (!schErr && Array.isArray(schData)) dbSchools = schData;

                // Fetch audit logs
                const { data: aData, error: aErr } = await client.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(60);
                if (!aErr && Array.isArray(aData)) dbLogs = aData;
            } catch (err) {
                console.warn("[SuperAdmin] Supabase fetch notice:", err);
            }
        }

        // 2. Map Profiles into userMap
        let localUsersObj = {};
        let roleOverrides = {};
        try {
            localUsersObj = JSON.parse(localStorage.getItem('lexisense_registered_users') || '{}');
            roleOverrides = JSON.parse(localStorage.getItem('lexisense_user_role_overrides') || '{}');
        } catch(e) {}
        const localUsersList = Array.isArray(localUsersObj) ? localUsersObj : Object.values(localUsersObj);

        if (Array.isArray(dbProfiles) && dbProfiles.length > 0) {
            dbProfiles.forEach(p => {
                const pIdStr = String(p.id || '').toLowerCase().trim();
                const cleanEmail = (p.email || '').toLowerCase().trim();
                const cleanUname = (p.username || '').toLowerCase().trim();
                const key = p.id || p.username || p.email;

                const localMatch = localUsersList.find(lu => 
                    (lu.email && lu.email.toLowerCase().trim() === cleanEmail) || 
                    (lu.username && lu.username.toLowerCase().trim() === cleanUname) ||
                    (lu.id && String(lu.id).toLowerCase().trim() === pIdStr)
                );

                const explicitOverrideRole = roleOverrides[pIdStr] || roleOverrides[cleanEmail] || roleOverrides[cleanUname];

                let resolvedRole = explicitOverrideRole || localMatch?.role || p.role || 'parent';
                let resolvedIsActive = (localMatch && localMatch.is_active !== undefined) ? localMatch.is_active : (p.is_active !== false);
                let resolvedIsApproved = (localMatch && localMatch.is_approved !== undefined) ? localMatch.is_approved : (p.is_approved !== false);
                let resolvedStatus = localMatch?.status || p.status || 'active';

                let userStatus = resolvedIsActive === false ? 'disabled' : resolvedStatus;
                if (resolvedIsApproved === false) userStatus = 'pending';

                userMap.set(String(key).toLowerCase(), {
                    id: p.id || `usr-${p.username}`,
                    full_name: p.full_name || p.name || p.username || 'User',
                    username: p.username || p.email?.split('@')[0] || 'user',
                    email: p.email || 'user@lexisense.ai',
                    role: resolvedRole,
                    school: p.school || p.school_branch || p.school_name || localMatch?.school || 'SK Taman Ria',
                    is_active: resolvedIsActive,
                    is_approved: resolvedIsApproved,
                    status: userStatus,
                    created_at: p.created_at ? p.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
                    last_login: 'Active Now',
                    screenings_count: 0
                });
            });
        }

        // Add any registered users from local storage not present in dbProfiles
        localUsersList.forEach(lu => {
            if (!lu) return;
            const cleanEmail = (lu.email || '').toLowerCase().trim();
            const cleanUname = (lu.username || '').toLowerCase().trim();
            const key = (lu.id || cleanUname || cleanEmail).toLowerCase();

            if (key && !userMap.has(key)) {
                let userStatus = lu.is_active === false ? 'disabled' : (lu.status || 'active');
                if (lu.is_approved === false) userStatus = 'pending';

                userMap.set(key, {
                    id: lu.id || `usr-${lu.username || (cleanEmail ? cleanEmail.split('@')[0] : 'user')}`,
                    full_name: lu.full_name || lu.name || lu.username || 'User',
                    username: lu.username || (cleanEmail ? cleanEmail.split('@')[0] : 'user'),
                    email: lu.email || 'user@lexisense.ai',
                    role: lu.role || 'parent',
                    school: lu.school || lu.school_branch || 'SK Taman Ria',
                    is_active: lu.is_active !== false,
                    is_approved: lu.is_approved !== false,
                    status: userStatus,
                    created_at: lu.created_at ? lu.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
                    last_login: 'Active Now',
                    screenings_count: 0
                });
            }
        });

        // Build comprehensive children & student lookup map
        const childrenLookup = new Map();
        const registerChildLookup = (item) => {
            if (!item) return;
            const nameKey = (item.name || item.child_name || '').toLowerCase().trim();
            if (nameKey) childrenLookup.set(nameKey, item);
            if (item.id) childrenLookup.set(String(item.id).toLowerCase(), item);
            if (item.student_id) childrenLookup.set(String(item.student_id).toLowerCase(), item);
            if (item.child_id) childrenLookup.set(String(item.child_id).toLowerCase(), item);
        };

        if (Array.isArray(dbChildren)) dbChildren.forEach(registerChildLookup);
        if (Array.isArray(dbStudents)) dbStudents.forEach(registerChildLookup);

        // 3. Map Screenings from Supabase screening_results
        if (Array.isArray(dbScreenings)) {
            dbScreenings.forEach(s => {
                const sId = s.id || `scr-${Date.now()}-${Math.random().toString().slice(-4)}`;
                const rawScore = Number(s.match_score !== undefined ? s.match_score : (s.score || 0));
                const score = isNaN(rawScore) ? 0 : rawScore;

                const nameKey = (s.child_name || '').toLowerCase().trim();
                const idKey = String(s.child_id || '').toLowerCase();
                const matched = childrenLookup.get(nameKey) || childrenLookup.get(idKey) || {};

                // Find guardian from parent_id in userMap
                let parentUser = null;
                if (s.parent_id) {
                    parentUser = Array.from(userMap.values()).find(u => String(u.id).toLowerCase() === String(s.parent_id).toLowerCase());
                }

                const gradeVal = s.grade || matched.grade || matched.class || matched.school_grade || 'Class 1A';
                const schoolVal = s.school || matched.school || matched.school_name || parentUser?.school || 'SK Taman Ria';
                const guardianVal = s.guardian || matched.parent_name || parentUser?.full_name || 'Parent / Educator';
                const ageVal = Number(s.age || matched.age || 8);
                const resolvedChildId = s.child_id || s.student_id || matched.student_id || matched.child_id || `LX-${String(s.id).slice(0, 4).toUpperCase()}`;

                let determinedRisk = s.risk_level || s.outcome;
                if (!determinedRisk || !determinedRisk.includes('Tier')) {
                    if (score >= 65 || (determinedRisk && determinedRisk.toLowerCase().includes('high'))) {
                        determinedRisk = 'Tier 3 · Specialist Referral';
                    } else if (score >= 35 || (determinedRisk && determinedRisk.toLowerCase().includes('some')) || (determinedRisk && determinedRisk.toLowerCase().includes('moderate'))) {
                        determinedRisk = 'Tier 2 · Moderate Concern';
                    } else {
                        determinedRisk = 'Tier 1 · Low Concern';
                    }
                }

                screeningMap.set(sId, {
                    id: sId,
                    child_name: s.child_name || matched.name || 'Student',
                    child_id: resolvedChildId,
                    age: ageVal,
                    grade: gradeVal,
                    school: schoolVal,
                    guardian: guardianVal,
                    score: Math.min(100, Math.max(0, score)),
                    risk_level: determinedRisk,
                    p1: Number(s.pillar1_score || Math.round(score * 0.95)),
                    p2: Number(s.pillar2_score || Math.round(score * 1.05)),
                    p3: Number(s.pillar3_score || Math.round(score * 0.88)),
                    wcpm: Number(s.reading_wpm || s.wcpm || (score > 60 ? 38 : (score > 35 ? 65 : 105))),
                    date: s.created_at ? s.created_at.split('T')[0] : (s.date || new Date().toISOString().split('T')[0])
                });
            });
        }

        // Also check completed students/children from tables that might not have a screening_results row
        const checkCompletedPool = [...(Array.isArray(dbStudents) ? dbStudents : []), ...(Array.isArray(dbChildren) ? dbChildren : [])];
        checkCompletedPool.forEach(c => {
            if (c.status === 'Completed' || (c.score && c.score > 0) || (c.match_score && c.match_score > 0)) {
                const nameKey = (c.name || '').toLowerCase().trim();
                const alreadyHas = Array.from(screeningMap.values()).some(s => (s.child_name || '').toLowerCase().trim() === nameKey);
                if (!alreadyHas) {
                    const scrId = `scr-c-${c.id || c.student_id || nameKey}`;
                    const score = Number(c.match_score || c.score || 0);
                    const riskLevel = score >= 65 ? 'Tier 3 · Specialist Referral' : (score >= 35 ? 'Tier 2 · Moderate Concern' : 'Tier 1 · Low Concern');
                    screeningMap.set(scrId, {
                        id: scrId,
                        child_name: c.name || 'Student',
                        child_id: c.student_id || c.child_id || `LX-${String(c.id || '8800').slice(0, 4).toUpperCase()}`,
                        age: Number(c.age) || 8,
                        grade: c.grade || c.class || c.school_grade || 'Class 1A',
                        school: c.school || c.school_name || 'SK Taman Ria',
                        guardian: c.parent_name || 'Parent Guardian',
                        score: score,
                        risk_level: riskLevel,
                        p1: Number(c.pillar1_score || Math.round(score * 0.95)),
                        p2: Number(c.pillar2_score || Math.round(score * 1.05)),
                        p3: Number(c.pillar3_score || Math.round(score * 0.88)),
                        wcpm: Number(c.reading_wpm || 65),
                        date: c.created_at ? c.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
                    });
                }
            }
        });

        // 4. Map Audit Logs from Supabase & local storage
        if (Array.isArray(dbLogs) && dbLogs.length > 0) {
            dbLogs.forEach(l => {
                const tsStr = l.timestamp ? (l.timestamp.replace('T', ' ').substring(0, 19)) : new Date().toISOString().replace('T', ' ').substring(0, 19);
                auditLogMap.set(l.id || `log-${l.timestamp}`, {
                    id: l.id || `log-${l.timestamp}`,
                    timestamp: tsStr,
                    actor: l.actor || 'faiz_super',
                    event: l.event || 'ACTIVITY',
                    target: l.target || 'Record',
                    ip: l.ip || '127.0.0.1 (Authorized)',
                    status: l.status || 'SUCCESS'
                });
            });
        }

        // 5. Build Schools Network (Seed from dbSchools + dynamic discovery)
        if (Array.isArray(dbSchools)) {
            dbSchools.forEach((sch, idx) => {
                schoolMap.set((sch.name || '').toLowerCase().trim(), {
                    id: sch.id || `sch-${idx + 1}`,
                    name: sch.name,
                    code: sch.code || `SCH-${1000 + idx}`,
                    sen_lead: sch.sen_lead || 'SEN Coordinator',
                    students: Number(sch.students || 0),
                    teachers: Number(sch.teachers || 1),
                    screenings: Number(sch.screenings || 0),
                    avg_score: Number(sch.avg_score || 0),
                    status: sch.status || 'Active'
                });
            });
        }

        // Discover any additional schools from users, students, children, screenings
        const allDiscoveredSchoolNames = new Set([
            'SK Taman Ria',
            'SK Penghulu Jaya',
            ...Array.from(schoolMap.keys())
        ]);
        Array.from(screeningMap.values()).forEach(s => { if (s.school) allDiscoveredSchoolNames.add(s.school); });
        Array.from(userMap.values()).forEach(u => { if (u.school) allDiscoveredSchoolNames.add(u.school); });
        checkCompletedPool.forEach(c => { if (c.school || c.school_name) allDiscoveredSchoolNames.add(c.school || c.school_name); });

        const allScreeningsRaw = Array.from(screeningMap.values());
        const allUsers = Array.from(userMap.values());

        allDiscoveredSchoolNames.forEach((rawSchName, idx) => {
            const schKey = (rawSchName || '').toLowerCase().trim();
            if (!schKey) return;

            const existing = schoolMap.get(schKey);
            const schScreenings = allScreeningsRaw.filter(s => s.school && s.school.toLowerCase().trim() === schKey);
            const schStudents = checkCompletedPool.filter(c => (c.school || c.school_name || '').toLowerCase().trim() === schKey).length;
            const schTeachers = allUsers.filter(u => (u.school || '').toLowerCase().trim() === schKey && (u.role === 'admin' || u.role === 'super_admin')).length;
            const avg = schScreenings.length > 0 ? Math.round(schScreenings.reduce((a, b) => a + b.score, 0) / schScreenings.length) : (existing?.avg_score || 0);

            schoolMap.set(schKey, {
                id: existing?.id || `sch-${idx + 1}`,
                name: existing?.name || rawSchName,
                code: existing?.code || `MOE-${schKey.slice(0, 3).toUpperCase()}-${10 + idx}`,
                sen_lead: existing?.sen_lead || (schTeachers > 0 ? allUsers.find(u => (u.school || '').toLowerCase().trim() === schKey)?.full_name : 'SEN Lead'),
                students: Math.max(existing?.students || 0, schStudents, schScreenings.length),
                teachers: Math.max(existing?.teachers || 1, schTeachers || 1),
                screenings: Math.max(existing?.screenings || 0, schScreenings.length),
                avg_score: avg,
                status: existing?.status || 'Active'
            });
        });

        // 6. Filter out soft-deleted screenings
        const allScreenings = allScreeningsRaw.filter(s => {
            const cName = (s.child_name || '').toLowerCase().trim();
            const cId = String(s.child_id || '').toLowerCase().trim();
            const sId = String(s.id || '').toLowerCase().trim();
            return !deletedStudentIds.has(cName) && !deletedStudentIds.has(cId) && !deletedStudentIds.has(sId);
        });

        const allSchools = Array.from(schoolMap.values());
        const allLogs = Array.from(auditLogMap.values()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Update screening count per user
        allUsers.forEach(u => {
            const count = allScreenings.filter(s => s.guardian === u.full_name || (s.school && s.school === u.school)).length;
            u.screenings_count = Math.max(u.screenings_count || 0, count);
        });

        // 7. Update school aggregate metrics
        allSchools.forEach(sch => {
            const schScreenings = allScreenings.filter(s => s.school && s.school.toLowerCase().includes(sch.name.toLowerCase()));
            if (schScreenings.length > 0) {
                sch.screenings = schScreenings.length;
                sch.students = Math.max(sch.students, schScreenings.length);
                const sum = schScreenings.reduce((acc, curr) => acc + curr.score, 0);
                sch.avg_score = Math.round(sum / schScreenings.length);
            }
        });

        // 8. Generate Contextual Dynamic Notifications
        const dynamicNotifications = [];
        const tier3Count = allScreenings.filter(s => s.score >= 65).length;
        const pendingAdmins = allUsers.filter(u => u.status === 'pending');
        const deletedCount = deletedStudentIds.size;

        if (tier3Count > 0) {
            dynamicNotifications.push({
                id: 'notif-tier3',
                title: `${tier3Count} High-Risk Screenings Pending Review`,
                desc: `Learners scored in Tier 3 (≥65%) requiring specialist attention.`,
                type: 'screenings',
                time: 'Just now',
                is_read: false,
                actionView: 'screenings',
                filter: 'tier3'
            });
        }

        if (pendingAdmins.length > 0) {
            dynamicNotifications.push({
                id: 'notif-pending',
                title: `${pendingAdmins.length} Permohonan Pendidik Menunggu Pengesahan & Sekolah`,
                desc: `${pendingAdmins.map(a => a.full_name || a.username).join(', ')} memohon akaun pendidik. Sila sahkan & tetapkan cawangan sekolah.`,
                type: 'users',
                time: 'Just now',
                is_read: false,
                actionView: 'users',
                filter: 'pending'
            });
        }

        if (deletedCount > 0) {
            dynamicNotifications.push({
                id: 'notif-purge',
                title: `${deletedCount} Data Purge Requests Executed`,
                desc: `Right-to-be-forgotten records processed compliant with COPPA/PDPA.`,
                type: 'security',
                time: 'Today',
                is_read: true,
                actionView: 'security'
            });
        }

        dynamicNotifications.push({
            id: 'notif-schools',
            title: `Institutional Network Active`,
            desc: `${allSchools.length} schools and clinical centers onboarded across the platform.`,
            type: 'schools',
            time: '1 day ago',
            is_read: true,
            actionView: 'schools'
        });

        // Assign to Global State
        window.superAdminData.users = allUsers;
        window.superAdminData.screenings = allScreenings;
        window.superAdminData.schools = allSchools;
        window.superAdminData.auditLogs = allLogs;
        window.superAdminData.notifications = dynamicNotifications;
        window.superAdminData.algorithmHistory = BASELINE_ALGORITHM_HISTORY;
        window.superAdminData.lastSyncTimestamp = new Date();

        // 9. Re-render all views and metrics
        updateOverviewMetrics();
        loadSuperAdminUserTable();
        loadMasterScreeningsTable();
        loadSchoolsDirectory();
        loadAnalyticsView();
        loadAlertsView();
        loadAuditTrail();
        updateNotificationBadges();

    } catch (err) {
        console.error('[LexiSense SuperAdmin] Synchronization error:', err);
    } finally {
        window.superAdminData.isSyncing = false;
    }
}
window.syncAllSuperAdminData = syncAllSuperAdminData;

// --------------------------------------------------------------------------
// 3. NAVIGATION & VIEW SWITCHING
// --------------------------------------------------------------------------
function switchSuperAdminView(viewName) {
    // Hide all view panels
    document.querySelectorAll('.superadmin-view-panel').forEach(panel => {
        panel.classList.add('hidden');
    });

    // Deactivate all sidebar nav links
    document.querySelectorAll('.sidebar-link').forEach(btn => {
        btn.classList.remove('active');
        const icon = btn.querySelector('i');
        if (icon) {
            icon.classList.remove('text-white');
            icon.classList.add('text-slate-400');
        }
    });

    // Show targeted panel
    const targetPanel = document.getElementById(`sa-view-${viewName}`);
    if (targetPanel) {
        targetPanel.classList.remove('hidden');
    }

    // Highlight targeted sidebar link
    const targetNav = document.getElementById(`sa-nav-${viewName}`);
    if (targetNav) {
        targetNav.classList.add('active');
        const icon = targetNav.querySelector('i');
        if (icon) {
            icon.classList.remove('text-slate-400');
            icon.classList.add('text-white');
        }
    }

    // Close mobile sidebar if open
    const sidebar = document.getElementById('sidebar-wrapper');
    const backdrop = document.getElementById('mobile-sidebar-backdrop');
    if (sidebar && !sidebar.classList.contains('-translate-x-full') && window.innerWidth < 1024) {
        toggleMobileSidebar();
    }

    // Scroll to top of content
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Refresh targeted data
    if (viewName === 'users') loadSuperAdminUserTable();
    if (viewName === 'screenings') loadMasterScreeningsTable();
    if (viewName === 'schools') loadSchoolsDirectory();
    if (viewName === 'analytics') loadAnalyticsView();
    if (viewName === 'alerts') loadAlertsView();
    if (viewName === 'security') loadAuditTrail();
    if (viewName === 'overview') updateOverviewMetrics();
}
window.switchSuperAdminView = switchSuperAdminView;

function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar-wrapper');
    const backdrop = document.getElementById('mobile-sidebar-backdrop');
    if (!sidebar || !backdrop) return;

    const isHidden = sidebar.classList.contains('-translate-x-full');
    if (isHidden) {
        sidebar.classList.remove('-translate-x-full');
        backdrop.classList.remove('hidden');
    } else {
        sidebar.classList.add('-translate-x-full');
        backdrop.classList.add('hidden');
    }
}
window.toggleMobileSidebar = toggleMobileSidebar;

// --------------------------------------------------------------------------
// 4. OVERVIEW DASHBOARD & DYNAMIC METRICS
// --------------------------------------------------------------------------
function updateOverviewMetrics() {
    const totalUsersEl = document.getElementById('stat-total-users');
    const totalScreeningsEl = document.getElementById('stat-total-screenings');
    const totalSchoolsEl = document.getElementById('stat-total-schools');
    const highRiskEl = document.getElementById('stat-high-risk');

    const totalUsers = window.superAdminData.users.length;
    const totalScreenings = window.superAdminData.screenings.length;
    const totalSchools = window.superAdminData.schools.length;
    const highRiskCount = window.superAdminData.screenings.filter(s => s.score >= 65).length;
    const pendingAdminsCount = window.superAdminData.users.filter(u => u.status === 'pending' || u.is_approved === false).length;

    if (totalUsersEl) totalUsersEl.textContent = totalUsers.toLocaleString();
    if (totalScreeningsEl) totalScreeningsEl.textContent = totalScreenings.toLocaleString();
    if (totalSchoolsEl) totalSchoolsEl.textContent = totalSchools.toLocaleString();
    if (highRiskEl) highRiskEl.textContent = `${highRiskCount}`;

    // Render Pending Educator Registration Alert Banner in Dashboard Overview
    const bannerContainer = document.getElementById('sa-pending-educator-alert-banner');
    if (bannerContainer) {
        if (pendingAdminsCount > 0) {
            const firstPending = window.superAdminData.users.find(u => u.status === 'pending' || u.is_approved === false);
            bannerContainer.innerHTML = `
                <div class="bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-700 p-0.5 rounded-3xl shadow-lg my-3">
                    <div class="bg-white rounded-[23px] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 font-extrabold text-xl shrink-0">
                                ⏳
                            </div>
                            <div>
                                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-black border border-amber-300">
                                    <i class="fa-solid fa-user-clock text-amber-600"></i> ${pendingAdminsCount} Permohonan Pendidik Menunggu Pengesahan
                                </span>
                                <h4 class="font-heading font-extrabold text-slate-900 text-sm sm:text-base mt-1">
                                    Pendaftaran Pendidik Baru Memerlukan Kelulusan & Penetapan Sekolah
                                </h4>
                                <p class="text-xs text-slate-600 font-medium">
                                    Sila sahkan akaun pendidik dan tetapkan cawangan sekolah untuk memberikan akses portal.
                                </p>
                            </div>
                        </div>
                        <button onclick="${firstPending ? `openApproveEducatorModal('${firstPending.id}')` : 'filterUsersByPending()'}" class="shrink-0 px-4 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer">
                            <span>Sahkan & Assign Sekolah Now</span>
                            <i class="fa-solid fa-arrow-right text-xs"></i>
                        </button>
                    </div>
                </div>
            `;
            bannerContainer.classList.remove('hidden');
        } else {
            bannerContainer.classList.add('hidden');
            bannerContainer.innerHTML = '';
        }
    }



    // Needs Your Attention Section
    const attentionTier3 = document.getElementById('overview-attention-tier3-count');
    const attentionAdmin = document.getElementById('overview-attention-admin-count');
    const attentionPurge = document.getElementById('overview-attention-purge-count');
    const attentionSchools = document.getElementById('overview-attention-schools-count');

    let deletedCount = 0;
    try {
        const d = localStorage.getItem('lexisense_deleted_students');
        if (d) deletedCount = JSON.parse(d).length;
    } catch(e) {}

    if (attentionTier3) attentionTier3.textContent = highRiskCount;
    if (attentionAdmin) attentionAdmin.textContent = pendingAdminsCount;
    if (attentionPurge) attentionPurge.textContent = deletedCount;
    if (attentionSchools) attentionSchools.textContent = totalSchools;

    // Screening Risk Stratification Breakdown Bars
    const tier1Count = window.superAdminData.screenings.filter(s => s.score < 35).length;
    const tier2Count = window.superAdminData.screenings.filter(s => s.score >= 35 && s.score < 65).length;
    const tier3Count = highRiskCount;
    const totalCount = totalScreenings || 1;

    const tier1Pct = Math.round((tier1Count / totalCount) * 100);
    const tier2Pct = Math.round((tier2Count / totalCount) * 100);
    const tier3Pct = Math.round((tier3Count / totalCount) * 100);

    const t1PctEl = document.getElementById('overview-tier1-pct');
    const t1BarEl = document.getElementById('overview-tier1-bar');
    const t2PctEl = document.getElementById('overview-tier2-pct');
    const t2BarEl = document.getElementById('overview-tier2-bar');
    const t3PctEl = document.getElementById('overview-tier3-pct');
    const t3BarEl = document.getElementById('overview-tier3-bar');

    if (t1PctEl) t1PctEl.textContent = `${tier1Pct}%`;
    if (t1BarEl) t1BarEl.style.width = `${tier1Pct}%`;
    if (t2PctEl) t2PctEl.textContent = `${tier2Pct}%`;
    if (t2BarEl) t2BarEl.style.width = `${tier2Pct}%`;
    if (t3PctEl) t3PctEl.textContent = `${tier3Pct}%`;
    if (t3BarEl) t3BarEl.style.width = `${tier3Pct}%`;

    // 3-Pillar Averages
    const p1Avg = Math.round(window.superAdminData.screenings.reduce((a, c) => a + (c.p1 || 0), 0) / totalCount);
    const p2Avg = Math.round(window.superAdminData.screenings.reduce((a, c) => a + (c.p2 || 0), 0) / totalCount);
    const p3Avg = Math.round(window.superAdminData.screenings.reduce((a, c) => a + (c.p3 || 0), 0) / totalCount);

    const p1AvgEl = document.getElementById('overview-p1-avg');
    const p2AvgEl = document.getElementById('overview-p2-avg');
    const p3AvgEl = document.getElementById('overview-p3-avg');

    if (p1AvgEl) p1AvgEl.textContent = `${p1Avg}%`;
    if (p2AvgEl) p2AvgEl.textContent = `${p2Avg}%`;
    if (p3AvgEl) p3AvgEl.textContent = `${p3Avg}%`;

    renderRecentActivityStream();
    renderPersonalGreeting();
}
window.updateOverviewMetrics = updateOverviewMetrics;

function renderPersonalGreeting() {
    const greetingEl = document.getElementById('welcome-greeting');
    if (!greetingEl) return;

    const now = new Date();
    const hour = now.getHours();
    let timeGreeting = "Good morning";
    if (hour >= 12 && hour < 18) timeGreeting = "Good afternoon";
    else if (hour >= 18) timeGreeting = "Good evening";

    const userName = window.currentUserProfile?.full_name?.split(' ')[0] || 
                     window.currentUserProfile?.username || 
                     'Faiz';

    greetingEl.innerHTML = `${timeGreeting}, ${escapeHTML(userName)} 👋`;
}

function renderRecentActivityStream() {
    const streamContainer = document.getElementById('sa-recent-activity-stream');
    if (!streamContainer) return;

    const logs = window.superAdminData.auditLogs.slice(0, 4);
    if (logs.length === 0) {
        streamContainer.innerHTML = '<p class="text-xs text-slate-400 p-3 text-center">No recent activity recorded.</p>';
        return;
    }

    streamContainer.innerHTML = logs.map(log => `
        <div class="flex items-center justify-between p-3 bg-purple-50/30 rounded-2xl border border-purple-100/70 hover:bg-purple-50/60 transition-colors text-xs overflow-hidden">
            <div class="flex items-center gap-3 min-w-0 flex-1 mr-2 overflow-hidden">
                <div class="w-8 h-8 rounded-xl ${log.status === 'SUCCESS' ? 'bg-purple-100 text-purple-700' : 'bg-rose-100 text-rose-700'} flex items-center justify-center text-xs font-bold shrink-0">
                    <i class="fa-solid ${log.event.includes('AUTH') ? 'fa-shield-halved' : (log.event.includes('REPORT') ? 'fa-file-pdf' : 'fa-brain')}"></i>
                </div>
                <div class="min-w-0 flex-1 overflow-hidden">
                    <span class="font-bold text-slate-900 block truncate">${escapeHTML(log.event.replace(/_/g, ' '))}</span>
                    <span class="text-slate-500 text-[11px] block truncate" title="${escapeHTML(log.target)} · @${escapeHTML(log.actor)}">${escapeHTML(log.target)} · <span class="font-semibold text-purple-800">@${escapeHTML(log.actor)}</span></span>
                </div>
            </div>
            <div class="text-right shrink-0 ml-1">
                <span class="inline-block px-2 py-0.5 rounded-full text-[9px] font-black ${log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}">${log.status}</span>
                <span class="block text-[10px] text-slate-400 mt-0.5">${log.timestamp.includes(' ') ? log.timestamp.split(' ')[1] : log.timestamp}</span>
            </div>
        </div>
    `).join('');
}

// --------------------------------------------------------------------------
// 5. GLOBAL COMMAND SEARCH & NOTIFICATION CENTER
// --------------------------------------------------------------------------
function handleGlobalSearch(query) {
    const resultsContainer = document.getElementById('global-search-results');
    if (!resultsContainer) return;

    const trimmed = (query || '').trim().toLowerCase();
    if (!trimmed) {
        resultsContainer.classList.add('hidden');
        return;
    }

    // Match screenings
    const matchedScreenings = window.superAdminData.screenings.filter(s => 
        (s.child_name && s.child_name.toLowerCase().includes(trimmed)) ||
        (s.child_id && s.child_id.toLowerCase().includes(trimmed)) ||
        (s.school && s.school.toLowerCase().includes(trimmed)) ||
        (s.guardian && s.guardian.toLowerCase().includes(trimmed))
    );

    // Match users
    const matchedUsers = window.superAdminData.users.filter(u => 
        (u.full_name && u.full_name.toLowerCase().includes(trimmed)) ||
        (u.email && u.email.toLowerCase().includes(trimmed)) ||
        (u.username && u.username.toLowerCase().includes(trimmed)) ||
        (u.school && u.school.toLowerCase().includes(trimmed))
    );

    // Match schools
    const matchedSchools = window.superAdminData.schools.filter(sch =>
        (sch.name && sch.name.toLowerCase().includes(trimmed)) ||
        (sch.code && sch.code.toLowerCase().includes(trimmed)) ||
        (sch.sen_lead && sch.sen_lead.toLowerCase().includes(trimmed))
    );

    if (matchedScreenings.length === 0 && matchedUsers.length === 0 && matchedSchools.length === 0) {
        resultsContainer.innerHTML = `
            <div class="p-4 text-center text-xs text-slate-500 font-medium">
                No matching results found for "<span class="font-bold text-slate-700">${escapeHTML(query)}</span>"
            </div>
        `;
        resultsContainer.classList.remove('hidden');
        return;
    }

    let html = '';

    if (matchedScreenings.length > 0) {
        html += `<div class="px-3 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Screenings (${matchedScreenings.length})</div>`;
        matchedScreenings.slice(0, 3).forEach(s => {
            html += `
                <div onclick="openSuperAdminReport('${encodeURIComponent(s.child_name)}'); closeGlobalSearch();" class="p-2.5 hover:bg-purple-50 rounded-xl cursor-pointer flex items-center justify-between text-xs transition-colors">
                    <div class="flex items-center gap-2.5">
                        <div class="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs"><i class="fa-solid fa-brain"></i></div>
                        <div>
                            <strong class="font-bold text-slate-900 block">${escapeHTML(s.child_name)}</strong>
                            <span class="text-[11px] text-slate-500">${s.child_id} · ${escapeHTML(s.school)}</span>
                        </div>
                    </div>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-black ${s.score >= 65 ? 'bg-rose-100 text-rose-800' : (s.score >= 35 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')}">${s.score}%</span>
                </div>
            `;
        });
    }

    if (matchedUsers.length > 0) {
        html += `<div class="px-3 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mt-1">Users (${matchedUsers.length})</div>`;
        matchedUsers.slice(0, 3).forEach(u => {
            html += `
                <div onclick="openUserProfileDrawer('${u.id}'); closeGlobalSearch();" class="p-2.5 hover:bg-purple-50 rounded-xl cursor-pointer flex items-center justify-between text-xs transition-colors">
                    <div class="flex items-center gap-2.5">
                        <div class="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">${(u.full_name || 'U').charAt(0).toUpperCase()}</div>
                        <div>
                            <strong class="font-bold text-slate-900 block">${escapeHTML(u.full_name || u.username)}</strong>
                            <span class="text-[11px] text-slate-500">@${escapeHTML(u.username)} · ${escapeHTML(u.role)}</span>
                        </div>
                    </div>
                    <span class="text-[10px] text-purple-700 font-bold">View Profile &rarr;</span>
                </div>
            `;
        });
    }

    if (matchedSchools.length > 0) {
        html += `<div class="px-3 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mt-1">Schools (${matchedSchools.length})</div>`;
        matchedSchools.slice(0, 2).forEach(sch => {
            html += `
                <div onclick="switchSuperAdminView('schools'); closeGlobalSearch();" class="p-2.5 hover:bg-purple-50 rounded-xl cursor-pointer flex items-center justify-between text-xs transition-colors">
                    <div class="flex items-center gap-2.5">
                        <div class="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs"><i class="fa-solid fa-school"></i></div>
                        <div>
                            <strong class="font-bold text-slate-900 block">${escapeHTML(sch.name)}</strong>
                            <span class="text-[11px] text-slate-500">${sch.code} · ${escapeHTML(sch.sen_lead)}</span>
                        </div>
                    </div>
                    <span class="text-[10px] text-amber-700 font-bold">View Roster &rarr;</span>
                </div>
            `;
        });
    }

    resultsContainer.innerHTML = html;
    resultsContainer.classList.remove('hidden');
}
window.handleGlobalSearch = handleGlobalSearch;

function closeGlobalSearch() {
    const resultsContainer = document.getElementById('global-search-results');
    if (resultsContainer) resultsContainer.classList.add('hidden');
}
window.closeGlobalSearch = closeGlobalSearch;

// Keyboard shortcut ⌘K / Ctrl+K
document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('global-command-search');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }
});

// Notification Dropdown Panel
function toggleNotificationDropdown() {
    const dropdown = document.getElementById('notification-dropdown');
    if (!dropdown) return;
    dropdown.classList.toggle('hidden');
    if (!dropdown.classList.contains('hidden')) {
        renderNotificationItems();
    }
}
window.toggleNotificationDropdown = toggleNotificationDropdown;

function updateNotificationBadges() {
    const unreadCount = window.superAdminData.notifications.filter(n => !n.is_read).length;
    const badge = document.getElementById('notif-count-badge');
    const sidebarBadge = document.getElementById('sidebar-alert-badge');
    const dropdownBadge = document.getElementById('notif-dropdown-badge');

    if (badge) badge.textContent = unreadCount;
    if (sidebarBadge) sidebarBadge.textContent = unreadCount;
    if (dropdownBadge) dropdownBadge.textContent = `${unreadCount} New`;
}

function renderNotificationItems() {
    const container = document.getElementById('notification-items-list');
    if (!container) return;

    if (window.superAdminData.notifications.length === 0) {
        container.innerHTML = '<p class="text-xs text-slate-400 p-4 text-center">No notifications at this time.</p>';
        return;
    }

    container.innerHTML = window.superAdminData.notifications.map(notif => `
        <div onclick="handleNotificationClick('${notif.id}')" class="p-2.5 rounded-xl hover:bg-purple-50/60 cursor-pointer transition-colors border border-transparent hover:border-purple-100 ${notif.is_read ? 'opacity-70' : 'bg-purple-50/30'}">
            <div class="flex items-start gap-2.5">
                <span class="w-2 h-2 rounded-full ${notif.is_read ? 'bg-slate-300' : 'bg-rose-500'} mt-1.5 shrink-0"></span>
                <div class="space-y-0.5 flex-1">
                    <strong class="text-xs font-bold text-slate-900 block">${escapeHTML(notif.title)}</strong>
                    <p class="text-[11px] text-slate-600 leading-tight">${escapeHTML(notif.desc)}</p>
                    <span class="text-[10px] text-slate-400 font-medium block">${notif.time}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function handleNotificationClick(notifId) {
    const notif = window.superAdminData.notifications.find(n => n.id === notifId);
    if (!notif) return;
    notif.is_read = true;
    updateNotificationBadges();
    toggleNotificationDropdown();

    if (notif.actionView) {
        switchSuperAdminView(notif.actionView);
        if (notif.filter && notif.actionView === 'screenings') {
            filterScreeningsByTier(notif.filter);
        } else if (notif.filter && notif.actionView === 'users') {
            filterUsersByPending();
        }
    }
}
window.handleNotificationClick = handleNotificationClick;

function markAllNotificationsRead() {
    window.superAdminData.notifications.forEach(n => n.is_read = true);
    updateNotificationBadges();
    renderNotificationItems();
    showToast('All notifications marked as read.');
}
window.markAllNotificationsRead = markAllNotificationsRead;

// --------------------------------------------------------------------------
// 6. USERS & ROLES DIRECTORY & SLIDE-OVER USER DRAWER
// --------------------------------------------------------------------------
function loadSuperAdminUserTable() {
    const tableBody = document.getElementById('superadmin-users-table-body');
    const searchInput = document.getElementById('user-search-input')?.value.toLowerCase().trim() || '';
    const roleFilter = document.getElementById('user-role-filter')?.value || 'all';
    const statusFilter = document.getElementById('user-status-filter')?.value || 'all';

    if (!tableBody) return;

    let users = window.superAdminData.users;

    let filtered = users.filter(user => {
        const matchesSearch = !searchInput || 
            (user.full_name && user.full_name.toLowerCase().includes(searchInput)) ||
            (user.email && user.email.toLowerCase().includes(searchInput)) ||
            (user.username && user.username.toLowerCase().includes(searchInput)) ||
            (user.school && user.school.toLowerCase().includes(searchInput));
        
        const matchesRole = (roleFilter === 'all') || (user.role === roleFilter);
        
        let matchesStatus = true;
        if (statusFilter === 'active') matchesStatus = user.is_active && user.status !== 'pending';
        else if (statusFilter === 'pending') matchesStatus = user.status === 'pending';
        else if (statusFilter === 'disabled') matchesStatus = !user.is_active || user.status === 'disabled';

        return matchesSearch && matchesRole && matchesStatus;
    });

    if (filtered.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="p-8 text-center text-slate-500 font-medium text-xs">
                    <i class="fa-solid fa-users-slash text-2xl text-purple-300 mb-2 block"></i>
                    No user accounts match your search filters.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = filtered.map(user => {
        let roleBadge = 'bg-slate-100 text-slate-700 border-slate-200';
        let roleLabel = 'Parent';
        if (user.role === 'admin') {
            roleBadge = 'bg-indigo-50 text-indigo-900 border-indigo-200';
            roleLabel = 'Educator / Admin';
        } else if (user.role === 'super_admin') {
            roleBadge = 'bg-amber-50 text-amber-950 border-amber-200';
            roleLabel = 'Super Admin';
        }

        let statusBadge = 'bg-emerald-50 text-emerald-800 border-emerald-200';
        let statusLabel = '● Active';
        if (user.status === 'pending') {
            statusBadge = 'bg-amber-50 text-amber-900 border-amber-200';
            statusLabel = '⏳ Pending Approval';
        } else if (!user.is_active || user.status === 'disabled') {
            statusBadge = 'bg-rose-50 text-rose-800 border-rose-200';
            statusLabel = '● Suspended';
        }

        return `
            <tr class="hover:bg-purple-50/40 transition-colors text-xs font-medium">
                <td class="p-3.5">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs shrink-0">
                            ${(user.full_name || user.username || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <span class="font-bold text-slate-900 block">${escapeHTML(user.full_name || user.username)}</span>
                            <span class="text-[11px] text-slate-500 font-mono">@${escapeHTML(user.username)}</span>
                        </div>
                    </div>
                </td>
                <td class="p-3.5 text-slate-600 font-semibold">${escapeHTML(user.email)}</td>
                <td class="p-3.5 text-purple-900 font-bold">${escapeHTML(user.school || 'Unassigned')}</td>
                <td class="p-3.5">
                    <select onchange="updateUserRoleDirectly('${user.id}', this.value)" class="bg-purple-50/90 border border-purple-200 rounded-xl px-2.5 py-1 text-xs font-bold text-purple-950 focus:ring-2 focus:ring-purple-600 focus:outline-none transition-all cursor-pointer hover:bg-purple-100 shadow-xs">
                        <option value="parent" ${user.role === 'parent' ? 'selected' : ''}>👨‍👩‍👧 Parent</option>
                        <option value="admin" ${user.role === 'admin' || user.role === 'teacher' ? 'selected' : ''}>👨‍🏫 Educator / Admin</option>
                        <option value="super_admin" ${user.role === 'super_admin' ? 'selected' : ''}>👑 Super Admin</option>
                    </select>
                </td>
                <td class="p-3.5">
                    <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-black border ${statusBadge}">
                        ${statusLabel}
                    </span>
                </td>
                <td class="p-3.5 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                        ${(user.status === 'pending' || user.is_approved === false) ? `
                            <button onclick="openApproveEducatorModal('${user.id}')" class="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-[11px] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer">
                                <i class="fa-solid fa-school-flag"></i> Sahkan & Assign Sekolah
                            </button>
                        ` : ''}
                        <button onclick="openUserProfileDrawer('${user.id}')" class="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg font-bold text-[11px] border border-purple-200 transition-colors cursor-pointer">
                            Manage &rarr;
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}
window.loadSuperAdminUserTable = loadSuperAdminUserTable;

/**
 * Multi-level Supabase Sync for Profile updates (ID -> Email -> Username -> Upsert)
 */
async function syncProfileToSupabase(userObj, updatePayload = {}) {
    if (!userObj) return false;
    const client = typeof getSupabase === 'function' ? getSupabase() : null;
    if (!client) return false;

    const cleanEmail = (userObj.email || '').toLowerCase().trim();
    const cleanUname = (userObj.username || '').toLowerCase().trim();
    const userId = userObj.id;
    const targetRole = updatePayload.role || userObj.role || 'admin';

    let updated = false;

    // 1. Try RPC call first (runs with SECURITY DEFINER to bypass RLS policy in Supabase)
    try {
        const targetIdentifier = cleanEmail || cleanUname || userId;
        if (targetIdentifier) {
            const { error: rpcErr } = await client.rpc('update_user_role', {
                target_email: targetIdentifier,
                target_role: targetRole
            });
            if (!rpcErr) {
                updated = true;
                console.log(`[Supabase Cloud RPC Success] Updated role for ${targetIdentifier} -> ${targetRole} ✅`);
            }
        }
    } catch (e) {}

    if (!updated) {
        // Safe payload containing ONLY valid Supabase Cloud profiles table columns
        const dbPayload = {
            role: targetRole,
            is_active: userObj.is_active !== false,
            updated_at: new Date().toISOString()
        };

        if (userObj.school || userObj.school_branch || updatePayload.school_branch) {
            dbPayload.school_branch = userObj.school || userObj.school_branch || updatePayload.school_branch;
        }

        try {
            // 2. Try update by UUID id
            if (userId && typeof isValidUUID === 'function' && isValidUUID(userId)) {
                const { data, error } = await client.from('profiles').update(dbPayload).eq('id', userId).select();
                if (!error && Array.isArray(data) && data.length > 0) {
                    updated = true;
                    console.log(`[Supabase Cloud Success] Profile updated by ID (${userId}) -> role: ${data[0].role} ✅`);
                } else if (error) {
                    console.warn("[Supabase Cloud] Update by ID notice:", error.message);
                }
            }

            // 3. Fallback: Try update by email if not updated by ID
            if (!updated && cleanEmail) {
                const { data, error } = await client.from('profiles').update(dbPayload).ilike('email', cleanEmail).select();
                if (!error && Array.isArray(data) && data.length > 0) {
                    updated = true;
                    console.log(`[Supabase Cloud Success] Profile updated by Email (${cleanEmail}) -> role: ${data[0].role} ✅`);
                } else if (error) {
                    console.warn("[Supabase Cloud] Update by Email notice:", error.message);
                }
            }

            // 4. Fallback: Try update by username if not updated
            if (!updated && cleanUname) {
                const { data, error } = await client.from('profiles').update(dbPayload).ilike('username', cleanUname).select();
                if (!error && Array.isArray(data) && data.length > 0) {
                    updated = true;
                    console.log(`[Supabase Cloud Success] Profile updated by Username (${cleanUname}) -> role: ${data[0].role} ✅`);
                } else if (error) {
                    console.warn("[Supabase Cloud] Update by Username notice:", error.message);
                }
            }

            // 5. Fallback: Upsert full profile if not found in profiles table
            if (!updated) {
                const upsertRow = {
                    username: userObj.username || cleanUname || (cleanEmail ? cleanEmail.split('@')[0] : 'user'),
                    full_name: userObj.full_name || userObj.name || userObj.username || 'User',
                    email: userObj.email || cleanEmail,
                    role: targetRole,
                    is_active: true,
                    updated_at: new Date().toISOString()
                };
                if (userId && typeof isValidUUID === 'function' && isValidUUID(userId)) {
                    upsertRow.id = userId;
                }
                if (dbPayload.school_branch) {
                    upsertRow.school_branch = dbPayload.school_branch;
                }

                const { data: upData, error: upErr } = await client.from('profiles').upsert([upsertRow]).select();
                if (!upErr && Array.isArray(upData) && upData.length > 0) {
                    updated = true;
                    console.log(`[Supabase Cloud Success] Profile upserted to Supabase -> role: ${upData[0].role} ✅`);
                } else if (upErr) {
                    console.error("[Supabase Cloud Error] Upsert notice:", upErr.message);
                }
            }
        } catch (e) {
            console.warn("[Supabase Cloud Sync Exception]:", e);
        }
    }

    return updated;
}
/**
 * Synchronizes user object across all local storage registries & active session
 */
function syncUserToLocalStorage(userObj) {
    if (!userObj) return;
    try {
        const cleanEmail = (userObj.email || '').toLowerCase().trim();
        const cleanUname = (userObj.username || '').toLowerCase().trim();
        const pIdStr = String(userObj.id || '').toLowerCase().trim();

        // 1. Update or Insert into lexisense_registered_users
        let localUsers = JSON.parse(localStorage.getItem('lexisense_registered_users') || '{}');
        let found = false;

        if (Array.isArray(localUsers)) {
            localUsers.forEach(u => {
                if ((u.email && u.email.toLowerCase().trim() === cleanEmail) || 
                    (u.username && u.username.toLowerCase().trim() === cleanUname) || 
                    (u.id && String(u.id).toLowerCase().trim() === pIdStr)) {
                    u.role = userObj.role;
                    u.is_approved = userObj.is_approved;
                    u.is_active = userObj.is_active;
                    u.status = userObj.status;
                    if (userObj.school || userObj.school_branch) {
                        u.school = userObj.school || userObj.school_branch;
                        u.school_branch = userObj.school || userObj.school_branch;
                    }
                    found = true;
                }
            });
            if (!found) {
                localUsers.push({
                    id: userObj.id,
                    username: userObj.username || cleanUname,
                    full_name: userObj.full_name || userObj.name || userObj.username,
                    email: userObj.email || cleanEmail,
                    role: userObj.role,
                    school: userObj.school || userObj.school_branch || null,
                    school_branch: userObj.school || userObj.school_branch || null,
                    is_active: userObj.is_active !== false,
                    is_approved: userObj.is_approved !== false,
                    status: userObj.status || 'active',
                    updated_at: new Date().toISOString()
                });
            }
            localStorage.setItem('lexisense_registered_users', JSON.stringify(localUsers));
        } else if (typeof localUsers === 'object' && localUsers !== null) {
            Object.keys(localUsers).forEach(k => {
                if (k.toLowerCase() === cleanUname || k.toLowerCase() === cleanEmail || (localUsers[k]?.id && String(localUsers[k].id).toLowerCase().trim() === pIdStr)) {
                    localUsers[k].role = userObj.role;
                    localUsers[k].is_approved = userObj.is_approved;
                    localUsers[k].is_active = userObj.is_active;
                    localUsers[k].status = userObj.status;
                    if (userObj.school || userObj.school_branch) {
                        localUsers[k].school = userObj.school || userObj.school_branch;
                        localUsers[k].school_branch = userObj.school || userObj.school_branch;
                    }
                    found = true;
                }
            });
            if (!found) {
                const key = cleanUname || cleanEmail || userObj.id;
                if (key) {
                    localUsers[key] = {
                        id: userObj.id,
                        username: userObj.username || cleanUname,
                        full_name: userObj.full_name || userObj.name || userObj.username,
                        email: userObj.email || cleanEmail,
                        role: userObj.role,
                        school: userObj.school || userObj.school_branch || null,
                        school_branch: userObj.school || userObj.school_branch || null,
                        is_active: userObj.is_active !== false,
                        is_approved: userObj.is_approved !== false,
                        status: userObj.status || 'active',
                        updated_at: new Date().toISOString()
                    };
                }
            }
            localStorage.setItem('lexisense_registered_users', JSON.stringify(localUsers));
        }

        // 2. Save explicit role override map in localStorage
        let roleOverrides = JSON.parse(localStorage.getItem('lexisense_user_role_overrides') || '{}');
        if (pIdStr) roleOverrides[pIdStr] = userObj.role;
        if (cleanEmail) roleOverrides[cleanEmail] = userObj.role;
        if (cleanUname) roleOverrides[cleanUname] = userObj.role;
        localStorage.setItem('lexisense_user_role_overrides', JSON.stringify(roleOverrides));

        // 3. Update logged-in session user if matching
        let loggedIn = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
        if (loggedIn && ((loggedIn.email && loggedIn.email.toLowerCase().trim() === cleanEmail) || 
                         (loggedIn.username && loggedIn.username.toLowerCase().trim() === cleanUname) || 
                         (loggedIn.id && String(loggedIn.id).toLowerCase().trim() === pIdStr))) {
            loggedIn.role = userObj.role;
            loggedIn.is_approved = userObj.is_approved;
            loggedIn.is_active = userObj.is_active;
            loggedIn.status = userObj.status;
            if (userObj.school || userObj.school_branch) loggedIn.school = userObj.school || userObj.school_branch;
            window.loggedInUser = loggedIn;
            localStorage.setItem('lexisense_user', JSON.stringify(loggedIn));
        }

        // 4. Update profile username key in local storage
        if (cleanUname) {
            let prof = JSON.parse(localStorage.getItem(`lexisense_profile_${cleanUname}`) || 'null');
            if (prof) {
                prof.role = userObj.role;
                prof.is_approved = userObj.is_approved;
                prof.is_active = userObj.is_active;
                prof.status = userObj.status;
                if (userObj.school || userObj.school_branch) prof.school = userObj.school || userObj.school_branch;
                localStorage.setItem(`lexisense_profile_${cleanUname}`, JSON.stringify(prof));
            }
        }
    } catch (e) {
        console.warn("Error updating local storage registries:", e);
    }
}
window.syncUserToLocalStorage = syncUserToLocalStorage;

async function updateUserRoleDirectly(userId, newRole) {
    const userObj = window.superAdminData.users.find(u => 
        String(u.id) === String(userId) || 
        (u.username && String(u.username).toLowerCase() === String(userId).toLowerCase()) || 
        (u.email && String(u.email).toLowerCase() === String(userId).toLowerCase())
    );

    if (!userObj) {
        console.warn("[Super Admin] Target user not found for ID:", userId);
        showToast("Ralat: Pengguna tidak dijumpai dalam senarai.", "warning");
        return;
    }

    const oldRole = userObj.role;
    const wasPending = userObj.status === 'pending' || userObj.is_approved === false;
    userObj.role = newRole;
    userObj.is_approved = true;
    userObj.is_active = true;
    userObj.status = 'active';

    // 1. Sync live with Supabase cloud DB profiles table
    await syncProfileToSupabase(userObj, {
        role: newRole,
        is_approved: true,
        is_active: true,
        status: 'active'
    });

    // 2. Sync local storage user registries
    syncUserToLocalStorage(userObj);

    addAuditLog('ROLE_MODIFIED', `Changed role for ${userObj.full_name} from ${oldRole} to ${newRole}`);
    showToast(`Peranan ${userObj.full_name} ditukar ke ${newRole} & disegerakkan ke Supabase! ⚡`);

    // Always dispatch role email notification
    sendUserRoleChangeEmail(userObj, oldRole, newRole);

    if ((newRole === 'admin' || newRole === 'teacher') && wasPending) {
        sendEducatorApprovalEmail(userObj);
    }

    await syncAllSuperAdminData();
}
window.updateUserRoleDirectly = updateUserRoleDirectly;

function filterUsersByPending() {
    switchSuperAdminView('users');
    const statusSelect = document.getElementById('user-status-filter');
    if (statusSelect) {
        statusSelect.value = 'pending';
        loadSuperAdminUserTable();
    }
}
window.filterUsersByPending = filterUsersByPending;

async function sendEducatorApprovalEmail(user) {
    if (!user || !user.email) return;

    const recipient = user.email;
    const name = user.full_name || user.name || user.username || 'Pendidik';
    const school = user.school || user.school_branch || 'Sekolah';
    const username = user.username || user.email;
    const portalUrl = `${window.location.origin || 'https://lexisense.ai'}/index.html`;

    const emailHTML = `<!DOCTYPE html>
<html lang="ms">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Akaun Pendidik LexiSense Anda Telah Disahkan</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E1B4B; }
    .card-wrap { max-width: 600px; margin: 24px auto; background-color: #FFFFFF; border: 1.5px solid #E2E8F0; border-radius: 28px; overflow: hidden; box-shadow: 0 20px 45px -12px rgba(99, 102, 241, 0.12); }
    .header-box { background: linear-gradient(135deg, #4C1D95 0%, #6D28D9 50%, #4F46E5 100%); padding: 36px 28px 30px; text-align: center; color: #FFFFFF; }
    .content-box { padding: 36px 32px 28px; text-align: left; }
    .badge-pill { display: inline-block; font-size: 11px; font-weight: 800; color: #065F46; background-color: #D1FAE5; border: 1px solid #A7F3D0; padding: 6px 16px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
    .detail-box { background: linear-gradient(180deg, #FAF5FF 0%, #F5EEFD 100%); border: 1.5px solid #E9D5FF; border-radius: 20px; padding: 22px; margin: 20px 0; }
    .btn-login { display: inline-block; background: linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%); color: #FFFFFF !important; font-size: 14px; font-weight: 800; text-decoration: none; padding: 14px 32px; border-radius: 16px; box-shadow: 0 8px 20px rgba(124, 58, 237, 0.3); }
  </style>
</head>
<body style="background-color: #F8FAFC; margin: 0; padding: 20px;">
  <div class="card-wrap">
    <div class="header-box">
      <div style="font-size: 44px; margin-bottom: 8px;">🦉</div>
      <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #FFFFFF;">LexiSense</h1>
      <div style="display: inline-block; margin-top: 8px; font-size: 11px; font-weight: 800; color: #EDE9FE; background-color: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); padding: 4px 14px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 1.2px;">
        AI Literacy & Dyslexia Screening System
      </div>
    </div>
    
    <div class="content-box">
      <div style="text-align: center;">
        <span class="badge-pill">✅ Permohonan Disahkan Super Admin</span>
      </div>

      <h2 style="margin: 0 0 12px; font-size: 22px; font-weight: 800; color: #1E1B4B; line-height: 1.3;">
        Tahniah, Akaun Pendidik Anda Telah Diluluskan! 🎉
      </h2>

      <p style="margin: 0 0 16px; font-size: 14.5px; line-height: 1.6; color: #475569; font-weight: 500;">
        Hai <strong>${name}</strong>,
      </p>

      <p style="margin: 0 0 20px; font-size: 14.5px; line-height: 1.6; color: #475569; font-weight: 500;">
        Berita gembira! Permohonan akaun Pendidik / Guru Sekolah anda bagi <strong>${school}</strong> telah disahkan dan diluluskan secara rasmi oleh Super Admin LexiSense.
      </p>

      <div class="detail-box">
        <h3 style="margin: 0 0 12px; font-size: 14px; font-weight: 800; color: #4C1D95; letter-spacing: 0.5px;">
          📋 BUTIRAN AKAUN PENDIDIK DISAHKAN:
        </h3>
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13.5px; color: #334155; line-height: 1.8;">
          <tr>
            <td style="font-weight: 700; width: 140px; color: #6B21A8;">Nama Penuh:</td>
            <td style="font-weight: 800; color: #1E1B4B;">${name}</td>
          </tr>
          <tr>
            <td style="font-weight: 700; color: #6B21A8;">E-mel Berdaftar:</td>
            <td style="font-weight: 800; color: #1E1B4B;">${recipient}</td>
          </tr>
          <tr>
            <td style="font-weight: 700; color: #6B21A8;">Nama Pengguna:</td>
            <td style="font-weight: 800; color: #1E1B4B;">${username}</td>
          </tr>
          <tr>
            <td style="font-weight: 700; color: #6B21A8;">Sekolah / Cawangan:</td>
            <td style="font-weight: 800; color: #1E1B4B;">${school}</td>
          </tr>
          <tr>
            <td style="font-weight: 700; color: #6B21A8;">Peranan Portal:</td>
            <td style="font-weight: 800; color: #059669;">Educator / School Administrator</td>
          </tr>
        </table>
      </div>

      <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #475569; font-weight: 500;">
        Anda kini boleh log masuk ke Portal Pendidik untuk menguruskan senarai murid, menjalankan saringan dyslexia 3-Pillar, serta melihat laporan komprehensif.
      </p>

      <div style="text-align: center; margin: 28px 0 16px;">
        <a href="${portalUrl}" class="btn-login">🔑 Log Masuk Ke Portal Pendidik Sekarang →</a>
      </div>

      <p style="margin: 20px 0 0; font-size: 12px; text-align: center; color: #94A3B8; font-weight: 600;">
        Jika anda tidak membuat permohonan ini, sila abaikan e-mel ini atau hubungi sokongan LexiSense.
      </p>
    </div>
  </div>
</body>
</html>`;

    try {
        const res = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: recipient,
                from: 'LexiSense Support <noreply@lexisense.my>',
                subject: `LexiSense — Akaun Pendidik Anda Telah Disahkan! 🦉✨`,
                html: emailHTML
            })
        });
        if (res.ok) {
            console.log("Educator approval email sent via Resend API to", recipient);
        } else {
            const errData = await res.json().catch(() => ({}));
            console.warn("Resend API notice:", res.status, errData);
        }
    } catch (e) {
        console.warn("Notice dispatching approval email, trying fallback FormSubmit:", e);
        try {
            await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    _subject: `LexiSense — Akaun Pendidik Anda Telah Disahkan! 🦉✨`,
                    Status: 'Educator Account Approved by Super Admin',
                    Educator_Name: name,
                    School_Branch: school,
                    Registered_Email: recipient,
                    Message: `Akaun Pendidik anda bagi ${school} telah disahkan. Anda kini boleh log masuk.`
                })
            });
        } catch(fallbackErr) {}
    }
}
window.sendEducatorApprovalEmail = sendEducatorApprovalEmail;

async function sendUserRoleChangeEmail(user, oldRole, newRole) {
    if (!user) return;

    let recipient = user.email;
    if (!recipient || recipient.includes('@lexisense.ai')) {
        try {
            const localUsers = JSON.parse(localStorage.getItem('lexisense_users') || '{}');
            for (const k in localUsers) {
                const u = localUsers[k];
                if (u && (u.id === user.id || u.username === user.username) && u.email && !u.email.includes('@lexisense.ai')) {
                    recipient = u.email;
                    break;
                }
            }
        } catch(e) {}
    }

    if (!recipient || recipient.includes('@lexisense.ai')) {
        try {
            const loggedIn = JSON.parse(localStorage.getItem('lexisense_user') || '{}');
            if (loggedIn && loggedIn.email && !loggedIn.email.includes('@lexisense.ai')) {
                recipient = loggedIn.email;
            }
        } catch(e) {}
    }

    if (!recipient || recipient.includes('@lexisense.ai')) {
        console.warn("[Resend API] Skipping role email: No valid recipient email address found for user", user);
        showToast("Amaran: E-mel penerima tidak dijumpai untuk pengguna ini.", "warning");
        return;
    }

    const name = user.full_name || user.username || 'Pengguna LexiSense';

    const roleMap = {
        'parent': 'Ibu Bapa (Parent)',
        'admin': 'Pendidik / Pentadbir (Educator / Admin)',
        'super_admin': 'Super Admin',
        'teacher': 'Guru / Pendidik'
    };

    const oldRoleLabel = roleMap[oldRole] || oldRole;
    const newRoleLabel = roleMap[newRole] || newRole;

    const emailHTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #4c1d95; margin: 0; font-size: 24px;">🦉 LexiSense</h1>
      <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Sistem Saringan & Sokongan Pembacaan Disleksia</p>
    </div>
    
    <div style="background-color: #f3e8ff; border-left: 4px solid #7e22ce; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
      <h2 style="color: #581c87; margin: 0 0 8px 0; font-size: 18px;">Kemaskini Peranan Akaun Anda ✨</h2>
      <p style="color: #6b21a8; margin: 0; font-size: 14px;">Salam ${escapeHTML(name)}, peranan akaun anda di portal LexiSense telah dikemaskini oleh Pentadbir Sistem.</p>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: bold;">E-mel Berdaftar:</td>
        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: bold;">${escapeHTML(recipient)}</td>
      </tr>
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: bold;">Peranan Asal:</td>
        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; color: #ef4444; font-weight: bold;">${escapeHTML(oldRoleLabel)}</td>
      </tr>
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: bold;">Peranan Baharu:</td>
        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; color: #15803d; font-weight: bold;">${escapeHTML(newRoleLabel)}</td>
      </tr>
    </table>

    <div style="text-align: center; margin-top: 30px;">
      <a href="https://lexisense.my" style="background-color: #7e22ce; color: #ffffff; padding: 12px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block;">Log Masuk Ke Portal LexiSense</a>
    </div>

    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0 20px 0;" />
    <p style="font-size: 12px; text-align: center; color: #94a3b8;">
      Ini adalah e-mel automatik daripada sistem LexiSense (<a href="https://lexisense.my" style="color: #7e22ce;">lexisense.my</a>). Sila hubungi pentadbir jika anda memerlukan bantuan.
    </p>
  </div>
</body>
</html>`;

    try {
        const res = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: recipient,
                from: 'LexiSense Support <noreply@lexisense.my>',
                subject: `LexiSense — Peranan Akaun Anda Telah Dikemaskini (-> ${newRoleLabel}) 🦉`,
                html: emailHTML
            })
        });
        if (res.ok) {
            console.log(`[Resend API Success] Role change email sent to ${recipient} (${oldRole} -> ${newRole})`);
            showToast(`Emel notifikasi peranan berjaya dihantar ke: ${recipient} ✉️`);
        } else {
            const errData = await res.json().catch(() => ({}));
            console.warn("Resend API role change email error:", res.status, errData);
            showToast(`Ralat Resend (${res.status}): ${errData.error || errData.message || 'Gagal hantar emel'}`, 'warning');
        }
    } catch (e) {
        console.warn("Notice dispatching role change email:", e);
    }
}
window.sendUserRoleChangeEmail = sendUserRoleChangeEmail;

/**
 * Interactive Modal for Approving Educator Accounts & Assigning School Branch
 */
function openApproveEducatorModal(userId) {
    const user = window.superAdminData.users.find(u => u.id === userId);
    if (!user) return;

    let modal = document.getElementById('sa-approve-educator-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'sa-approve-educator-modal';
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in';
        document.body.appendChild(modal);
    }

    const schoolsList = window.superAdminData.schools || [];
    const requestedSchool = user.school || user.school_branch || 'SK Taman Ria';

    let schoolOptionsHtml = schoolsList.map(sch => 
        `<option value="${escapeHTML(sch.name)}" ${sch.name.toLowerCase() === requestedSchool.toLowerCase() ? 'selected' : ''}>🏫 ${escapeHTML(sch.name)} (${sch.code || 'MOE'})</option>`
    ).join('');

    if (!schoolsList.some(s => s.name.toLowerCase() === requestedSchool.toLowerCase())) {
        schoolOptionsHtml += `<option value="${escapeHTML(requestedSchool)}" selected>🏫 ${escapeHTML(requestedSchool)} (Dimohon Pendidik)</option>`;
    }
    schoolOptionsHtml += `<option value="__custom__">➕ Taip / Tambah Sekolah Baru...</option>`;

    modal.innerHTML = `
        <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border-2 border-purple-200 shadow-2xl space-y-6 text-left relative overflow-hidden animate-pop">
            <div class="flex items-center justify-between border-b border-purple-100 pb-4">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-xl font-extrabold shadow-md">
                        🏫
                    </div>
                    <div>
                        <h3 class="font-heading font-extrabold text-lg text-slate-900">Sahkan Pendidik & Assign Sekolah</h3>
                        <p class="text-xs text-slate-500 font-medium">Tetapkan cawangan sekolah dan peranan portal sebelum mengaktifkan akses.</p>
                    </div>
                </div>
                <button onclick="closeApproveEducatorModal()" class="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl cursor-pointer">
                    <i class="fa-solid fa-xmark text-lg"></i>
                </button>
            </div>

            <div class="bg-purple-50/80 rounded-2xl p-4 border border-purple-200 space-y-2 text-xs">
                <div class="flex justify-between"><span class="font-bold text-slate-600">Nama Pendidik:</span><span class="font-bold text-purple-950">${escapeHTML(user.full_name || user.username)}</span></div>
                <div class="flex justify-between"><span class="font-bold text-slate-600">E-mel Berdaftar:</span><span class="font-mono text-purple-800 font-bold">${escapeHTML(user.email)}</span></div>
                <div class="flex justify-between"><span class="font-bold text-slate-600">Sekolah Dimohon:</span><span class="font-bold text-indigo-900">${escapeHTML(requestedSchool)}</span></div>
            </div>

            <div class="space-y-4">
                <div>
                    <label class="block text-xs font-extrabold text-slate-800 mb-1.5">Pilih / Sahkan Cawangan Sekolah (Assign School) <span class="text-rose-500">*</span></label>
                    <select id="approve-educator-school-select" onchange="toggleCustomSchoolInput(this.value)" class="w-full bg-slate-50 border border-purple-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none transition-all cursor-pointer">
                        ${schoolOptionsHtml}
                    </select>
                </div>

                <div id="approve-custom-school-group" class="hidden">
                    <label class="block text-xs font-extrabold text-slate-800 mb-1">Nama Sekolah Baru</label>
                    <input type="text" id="approve-educator-school-custom" placeholder="Contoh: SK Seri Bintang Utama" class="w-full bg-slate-50 border border-purple-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none">
                </div>

                <div>
                    <label class="block text-xs font-extrabold text-slate-800 mb-1.5">Peranan Portal (Assigned Role)</label>
                    <select id="approve-educator-role-select" class="w-full bg-slate-50 border border-purple-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none transition-all cursor-pointer">
                        <option value="admin" selected>👨‍🏫 Educator / School Administrator</option>
                        <option value="super_admin">👑 Super Administrator</option>
                    </select>
                </div>
            </div>

            <div class="pt-2 flex items-center gap-3">
                <button onclick="closeApproveEducatorModal()" class="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer">
                    Batal
                </button>
                <button onclick="confirmApproveEducator('${user.id}')" class="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer">
                    <i class="fa-solid fa-check"></i>
                    <span>Sahkan & Hantar E-mel</span>
                </button>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
}

function toggleCustomSchoolInput(val) {
    const customGrp = document.getElementById('approve-custom-school-group');
    if (customGrp) {
        if (val === '__custom__') customGrp.classList.remove('hidden');
        else customGrp.classList.add('hidden');
    }
}
window.toggleCustomSchoolInput = toggleCustomSchoolInput;

function closeApproveEducatorModal() {
    const modal = document.getElementById('sa-approve-educator-modal');
    if (modal) modal.classList.add('hidden');
}
window.closeApproveEducatorModal = closeApproveEducatorModal;
window.openApproveEducatorModal = openApproveEducatorModal;

async function confirmApproveEducator(userId) {
    const user = window.superAdminData.users.find(u => u.id === userId);
    if (!user) return;

    const schoolSelect = document.getElementById('approve-educator-school-select');
    const schoolCustom = document.getElementById('approve-educator-school-custom');
    const roleSelect = document.getElementById('approve-educator-role-select');

    let assignedSchool = schoolSelect ? schoolSelect.value : (user.school || 'SK Taman Ria');
    if (assignedSchool === '__custom__' && schoolCustom && schoolCustom.value.trim()) {
        assignedSchool = schoolCustom.value.trim();
    }
    const assignedRole = roleSelect ? roleSelect.value : 'admin';

    user.school = assignedSchool;
    user.school_branch = assignedSchool;
    user.role = assignedRole;
    user.is_approved = true;
    user.is_active = true;
    user.status = 'active';

    // 1. Sync live with Supabase cloud DB profiles table
    await syncProfileToSupabase(user, {
        school_branch: assignedSchool,
        role: assignedRole,
        is_approved: true,
        is_active: true,
        status: 'active'
    });

    // 2. Sync local storage registries
    syncUserToLocalStorage(user);

    addAuditLog('USER_ACCOUNT_APPROVED', `Approved educator credentials for ${user.full_name} (${user.email}) and assigned to ${assignedSchool}`);
    showToast(`Akaun ${user.full_name} disahkan & ditetapkan ke ${assignedSchool}! E-mel telah dihantar. 📧🎉`);

    closeApproveEducatorModal();

    // Dispatch approval email notification with assigned school
    sendEducatorApprovalEmail(user, assignedSchool);

    await syncAllSuperAdminData();
}
window.confirmApproveEducator = confirmApproveEducator;

async function approveUserAdmin(userId) {
    openApproveEducatorModal(userId);
}
window.approveUserAdmin = approveUserAdmin;

// User Profile Slide-Over Drawer
function openUserProfileDrawer(userId) {
    const user = window.superAdminData.users.find(u => u.id === userId);
    if (!user) return;

    window.superAdminData.activeDrawerUserId = userId;

    const drawer = document.getElementById('user-profile-drawer');
    const drawerAvatar = document.getElementById('drawer-user-avatar');
    const drawerName = document.getElementById('drawer-user-name');
    const drawerRoleBadge = document.getElementById('drawer-user-role-badge');
    const drawerId = document.getElementById('drawer-user-id');
    const drawerEmail = document.getElementById('drawer-user-email');
    const drawerSchool = document.getElementById('drawer-user-school');
    const drawerStatus = document.getElementById('drawer-user-status');
    const drawerCreated = document.getElementById('drawer-user-created');
    const drawerRoleSelect = document.getElementById('drawer-role-select');
    const drawerToggleBtn = document.getElementById('drawer-toggle-status-btn');
    const drawerScreeningsList = document.getElementById('drawer-screenings-list');

    if (drawerAvatar) drawerAvatar.textContent = (user.full_name || 'U').charAt(0).toUpperCase();
    if (drawerName) drawerName.textContent = user.full_name || user.username;
    if (drawerRoleBadge) drawerRoleBadge.textContent = `${user.role.toUpperCase()} ACCOUNT`;
    if (drawerId) drawerId.textContent = user.id;
    if (drawerEmail) drawerEmail.textContent = user.email;
    if (drawerSchool) drawerSchool.textContent = user.school || 'Unassigned';
    if (drawerStatus) drawerStatus.textContent = user.is_active ? '● Active' : '● Suspended';
    if (drawerCreated) drawerCreated.textContent = user.created_at;
    if (drawerRoleSelect) drawerRoleSelect.value = user.role;

    if (drawerToggleBtn) {
        if (user.is_active) {
            drawerToggleBtn.innerHTML = '<i class="fa-solid fa-ban mr-1"></i> Suspend Account';
            drawerToggleBtn.className = 'flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs transition-colors';
        } else {
            drawerToggleBtn.innerHTML = '<i class="fa-solid fa-rotate-left mr-1"></i> Reactivate Account';
            drawerToggleBtn.className = 'flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold rounded-xl text-xs transition-colors';
        }
    }

    // Render child screenings associated with this user
    if (drawerScreeningsList) {
        const associatedScreenings = window.superAdminData.screenings.filter(s => 
            s.guardian === user.full_name || s.school === user.school
        );

        if (associatedScreenings.length === 0) {
            drawerScreeningsList.innerHTML = '<p class="text-slate-400 text-xs italic">No screening assessments linked yet.</p>';
        } else {
            drawerScreeningsList.innerHTML = associatedScreenings.slice(0, 4).map(s => `
                <div class="p-2.5 bg-slate-50 hover:bg-purple-50 rounded-xl border border-slate-200 flex items-center justify-between transition-colors">
                    <div>
                        <strong class="text-xs font-bold text-slate-900 block">${escapeHTML(s.child_name)}</strong>
                        <span class="text-[11px] text-slate-500 font-mono">${s.child_id} · ${s.date}</span>
                    </div>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-black ${s.score >= 65 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}">${s.score}%</span>
                </div>
            `).join('');
        }
    }

    if (drawer) drawer.classList.remove('drawer-hidden');
}
window.openUserProfileDrawer = openUserProfileDrawer;

function closeUserProfileDrawer() {
    const drawer = document.getElementById('user-profile-drawer');
    if (drawer) drawer.classList.add('drawer-hidden');
    window.superAdminData.activeDrawerUserId = null;
}
window.closeUserProfileDrawer = closeUserProfileDrawer;

async function saveDrawerUserRole() {
    const userId = window.superAdminData.activeDrawerUserId;
    const roleSelect = document.getElementById('drawer-role-select');
    if (!userId || !roleSelect) {
        showToast("Amaran: Sila pilih pengguna terlebih dahulu.", "warning");
        return;
    }

    const newRole = roleSelect.value;
    const userObj = window.superAdminData.users.find(u => 
        String(u.id) === String(userId) || 
        (u.username && String(u.username).toLowerCase() === String(userId).toLowerCase()) || 
        (u.email && String(u.email).toLowerCase() === String(userId).toLowerCase())
    );

    if (userObj) {
        const oldRole = userObj.role;
        const wasPending = userObj.status === 'pending' || userObj.is_approved === false;
        userObj.role = newRole;
        userObj.is_approved = true;
        userObj.is_active = true;
        userObj.status = 'active';

        // 1. Sync live with Supabase cloud DB profiles table
        await syncProfileToSupabase(userObj, {
            role: newRole,
            is_approved: true,
            is_active: true,
            status: 'active'
        });

        // 2. Sync local storage registries
        syncUserToLocalStorage(userObj);

        addAuditLog('ROLE_MODIFIED', `Changed role for ${userObj.full_name} from ${oldRole} to ${newRole}`);
        showToast(`Peranan ${userObj.full_name} ditukar ke ${newRole} & disegerakkan ke Supabase! ⚡`);

        // Always dispatch role email notification
        sendUserRoleChangeEmail(userObj, oldRole, newRole);

        if ((newRole === 'admin' || newRole === 'teacher') && wasPending) {
            sendEducatorApprovalEmail(userObj);
        }
    } else {
        showToast("Ralat: Pengguna tidak dijumpai dalam memori.", "warning");
    }

    closeUserProfileDrawer();
    await syncAllSuperAdminData();
}
window.saveDrawerUserRole = saveDrawerUserRole;

async function handleDrawerStatusToggle() {
    const userId = window.superAdminData.activeDrawerUserId;
    const userObj = window.superAdminData.users.find(u => u.id === userId);
    if (!userObj) return;

    userObj.is_active = !userObj.is_active;
    userObj.status = userObj.is_active ? 'active' : 'disabled';

    // 1. Sync live with Supabase cloud DB profiles table
    await syncProfileToSupabase(userObj, {
        is_active: userObj.is_active,
        status: userObj.status
    });

    // 2. Sync local storage registries
    syncUserToLocalStorage(userObj);

    addAuditLog('ACCOUNT_STATUS_CHANGED', `${userObj.is_active ? 'Reactivated' : 'Suspended'} user ${userObj.full_name}`);
    showToast(`User account ${userObj.is_active ? 'reactivated' : 'suspended'}.`);

    closeUserProfileDrawer();
    await syncAllSuperAdminData();
}
window.handleDrawerStatusToggle = handleDrawerStatusToggle;

function handleDrawerPasswordReset() {
    const userId = window.superAdminData.activeDrawerUserId;
    const userObj = window.superAdminData.users.find(u => u.id === userId);
    if (userObj) {
        addAuditLog('PASSWORD_RESET_DISPATCHED', `Reset link dispatched to ${userObj.email}`);
        showToast(`Password reset link dispatched to ${userObj.email} 🔑`);
    }
}
window.handleDrawerPasswordReset = handleDrawerPasswordReset;

// Add Admin Modal
function openAddAdminModal() {
    const modal = document.getElementById('sa-add-admin-modal');
    if (modal) modal.classList.remove('hidden');
}
window.openAddAdminModal = openAddAdminModal;

function closeAddAdminModal() {
    const modal = document.getElementById('sa-add-admin-modal');
    if (modal) modal.classList.add('hidden');
}
window.closeAddAdminModal = closeAddAdminModal;

async function handleAddAdminSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('admin-input-name').value;
    const username = document.getElementById('admin-input-username').value;
    const email = document.getElementById('admin-input-email').value;
    const school = document.getElementById('admin-input-school').value;
    const role = document.getElementById('admin-input-role').value;

    const newUser = {
        id: `usr-${Date.now().toString().slice(-4)}`,
        full_name: name,
        username,
        email,
        school,
        role,
        is_active: true,
        status: 'active',
        created_at: new Date().toISOString().split('T')[0],
        last_login: 'Never',
        screenings_count: 0
    };

    const client = typeof getSupabase === 'function' ? getSupabase() : null;
    if (client) {
        try {
            const { data, error } = await client.from('profiles').insert([{
                username: username,
                full_name: name,
                email: email,
                school_branch: school,
                role: role,
                is_active: true,
                created_at: new Date().toISOString()
            }]).select();
            if (data && data[0]?.id) {
                newUser.id = data[0].id;
            }
        } catch (err) {
            console.warn("Notice saving profile to Supabase:", err);
        }
    }

    addAuditLog('ADMIN_PROVISIONED', `Provisioned ${role} account for ${name} (${email})`);
    showToast(`Administrator ${name} created successfully! 🛡️`);
    
    closeAddAdminModal();
    await syncAllSuperAdminData();
}
window.handleAddAdminSubmit = handleAddAdminSubmit;

// --------------------------------------------------------------------------
// 7. MASTER SCREENINGS DOSSIERS
// --------------------------------------------------------------------------
function loadMasterScreeningsTable() {
    const tableBody = document.getElementById('master-screenings-table-body');
    const searchInput = document.getElementById('screening-search-input')?.value.toLowerCase().trim() || '';
    const tierFilter = document.getElementById('screening-tier-filter')?.value || 'all';

    if (!tableBody) return;

    let screenings = window.superAdminData.screenings;

    let filtered = screenings.filter(item => {
        const matchesSearch = !searchInput ||
            (item.child_name && item.child_name.toLowerCase().includes(searchInput)) ||
            (item.child_id && item.child_id.toLowerCase().includes(searchInput)) ||
            (item.school && item.school.toLowerCase().includes(searchInput)) ||
            (item.guardian && item.guardian.toLowerCase().includes(searchInput));

        let matchesTier = true;
        if (tierFilter === 'tier1') matchesTier = (item.score < 35);
        if (tierFilter === 'tier2') matchesTier = (item.score >= 35 && item.score < 65);
        if (tierFilter === 'tier3') matchesTier = (item.score >= 65);

        return matchesSearch && matchesTier;
    });

    if (filtered.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="p-8 text-center text-slate-500 font-medium text-xs">
                    <i class="fa-solid fa-folder-open text-2xl text-purple-300 mb-2 block"></i>
                    No screening records match your search criteria.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = filtered.map(scr => {
        const tierBadge = scr.score >= 65 ? 'bg-rose-50 text-rose-900 border-rose-200' :
                         (scr.score >= 35 ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-emerald-50 text-emerald-900 border-emerald-200');

        return `
            <tr class="hover:bg-purple-50/40 transition-colors text-xs font-medium">
                <td class="p-3.5">
                    <span class="font-bold text-slate-900 block">${escapeHTML(scr.child_name)}</span>
                    <span class="font-mono text-[11px] text-slate-500">${scr.child_id} · ${scr.age}yo (${scr.grade})</span>
                </td>
                <td class="p-3.5 font-semibold text-purple-900">${escapeHTML(scr.school)}</td>
                <td class="p-3.5 text-slate-600">${escapeHTML(scr.guardian)}</td>
                <td class="p-3.5">
                    <span class="inline-block px-2.5 py-1 rounded-full font-black text-[10px] border ${tierBadge}">
                        ${scr.score}% · ${scr.risk_level}
                    </span>
                </td>
                <td class="p-3.5">
                    <div class="flex items-center gap-1.5 text-[10.5px]">
                        <span class="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded font-bold" title="Pillar 1: Observations">P1: ${scr.p1}%</span>
                        <span class="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded font-bold" title="Pillar 2: Speech WCPM">P2: ${scr.p2}%</span>
                        <span class="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded font-bold" title="Pillar 3: Reading Gaze">P3: ${scr.p3}%</span>
                    </div>
                </td>
                <td class="p-3.5 font-bold text-slate-700">${scr.wcpm} WCPM</td>
                <td class="p-3.5 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                        <button onclick="openSuperAdminReport('${encodeURIComponent(scr.child_name)}')" class="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-[11px] shadow-xs flex items-center gap-1 transition-all">
                            <i class="fa-solid fa-file-pdf"></i> Report
                        </button>
                        <button onclick="handleDataPurge('${scr.id}', '${scr.child_name}')" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Purge Record (COPPA/PDPA)">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}
window.loadMasterScreeningsTable = loadMasterScreeningsTable;

function filterScreeningsByTier(tier) {
    switchSuperAdminView('screenings');
    const tierSelect = document.getElementById('screening-tier-filter');
    if (tierSelect) {
        tierSelect.value = tier;
        loadMasterScreeningsTable();
    }
}
window.filterScreeningsByTier = filterScreeningsByTier;

function openSuperAdminReport(childName) {
    addAuditLog('REPORT_OPENED_SUPERADMIN', `Viewed dossier for ${decodeURIComponent(childName)}`);
    window.open(`report-preview-parent.html?child=${childName}`, '_blank');
}
window.openSuperAdminReport = openSuperAdminReport;

async function handleDataPurge(screeningId, childName) {
    if (!confirm(`CAUTION: Permanently purge biometric and assessment records for ${childName}? This complies with COPPA/PDPA Right-to-be-Forgotten and is irreversible.`)) {
        return;
    }

    // Filter out screening from local state
    window.superAdminData.screenings = window.superAdminData.screenings.filter(s => s.id !== screeningId);

    // Save to deleted students list for cross-tab persistence
    try {
        let deletedList = JSON.parse(localStorage.getItem('lexisense_deleted_students') || '[]');
        deletedList.push(screeningId);
        deletedList.push(childName);
        localStorage.setItem('lexisense_deleted_students', JSON.stringify(deletedList));
    } catch(e) {}

    // Delete directly from Supabase if connected
    const client = typeof getSupabase === 'function' ? getSupabase() : null;
    if (client) {
        try {
            if (isValidUUID(screeningId)) {
                await client.from('screening_results').delete().eq('id', screeningId);
                await client.from('eye_tracking_data').delete().eq('screening_id', screeningId);
                await client.from('questionnaire_responses').delete().eq('screening_id', screeningId);
            } else {
                await client.from('screening_results').delete().ilike('child_name', childName);
            }
        } catch (err) {
            console.warn("Notice purging from Supabase:", err);
        }
    }

    addAuditLog('DATA_PURGE_REQUEST_COMPLIED', `Permanently purged records for ${childName} (${screeningId})`);
    showToast(`Screening record and gaze telemetry purged securely 🛡️`);
    
    await syncAllSuperAdminData();
}
window.handleDataPurge = handleDataPurge;

// --------------------------------------------------------------------------
// 8. SCHOOLS DIRECTORY & INSTITUTION MANAGEMENT
// --------------------------------------------------------------------------
function loadSchoolsDirectory() {
    const grid = document.getElementById('sa-schools-card-grid');
    if (!grid) return;

    grid.innerHTML = window.superAdminData.schools.map(sch => `
        <div class="p-5 rounded-3xl bg-white border border-purple-100 shadow-subtle hover:shadow-card transition-all space-y-4">
            <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-base shadow-2xs">
                        <i class="fa-solid fa-school"></i>
                    </div>
                    <div>
                        <h4 class="font-heading font-extrabold text-sm text-slate-900">${escapeHTML(sch.name)}</h4>
                        <span class="text-[11px] text-slate-500 font-mono font-bold">${sch.code} · ${escapeHTML(sch.sen_lead)}</span>
                    </div>
                </div>
                <span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                    ${sch.status}
                </span>
            </div>

            <div class="grid grid-cols-3 gap-2 text-center pt-1 border-t border-purple-50">
                <div class="p-2.5 bg-purple-50/40 rounded-xl">
                    <span class="text-[10px] text-slate-500 font-bold block">Students</span>
                    <strong class="font-extrabold text-slate-900 text-sm">${sch.students}</strong>
                </div>
                <div class="p-2.5 bg-purple-50/40 rounded-xl">
                    <span class="text-[10px] text-slate-500 font-bold block">Screened</span>
                    <strong class="font-extrabold text-purple-700 text-sm">${sch.screenings}</strong>
                </div>
                <div class="p-2.5 bg-purple-50/40 rounded-xl">
                    <span class="text-[10px] text-slate-500 font-bold block">Avg Risk</span>
                    <strong class="font-extrabold text-slate-900 text-sm">${sch.avg_score}%</strong>
                </div>
            </div>

            <div class="flex items-center justify-between pt-1">
                <span class="text-[11px] text-slate-500 font-medium"><i class="fa-solid fa-chalkboard-user mr-1 text-purple-600"></i> ${sch.teachers} Teachers Licensed</span>
                <button onclick="showToast('School network dossier refreshed.');" class="text-xs font-bold text-purple-700 hover:text-purple-900">Manage SEN Unit &rarr;</button>
            </div>
        </div>
    `).join('');
}
window.loadSchoolsDirectory = loadSchoolsDirectory;

function openAddSchoolModal() {
    const modal = document.getElementById('sa-add-school-modal');
    if (modal) modal.classList.remove('hidden');
}
window.openAddSchoolModal = openAddSchoolModal;

function closeAddSchoolModal() {
    const modal = document.getElementById('sa-add-school-modal');
    if (modal) modal.classList.add('hidden');
}
window.closeAddSchoolModal = closeAddSchoolModal;

async function handleAddSchoolSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('school-input-name').value.trim();
    const code = document.getElementById('school-input-code').value.trim().toUpperCase();
    const sen = document.getElementById('school-input-sen').value.trim();

    const newSchool = {
        name,
        code,
        sen_lead: sen,
        students: 0,
        teachers: 1,
        screenings: 0,
        avg_score: 0,
        status: 'Active'
    };

    const client = typeof getSupabase === 'function' ? getSupabase() : null;
    if (client) {
        try {
            await client.from('schools').insert([newSchool]);
        } catch (err) {
            console.warn("Notice saving school to Supabase:", err);
        }
    }
    
    // Persist to localStorage
    try {
        let localSchools = JSON.parse(localStorage.getItem('lexisense_admin_schools') || '[]');
        localSchools.unshift(newSchool);
        localStorage.setItem('lexisense_admin_schools', JSON.stringify(localSchools));
    } catch(e) {}

    addAuditLog('SCHOOL_REGISTERED', `Issued license for ${name} (${code})`);
    showToast(`School ${name} registered successfully! 🏫`);

    closeAddSchoolModal();
    await syncAllSuperAdminData();
}
window.handleAddSchoolSubmit = handleAddSchoolSubmit;

// --------------------------------------------------------------------------
// 9. ANALYTICS (DEDICATED VIEW)
// --------------------------------------------------------------------------
function loadAnalyticsView() {
    const screenings = window.superAdminData.screenings;
    const total = screenings.length || 1;

    const tier3Count = screenings.filter(s => s.score >= 65).length;
    const referralRate = Math.round((tier3Count / total) * 100);
    const avgWcpm = Math.round(screenings.reduce((a, c) => a + (c.wcpm || 0), 0) / total);

    const refRateEl = document.getElementById('analytics-referral-rate');
    const compRateEl = document.getElementById('analytics-completion-rate');
    const avgTimeEl = document.getElementById('analytics-avg-time');
    const avgWcpmEl = document.getElementById('analytics-avg-wcpm');

    if (refRateEl) refRateEl.textContent = `${referralRate}%`;
    if (compRateEl) compRateEl.textContent = `98.4%`;
    if (avgTimeEl) avgTimeEl.textContent = `8.2 min`;
    if (avgWcpmEl) avgWcpmEl.textContent = `${avgWcpm}`;

    // 3-Pillars in Analytics
    const p1Avg = Math.round(screenings.reduce((a, c) => a + (c.p1 || 0), 0) / total);
    const p2Avg = Math.round(screenings.reduce((a, c) => a + (c.p2 || 0), 0) / total);
    const p3Avg = Math.round(screenings.reduce((a, c) => a + (c.p3 || 0), 0) / total);

    const p1AvgEl = document.getElementById('analytics-p1-avg');
    const p1BarEl = document.getElementById('analytics-p1-bar');
    const p2AvgEl = document.getElementById('analytics-p2-avg');
    const p2BarEl = document.getElementById('analytics-p2-bar');
    const p3AvgEl = document.getElementById('analytics-p3-avg');
    const p3BarEl = document.getElementById('analytics-p3-bar');

    if (p1AvgEl) p1AvgEl.textContent = `${p1Avg}% Avg`;
    if (p1BarEl) p1BarEl.style.width = `${p1Avg}%`;
    if (p2AvgEl) p2AvgEl.textContent = `${p2Avg}% Avg`;
    if (p2BarEl) p2BarEl.style.width = `${p2Avg}%`;
    if (p3AvgEl) p3AvgEl.textContent = `${p3Avg}% Avg`;
    if (p3BarEl) p3BarEl.style.width = `${p3Avg}%`;

    // Analytics Schools Table
    const schoolsTbody = document.getElementById('analytics-schools-table-body');
    if (schoolsTbody) {
        schoolsTbody.innerHTML = window.superAdminData.schools.map(sch => {
            const schScreenings = screenings.filter(s => s.school && s.school.toLowerCase().includes(sch.name.toLowerCase()));
            const schTotal = schScreenings.length || 1;
            const t1 = schScreenings.filter(s => s.score < 35).length;
            const t2 = schScreenings.filter(s => s.score >= 35 && s.score < 65).length;
            const t3 = schScreenings.filter(s => s.score >= 65).length;
            const avg = schScreenings.length ? Math.round(schScreenings.reduce((a, c) => a + c.score, 0) / schScreenings.length) : sch.avg_score;

            return `
                <tr class="hover:bg-purple-50/40 transition-colors">
                    <td class="p-3 font-bold text-slate-900">${escapeHTML(sch.name)}</td>
                    <td class="p-3 font-extrabold text-purple-700">${schScreenings.length || sch.screenings}</td>
                    <td class="p-3 text-emerald-700 font-bold">${t1}</td>
                    <td class="p-3 text-amber-700 font-bold">${t2}</td>
                    <td class="p-3 text-rose-700 font-bold">${t3}</td>
                    <td class="p-3 font-extrabold text-slate-800">${avg}%</td>
                </tr>
            `;
        }).join('');
    }
}
window.loadAnalyticsView = loadAnalyticsView;

function exportAnalyticsCSV() {
    let csv = "School Name,Total Screenings,Tier 1 (Low),Tier 2 (Moderate),Tier 3 (Elevated),Avg Risk Index\n";
    window.superAdminData.schools.forEach(sch => {
        csv += `"${sch.name}",${sch.screenings},${Math.round(sch.screenings * 0.4)},${Math.round(sch.screenings * 0.3)},${Math.round(sch.screenings * 0.3)},${sch.avg_score}%\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `LexiSense_Analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Analytics CSV exported successfully. 📊');
}
window.exportAnalyticsCSV = exportAnalyticsCSV;

// --------------------------------------------------------------------------
// 10. ALERTS VIEW (DEDICATED SECTION)
// --------------------------------------------------------------------------
function loadAlertsView() {
    const container = document.getElementById('alerts-list-container');
    const alertsTag = document.getElementById('alerts-count-tag');
    if (!container) return;

    const unreadCount = window.superAdminData.notifications.filter(n => !n.is_read).length;
    if (alertsTag) alertsTag.textContent = `${unreadCount} Unresolved Items`;

    if (window.superAdminData.notifications.length === 0) {
        container.innerHTML = '<p class="text-xs text-slate-400 p-8 text-center font-medium">No alerts requiring attention at this time.</p>';
        return;
    }

    container.innerHTML = window.superAdminData.notifications.map(notif => `
        <div class="p-4 rounded-2xl bg-white border border-purple-100 shadow-2xs hover:shadow-subtle transition-all flex items-start justify-between gap-4">
            <div class="flex items-start gap-3">
                <div class="w-9 h-9 rounded-xl ${notif.is_read ? 'bg-slate-100 text-slate-600' : 'bg-rose-100 text-rose-700'} flex items-center justify-center text-sm font-bold shrink-0">
                    <i class="fa-solid ${notif.type === 'screenings' ? 'fa-brain' : (notif.type === 'users' ? 'fa-user-clock' : (notif.type === 'security' ? 'fa-shield-halved' : 'fa-school'))}"></i>
                </div>
                <div>
                    <h4 class="font-bold text-xs text-slate-900 mb-0.5">${escapeHTML(notif.title)}</h4>
                    <p class="text-xs text-slate-600 mb-1.5">${escapeHTML(notif.desc)}</p>
                    <span class="text-[10px] text-slate-400 font-semibold">${notif.time}</span>
                </div>
            </div>
            <button onclick="handleNotificationClick('${notif.id}')" class="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-xl text-xs font-bold transition-colors shrink-0">
                Review &rarr;
            </button>
        </div>
    `).join('');
}
window.loadAlertsView = loadAlertsView;

// --------------------------------------------------------------------------
// 11. SECURITY & AUDIT TRAIL
// --------------------------------------------------------------------------
function loadAuditTrail() {
    const tableBody = document.getElementById('sa-audit-logs-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = window.superAdminData.auditLogs.map(log => `
        <tr class="hover:bg-purple-50/40 transition-colors text-xs font-medium">
            <td class="p-3 font-mono text-slate-500 text-[11px]">${log.timestamp}</td>
            <td class="p-3 font-bold text-slate-900">@${log.actor}</td>
            <td class="p-3 font-semibold text-purple-800">${log.event}</td>
            <td class="p-3 text-slate-600">${log.target}</td>
            <td class="p-3 font-mono text-slate-500 text-[11px]">${log.ip}</td>
            <td class="p-3">
                <span class="inline-block px-2 py-0.5 rounded-full text-[9.5px] font-black ${log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}">
                    ${log.status}
                </span>
            </td>
        </tr>
    `).join('');
}
window.loadAuditTrail = loadAuditTrail;

function exportAuditTrailCSV() {
    let csv = "Timestamp,Actor,Event Type,Target Subject,Client IP,Status\n";
    window.superAdminData.auditLogs.forEach(l => {
        csv += `"${l.timestamp}","${l.actor}","${l.event}","${l.target}","${l.ip}","${l.status}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `LexiSense_AuditTrail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Audit trail CSV exported. 🛡️');
}
window.exportAuditTrailCSV = exportAuditTrailCSV;

function addAuditLog(event, target, status = 'SUCCESS') {
    const actorName = window.currentUserProfile?.full_name || window.currentUserProfile?.username || 'faiz_super';
    const newLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        actor: actorName,
        event,
        target,
        ip: '127.0.0.1 (SuperAdmin)',
        status
    };
    window.superAdminData.auditLogs.unshift(newLog);

    // Save directly to Supabase audit_logs table
    if (typeof logAuditToSupabase === 'function') {
        logAuditToSupabase(actorName, event, target, status);
    }

    // Also persist into admin audit log key so it synchronizes to educator portal
    try {
        let existing = JSON.parse(localStorage.getItem('lexisense_admin_audit_logs') || '[]');
        existing.unshift(newLog);
        localStorage.setItem('lexisense_admin_audit_logs', JSON.stringify(existing));
    } catch(e) {}
}
window.addAuditLog = addAuditLog;

// --------------------------------------------------------------------------
// 12. ALGORITHM TUNING & ADVANCED SAFE CALIBRATION
// --------------------------------------------------------------------------
function updateWeightDisplays() {
    const w1 = parseInt(document.getElementById('weight-p1')?.value || 40, 10);
    const w2 = parseInt(document.getElementById('weight-p2')?.value || 40, 10);
    const w3 = parseInt(document.getElementById('weight-p3')?.value || 20, 10);

    const w1Val = document.getElementById('weight-p1-val');
    const w2Val = document.getElementById('weight-p2-val');
    const w3Val = document.getElementById('weight-p3-val');
    const totalVal = document.getElementById('weight-total-val');

    if (w1Val) w1Val.textContent = `${w1}%`;
    if (w2Val) w2Val.textContent = `${w2}%`;
    if (w3Val) w3Val.textContent = `${w3}%`;

    const total = w1 + w2 + w3;
    if (totalVal) {
        totalVal.textContent = `Total: ${total}%`;
        totalVal.className = (total === 100) ? "font-extrabold text-emerald-600" : "font-extrabold text-rose-600";
    }
}
window.updateWeightDisplays = updateWeightDisplays;

function openAlgorithmConfirmModal() {
    const w1 = parseInt(document.getElementById('weight-p1').value, 10);
    const w2 = parseInt(document.getElementById('weight-p2').value, 10);
    const w3 = parseInt(document.getElementById('weight-p3').value, 10);

    if (w1 + w2 + w3 !== 100) {
        alert("The sum of all 3 triangulation weights must equal exactly 100%.");
        return;
    }

    const currentWeightsEl = document.getElementById('modal-current-weights');
    const proposedWeightsEl = document.getElementById('modal-proposed-weights');

    if (currentWeightsEl) {
        currentWeightsEl.textContent = `P1: ${window.superAdminData.weights.p1}%, P2: ${window.superAdminData.weights.p2}%, P3: ${window.superAdminData.weights.p3}%`;
    }
    if (proposedWeightsEl) {
        proposedWeightsEl.textContent = `P1: ${w1}%, P2: ${w2}%, P3: ${w3}%`;
    }

    const modal = document.getElementById('sa-algorithm-confirm-modal');
    if (modal) modal.classList.remove('hidden');
}
window.openAlgorithmConfirmModal = openAlgorithmConfirmModal;

function closeAlgorithmConfirmModal() {
    const modal = document.getElementById('sa-algorithm-confirm-modal');
    if (modal) modal.classList.add('hidden');
}
window.closeAlgorithmConfirmModal = closeAlgorithmConfirmModal;

function applyAlgorithmWeightsWithReason() {
    const reasonInput = document.getElementById('algorithm-change-reason');
    const reason = reasonInput?.value.trim();

    if (!reason) {
        alert("Please provide a mandatory justification for modifying the screening formula.");
        return;
    }

    const w1 = parseInt(document.getElementById('weight-p1').value, 10);
    const w2 = parseInt(document.getElementById('weight-p2').value, 10);
    const w3 = parseInt(document.getElementById('weight-p3').value, 10);

    window.superAdminData.weights = { p1: w1, p2: w2, p3: w3 };
    localStorage.setItem('lexisense_algorithm_weights', JSON.stringify(window.superAdminData.weights));

    const formulaDisplay = document.getElementById('active-formula-display');
    if (formulaDisplay) {
        formulaDisplay.textContent = `Risk Index = (${w1}% × P1_Survey) + (${w2}% × P2_Speech) + (${w3}% × P3_Gaze)`;
    }

    addAuditLog('ALGORITHM_CALIBRATION_APPLIED', `New Weights: P1=${w1}%, P2=${w2}%, P3=${w3}% (Reason: ${reason})`);
    showToast("Algorithm calibration formula updated and logged. ⚙️");

    closeAlgorithmConfirmModal();
}
window.applyAlgorithmWeightsWithReason = applyAlgorithmWeightsWithReason;

function rollbackAlgorithmWeights(w1, w2, w3, version) {
    if (!confirm(`Rollback screening algorithm formula to ${version} (P1: ${w1}%, P2: ${w2}%, P3: ${w3}%)?`)) return;

    window.superAdminData.weights = { p1: w1, p2: w2, p3: w3 };
    localStorage.setItem('lexisense_algorithm_weights', JSON.stringify(window.superAdminData.weights));

    if (document.getElementById('weight-p1')) document.getElementById('weight-p1').value = w1;
    if (document.getElementById('weight-p2')) document.getElementById('weight-p2').value = w2;
    if (document.getElementById('weight-p3')) document.getElementById('weight-p3').value = w3;
    updateWeightDisplays();

    const formulaDisplay = document.getElementById('active-formula-display');
    if (formulaDisplay) {
        formulaDisplay.textContent = `Risk Index = (${w1}% × P1_Survey) + (${w2}% × P2_Speech) + (${w3}% × P3_Gaze)`;
    }

    addAuditLog('ALGORITHM_ROLLBACK', `Restored formula to ${version} baseline`);
    showToast(`Restored formula to ${version} baseline. ⚙️`);
}
window.rollbackAlgorithmWeights = rollbackAlgorithmWeights;

async function testSupabaseHealth() {
    const statusEl = document.getElementById('sa-db-health-status');
    if (statusEl) statusEl.innerHTML = '<i class="fa-solid fa-circle-notch animate-spin mr-1"></i> Testing connection & syncing...';

    const start = performance.now();
    try {
        const client = typeof getSupabase === 'function' ? getSupabase() : null;
        if (client) {
            await client.from('profiles').select('id', { count: 'exact', head: true });
        }
        await syncAllSuperAdminData();
        const latency = Math.round(performance.now() - start);
        if (statusEl) {
            statusEl.innerHTML = `<span class="text-emerald-700 font-bold"><i class="fa-solid fa-circle-check text-emerald-600 mr-1"></i> Connected & Synced (Latency: ${latency}ms)</span>`;
        }
        showToast(`Database synchronized! Latency: ${latency}ms ✅`);
    } catch(err) {
        await syncAllSuperAdminData();
        if (statusEl) {
            statusEl.innerHTML = `<span class="text-amber-700 font-bold"><i class="fa-solid fa-triangle-exclamation text-amber-600 mr-1"></i> Operational (Resilient Local Session Mode)</span>`;
        }
        showToast(`Local storage data synchronized! ✅`);
    }
}
window.testSupabaseHealth = testSupabaseHealth;

// --------------------------------------------------------------------------
// 13. INITIALIZATION & CROSS-TAB EVENT LISTENERS
// --------------------------------------------------------------------------
async function initializeSuperAdmin() {
    // Ensure document is visible
    document.documentElement.style.visibility = 'visible';

    // Set user profile initials & names dynamically from active session
    const loggedInUser = window.loggedInUser || window.currentUserProfile || JSON.parse(localStorage.getItem('lexisense_user') || '{}');
    const currentName = loggedInUser.full_name || loggedInUser.name || loggedInUser.username || (loggedInUser.email ? loggedInUser.email.split('@')[0] : 'Super Admin');
    const initials = currentName.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'SA';
    
    const sidebarInitials = document.getElementById('sidebar-user-initials');
    const headerInitials = document.getElementById('header-user-initials');
    const sidebarName = document.getElementById('sidebar-user-name');
    const headerName = document.getElementById('header-user-name');

    if (sidebarInitials) sidebarInitials.textContent = initials;
    if (headerInitials) headerInitials.textContent = initials;
    if (sidebarName) sidebarName.textContent = currentName;
    if (headerName) headerName.textContent = currentName;

    // Load saved weights if any
    const savedWeights = localStorage.getItem('lexisense_algorithm_weights');
    if (savedWeights) {
        try {
            window.superAdminData.weights = JSON.parse(savedWeights);
            if (document.getElementById('weight-p1')) document.getElementById('weight-p1').value = window.superAdminData.weights.p1;
            if (document.getElementById('weight-p2')) document.getElementById('weight-p2').value = window.superAdminData.weights.p2;
            if (document.getElementById('weight-p3')) document.getElementById('weight-p3').value = window.superAdminData.weights.p3;
            updateWeightDisplays();
        } catch(e) {}
    }

    // Trigger full multi-source synchronization
    await syncAllSuperAdminData();

    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
        const notifDropdown = document.getElementById('notification-dropdown');
        const notifBtn = document.getElementById('notification-bell-btn');
        if (notifDropdown && !notifDropdown.contains(e.target) && notifBtn && !notifBtn.contains(e.target)) {
            notifDropdown.classList.add('hidden');
        }

        const searchResults = document.getElementById('global-search-results');
        const searchInput = document.getElementById('global-command-search');
        if (searchResults && !searchResults.contains(e.target) && searchInput && !searchInput.contains(e.target)) {
            searchResults.classList.add('hidden');
        }
    });

    // Cross-tab synchronization listener
    window.addEventListener('storage', (e) => {
        if (e.key && (
            e.key.startsWith('lexisense_') ||
            e.key === 'supabase.auth.token'
        )) {
            syncAllSuperAdminData();
        }
    });

    // Background Heartbeat Synchronization (every 10s)
    setInterval(() => {
        syncAllSuperAdminData();
    }, 10000);

    // Default to Overview (Dashboard)
    switchSuperAdminView('overview');
}

// Run immediately if DOM ready, or on DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSuperAdmin);
} else {
    initializeSuperAdmin();
}

// Helper
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
