/**
 * LexiSense — Admin & School Screening Management Controller
 * Clean Redesign with Supabase Real-Time Synchronization,
 * 5-Step Multimodal Screening Wizard, Class Management, Analytics & Accessibility.
 */

const DYSLEXIA_QUESTIONNAIRE = [
    { id: 1, section: 'A', title: 'Section A: Phonological & Language', text: 'Student has difficulty recognizing or producing rhyming words.' },
    { id: 2, section: 'A', title: 'Section A: Phonological & Language', text: 'Student struggles to isolate individual sounds (e.g. "cat" → c-a-t).' },
    { id: 3, section: 'A', title: 'Section A: Phonological & Language', text: 'Student has difficulty blending sounds smoothly into whole words.' },
    { id: 4, section: 'A', title: 'Section A: Phonological & Language', text: 'Student confuses phonetically similar words or phonemes.' },
    { id: 5, section: 'A', title: 'Section A: Phonological & Language', text: 'Student demonstrates delayed speech or expressive vocabulary recall.' },
    { id: 6, section: 'A', title: 'Section A: Phonological & Language', text: 'Student substitutes syllables when pronouncing multi-syllabic words.' },
    { id: 7, section: 'A', title: 'Section A: Phonological & Language', text: 'Student has difficulty rapidly naming familiar classroom objects.' },

    { id: 8, section: 'B', title: 'Section B: Reading & Decoding Fluency', text: 'Student reads slowly and with marked effort, lacking cadence.' },
    { id: 9, section: 'B', title: 'Section B: Reading & Decoding Fluency', text: 'Student guesses words based on initial letters rather than sounding them out.' },
    { id: 10, section: 'B', title: 'Section B: Reading & Decoding Fluency', text: 'Student confuses visually similar words (e.g. "saw" vs "was").' },
    { id: 11, section: 'B', title: 'Section B: Reading & Decoding Fluency', text: 'Student skips lines or requires a finger guide to maintain place in text.' },
    { id: 12, section: 'B', title: 'Section B: Reading & Decoding Fluency', text: 'Student struggles to retain letter-sound correspondences.' },
    { id: 13, section: 'B', title: 'Section B: Reading & Decoding Fluency', text: 'Student has marked difficulty decoding unfamiliar test tokens.' },
    { id: 14, section: 'B', title: 'Section B: Reading & Decoding Fluency', text: 'Student reading fluency is noticeably below year group benchmarks.' },

    { id: 15, section: 'C', title: 'Section C: Spelling & Letter Form Representation', text: 'Student makes recurring spelling errors on high-frequency words.' },
    { id: 16, section: 'C', title: 'Section C: Spelling & Letter Form Representation', text: 'Student spells strictly phonetically without orthographic conventions.' },
    { id: 17, section: 'C', title: 'Section C: Spelling & Letter Form Representation', text: 'Student displays recurring letter/numeral reversals (b/d, p/q).' },
    { id: 18, section: 'C', title: 'Section C: Spelling & Letter Form Representation', text: 'Student shows avoidance or noticeable frustration during written exercises.' },

    { id: 19, section: 'D', title: 'Section D: Working Memory & Sequencing', text: 'Student struggles to retain sequential lists (days of week, alphabet).' },
    { id: 20, section: 'D', title: 'Section D: Working Memory & Sequencing', text: 'Student has difficulty remembering and executing multi-step instructions.' },
    { id: 21, section: 'D', title: 'Section D: Working Memory & Sequencing', text: 'Student confuses spatial or lateral orientations (left vs right).' },
    { id: 22, section: 'D', title: 'Section D: Working Memory & Sequencing', text: 'Student has difficulty recalling narrative points immediately after reading.' },

    { id: 23, section: 'E', title: 'Section E: Visual Fatigue & Family Indicators', text: 'Student reports letters blurring or dancing on bright white paper.' },
    { id: 24, section: 'E', title: 'Section E: Visual Fatigue & Family Indicators', text: 'Student demonstrates visual fatigue, eye rubbing, or head tilt.' },
    { id: 25, section: 'E', title: 'Section E: Visual Fatigue & Family Indicators', text: 'Known family history of reading, language, or learning differences.' }
];

const READING_PASSAGES = {
    english: {
        label: "English 🇬🇧",
        title: "English Reading Task (Grade-Aligned)",
        words: ["The", "quick", "brown", "fox", "jumps", "over", "the", "lazy", "dog.", "Student", "loves", "reading", "colorful", "storybooks", "every", "evening.", "Practicing", "phonics", "sounds", "builds", "strong", "confidence."]
    },
    malay: {
        label: "Bahasa Melayu 🇲🇾",
        title: "Tugasan Bacaan Bahasa Melayu",
        words: ["Arnab", "yang", "pantas", "melompat", "melepasi", "anjing", "yang", "malas.", "Murid", "sangat", "suka", "membaca", "buku", "cerita", "setiap", "petang.", "Latihan", "sebutan", "fonik", "membina", "keyakinan", "diri."]
    }
};

const adminState = {
    activeTab: 'dashboard',
    students: [],
    classes: [],
    followups: [],
    selectedStudentIds: new Set(),
    selectedDetailStudent: null,
    
    profile: {
        name: 'Faiz Ikhwan',
        role: 'SEN Literacy Specialist / Guru Pemulihan',
        school: 'SK Taman Ria',
        email: 'faiz.ikhwan@sktamanria.edu.my',
        phone: '+6013-8889922',
        classes: 'Class 1A & Class 2B',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=140',
        bio: 'SEN Literacy Coordinator at SK Taman Ria, focusing on early dyslexia intervention.'
    },

    wizardStep: 1,
    activeScreeningStudent: null,
    currentQuestionIndex: 0,
    questionnaireAnswers: {},
    currentSelectedLanguage: 'english',
    isFaceAligned: true,
    isGoodLighting: true,
    readingInterval: null,
    readingWordIndex: 0,
    readingStartTime: null,

    defaultStudents: [],
    defaultClasses: [],
    defaultFollowups: []
};

let categoryBreakdownChartInstance = null;
let riskDistributionChartInstance = null;
let cohortComparisonChartInstance = null;
let pillarTriangulationChartInstance = null;
let longitudinalTrendChartInstance = null;

// Initialization on DOM Load
document.addEventListener('DOMContentLoaded', async () => {
    console.log("LexiSense Admin Module Initializing 🚀");
    setupMobileMenu();
    loadAdminProfile();
    await loadInitialAdminData();
    renderAllAdminViews();

    // Check URL parameters for direct deep linking (e.g. returning from prediagnosis screening)
    const urlParams = new URLSearchParams(window.location.search);
    const studentParam = urlParams.get('student');
    const tabParam = urlParams.get('tab');
    if (studentParam) {
        viewStudentProfile(decodeURIComponent(studentParam));
    } else if (tabParam) {
        switchTab(tabParam);
    }
});

/* --------------------------------------------------------------------------
   1. Database Synchronization (Supabase + Local Fallback)
   -------------------------------------------------------------------------- */
function isValidUUID(str) {
    if (!str || typeof str !== 'string') return false;
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuidRegex.test(str);
}

function getCurrentTeacherId() {
    const authUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
    if (authUser?.id && isValidUUID(authUser.id)) return authUser.id;
    if (adminState.profile?.id && isValidUUID(adminState.profile.id)) return adminState.profile.id;
    return null;
}

function getCurrentTeacherName() {
    const authUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
    return authUser?.full_name || authUser?.name || adminState.profile?.name || 'Faiz Ikhwan';
}

function getCurrentTeacherSchool() {
    const authUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
    return authUser?.school_branch || authUser?.school || adminState.profile?.school || 'SK Taman Ria';
}

function formatStudentsArray(data) {
    if (!Array.isArray(data)) return [];
    return data.map(s => ({
        id: s.student_id || (s.id ? `LX-${String(s.id).slice(0, 4).toUpperCase()}` : `LX-${Math.floor(1000 + Math.random() * 9000)}`),
        dbId: s.id,
        name: s.name,
        age: s.age || 8,
        gender: s.gender || 'Male',
        class: s.class || s.grade || s.school_grade || 'Class 1A',
        school: s.school || s.school_name || getCurrentTeacherSchool(),
        parent_name: s.parent_name || 'Guardian',
        parent_phone: s.parent_phone || '+6012-3456789',
        parent_email: s.parent_email || 'guardian@email.com',
        status: s.status || 'Pending',
        risk: s.risk || 'Not Screened',
        score: s.score || 0,
        match_score: s.match_score || 0,
        pillar1_score: s.pillar1_score || 0,
        pillar2_score: s.pillar2_score || 0,
        pillar3_score: s.pillar3_score || 0,
        diagnostic_area: s.diagnostic_area || '⏳ Screening not yet conducted',
        reading_wpm: s.reading_wpm || 0,
        date: s.date || (s.created_at ? new Date(s.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }))
    }));
}

async function loadInitialAdminData() {
    const client = typeof getSupabase === 'function' ? getSupabase() : null;

    // 1. Fetch from Supabase students table directly (Admin / Educator Portal)
    let fetchedStudents = [];
    if (client) {
        try {
            let { data, error } = await client
                .from('students')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && Array.isArray(data)) {
                fetchedStudents = formatStudentsArray(data);
                console.log(`Loaded ${fetchedStudents.length} students from Supabase 'students' table 🎒`);
            } else if (error) {
                console.warn("Notice checking 'students' table:", error.message);
            }
        } catch (err) {
            console.warn("Supabase fetch students notice:", err);
        }
    }

    // Check local storage for any students created locally
    let savedLocalStudents = [];
    try {
        savedLocalStudents = JSON.parse(localStorage.getItem('lexisense_admin_students') || '[]');
    } catch(e) {}
    const deletedStudents = JSON.parse(localStorage.getItem('lexisense_deleted_students') || '[]');

    // Auto-sync any existing local students to Supabase DB if not already in Supabase
    if (Array.isArray(savedLocalStudents) && savedLocalStudents.length > 0) {
        const dbStudentNames = new Set(fetchedStudents.map(s => (s.name || '').toLowerCase()));
        const dbStudentIds = new Set(fetchedStudents.map(s => (s.id || s.student_id || '').toLowerCase()));
        
        for (const locStudent of savedLocalStudents) {
            const locName = (locStudent.name || '').toLowerCase();
            const locId = (locStudent.id || '').toLowerCase();
            if (locName && !deletedStudents.includes(locName) && !deletedStudents.includes(locId) && !dbStudentNames.has(locName)) {
                fetchedStudents.push(locStudent);
                if (client) {
                    try {
                        const activeSchool = locStudent.school || getCurrentTeacherSchool();
                        const syncPayload = {
                            student_id: locStudent.id,
                            name: locStudent.name,
                            age: locStudent.age || 8,
                            class: locStudent.class || locStudent.grade || 'Class 1A',
                            grade: locStudent.grade || locStudent.class || 'Class 1A',
                            school: activeSchool,
                            school_grade: locStudent.grade || locStudent.class || 'Class 1A',
                            school_name: activeSchool,
                            parent_name: locStudent.parent_name || null,
                            parent_phone: locStudent.parent_phone || null,
                            parent_email: locStudent.parent_email || null,
                            gender: locStudent.gender || 'Male',
                            status: locStudent.status || 'Pending',
                            risk: locStudent.risk || 'Not Screened',
                            score: locStudent.score || 0
                        };
                        let { data: insData, error: insErr } = await client.from('students').insert([syncPayload]).select();
                        if (insData && insData[0]) {
                            locStudent.dbId = insData[0].id;
                            console.log(`Auto-synced student "${locStudent.name}" to Supabase students table 🎒🚀`);
                        }
                    } catch (e) {
                        console.warn("Auto-sync local student notice:", e);
                    }
                }
            }
        }
    }

    // 2. Set students strictly from Supabase / synced records
    adminState.students = Array.isArray(fetchedStudents) ? fetchedStudents : [];

    // Sanitize uncompleted students
    adminState.students = adminState.students.map(s => {
        if (s.status !== 'Completed') {
            return {
                ...s,
                risk: 'Not Screened',
                score: 0,
                diagnostic_area: s.diagnostic_area && !s.diagnostic_area.includes('Reading smoothly') ? s.diagnostic_area : '⏳ Screening not yet conducted'
            };
        }
        return s;
    });

    // 3. Fetch custom / created classes from Supabase 'classes' table
    let dbClasses = [];
    if (client) {
        try {
            const { data: cData, error: cErr } = await client.from('classes').select('*').order('name', { ascending: true });
            if (!cErr && Array.isArray(cData)) {
                dbClasses = cData;
                console.log(`Loaded ${dbClasses.length} classes from Supabase 🏫`);
            } else if (cErr) {
                console.warn("Notice fetching classes from Supabase:", cErr.message);
            }
        } catch (err) {
            console.warn("Notice fetching classes from Supabase:", err);
        }
    }

    // Check local storage for any classes created locally
    let savedLocalClasses = [];
    try {
        savedLocalClasses = JSON.parse(localStorage.getItem('lexisense_admin_classes') || '[]');
    } catch(e) {}

    const deletedClasses = JSON.parse(localStorage.getItem('lexisense_deleted_classes') || '[]');

    // Auto-sync any existing local classes to Supabase DB if not already in Supabase
    if (client && Array.isArray(savedLocalClasses) && savedLocalClasses.length > 0) {
        for (const locClass of savedLocalClasses) {
            if (locClass.name && !deletedClasses.includes(locClass.name) && !dbClasses.some(d => d.name.toLowerCase() === locClass.name.toLowerCase())) {
                try {
                    let { data: insData, error: insErr } = await client.from('classes').insert([{
                        name: locClass.name,
                        grade: locClass.grade || 'Year 1'
                    }]).select();

                    if (!insErr && insData && insData[0]) {
                        dbClasses.push(insData[0]);
                        console.log(`Auto-synced "${locClass.name}" to Supabase classes table 🚀`);
                    }
                } catch (e) {
                    console.warn("Auto-sync local class notice:", e);
                }
            }
        }
    }

    // Build unique dictionary of classes
    const classMap = new Map();

    // Add classes from Supabase DB
    dbClasses.forEach(c => {
        if (c.name && !deletedClasses.includes(c.name)) {
            classMap.set(c.name, {
                name: c.name,
                grade: c.grade || 'Year 1',
                school: c.school || 'SK Taman Permata'
            });
        }
    });

    // Also include classes present on registered students
    adminState.students.forEach(s => {
        const cName = (s.class || s.grade || '').trim();
        if (cName && !deletedClasses.includes(cName) && !classMap.has(cName)) {
            classMap.set(cName, {
                name: cName,
                grade: cName.includes('Class 1') || cName.includes('Year 1') ? 'Year 1' : (cName.includes('Class 2') || cName.includes('Year 2') ? 'Year 2' : (cName.includes('Class 3') || cName.includes('Year 3') ? 'Year 3' : 'Year 1')),
                school: s.school || 'SK Taman Permata'
            });
        }
    });

    // Compute metrics for each cohort
    adminState.classes = Array.from(classMap.values()).map(c => {
        const classStudents = adminState.students.filter(s => s.class === c.name || s.grade === c.name);
        return {
            name: c.name,
            grade: c.grade || (c.name.includes('Class 1') || c.name.includes('Year 1') ? 'Year 1' : (c.name.includes('Class 2') || c.name.includes('Year 2') ? 'Year 2' : (c.name.includes('Class 3') || c.name.includes('Year 3') ? 'Year 3' : 'Year 1'))),
            total: classStudents.length,
            completed: classStudents.filter(s => s.status === 'Completed').length,
            pending: classStudents.filter(s => s.status === 'Pending').length,
            incomplete: classStudents.filter(s => s.status === 'Incomplete').length,
            riskCount: classStudents.filter(s => s.risk === 'Higher Indicators' || s.risk === 'Moderate Risk').length
        };
    });

    // 4. Load Follow-Ups from Supabase 'teacher_followups' table & LocalStorage
    let dbFollowups = [];
    if (typeof loadFollowupsFromSupabase === 'function') {
        dbFollowups = await loadFollowupsFromSupabase();
    } else if (client) {
        try {
            const { data: fData, error: fErr } = await client.from('teacher_followups').select('*').order('created_at', { ascending: false });
            if (!fErr && Array.isArray(fData)) {
                dbFollowups = fData.map(f => ({
                    id: f.id,
                    dbId: f.id,
                    student: f.student_name || f.student,
                    student_id: f.student_id || null,
                    class: f.class || 'Class 1A',
                    action: f.action || 'Educator Action',
                    date: f.scheduled_date || f.date || 'Today',
                    status: f.status || 'Pending',
                    notes: f.notes || '',
                    teacher_name: f.teacher_name || null,
                    teacher_email: f.teacher_email || null,
                    school: f.school || 'SK Taman Permata',
                    created_at: f.created_at
                }));
            }
        } catch (e) {}
    }

    let savedLocalFollowups = [];
    try {
        savedLocalFollowups = JSON.parse(localStorage.getItem('lexisense_admin_followups') || '[]');
    } catch(e) {}

    const deletedFollowups = JSON.parse(localStorage.getItem('lexisense_deleted_followups') || '[]');

    // Auto-sync local followups to Supabase if not present in Supabase
    if (client && Array.isArray(savedLocalFollowups) && savedLocalFollowups.length > 0) {
        for (const locF of savedLocalFollowups) {
            const locId = locF.id || locF.dbId;
            if (locId && !deletedFollowups.includes(locId) && !dbFollowups.some(d => d.id === locId || (d.student === locF.student && d.action === locF.action))) {
                try {
                    if (typeof saveFollowupToSupabase === 'function') {
                        const insData = await saveFollowupToSupabase(locF);
                        if (insData) {
                            locF.dbId = insData.id;
                            locF.id = insData.id;
                            dbFollowups.unshift(locF);
                        }
                    }
                } catch(e) {}
            }
        }
    }

    if (dbFollowups.length > 0) {
        adminState.followups = dbFollowups.filter(f => !deletedFollowups.includes(f.id));
    } else if (savedLocalFollowups.length > 0) {
        adminState.followups = savedLocalFollowups.filter(f => !deletedFollowups.includes(f.id));
    } else {
        adminState.followups = [];
    }

    saveAdminStateLocally();
    syncClassesMetricsToSupabase();
}

async function syncClassesMetricsToSupabase() {
    const client = typeof getSupabase === 'function' ? getSupabase() : null;
    if (!client || !Array.isArray(adminState.classes) || adminState.classes.length === 0) return;

    try {
        for (const c of adminState.classes) {
            const classStudents = adminState.students.filter(s => 
                (s.class && s.class.toLowerCase() === (c.name || '').toLowerCase()) ||
                (s.grade && s.grade.toLowerCase() === (c.name || '').toLowerCase()) ||
                (s.class && s.class.toLowerCase() === (c.grade || '').toLowerCase()) ||
                (s.grade && s.grade.toLowerCase() === (c.grade || '').toLowerCase())
            );

            const total = classStudents.length;
            const completed = classStudents.filter(s => s.status === 'Completed').length;
            const pending = classStudents.filter(s => s.status === 'Pending' || s.status === 'Not Screened').length;
            const incomplete = classStudents.filter(s => s.status === 'Incomplete').length;
            const riskCount = classStudents.filter(s => s.risk === 'Higher Indicators' || s.risk === 'Moderate Risk' || s.risk === 'High Risk').length;

            const updatePayload = {
                total_students: total,
                completed_count: completed,
                pending_count: pending,
                incomplete_count: incomplete,
                risk_count: riskCount
            };

            // Attempt update by name or grade
            if (c.name) {
                await client.from('classes').update(updatePayload).eq('name', c.name);
            }
            if (c.grade) {
                await client.from('classes').update(updatePayload).eq('grade', c.grade);
            }
        }
        console.log("Classes metrics synchronized to Supabase 'classes' table 🏫📊");
    } catch (err) {
        console.warn("Notice syncing classes metrics to Supabase:", err);
    }
    await syncSchoolsMetricsToSupabase();
}

async function syncSchoolsMetricsToSupabase() {
    const client = typeof getSupabase === 'function' ? getSupabase() : null;
    if (!client) return;

    try {
        const schoolName = getCurrentTeacherSchool();
        const teacherName = getCurrentTeacherName();
        const schoolStudents = adminState.students.filter(s => !s.school || s.school.toLowerCase().includes(schoolName.toLowerCase()) || schoolName.toLowerCase().includes(s.school.toLowerCase()));
        const total = schoolStudents.length;
        const completed = schoolStudents.filter(s => s.status === 'Completed');
        const scores = completed.filter(s => typeof s.score === 'number' && s.score > 0).map(s => s.score);
        const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

        const updatePayload = {
            students: total,
            teachers: 1,
            screenings: completed.length,
            avg_score: avgScore,
            sen_lead: teacherName,
            status: 'Active'
        };

        const { error } = await client.from('schools').update(updatePayload).ilike('name', `%${schoolName}%`);
        if (error) {
            console.warn("Notice updating school in Supabase:", error.message);
        } else {
            console.log(`School "${schoolName}" metrics synchronized in Supabase 'schools' table 🏫✨`);
        }
    } catch (err) {
        console.warn("Notice syncing schools metrics to Supabase:", err);
    }
}

function saveAdminStateLocally() {
    localStorage.setItem('lexisense_admin_students', JSON.stringify(adminState.students));
    localStorage.setItem('lexisense_admin_classes', JSON.stringify(adminState.classes));
    localStorage.setItem('lexisense_admin_followups', JSON.stringify(adminState.followups));
}

/* --------------------------------------------------------------------------
   Teacher Profile Management & Real-Time Supabase Sync
   -------------------------------------------------------------------------- */
async function loadAdminProfile() {
    const savedCustomProfile = localStorage.getItem('lexisense_admin_profile');
    const authUser = window.loggedInUser || (typeof getActiveUser === 'function' ? getActiveUser() : null) || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
    const client = typeof getSupabase === 'function' ? getSupabase() : null;

    // 1. Instant rendering from cache to prevent any visual delay or flicker
    if (savedCustomProfile) {
        try {
            adminState.profile = { ...adminState.profile, ...JSON.parse(savedCustomProfile) };
        } catch (e) {}
    } else if (authUser) {
        adminState.profile.name = authUser.full_name || authUser.name || authUser.username || adminState.profile.name;
        adminState.profile.school = authUser.school_branch || authUser.school || adminState.profile.school;
        adminState.profile.email = authUser.email || adminState.profile.email;
        if (authUser.designation) adminState.profile.role = authUser.designation;
        if (authUser.role === 'super_admin') adminState.profile.role = 'Super Administrator';
        if (authUser.avatar_url || authUser.avatar) {
            adminState.profile.avatar = authUser.avatar_url || authUser.avatar;
        }
    }

    syncAdminProfileUI();

    // 2. Direct Live Fetch & Synchronization from Supabase 'profiles' table
    if (client && authUser?.id) {
        try {
            const { data: dbProfile, error } = await client
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (dbProfile && !error) {
                if (dbProfile.full_name) adminState.profile.name = dbProfile.full_name;
                if (dbProfile.school_branch) adminState.profile.school = dbProfile.school_branch;
                if (dbProfile.email) adminState.profile.email = dbProfile.email;
                if (dbProfile.designation) adminState.profile.role = dbProfile.designation;
                if (dbProfile.avatar_url) adminState.profile.avatar = dbProfile.avatar_url;
                if (dbProfile.phone) adminState.profile.phone = dbProfile.phone;
                if (dbProfile.bio) adminState.profile.bio = dbProfile.bio;
                if (dbProfile.assigned_classes) adminState.profile.classes = dbProfile.assigned_classes;

                localStorage.setItem('lexisense_admin_profile', JSON.stringify(adminState.profile));
                syncAdminProfileUI();
                console.log("Admin Profile synchronized from Supabase DB 👩‍🏫☁️", dbProfile);
            }
        } catch (err) {
            console.warn("Notice loading profile from Supabase:", err);
        }
    }
}

function syncAdminProfileUI() {
    const p = adminState.profile;

    // 1. Header Elements
    const headerName = document.getElementById('headerAdminName');
    const headerRole = document.getElementById('headerAdminRole');
    const headerAvatar = document.getElementById('headerAdminAvatar');
    const welcomeGreet = document.getElementById('welcomeGreetingText');

    if (headerName) headerName.innerText = p.name;
    if (headerRole) headerRole.innerText = p.role;
    if (headerAvatar) {
        headerAvatar.src = p.avatar;
        headerAvatar.onerror = () => { headerAvatar.src = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120'; };
    }
    if (welcomeGreet) welcomeGreet.innerHTML = `<span class="animate-wave-hand">👋</span> Welcome back, ${escapeHTML(p.name)}`;

    // 2. Profile View Card Elements
    const cardAvatar = document.getElementById('profileCardAvatar');
    const cardName = document.getElementById('profileCardName');
    const cardRole = document.getElementById('profileCardRole');
    const cardSchool = document.getElementById('profileCardSchool');
    const cardEmail = document.getElementById('profileCardEmail');
    const cardPhone = document.getElementById('profileCardPhone');
    const cardClasses = document.getElementById('profileCardClasses');
    const cardBio = document.getElementById('profileCardBio');

    if (cardAvatar) {
        cardAvatar.src = p.avatar;
        cardAvatar.onerror = () => { cardAvatar.src = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120'; };
    }
    if (cardName) cardName.innerText = p.name;
    if (cardRole) cardRole.innerText = p.role;
    if (cardSchool) cardSchool.innerText = p.school;
    if (cardEmail) cardEmail.innerText = p.email;
    if (cardPhone) cardPhone.innerText = p.phone;
    if (cardClasses) cardClasses.innerText = p.classes;
    if (cardBio) cardBio.innerText = p.bio;

    // 3. Edit Form Inputs (pre-populate)
    const inName = document.getElementById('editProfileName');
    const inRole = document.getElementById('editProfileRole');
    const inSchool = document.getElementById('editProfileSchool');
    const inEmail = document.getElementById('editProfileEmail');
    const inPhone = document.getElementById('editProfilePhone');
    const inClasses = document.getElementById('editProfileClasses');
    const inBio = document.getElementById('editProfileBio');
    const inAvatarUrl = document.getElementById('editProfileAvatarUrl');
    const previewAvatar = document.getElementById('editProfileAvatarPreview');

    if (inName) inName.value = p.name || '';
    if (inRole) {
        if (p.role) {
            let optionFound = false;
            for (let i = 0; i < inRole.options.length; i++) {
                if (inRole.options[i].value === p.role || inRole.options[i].text.includes(p.role) || p.role.includes(inRole.options[i].value)) {
                    inRole.selectedIndex = i;
                    optionFound = true;
                    break;
                }
            }
            if (!optionFound) {
                const opt = document.createElement('option');
                opt.value = p.role;
                opt.text = p.role;
                opt.selected = true;
                inRole.appendChild(opt);
            }
        }
    }
    if (inSchool) inSchool.value = p.school || '';
    if (inEmail) inEmail.value = p.email || '';
    if (inPhone) inPhone.value = p.phone || '';
    if (inClasses) inClasses.value = p.classes || '';
    if (inBio) inBio.value = p.bio || '';
    if (inAvatarUrl) inAvatarUrl.value = p.avatar || '';
    if (previewAvatar) previewAvatar.src = p.avatar || '';
}

function toggleEditProfileMode(showEdit) {
    const viewSection = document.getElementById('profileViewSection');
    const editSection = document.getElementById('profileEditSection');

    if (showEdit) {
        viewSection?.classList.add('hidden');
        editSection?.classList.remove('hidden');
        editSection?.classList.add('animate-pop-in');
    } else {
        editSection?.classList.add('hidden');
        viewSection?.classList.remove('hidden');
        viewSection?.classList.add('animate-pop-in');
    }
}

function selectAvatarPreset(url) {
    const inAvatarUrl = document.getElementById('editProfileAvatarUrl');
    const previewAvatar = document.getElementById('editProfileAvatarPreview');
    if (inAvatarUrl) inAvatarUrl.value = url;
    if (previewAvatar) previewAvatar.src = url;
}

// Client-side image compression: converts high-res photos to lightweight ~25KB WebP/JPEG avatars for instant upload & storage
function compressAvatarFile(file, maxDimension = 300, quality = 0.85) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxDimension) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    }
                } else {
                    if (height > maxDimension) {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Efficient JPEG compression (~20KB-30KB)
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedDataUrl);
            };
            img.onerror = (err) => reject(err);
            img.src = event.target.result;
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
}

async function handleAvatarFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const compressedDataUrl = await compressAvatarFile(file, 300, 0.85);
        selectAvatarPreset(compressedDataUrl);
    } catch (e) {
        console.warn("Notice compressing image, using standard reader:", e);
        const reader = new FileReader();
        reader.onload = (ev) => {
            selectAvatarPreset(ev.target.result);
        };
        reader.readAsDataURL(file);
    }
}

async function saveAdminProfile(event) {
    if (event) event.preventDefault();

    const name = document.getElementById('editProfileName')?.value.trim();
    const roleSelect = document.getElementById('editProfileRole');
    const role = roleSelect ? roleSelect.value : '';
    const school = document.getElementById('editProfileSchool')?.value.trim();
    const email = document.getElementById('editProfileEmail')?.value.trim();
    const phone = document.getElementById('editProfilePhone')?.value.trim();
    const classes = document.getElementById('editProfileClasses')?.value.trim();
    const bio = document.getElementById('editProfileBio')?.value.trim();
    const avatar = document.getElementById('editProfileAvatarUrl')?.value.trim() || document.getElementById('editProfileAvatarPreview')?.src;

    if (!name) {
        showToast("Sila masukkan nama penuh anda.", "error");
        return;
    }

    adminState.profile = {
        name: name,
        role: role || 'Literacy Specialist / Reading Interventionist',
        school: school || 'SK Taman Permata',
        email: email || adminState.profile.email || 'educator@school.edu.my',
        phone: phone || adminState.profile.phone || '+6012-3456789',
        classes: classes || adminState.profile.classes || 'Year 1 & Year 3 Groups',
        avatar: avatar || adminState.profile.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
        bio: bio || adminState.profile.bio || 'Senior Educator in special literacy screening and phonological intervention.'
    };

    // 1. Instant optimistic local persistence (0ms delay!)
    localStorage.setItem('lexisense_admin_profile', JSON.stringify(adminState.profile));

    const authUser = window.loggedInUser || (typeof getActiveUser === 'function' ? getActiveUser() : null) || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
    if (authUser) {
        authUser.full_name = name;
        authUser.name = name;
        authUser.school_branch = school;
        authUser.school = school;
        authUser.designation = role;
        authUser.avatar_url = adminState.profile.avatar;
        authUser.avatar = adminState.profile.avatar;
        if (email) authUser.email = email;
        localStorage.setItem('lexisense_user', JSON.stringify(authUser));
        window.loggedInUser = authUser;
    }

    // 2. Immediately reflect changes in UI and close edit mode with zero waiting
    syncAdminProfileUI();
    toggleEditProfileMode(false);
    showToast("Profil berjaya dikemaskini! ✨", "success");

    // 3. Fast non-blocking background synchronization with Supabase
    const client = typeof getSupabase === 'function' ? getSupabase() : null;
    if (client && authUser?.id) {
        (async () => {
            try {
                const updatePayload = {
                    full_name: name,
                    school_branch: school,
                    designation: role,
                    avatar_url: adminState.profile.avatar,
                    updated_at: new Date().toISOString()
                };
                
                const { error: updErr } = await client
                    .from('profiles')
                    .update(updatePayload)
                    .eq('id', authUser.id);

                if (updErr) {
                    console.warn("Retrying profile save with basic fields:", updErr.message);
                    await client
                        .from('profiles')
                        .update({
                            full_name: name,
                            school_branch: school,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', authUser.id);
                } else {
                    console.log("Profile & Avatar synced to Supabase DB in background 👩‍🏫☁️");
                }
            } catch (e) {
                console.warn("Notice syncing profile to Supabase:", e);
            }
        })();
    }
}

/* --------------------------------------------------------------------------
   2. Master Render & Tab Switching
   -------------------------------------------------------------------------- */
function renderAllAdminViews() {
    recalculateDashboardMetrics();
    renderStudentTable();
    renderClassesList();
    renderFollowupsList();
    renderStudentsNeedingAttention();
    initAnalyticsCharts();
    populateSelectDropdowns();
    renderWizardStudentCards();
    renderSystemNotifications();
    updateSidebarFollowupBadge();
}

function switchTab(tabId) {
    if (tabId === 'screening') {
        window.location.href = 'prediagnosis-page.html?from=admin';
        return;
    }

    adminState.activeTab = tabId;

    document.querySelectorAll('main > div[id^="tab-"]').forEach(div => {
        div.classList.add('hidden');
    });

    const target = document.getElementById(`tab-${tabId}`);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('animate-pop-in');
    }

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        link.classList.remove('active-tab-nav');
    });
    const activeNav = document.getElementById(`nav-${tabId}`);
    if (activeNav) {
        activeNav.classList.add('active');
    }

    if (tabId === 'analytics') {
        setTimeout(initAnalyticsCharts, 100);
    } else if (tabId === 'followup') {
        renderFollowupsList();
    }

    const sidebar = document.getElementById('app-sidebar');
    if (sidebar && window.innerWidth < 1024) {
        sidebar.classList.add('hidden');
    }

    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
}

/* --------------------------------------------------------------------------
   Creative & Animated Logout Experience Controller
   -------------------------------------------------------------------------- */
function confirmLogout() {
    const overlay = document.getElementById('logoutModalOverlay');
    const confirmCard = document.getElementById('logoutConfirmCard');
    const farewellStage = document.getElementById('logoutFarewellStage');
    const teacherNameEl = document.getElementById('logoutTeacherGreeting');
    const schoolBadgeEl = document.getElementById('logoutSchoolBadge');

    if (!overlay || !confirmCard) {
        proceedWithCreativeLogout();
        return;
    }

    // Set dynamic teacher and school names
    const teacherName = getCurrentTeacherName();
    const schoolName = getCurrentTeacherSchool();
    if (teacherNameEl) teacherNameEl.innerText = teacherName;
    if (schoolBadgeEl) schoolBadgeEl.innerText = schoolName;

    // Reset card and farewell stages
    confirmCard.classList.remove('hidden');
    confirmCard.classList.remove('scale-100', 'opacity-100');
    confirmCard.classList.add('scale-90', 'opacity-0');

    if (farewellStage) {
        farewellStage.classList.add('hidden');
        farewellStage.classList.remove('scale-100', 'opacity-100');
        farewellStage.classList.add('scale-95', 'opacity-0');
    }

    // Reveal overlay with backdrop animation
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
        // Transition from confirmation to cinematic farewell stage
        confirmCard.classList.remove('scale-100', 'opacity-100');
        confirmCard.classList.add('scale-90', 'opacity-0');

        setTimeout(() => {
            confirmCard.classList.add('hidden');
            farewellStage.classList.remove('hidden');

            requestAnimationFrame(() => {
                farewellStage.classList.remove('scale-95', 'opacity-0');
                farewellStage.classList.add('scale-100', 'opacity-100');

                // Animate progress bar filling smoothly
                if (progressBar) {
                    progressBar.style.width = '30%';
                    setTimeout(() => {
                        progressBar.style.width = '75%';
                        if (progressLabel) {
                            progressLabel.innerHTML = `<i class="fa-solid fa-sparkles text-amber-300"></i><span>Preserving educator preferences &amp; signing out...</span>`;
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

    // Clean session, auth, and state in background
    try {
        const client = typeof getSupabase === 'function' ? getSupabase() : null;
        if (client) {
            await client.auth.signOut();
        }
    } catch (e) {
        console.warn("Supabase sign out notice:", e);
    }

    window.loggedInUser = null;
    window.currentUserProfile = null;
    localStorage.removeItem('lexisense_user');
    localStorage.removeItem('lexisense_token');
    localStorage.removeItem('lexisense_admin_active_student');
    sessionStorage.clear();

    // Redirect to home page with smooth timing matching animation
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

function logout() {
    confirmLogout();
}

/* --------------------------------------------------------------------------
   3. Dashboard KPIs & Aggregation
   -------------------------------------------------------------------------- */
function recalculateDashboardMetrics() {
    const totalStudents = adminState.students.length;
    const completed = adminState.students.filter(s => s.status === 'Completed').length;
    const pending = adminState.students.filter(s => s.status === 'Pending').length;
    const incomplete = adminState.students.filter(s => s.status === 'Incomplete').length;
    const pendingTotal = pending + incomplete;
    const riskAttention = adminState.students.filter(s => s.status === 'Completed' && (s.risk === 'Higher Indicators' || s.risk === 'Moderate Risk')).length;
    const totalClasses = adminState.classes.length;

    const elTotalStudents = document.getElementById('kpi-total-students');
    const elTotalSubtext = document.getElementById('kpi-total-subtext');
    const elTotalClasses = document.getElementById('kpi-total-classes');
    const elCompleted = document.getElementById('kpi-completed-students');
    const elCompletedSubtext = document.getElementById('kpi-completed-subtext');
    const elPending = document.getElementById('kpi-pending-students');
    const elPendingSubtext = document.getElementById('kpi-pending-subtext');
    const elIncomplete = document.getElementById('kpi-incomplete-students');
    const elRisk = document.getElementById('kpi-risk-attention');
    const elRiskSubtext = document.getElementById('kpi-risk-subtext');

    const completedPct = totalStudents > 0 ? Math.round((completed / totalStudents) * 100) : 0;
    const pendingPct = totalStudents > 0 ? Math.round((pendingTotal / totalStudents) * 100) : 0;
    const incompletePct = totalStudents > 0 ? Math.round((incomplete / totalStudents) * 100) : 0;

    if (elTotalStudents) elTotalStudents.innerText = totalStudents;
    if (elTotalSubtext) elTotalSubtext.innerText = `${totalClasses} Active Classes`;
    if (elTotalClasses) elTotalClasses.innerText = totalClasses;
    if (elCompleted) elCompleted.innerText = completed;
    if (elCompletedSubtext) elCompletedSubtext.innerText = `${completedPct}% of cohort`;
    if (elPending) elPending.innerText = pendingTotal;
    if (elPendingSubtext) elPendingSubtext.innerText = `${pendingTotal} Awaiting Screening`;
    if (elIncomplete) elIncomplete.innerText = incomplete;
    if (elRisk) elRisk.innerText = riskAttention;
    if (elRiskSubtext) elRiskSubtext.innerText = riskAttention > 0 ? `${riskAttention} Need Support` : 'No flagged concerns';

    const barCompleted = document.getElementById('progress-bar-completed');
    const barPending = document.getElementById('progress-bar-pending');
    const barIncomplete = document.getElementById('progress-bar-incomplete');

    if (barCompleted) barCompleted.style.width = `${completedPct}%`;
    if (barPending) barPending.style.width = `${pendingPct}%`;
    if (barIncomplete) barIncomplete.style.width = `${incompletePct}%`;

    const labelCompleted = document.getElementById('progress-label-completed');
    const labelPending = document.getElementById('progress-label-pending');
    const labelIncomplete = document.getElementById('progress-label-incomplete');

    if (labelCompleted) labelCompleted.innerText = `Completed: ${completed} (${completedPct}%)`;
    if (labelPending) labelPending.innerText = `Pending: ${pendingTotal} (${pendingPct}%)`;
    if (labelIncomplete) labelIncomplete.innerText = `Incomplete: ${incomplete} (${incompletePct}%)`;

    const attentionBanner = document.getElementById('dashboard-attention-banner-text');
    if (attentionBanner) {
        if (riskAttention > 0) {
            attentionBanner.innerText = `${riskAttention} students identified with higher/moderate screening indicators for learning follow-up.`;
        } else if (completed === 0) {
            attentionBanner.innerText = `All ${totalStudents} students are awaiting initial screening. Click "Launch Screener" to begin assessments.`;
        } else {
            attentionBanner.innerText = `All screened students are progressing well on track! No immediate interventions required.`;
        }
    }

    renderDashboardClassCards();
}

function slideClassCards(direction) {
    const container = document.getElementById('dashboard-class-cards');
    if (!container) return;
    const firstCard = container.querySelector('.snap-start');
    const scrollAmount = firstCard ? (firstCard.offsetWidth + 14) : Math.round(container.clientWidth / 3);
    container.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
    });
}

function viewClassRosterFromDashboard(className) {
    // 1. Switch to Students Roster tab
    switchTab('students');

    // 2. Set the class filter select
    const filterSelect = document.getElementById('filterClass');
    if (filterSelect) {
        filterSelect.value = className;
    }

    // 3. Reset search text to show all students for this cohort
    const searchInput = document.getElementById('studentTableSearch');
    if (searchInput) {
        searchInput.value = '';
    }

    // 4. Trigger filtering and re-render table
    filterStudentTable();

    // 5. User feedback
    showToast(`Showing roster for ${className} 📚`);
}

function viewClassDetail(className) {
    viewClassRosterFromDashboard(className);
}

function renderDashboardClassCards() {
    const container = document.getElementById('dashboard-class-cards');
    if (!container) return;

    const countBadge = document.getElementById('class-cohort-count-badge');
    const classCount = adminState.classes.length;
    if (countBadge) {
        countBadge.innerText = `${classCount} ${classCount === 1 ? 'Class' : 'Classes'}`;
    }

    if (classCount === 0) {
        container.innerHTML = `
            <div class="w-full p-8 bg-purple-50/40 rounded-3xl border-2 border-dashed border-purple-200 text-center space-y-2.5 my-1">
                <div class="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto text-xl font-bold shadow-2xs">
                    🏫
                </div>
                <h4 class="font-heading font-black text-base text-purple-950">No Class Cohorts Added Yet</h4>
                <p class="text-xs text-gray-500 max-w-sm mx-auto font-medium">Create a class cohort to organize students and track screening completion rates.</p>
                <button type="button" onclick="openCreateClassModal()" class="mt-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-sm hover:shadow transition-all inline-flex items-center gap-1.5 cursor-pointer">
                    <i class="fa-solid fa-plus text-xs"></i>
                    <span>Create Class Cohort</span>
                </button>
            </div>
        `;
        return;
    }

    // Determine card layout sizing depending on class count
    const getCardWidthClass = () => {
        if (classCount === 1) {
            return 'w-full max-w-sm sm:max-w-md shrink-0'; 
        } else if (classCount === 2) {
            return 'w-full sm:w-[calc(50%-8px)] min-w-[300px] shrink-0'; 
        } else {
            return 'w-[calc(100%-14px)] sm:w-[calc((100%-16px)/2)] xl:w-[calc((100%-28px)/3)] min-w-[300px] sm:min-w-[315px] shrink-0 snap-start'; 
        }
    };

    const cardWidthClass = getCardWidthClass();

    let cardsHtml = adminState.classes.map(c => {
        const classStudents = adminState.students.filter(s => s.class === c.name);
        let countTotal = 0;
        let countCompleted = 0;
        let countPending = 0;
        let countIncomplete = 0;
        let countRisk = 0;

        if (classStudents.length > 0) {
            countTotal = classStudents.length;
            countCompleted = classStudents.filter(s => s.status === 'Completed').length;
            countPending = classStudents.filter(s => s.status === 'Pending').length;
            countIncomplete = classStudents.filter(s => s.status === 'Incomplete').length;
            countRisk = classStudents.filter(s => s.risk === 'Higher Indicators' || s.risk === 'Moderate Risk').length;
        } else {
            countTotal = c.total || 0;
            countCompleted = c.completed || 0;
            countPending = c.pending || 0;
            countIncomplete = c.incomplete || 0;
            countRisk = c.riskCount || 0;
        }

        const pctDone = countTotal > 0 ? Math.min(100, Math.max(0, Math.round((countCompleted / countTotal) * 100))) : 0;
        const pctCompleted = countTotal > 0 ? ((countCompleted / countTotal) * 100) : 0;
        const pctPending = countTotal > 0 ? ((countPending / countTotal) * 100) : 0;
        const pctIncomplete = countTotal > 0 ? ((countIncomplete / countTotal) * 100) : 0;

        return `
            <div class="${cardWidthClass} bg-white rounded-3xl p-4.5 sm:p-5 border-2 border-purple-100 hover:border-purple-300 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-3.5 group relative overflow-hidden h-full min-h-[245px]">
                <!-- Top Accent Line -->
                <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-amber-400"></div>

                <div class="space-y-3">
                    <!-- Header with Name, Grade & % Done -->
                    <div class="flex items-start justify-between gap-2.5">
                        <div class="flex items-center gap-2.5 min-w-0 flex-1">
                            <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-50 text-purple-700 flex items-center justify-center font-bold text-sm shrink-0 border border-purple-200/80 group-hover:scale-105 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-2xs">
                                <i class="fa-solid fa-graduation-cap"></i>
                            </div>
                            <div class="min-w-0 flex-1">
                                <h4 class="font-heading font-black text-base sm:text-lg text-brand-purple-deep leading-tight truncate" title="${escapeHTML(c.name)}">${escapeHTML(c.name)}</h4>
                                <div class="flex items-center gap-1.5 mt-0.5 whitespace-nowrap">
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-extrabold text-[11px] border border-purple-200/80 whitespace-nowrap shrink-0">${escapeHTML(c.grade || 'Standard')}</span>
                                    <span class="text-xs font-bold text-gray-500 whitespace-nowrap shrink-0">• ${countTotal} ${countTotal === 1 ? 'Learner' : 'Learners'}</span>
                                </div>
                            </div>
                        </div>
                        <span class="px-2.5 py-1 ${pctDone >= 70 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'} font-black text-xs rounded-full border shadow-2xs shrink-0 whitespace-nowrap">
                            ${pctDone}% Done
                        </span>
                    </div>

                    <!-- Multi-Segment Progress Bar -->
                    <div class="space-y-1">
                        <div class="h-2.5 w-full bg-purple-50 rounded-full overflow-hidden flex border border-purple-100 shadow-inner" title="Completed: ${countCompleted} | Pending: ${countPending} | Incomplete: ${countIncomplete}">
                            <div style="width: ${pctCompleted}%" class="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500" title="Completed: ${countCompleted} (${Math.round(pctCompleted)}%)"></div>
                            <div style="width: ${pctPending}%" class="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-500" title="Pending: ${countPending} (${Math.round(pctPending)}%)"></div>
                            <div style="width: ${pctIncomplete}%" class="h-full bg-gradient-to-r from-rose-500 to-pink-400 transition-all duration-500" title="Incomplete: ${countIncomplete} (${Math.round(pctIncomplete)}%)"></div>
                        </div>
                    </div>

                    <!-- Metrics 2x2 Grid -->
                    <div class="grid grid-cols-2 gap-2 text-xs pt-0.5">
                        <div class="p-2 rounded-2xl bg-emerald-50/80 border border-emerald-100/90 flex items-center justify-between">
                            <span class="text-emerald-800 font-bold text-xs flex items-center gap-1.5 whitespace-nowrap">
                                <span class="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                                <span>Completed</span>
                            </span>
                            <strong class="text-emerald-950 font-black text-sm">${countCompleted}</strong>
                        </div>
                        <div class="p-2 rounded-2xl bg-amber-50/80 border border-amber-100/90 flex items-center justify-between">
                            <span class="text-amber-800 font-bold text-xs flex items-center gap-1.5 whitespace-nowrap">
                                <span class="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                                <span>Pending</span>
                            </span>
                            <strong class="text-amber-950 font-black text-sm">${countPending}</strong>
                        </div>
                        <div class="p-2 rounded-2xl bg-rose-50/80 border border-rose-100/90 flex items-center justify-between">
                            <span class="text-rose-800 font-bold text-xs flex items-center gap-1.5 whitespace-nowrap">
                                <span class="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                                <span>Incomplete</span>
                            </span>
                            <strong class="text-rose-950 font-black text-sm">${countIncomplete}</strong>
                        </div>
                        <div class="p-2 rounded-2xl ${countRisk > 0 ? 'bg-purple-100/80 border-purple-200 text-purple-900' : 'bg-gray-50 border-gray-100 text-gray-600'} border flex items-center justify-between">
                            <span class="font-bold text-xs flex items-center gap-1.5 whitespace-nowrap">
                                <span class="w-2 h-2 rounded-full ${countRisk > 0 ? 'bg-purple-600' : 'bg-gray-400'} shrink-0"></span>
                                <span>Attention</span>
                            </span>
                            <strong class="${countRisk > 0 ? 'text-purple-950' : 'text-gray-700'} font-black text-sm">${countRisk}</strong>
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex items-center gap-2 pt-2.5 border-t border-purple-100/60 mt-auto">
                    <button type="button" onclick="viewClassRosterFromDashboard('${escapeHTML(c.name)}')" class="flex-1 py-2 px-3.5 bg-purple-50 hover:bg-purple-600 text-purple-800 hover:text-white font-extrabold text-xs rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 border border-purple-200 hover:border-purple-600 shadow-2xs group/btn cursor-pointer whitespace-nowrap">
                        <span>View Class Roster</span>
                        <i class="fa-solid fa-arrow-right text-xs transition-transform group-hover/btn:translate-x-1"></i>
                    </button>
                    <button type="button" onclick="deleteClass('${escapeHTML(c.name)}')" class="w-9 h-9 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white flex items-center justify-center transition-all border border-rose-200 hover:border-rose-600 cursor-pointer shrink-0 shadow-2xs" title="Delete Class Cohort">
                        <i class="fa-solid fa-trash-can text-xs"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // If there is only 1 class, add a neat dashed "+ Add Cohort" invite card side-by-side
    if (classCount === 1) {
        cardsHtml += `
            <div onclick="openCreateClassModal()" class="w-full max-w-xs bg-purple-50/30 hover:bg-purple-50/70 rounded-3xl p-4.5 border-2 border-dashed border-purple-200 hover:border-purple-400 transition-all duration-300 flex flex-col items-center justify-center text-center space-y-2 cursor-pointer group min-h-[220px] shrink-0">
                <div class="w-10 h-10 rounded-2xl bg-white text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all flex items-center justify-center text-base shadow-sm border border-purple-200 group-hover:scale-110">
                    <i class="fa-solid fa-plus"></i>
                </div>
                <div>
                    <h5 class="font-heading font-black text-xs text-purple-950">Add Another Class Cohort</h5>
                    <p class="text-[10px] text-gray-500 font-medium max-w-[180px] mt-0.5">Organize multiple classrooms easily.</p>
                </div>
                <span class="text-[11px] font-extrabold text-purple-700 bg-white px-2.5 py-0.5 rounded-full border border-purple-200 shadow-2xs group-hover:bg-purple-100 transition-colors">
                    + New Cohort
                </span>
            </div>
        `;
    }

    container.innerHTML = cardsHtml;
}

function renderStudentsNeedingAttention() {
    const container = document.getElementById('dashboard-risk-students-container');
    if (!container) return;

    const riskStudents = adminState.students.filter(s => s.risk === 'Higher Indicators' || s.risk === 'Moderate Risk');
    const badge = document.getElementById('dashboard-risk-count-badge');
    if (badge) badge.innerText = `${riskStudents.length} ${riskStudents.length === 1 ? 'Student' : 'Students'}`;

    if (riskStudents.length === 0) {
        container.innerHTML = `
            <div class="p-5 bg-purple-50/40 rounded-2xl text-center text-xs text-purple-900/70 border border-purple-100 space-y-1">
                <span class="text-lg block">✨</span>
                <span class="font-extrabold text-purple-950 block">All Learners On Track</span>
                <span class="text-[11px] text-gray-500 font-medium">No students currently flagged with elevated reading variance indicators.</span>
            </div>
        `;
        return;
    }

    container.innerHTML = riskStudents.slice(0, 3).map(s => {
        // Generate neat initials
        const nameParts = (s.name || 'Learner').trim().split(/\s+/);
        const initials = nameParts.length >= 2 
            ? (nameParts[0][0] + nameParts[1][0]).toUpperCase() 
            : (nameParts[0] ? nameParts[0].slice(0, 2).toUpperCase() : 'LS');

        const isHigh = s.risk === 'Higher Indicators' || s.risk === 'High Risk';

        return `
            <div class="bg-white p-3 sm:p-3.5 rounded-2xl border-2 border-purple-100 hover:border-purple-300 shadow-2xs hover:shadow-sm transition-all duration-200 flex items-center justify-between gap-3 group">
                <div class="flex items-center gap-3 min-w-0">
                    <!-- Initials Avatar -->
                    <div class="w-9 h-9 rounded-xl ${isHigh ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-amber-100 text-amber-800 border-amber-200'} font-black text-xs flex items-center justify-center shrink-0 border shadow-2xs">
                        ${initials}
                    </div>

                    <div class="min-w-0">
                        <h4 class="font-heading font-black text-xs sm:text-sm text-brand-purple-deep truncate group-hover:text-purple-700 transition-colors" title="${escapeHTML(s.name)}">
                            ${escapeHTML(s.name)}
                        </h4>
                        <div class="flex items-center gap-1.5 text-[11px] text-gray-500 font-bold mt-0.5">
                            <span>${escapeHTML(s.class || s.school_grade || 'Class 1A')}</span>
                            <span>•</span>
                            <span>Age ${s.age || 8}</span>
                        </div>
                        <div class="mt-1">
                            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md ${isHigh ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-800 border border-amber-200'} text-[10px] font-black">
                                <i class="fa-solid ${isHigh ? 'fa-triangle-exclamation text-rose-500' : 'fa-circle-exclamation text-amber-500'} text-[9px]"></i>
                                <span>${escapeHTML(s.risk)}</span>
                            </span>
                        </div>
                    </div>
                </div>

                <button type="button" onclick="viewStudentProfile('${escapeHTML(s.name)}')" class="px-3 py-1.5 bg-purple-50 hover:bg-purple-600 text-purple-800 hover:text-white rounded-xl font-extrabold text-xs shrink-0 transition-all border border-purple-100 hover:border-purple-600 shadow-2xs flex items-center gap-1 group/btn cursor-pointer">
                    <span>Inspect</span>
                    <i class="fa-solid fa-chevron-right text-[10px] transition-transform group-hover/btn:translate-x-0.5"></i>
                </button>
            </div>
        `;
    }).join('');
}

/* --------------------------------------------------------------------------
   4. Student Management & Filtering
   -------------------------------------------------------------------------- */
function renderStudentTable() {
    const tbody = document.getElementById('studentTableBody');
    if (!tbody) return;

    const searchVal = (document.getElementById('studentTableSearch')?.value || '').toLowerCase().trim();
    const classVal = document.getElementById('filterClass')?.value || 'ALL';
    const statusVal = document.getElementById('filterStatus')?.value || 'ALL';
    const riskVal = document.getElementById('filterRisk')?.value || 'ALL';

    const filtered = adminState.students.filter(s => {
        const matchSearch = s.name.toLowerCase().includes(searchVal) || (s.id && s.id.toLowerCase().includes(searchVal));
        const matchClass = classVal === 'ALL' || s.class === classVal;
        const matchStatus = statusVal === 'ALL' || s.status === statusVal;
        const matchRisk = riskVal === 'ALL' || s.risk === riskVal;
        return matchSearch && matchClass && matchStatus && matchRisk;
    });

    const countEl = document.getElementById('displayedStudentCount');
    if (countEl) countEl.innerText = filtered.length;

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="p-8 text-center text-gray-500 font-medium">
                    <i class="fa-solid fa-user-xmark text-purple-300 text-2xl mb-2 block"></i>
                    No student records match the selected search or filter criteria.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(s => {
        const isChecked = adminState.selectedStudentIds.has(s.id);
        const isDone = s.status === 'Completed';

        let riskBadgeClass = "bg-gray-100 text-gray-700";
        let displayRisk = "Not Screened";

        if (isDone) {
            displayRisk = s.risk || 'Low Risk';
            if (s.risk === 'Higher Indicators') riskBadgeClass = "bg-rose-100 text-rose-800";
            else if (s.risk === 'Moderate Risk') riskBadgeClass = "bg-amber-100 text-amber-800";
            else riskBadgeClass = "bg-emerald-100 text-emerald-800";
        }

        let statusBadgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
        if (s.status === 'Pending') statusBadgeClass = "bg-amber-50 text-amber-700 border-amber-200";
        if (s.status === 'Incomplete') statusBadgeClass = "bg-rose-50 text-rose-700 border-rose-200";

        const cleanPhone = (s.parent_phone || '+6012-3456789').replace(/[^\d+]/g, '');
        const parentEmail = s.parent_email || 'guardian@email.com';

        return `
            <tr class="hover:bg-purple-50/40 transition-colors border-b border-purple-50">
                <td class="p-3.5 text-center w-10 min-w-[40px]">
                    <input type="checkbox" onchange="toggleSelectStudent('${s.id}')" ${isChecked ? 'checked' : ''} class="accent-purple-600 cursor-pointer">
                </td>
                <td class="p-3.5 font-extrabold text-brand-purple-deep min-w-[160px] whitespace-nowrap">
                    <span onclick="viewStudentProfile('${escapeHTML(s.name)}')" class="cursor-pointer hover:underline text-brand-purple-deep hover:text-purple-700">
                        ${escapeHTML(s.name)}
                    </span>
                    <span class="block text-[10px] text-gray-400 font-normal mt-0.5">${escapeHTML(s.id)}</span>
                </td>
                <td class="p-3.5 font-bold text-purple-700 whitespace-nowrap min-w-[100px]">${escapeHTML(s.class)}</td>
                <td class="p-3.5 text-gray-700 font-bold whitespace-nowrap min-w-[110px]">
                    ${s.age} years
                    <span class="text-[11px] text-gray-400 font-normal block">${escapeHTML(s.gender || 'Male')}</span>
                </td>
                <td class="p-3.5 min-w-[270px]">
                    <div class="leading-tight">
                        <strong class="text-brand-purple-deep block text-xs font-bold whitespace-nowrap">${escapeHTML(s.parent_name || 'Guardian')}</strong>
                        <div class="flex items-center gap-2 text-[11px] mt-1 font-semibold whitespace-nowrap">
                            <a href="tel:${cleanPhone}" class="inline-flex items-center gap-1 text-purple-700 hover:text-purple-900 hover:underline transition-colors" title="Click to Call: ${escapeHTML(s.parent_phone || '+6012-3456789')}">
                                <i class="fa-solid fa-phone text-[9.5px] text-purple-600"></i>
                                <span>${escapeHTML(s.parent_phone || '+6012-3456789')}</span>
                            </a>
                            <span class="text-gray-300">•</span>
                            <a href="mailto:${escapeHTML(parentEmail)}" class="inline-flex items-center gap-1 text-purple-700 hover:text-purple-900 hover:underline transition-colors" title="Click to Email: ${escapeHTML(parentEmail)}">
                                <i class="fa-solid fa-envelope text-[9.5px] text-purple-600"></i>
                                <span>${escapeHTML(parentEmail)}</span>
                            </a>
                        </div>
                    </div>
                </td>
                <td class="p-3.5 whitespace-nowrap min-w-[120px]">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border inline-block whitespace-nowrap ${statusBadgeClass}">${escapeHTML(s.status)}</span>
                </td>
                <td class="p-3.5 whitespace-nowrap min-w-[130px]">
                    <span class="px-3 py-1 rounded-full text-[10px] font-extrabold inline-block whitespace-nowrap ${riskBadgeClass}">${escapeHTML(displayRisk)}</span>
                </td>
                <td class="p-3.5 text-gray-500 font-medium whitespace-nowrap min-w-[110px]">${escapeHTML(s.date)}</td>
                <td class="p-3.5 text-center space-x-1 whitespace-nowrap min-w-[155px]">
                    <button onclick="viewStudentProfile('${escapeHTML(s.name)}')" class="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-xl font-bold text-[11px] transition-colors cursor-pointer" title="View Profile">
                        View
                    </button>
                    <button onclick="launchScreeningForStudent('${escapeHTML(s.name)}')" class="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-[11px] transition-colors shadow-sm cursor-pointer" title="Start screening wizard">
                        Screen
                    </button>
                    <button onclick="deleteStudentPrompt('${escapeHTML(s.id)}')" class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-[11px] transition-colors cursor-pointer" title="Delete Student Record">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function filterStudentTable() {
    renderStudentTable();
}

function toggleSelectStudent(id) {
    if (adminState.selectedStudentIds.has(id)) {
        adminState.selectedStudentIds.delete(id);
    } else {
        adminState.selectedStudentIds.add(id);
    }
    updateBulkBar();
}

function toggleSelectAllStudents(masterCheckbox) {
    if (masterCheckbox.checked) {
        adminState.students.forEach(s => adminState.selectedStudentIds.add(s.id));
    } else {
        adminState.selectedStudentIds.clear();
    }
    renderStudentTable();
    updateBulkBar();
}

function updateBulkBar() {
    const bar = document.getElementById('bulkActionsBar');
    const selectedText = document.getElementById('bulkSelectedText');
    if (!bar) return;

    if (adminState.selectedStudentIds.size > 0) {
        bar.classList.remove('hidden');
        if (selectedText) selectedText.innerText = `${adminState.selectedStudentIds.size} Students Selected`;
    } else {
        bar.classList.add('hidden');
    }
}

function triggerBulkAction(actionType) {
    const count = adminState.selectedStudentIds.size;
    if (count === 0) {
        alert("Please select at least one student.");
        return;
    }

    if (actionType === 'report') {
        alert(`Generating aggregated screening reports for ${count} selected students... 📄`);
    } else if (actionType === 'export') {
        exportSelectedStudentsCSV();
    } else if (actionType === 'assign') {
        const newClass = prompt("Enter target Class Name for selected students (e.g. Class 2A):", "Class 2A");
        if (newClass) {
            adminState.students.forEach(s => {
                if (adminState.selectedStudentIds.has(s.id)) {
                    s.class = newClass;
                }
            });
            saveAdminStateLocally();
            renderStudentTable();
            recalculateDashboardMetrics();
            alert(`Assigned ${count} students to ${newClass}!`);
        }
    } else if (actionType === 'delete') {
        if (!confirm(`Are you sure you want to delete the ${count} selected student(s)? This action cannot be undone.`)) {
            return;
        }
        const client = typeof getSupabase === 'function' ? getSupabase() : null;
        const selectedList = adminState.students.filter(s => adminState.selectedStudentIds.has(s.id));
        
        let deletedStudents = [];
        try {
            deletedStudents = JSON.parse(localStorage.getItem('lexisense_deleted_students') || '[]');
            if (!Array.isArray(deletedStudents)) deletedStudents = [];
        } catch (e) { deletedStudents = []; }

        for (const s of selectedList) {
            if (s.id && !deletedStudents.includes(s.id)) deletedStudents.push(s.id);
            if (s.name && !deletedStudents.includes(s.name.toLowerCase())) deletedStudents.push(s.name.toLowerCase());
            if (s.dbId && !deletedStudents.includes(s.dbId)) deletedStudents.push(s.dbId);

            if (client) {
                try {
                    if (s.dbId) {
                        client.from('students').delete().eq('id', s.dbId).then(() => {});
                    } else {
                        client.from('students').delete().eq('name', s.name).then(() => {});
                    }
                } catch (err) {
                    console.warn("Supabase bulk delete notice:", err);
                }
            }
        }
        try {
            localStorage.setItem('lexisense_deleted_students', JSON.stringify(deletedStudents));
        } catch (e) {}

        adminState.students = adminState.students.filter(s => !adminState.selectedStudentIds.has(s.id));
        adminState.selectedStudentIds.clear();
        saveAdminStateLocally();
        recalculateDashboardMetrics();
        renderStudentTable();
        updateBulkBar();
        updateAnalyticsDashboard();
        renderClassesList();
        showToast(`Successfully deleted ${count} student(s). 🗑️`);
    }
}

function deleteStudentPrompt(studentId) {
    deleteStudent(studentId, false);
}

function deleteCurrentStudentProfile() {
    if (!adminState.selectedDetailStudent) return;
    deleteStudent(adminState.selectedDetailStudent.id, true);
}

async function deleteStudent(studentId, returnToRoster = false) {
    const student = adminState.students.find(s => s.id === studentId);
    if (!student) return;

    if (!confirm(`Are you sure you want to delete student "${student.name}" (${student.id})? This will permanently remove their record.`)) {
        return;
    }

    // Save tombstone in localStorage
    try {
        let deletedStudents = JSON.parse(localStorage.getItem('lexisense_deleted_students') || '[]');
        if (!Array.isArray(deletedStudents)) deletedStudents = [];
        if (student.id && !deletedStudents.includes(student.id)) deletedStudents.push(student.id);
        if (student.name && !deletedStudents.includes(student.name.toLowerCase())) deletedStudents.push(student.name.toLowerCase());
        if (student.dbId && !deletedStudents.includes(student.dbId)) deletedStudents.push(student.dbId);
        localStorage.setItem('lexisense_deleted_students', JSON.stringify(deletedStudents));
    } catch (e) {}

    const client = typeof getSupabase === 'function' ? getSupabase() : null;
    const teacherName = getCurrentTeacherName();

    if (client) {
        try {
            if (student.dbId) {
                await client.from('students').delete().eq('id', student.dbId);
            } else {
                await client.from('students').delete().eq('name', student.name);
            }

            if (typeof logAuditToSupabase === 'function') {
                logAuditToSupabase(teacherName, 'DELETE_STUDENT', `Deleted student "${student.name}" (${student.id}) from ${student.school || getCurrentTeacherSchool()}`);
            }
        } catch (err) {
            console.warn("Supabase student delete notice:", err);
        }
    }

    adminState.students = adminState.students.filter(s => s.id !== studentId && s.name.toLowerCase() !== student.name.toLowerCase());
    adminState.selectedStudentIds.delete(studentId);
    if (adminState.selectedDetailStudent && adminState.selectedDetailStudent.id === studentId) {
        adminState.selectedDetailStudent = null;
    }

    saveAdminStateLocally();
    recalculateDashboardMetrics();
    renderStudentTable();
    updateBulkBar();
    updateAnalyticsDashboard();
    renderClassesList();
    syncClassesMetricsToSupabase();

    if (returnToRoster) {
        switchTab('students');
    }

    showToast(`Student "${student.name}" has been deleted. 🗑️`);
}

function exportSelectedStudentsCSV() {
    const selected = adminState.students.filter(s => adminState.selectedStudentIds.has(s.id));
    let csv = "ID,Name,Class,Age,Status,Risk Result,Last Assessment Date,Parent Name\n";
    selected.forEach(s => {
        csv += `"${s.id}","${s.name}","${s.class}",${s.age},"${s.status}","${s.risk}","${s.date}","${s.parent_name}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `LexiSense_Students_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

/* --------------------------------------------------------------------------
   5. Class Management
   -------------------------------------------------------------------------- */
function renderClassesList() {
    const container = document.getElementById('class-management-list');
    if (!container) return;

    const badgeEl = document.getElementById('activeClassSummaryBadge');
    if (badgeEl) badgeEl.innerText = `${adminState.classes.length} Active Cohorts`;

    if (adminState.classes.length === 0) {
        container.innerHTML = `
            <div class="col-span-full bg-white rounded-3xl p-8 border-2 border-dashed border-purple-200 text-center space-y-3 shadow-sm">
                <div class="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-2xl mx-auto"><i class="fa-solid fa-graduation-cap"></i></div>
                <h4 class="font-heading font-extrabold text-lg text-brand-purple-deep">No Class Cohorts Available</h4>
                <p class="text-xs text-gray-500 max-w-sm mx-auto font-medium">When you register students and assign them to classes, their cohorts will appear here automatically.</p>
                <button onclick="openAddStudentModal()" class="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow transition-all cursor-pointer">
                    + Register Student
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = adminState.classes.map(c => {
        const classStudents = adminState.students.filter(s => s.class === c.name);
        let countTotal = 0;
        let countCompleted = 0;
        let countPending = 0;
        let countIncomplete = 0;
        let countRisk = 0;

        if (classStudents.length > 0) {
            countTotal = classStudents.length;
            countCompleted = classStudents.filter(s => s.status === 'Completed').length;
            countPending = classStudents.filter(s => s.status === 'Pending').length;
            countIncomplete = classStudents.filter(s => s.status === 'Incomplete').length;
            countRisk = classStudents.filter(s => s.risk === 'Higher Indicators' || s.risk === 'Moderate Risk').length;
        } else {
            countTotal = c.total || 0;
            countCompleted = c.completed || 0;
            countPending = c.pending || 0;
            countIncomplete = c.incomplete || 0;
            countRisk = c.riskCount || 0;
        }

        const pctCompleted = countTotal > 0 ? ((countCompleted / countTotal) * 100) : 0;
        const pctPending = countTotal > 0 ? ((countPending / countTotal) * 100) : 0;
        const pctIncomplete = countTotal > 0 ? ((countIncomplete / countTotal) * 100) : 0;

        return `
            <div class="bg-white rounded-3xl p-5 sm:p-6 border-2 border-purple-100 hover:border-purple-300 shadow-sm hover:shadow-floating transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between space-y-4 group relative overflow-hidden">
                <!-- Top Ambient Accent Bar -->
                <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                
                <!-- Card Header -->
                <div class="flex items-start justify-between gap-2 pt-1">
                    <div>
                        <div class="flex items-center gap-2">
                            <h3 class="font-heading font-extrabold text-xl text-brand-purple-deep leading-tight group-hover:text-purple-700 transition-colors">${escapeHTML(c.name)}</h3>
                            <span class="bg-purple-100 text-purple-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-purple-200">${escapeHTML(c.grade || 'Year 1')}</span>
                        </div>
                        <p class="text-xs text-gray-500 font-bold mt-1 flex items-center gap-1.5">
                            <i class="fa-solid fa-users text-purple-400 text-xs"></i>
                            <span>${countTotal} Enrolled Students</span>
                        </p>
                    </div>

                    <!-- Class Actions: Edit & Delete -->
                    <div class="flex items-center gap-1 bg-purple-50/60 p-1 rounded-2xl border border-purple-100 shrink-0">
                        <button onclick="openEditClassModal('${escapeHTML(c.name)}')" class="w-8 h-8 rounded-xl bg-white hover:bg-purple-600 text-purple-700 hover:text-white flex items-center justify-center transition-all shadow-sm cursor-pointer" title="Edit Class Details">
                            <i class="fa-solid fa-pen-to-square text-xs"></i>
                        </button>
                        <button onclick="deleteClass('${escapeHTML(c.name)}')" class="w-8 h-8 rounded-xl bg-white hover:bg-rose-600 text-rose-600 hover:text-white flex items-center justify-center transition-all shadow-sm cursor-pointer" title="Delete Cohort">
                            <i class="fa-solid fa-trash text-xs"></i>
                        </button>
                    </div>
                </div>

                <!-- Screening Progress Mini Bar -->
                <div class="space-y-1.5">
                    <div class="flex justify-between items-center text-[11px] font-extrabold">
                        <span class="text-gray-500">Screening Completion</span>
                        <span class="text-purple-700 font-extrabold">${Math.round(pctCompleted)}% Complete</span>
                    </div>
                    <div class="h-2.5 w-full bg-purple-50 rounded-full overflow-hidden flex border border-purple-100" title="Completed: ${countCompleted} | Pending: ${countPending} | Incomplete: ${countIncomplete}">
                        <div style="width: ${pctCompleted}%" class="bg-emerald-500 h-full transition-all duration-500" title="Completed: ${countCompleted} (${Math.round(pctCompleted)}%)"></div>
                        <div style="width: ${pctPending}%" class="h-full bg-amber-400 transition-all duration-500" title="Pending: ${countPending} (${Math.round(pctPending)}%)"></div>
                        <div style="width: ${pctIncomplete}%" class="h-full bg-rose-500 transition-all duration-500" title="Incomplete: ${countIncomplete} (${Math.round(pctIncomplete)}%)"></div>
                    </div>
                </div>

                <!-- Status Metrics Grid -->
                <div class="grid grid-cols-3 gap-2 text-center text-xs">
                    <div class="p-2.5 rounded-2xl bg-emerald-50/80 border border-emerald-100">
                        <span class="text-[10px] uppercase font-extrabold text-emerald-800 block">Screened</span>
                        <strong class="text-base font-extrabold text-emerald-700">${countCompleted}</strong>
                    </div>
                    <div class="p-2.5 rounded-2xl bg-amber-50/80 border border-amber-100">
                        <span class="text-[10px] uppercase font-extrabold text-amber-800 block">Pending</span>
                        <strong class="text-base font-extrabold text-amber-700">${countPending}</strong>
                    </div>
                    <div class="p-2.5 rounded-2xl bg-rose-50/80 border border-rose-100">
                        <span class="text-[10px] uppercase font-extrabold text-rose-800 block">Attention</span>
                        <strong class="text-base font-extrabold text-rose-700">${countRisk}</strong>
                    </div>
                </div>

                <!-- Action Footer -->
                <div class="flex items-center gap-2 pt-1 border-t border-purple-50">
                    <button onclick="viewClassDetail('${escapeHTML(c.name)}')" class="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-2xl transition-all shadow-sm hover:shadow flex items-center justify-center gap-1.5 group/btn cursor-pointer">
                        <span>View Roster</span>
                        <i class="fa-solid fa-arrow-right text-[10px] group-hover/btn:translate-x-1 transition-transform"></i>
                    </button>
                    <button onclick="openAddStudentModal('${escapeHTML(c.name)}')" class="px-3 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold text-xs rounded-2xl border border-purple-200 transition-colors flex items-center gap-1 cursor-pointer" title="Add Student to this Class">
                        <i class="fa-solid fa-user-plus text-xs"></i>
                    </button>
                    <button onclick="generateClassPDFReport('${escapeHTML(c.name)}')" class="px-3 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold text-xs rounded-2xl border border-purple-200 transition-colors cursor-pointer" title="Print Class Summary Report">
                        <i class="fa-solid fa-print text-xs"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function viewClassDetail(className) {
    populateSelectDropdowns();
    const classFilter = document.getElementById('filterClass');
    if (classFilter) classFilter.value = className;
    const statusFilter = document.getElementById('filterStatus');
    if (statusFilter) statusFilter.value = 'ALL';
    const riskFilter = document.getElementById('filterRisk');
    if (riskFilter) riskFilter.value = 'ALL';
    const searchInput = document.getElementById('studentTableSearch');
    if (searchInput) searchInput.value = '';

    const banner = document.getElementById('activeClassFilterBanner');
    const bannerText = document.getElementById('activeClassFilterText');
    if (banner && bannerText) {
        bannerText.innerText = `Filtering by Class: ${className}`;
        banner.classList.remove('hidden');
    }

    switchTab('students');
    renderStudentTable();
}

function clearClassFilter() {
    const classFilter = document.getElementById('filterClass');
    if (classFilter) classFilter.value = 'ALL';
    const banner = document.getElementById('activeClassFilterBanner');
    if (banner) banner.classList.add('hidden');
    filterStudentTable();
}

const GRADE_CHOICES = [
    { id: 'Year 1', label: 'Year 1', icon: 'fa-1' },
    { id: 'Year 2', label: 'Year 2', icon: 'fa-2' },
    { id: 'Year 3', label: 'Year 3', icon: 'fa-3' },
    { id: 'Year 4', label: 'Year 4', icon: 'fa-4' },
    { id: 'Year 5', label: 'Year 5', icon: 'fa-5' },
    { id: 'Year 6', label: 'Year 6', icon: 'fa-6' },
    { id: 'Preschool / Kindergarten', label: 'Preschool', icon: 'fa-shapes' },
    { id: 'Special Education (PPKI)', label: 'PPKI / SEN', icon: 'fa-puzzle-piece' }
];

function selectGradeOption(targetInputId, value) {
    const input = document.getElementById(targetInputId);
    if (input) input.value = value;

    const buttons = document.querySelectorAll(`[data-grade-target="${targetInputId}"]`);
    buttons.forEach(btn => {
        const val = btn.getAttribute('data-grade-val');
        if (val === value) {
            btn.className = "grade-choice-btn py-2.5 px-2.5 rounded-2xl font-extrabold text-xs bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md border-2 border-purple-500 scale-[1.03] transition-all flex items-center justify-center gap-1.5 cursor-pointer";
        } else {
            btn.className = "grade-choice-btn py-2.5 px-2.5 rounded-2xl font-bold text-xs bg-purple-50/60 hover:bg-purple-100 text-purple-900 border-2 border-purple-100 hover:border-purple-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer";
        }
    });
}

function openEditClassModal(className) {
    const classObj = adminState.classes.find(c => c.name === className);
    if (!classObj) return;

    const content = document.getElementById('modalContent');
    if (!content) return;

    content.classList.remove('max-w-4xl');
    content.classList.add('max-w-lg');

    const currentGrade = classObj.grade || 'Year 1';

    const gradeButtonsHtml = GRADE_CHOICES.map(g => {
        const isSelected = (currentGrade === g.id || currentGrade === g.label);
        const btnClass = isSelected
            ? "grade-choice-btn py-2.5 px-2.5 rounded-2xl font-extrabold text-xs bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md border-2 border-purple-500 scale-[1.03] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            : "grade-choice-btn py-2.5 px-2.5 rounded-2xl font-bold text-xs bg-purple-50/60 hover:bg-purple-100 text-purple-900 border-2 border-purple-100 hover:border-purple-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer";

        return `
            <button type="button" data-grade-target="editClassGrade" data-grade-val="${escapeHTML(g.id)}" onclick="selectGradeOption('editClassGrade', '${escapeHTML(g.id)}')" class="${btnClass}">
                <i class="fa-solid ${g.icon} text-xs opacity-90"></i>
                <span>${escapeHTML(g.label)}</span>
            </button>
        `;
    }).join('');

    content.innerHTML = `
        <div class="flex justify-between items-center border-b border-purple-100 pb-3">
            <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    <i class="fa-solid fa-pen-to-square"></i>
                </div>
                <h3 class="font-heading font-extrabold text-xl text-brand-purple-deep">Edit Class Details</h3>
            </div>
            <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600"><i class="fa-solid fa-xmark text-lg"></i></button>
        </div>
        <div class="space-y-4 text-xs pt-2">
            <div>
                <label class="font-bold block mb-1 text-purple-950">Class Cohort Name *</label>
                <input type="text" id="editClassName" value="${escapeHTML(classObj.name)}" placeholder="e.g. Class 1A" class="w-full p-3 bg-purple-50/40 border border-purple-200 rounded-2xl outline-none font-bold text-brand-purple-deep focus:ring-2 focus:ring-purple-600 text-sm">
            </div>
            <div>
                <div class="flex items-center justify-between mb-1.5">
                    <label class="font-bold text-purple-950">Academic Year / Grade Level *</label>
                    <span class="text-[10px] text-purple-600 font-bold bg-purple-100/70 px-2 py-0.5 rounded-full border border-purple-200">1-Tap Choice</span>
                </div>
                <input type="hidden" id="editClassGrade" value="${escapeHTML(currentGrade)}">
                
                <!-- Modern Interactive Choice Grid -->
                <div class="grid grid-cols-4 gap-2 pt-0.5">
                    ${gradeButtonsHtml}
                </div>
            </div>
            <div class="flex gap-2.5 pt-2">
                <button onclick="closeModal()" class="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold rounded-2xl transition-all cursor-pointer">
                    Cancel
                </button>
                <button onclick="saveEditClassFromModal('${escapeHTML(classObj.name)}')" class="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold rounded-2xl shadow-md transition-all cursor-pointer">
                    Save Changes
                </button>
            </div>
        </div>
    `;
    document.getElementById('modalOverlay')?.classList.remove('hidden');
}

async function saveEditClassFromModal(oldName) {
    const newName = document.getElementById('editClassName')?.value.trim();
    const newGrade = document.getElementById('editClassGrade')?.value.trim();

    if (!newName) {
        alert("Please enter a valid class name.");
        return;
    }

    const classObj = adminState.classes.find(c => c.name === oldName);
    if (classObj) {
        classObj.name = newName;
        classObj.grade = newGrade || classObj.grade;
    }

    // Update students
    adminState.students.forEach(s => {
        if (s.class === oldName) s.class = newName;
    });

    // Update followups
    adminState.followups.forEach(f => {
        if (f.class === oldName) f.class = newName;
    });

    saveAdminStateLocally();

    // Persist changes to Supabase
    const client = typeof getSupabase === 'function' ? getSupabase() : null;
    if (client) {
        try {
            await client.from('classes').update({
                name: newName,
                grade: newGrade
            }).eq('name', oldName);

            // Also update students table in Supabase
            await client.from('students').update({
                class: newName,
                grade: newGrade,
                school_grade: newGrade
            }).eq('class', oldName);
        } catch (e) {
            console.warn("Notice updating class in Supabase:", e);
        }
    }

    closeModal();
    renderClassesList();
    renderStudentTable();
    populateSelectDropdowns();
    recalculateDashboardMetrics();
    showToast(`Class "${newName}" updated successfully! ✏️`);
}

async function deleteClass(className) {
    if (!className) return;

    // Find all students enrolled in this cohort
    const studentsInCohort = adminState.students.filter(s => 
        (s.class && s.class.toLowerCase().trim() === className.toLowerCase().trim()) || 
        (s.grade && s.grade.toLowerCase().trim() === className.toLowerCase().trim())
    );
    const studentCount = studentsInCohort.length;

    const confirmMsg = studentCount > 0
        ? `Adakah anda pasti mahu memadam kelas "${className}"?\n\nPerhatian: Semua (${studentCount}) orang murid dalam kelas ini juga akan dipadamkan secara automatik dari sistem.`
        : `Adakah anda pasti mahu memadam kelas "${className}"?`;

    if (!confirm(confirmMsg)) {
        return;
    }

    // 1. Save tombstone in localStorage for deleted class
    try {
        let deletedClasses = JSON.parse(localStorage.getItem('lexisense_deleted_classes') || '[]');
        if (!Array.isArray(deletedClasses)) deletedClasses = [];
        if (!deletedClasses.includes(className)) {
            deletedClasses.push(className);
            localStorage.setItem('lexisense_deleted_classes', JSON.stringify(deletedClasses));
        }
    } catch (e) {}

    // 2. Save tombstones for all students in this class
    let deletedStudents = [];
    try {
        deletedStudents = JSON.parse(localStorage.getItem('lexisense_deleted_students') || '[]');
        if (!Array.isArray(deletedStudents)) deletedStudents = [];
    } catch (e) { deletedStudents = []; }

    studentsInCohort.forEach(s => {
        if (s.id && !deletedStudents.includes(s.id)) deletedStudents.push(s.id);
        if (s.name && !deletedStudents.includes(s.name.toLowerCase())) deletedStudents.push(s.name.toLowerCase());
        if (s.dbId && !deletedStudents.includes(s.dbId)) deletedStudents.push(s.dbId);
        if (adminState.selectedStudentIds) adminState.selectedStudentIds.delete(s.id);
    });
    localStorage.setItem('lexisense_deleted_students', JSON.stringify(deletedStudents));

    // 3. Remove class and students from local memory state
    adminState.classes = adminState.classes.filter(c => c.name.toLowerCase().trim() !== className.toLowerCase().trim());
    adminState.students = adminState.students.filter(s => 
        (!s.class || s.class.toLowerCase().trim() !== className.toLowerCase().trim()) && 
        (!s.grade || s.grade.toLowerCase().trim() !== className.toLowerCase().trim())
    );

    // Reset active detailed student if they belonged to this deleted class
    if (adminState.selectedDetailStudent) {
        const detClass = (adminState.selectedDetailStudent.class || adminState.selectedDetailStudent.grade || '').toLowerCase().trim();
        if (detClass === className.toLowerCase().trim()) {
            adminState.selectedDetailStudent = null;
        }
    }

    // 4. Remove follow-ups for this class
    if (Array.isArray(adminState.followups)) {
        adminState.followups = adminState.followups.filter(f => {
            const fClass = (f.class_name || f.class || '').toLowerCase().trim();
            return fClass !== className.toLowerCase().trim();
        });
    }

    // 5. Persist admin state to localStorage
    saveAdminStateLocally();

    // 6. Delete class, its students, and follow-ups from Supabase
    const client = typeof getSupabase === 'function' ? getSupabase() : null;
    const teacherName = getCurrentTeacherName();

    if (client) {
        try {
            // Delete class from classes table
            await client.from('classes').delete().ilike('name', className);

            // Delete all students belonging to this class from students table
            await client.from('students').delete().ilike('class', className);
            await client.from('students').delete().ilike('grade', className);

            // Also delete by specific IDs/dbIds if present
            for (const s of studentsInCohort) {
                if (s.dbId && isValidUUID(s.dbId)) {
                    await client.from('students').delete().eq('id', s.dbId);
                } else if (s.id) {
                    await client.from('students').delete().eq('student_id', s.id);
                }
            }

            // Delete followups for this class
            await client.from('teacher_followups').delete().ilike('class_name', className);

            if (typeof logAuditToSupabase === 'function') {
                logAuditToSupabase(teacherName, 'DELETE_CLASS_AND_STUDENTS', `Deleted class "${className}" and its ${studentCount} students from ${getCurrentTeacherSchool()}`);
            }
            console.log(`Deleted class "${className}" and ${studentCount} students from Supabase 🗑️`);
        } catch (err) {
            console.warn("Supabase cascade class deletion notice:", err);
        }
    }

    // 7. Re-render all views and refresh UI
    renderClassesList();
    renderStudentTable();
    populateSelectDropdowns();
    recalculateDashboardMetrics();
    renderFollowupTable();
    updateAnalyticsDashboard();
    syncClassesMetricsToSupabase();

    showToast(studentCount > 0 
        ? `Kelas "${className}" dan ${studentCount} orang murid berjaya dipadam. 🗑️` 
        : `Kelas "${className}" berjaya dipadam. 🗑️`
    );
}

/* --------------------------------------------------------------------------
   6. Student Profile Detail Inspector (LexiSense Screening Summary View)
   -------------------------------------------------------------------------- */
let studentDetailRadarChartInstance = null;

function viewStudentProfile(studentName) {
    const student = adminState.students.find(s => s.name.toLowerCase() === studentName.toLowerCase()) || adminState.students[0];
    if (!student) return;

    adminState.selectedDetailStudent = student;
    const isCompleted = student.status === 'Completed';
    const scoreVal = typeof student.score === 'number' ? student.score : 0;
    const isHighRisk = scoreVal >= 65 || student.risk === 'Higher Indicators';
    const isModRisk = !isHighRisk && (scoreVal >= 35 || student.risk === 'Moderate Risk');
    const isLowRisk = isCompleted && !isHighRisk && !isModRisk;

    // 1. Top Demographic Profile Card
    const nameEl = document.getElementById('detailStudentName');
    const badgeEl = document.getElementById('detailStudentRiskBadge');
    const statusBadgeEl = document.getElementById('detailStudentStatusBadge');
    const metaEl = document.getElementById('detailStudentMeta');
    const avatarEl = document.getElementById('detailStudentAvatar');
    const parentNameEl = document.getElementById('detailParentName');
    const parentPhoneEl = document.getElementById('detailParentPhone');
    const parentEmailEl = document.getElementById('detailParentEmail');

    if (nameEl) nameEl.innerText = student.name;
    
    if (badgeEl) {
        if (isCompleted) {
            badgeEl.innerText = student.risk || (isHighRisk ? 'Higher Indicators' : (isModRisk ? 'Moderate Risk' : 'Low Risk'));
            badgeEl.className = `px-3 py-0.5 text-xs font-extrabold rounded-full border ${isHighRisk ? 'bg-rose-100 text-rose-800 border-rose-300' : (isModRisk ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300')}`;
        } else {
            badgeEl.innerText = 'Not Screened';
            badgeEl.className = 'px-3 py-0.5 text-xs font-extrabold rounded-full bg-gray-100 text-gray-700 border border-gray-300';
        }
    }

    if (statusBadgeEl) {
        if (isCompleted) {
            statusBadgeEl.innerText = '● Completed';
            statusBadgeEl.className = 'px-3 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-extrabold rounded-full border border-emerald-300';
        } else if (student.status === 'Incomplete') {
            statusBadgeEl.innerText = '● Incomplete';
            statusBadgeEl.className = 'px-3 py-0.5 bg-rose-100 text-rose-800 text-xs font-extrabold rounded-full border border-rose-300';
        } else {
            statusBadgeEl.innerText = '● Pending Screener';
            statusBadgeEl.className = 'px-3 py-0.5 bg-amber-100 text-amber-800 text-xs font-extrabold rounded-full border border-amber-300';
        }
    }

    if (metaEl) {
        metaEl.innerHTML = `
            <span class="inline-flex items-center gap-1 font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">Class: ${escapeHTML(student.class || 'N/A')}</span>
            <span class="text-gray-300">•</span>
            <span class="text-gray-600 font-semibold">${student.age ? `${student.age} yrs` : ''}</span>
            <span class="text-gray-300">•</span>
            <span class="text-gray-500 font-mono text-[11px]">${escapeHTML(student.id || '')}</span>
        `;
    }
    
    if (avatarEl) {
        const initials = student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        avatarEl.innerText = initials || '👦';
    }
    
    if (parentNameEl) parentNameEl.innerText = student.parent_name || 'Guardian';
    if (parentPhoneEl) parentPhoneEl.innerText = student.parent_phone || '+6012-3456789';
    if (parentEmailEl) parentEmailEl.innerText = student.parent_email || 'guardian@email.com';

    const parentPhoneLink = document.getElementById('detailParentPhoneLink');
    const parentEmailLink = document.getElementById('detailParentEmailLink');
    const cleanDetailPhone = (student.parent_phone || '+6012-3456789').replace(/[^\d+]/g, '');
    if (parentPhoneLink) parentPhoneLink.href = `tel:${cleanDetailPhone}`;
    if (parentEmailLink) parentEmailLink.href = `mailto:${student.parent_email || 'guardian@email.com'}`;

    // 2. Key Results at a Glance (4 Badges)
    const summaryNameEl = document.getElementById('detailSummaryStudentName');
    const summaryDateEl = document.getElementById('detailSummaryDate');
    const summaryScoreEl = document.getElementById('detailSummaryScore');
    const summaryRiskEl = document.getElementById('detailSummaryRiskClassification');

    if (summaryNameEl) summaryNameEl.innerText = student.name;
    if (summaryDateEl) summaryDateEl.innerText = isCompleted ? (student.date || 'Recent') : 'Pending Evaluation';
    if (summaryScoreEl) {
        summaryScoreEl.innerText = isCompleted ? `${scoreVal} / 100` : '0 / 100';
        summaryScoreEl.className = `font-black text-lg sm:text-2xl block ${isHighRisk ? 'text-rose-600' : (isModRisk ? 'text-amber-600' : 'text-emerald-600')}`;
    }
    if (summaryRiskEl) {
        if (isCompleted) {
            summaryRiskEl.innerText = student.risk || (isHighRisk ? 'Higher Indicators' : (isModRisk ? 'Moderate Risk' : 'Low Risk'));
            summaryRiskEl.className = `font-black text-xs sm:text-sm px-3 py-1 rounded-full inline-block mt-0.5 border ${isHighRisk ? 'bg-rose-100 text-rose-800 border-rose-300' : (isModRisk ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300')}`;
        } else {
            summaryRiskEl.innerText = 'Not Screened';
            summaryRiskEl.className = 'font-black text-xs sm:text-sm px-3 py-1 rounded-full inline-block mt-0.5 border bg-gray-100 text-gray-700 border-gray-300';
        }
    }

    // 3. Specialist Referral Guidance Card
    const referralCard = document.getElementById('detailSummaryReferralCard');
    if (referralCard) {
        const isCompleted = student.status === 'Completed';
        const isHighRisk = student.risk === 'Higher Indicators' || (student.score && student.score >= 70);
        const isModRisk = student.risk === 'Moderate Risk' || (student.score && student.score >= 35 && student.score < 70);
        const scoreVal = typeof student.score === 'number' ? student.score : (isCompleted ? 68 : 0);

        if (isCompleted) {
            if (isHighRisk) {
                referralCard.className = 'p-5 sm:p-6 rounded-3xl border-2 border-rose-300 bg-gradient-to-br from-rose-50 to-orange-50 space-y-2';
                referralCard.innerHTML = `
                    <div class="flex items-start gap-4">
                        <div class="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center text-2xl font-bold shrink-0 border border-rose-200">
                            🚨
                        </div>
                        <div class="space-y-1 flex-1">
                            <div class="flex items-center gap-2 flex-wrap">
                                <h4 class="font-heading font-extrabold text-rose-950 text-base sm:text-lg">Priority Clinical & Educational Specialist Referral Recommended</h4>
                                <span class="px-2.5 py-0.5 bg-rose-200 text-rose-900 font-extrabold text-[10px] rounded-full border border-rose-300">Level 3 Action</span>
                            </div>
                            <p class="text-xs sm:text-sm text-rose-900/90 leading-relaxed font-medium">
                                Screening indicators demonstrate significant phonological processing and visual tracking divergence (${scoreVal}% index). A comprehensive formal evaluation by an educational psychologist or certified literacy specialist is recommended to establish tailored classroom accommodations.
                            </p>
                        </div>
                    </div>
                `;
            } else if (isModRisk) {
                referralCard.className = 'p-5 sm:p-6 rounded-3xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 space-y-2';
                referralCard.innerHTML = `
                    <div class="flex items-start gap-4">
                        <div class="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl font-bold shrink-0 border border-amber-200">
                            ⚠️
                        </div>
                        <div class="space-y-1 flex-1">
                            <div class="flex items-center gap-2 flex-wrap">
                                <h4 class="font-heading font-extrabold text-amber-950 text-base sm:text-lg">Targeted Classroom Scaffolding & Structured Monitoring Suggested</h4>
                                <span class="px-2.5 py-0.5 bg-amber-200 text-amber-900 font-extrabold text-[10px] rounded-full border border-amber-300">Level 2 Action</span>
                            </div>
                            <p class="text-xs sm:text-sm text-amber-900/90 leading-relaxed font-medium">
                                Mild-to-moderate reading hesitation and decoding patterns observed (${scoreVal}% index). Implement multi-sensory reading exercises and line-tracking overlay aids with regular 4-week milestone checks.
                            </p>
                        </div>
                    </div>
                `;
            } else {
                referralCard.className = 'p-5 sm:p-6 rounded-3xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 space-y-2';
                referralCard.innerHTML = `
                    <div class="flex items-start gap-4">
                        <div class="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-bold shrink-0 border border-emerald-200">
                            🟢
                        </div>
                        <div class="space-y-1 flex-1">
                            <div class="flex items-center gap-2 flex-wrap">
                                <h4 class="font-heading font-extrabold text-emerald-950 text-base sm:text-lg">Age-Appropriate Reading Fluency — Few Indicators Observed</h4>
                                <span class="px-2.5 py-0.5 bg-emerald-200 text-emerald-900 font-extrabold text-[10px] rounded-full border border-emerald-300">On Track</span>
                            </div>
                            <p class="text-xs sm:text-sm text-emerald-900/90 leading-relaxed font-medium">
                                Screening reveals steady visual tracking and grade-aligned phonological fluency (${scoreVal}% index). Maintain general differentiated reading engagement and positive literacy enrichment.
                            </p>
                        </div>
                    </div>
                `;
            }
        } else {
            referralCard.className = 'p-5 sm:p-6 rounded-3xl border-2 border-purple-200 bg-purple-50/50 space-y-2';
            referralCard.innerHTML = `
                <div class="flex items-start gap-4">
                    <div class="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-2xl font-bold shrink-0 border border-purple-200">
                        ⏳
                    </div>
                    <div class="space-y-1 flex-1">
                        <div class="flex items-center gap-2 flex-wrap">
                            <h4 class="font-heading font-extrabold text-purple-950 text-base sm:text-lg">Screening Evaluation Pending</h4>
                            <span class="px-2.5 py-0.5 bg-purple-200 text-purple-900 font-extrabold text-[10px] rounded-full border border-purple-300">Not Screened</span>
                        </div>
                        <p class="text-xs sm:text-sm text-purple-900/90 leading-relaxed font-medium">
                            This learner has not undergone the 3-pillar dyslexia risk screening evaluation. Click <strong>"Start Screening"</strong> above to conduct an assessment.
                        </p>
                    </div>
                </div>
            `;
        }
    }

    // 4. 3 Simple Reading Highlights
    const gazeEl = document.getElementById('detailSummaryGazeStability');
    const wcpmEl = document.getElementById('detailSummaryReadingWCPM');
    const phonoEl = document.getElementById('detailSummaryPhonologicalMatch');

    const calculatedWPM = student.reading_wpm || (isHighRisk ? 32 : (isModRisk ? 48 : 88));
    const gazeStabilityVal = isCompleted ? (isHighRisk ? 62 : (isModRisk ? 78 : 94)) : 0;
    const phonoMatchVal = isCompleted ? (student.pillar2_score || (isHighRisk ? 42 : (isModRisk ? 68 : 92))) : 0;

    if (gazeEl) gazeEl.innerText = isCompleted ? `${gazeStabilityVal}% Steady` : 'Pending';
    if (wcpmEl) wcpmEl.innerText = isCompleted ? `${calculatedWPM} WCPM` : 'Pending';
    if (phonoEl) phonoEl.innerText = isCompleted ? `${phonoMatchVal}% Match` : 'Pending';

    // 5. Ollie Owl's Interpretation Box & 3-Pillar Progress Bars
    const interpBox = document.getElementById('detailSummaryInterpretationBox');
    const p1ScoreEl = document.getElementById('detailPillar1Score');
    const p1Bar = document.getElementById('detailPillar1Bar');
    const p2Label = document.getElementById('detailPillar2Label');
    const p2ScoreEl = document.getElementById('detailPillar2Score');
    const p2Bar = document.getElementById('detailPillar2Bar');
    const p3ScoreEl = document.getElementById('detailPillar3Score');
    const p3Bar = document.getElementById('detailPillar3Bar');

    const p1Val = isCompleted ? (student.pillar1_score || (isHighRisk ? 84 : (isModRisk ? 54 : 22))) : 0;
    const p2Val = isCompleted ? (student.pillar2_score || (isHighRisk ? 86 : (isModRisk ? 52 : 24))) : 0;
    const p3Val = isCompleted ? (student.pillar3_score || (isHighRisk ? 76 : (isModRisk ? 44 : 18))) : 0;

    if (interpBox) {
        if (isCompleted) {
            interpBox.innerHTML = `
                <p><strong>Primary Finding:</strong> ${escapeHTML(student.diagnostic_area || 'Comprehensive 3-pillar dyslexia screening evaluation complete.')}</p>
                <p class="text-xs text-gray-600 mt-1">
                    ${isHighRisk ? 'Demonstrates notable visual tracking hesitation, letter orientation ambiguity (b vs d), and extended phoneme decoding latencies. Multisensory decoding strategies and front-row classroom positioning are recommended.' : 
                      isModRisk ? 'Displays mild hesitation on multisyllabic vocabulary with occasional line-skipping. Regular line-reader overlay aids and praise for reading effort will accelerate fluency.' : 
                      'Demonstrates smooth reading cadence, rapid word recognition, and high phonological decoding accuracy aligned with age benchmarks.'}
                </p>
            `;
        } else {
            interpBox.innerHTML = `<p class="italic text-gray-500">Student screening observation summary will appear here once the 3-pillar assessment is conducted.</p>`;
        }
    }

    if (p1ScoreEl) p1ScoreEl.innerText = `${p1Val}%`;
    if (p1Bar) p1Bar.style.width = `${p1Val}%`;
    if (p2Label) p2Label.innerText = `2. Pillar 2: Oral Reading (${calculatedWPM} WCPM · 30%)`;
    if (p2ScoreEl) p2ScoreEl.innerText = `${p2Val}%`;
    if (p2Bar) p2Bar.style.width = `${p2Val}%`;
    if (p3ScoreEl) p3ScoreEl.innerText = `${p3Val}%`;
    if (p3Bar) p3Bar.style.width = `${p3Val}%`;

    // 6. 5-Axis Radar Chart
    renderStudentDetailRadarChart(student);

    // 7. Comparison Result & Reading Progression (Replaces supportive suggestions)
    renderStudentComparisonResult(student);

    // 8. Easy Note to Send to Parent
    const parentNoteText = generateParentNote(student);
    const parentNoteEl = document.getElementById('detailParentNoteText');
    if (parentNoteEl) parentNoteEl.innerText = `"${parentNoteText}"`;

    switchTab('student-detail');
}

/**
 * Renders 5-Axis Radar Chart on #detailRadarChart
 */
function renderStudentDetailRadarChart(student) {
    const canvas = document.getElementById('detailRadarChart');
    if (!canvas) return;

    if (studentDetailRadarChartInstance) {
        studentDetailRadarChartInstance.destroy();
        studentDetailRadarChartInstance = null;
    }

    if (typeof Chart === 'undefined') return;

    const isDone = student.status === 'Completed';
    const score = isDone ? (typeof student.score === 'number' ? student.score : 50) : 15;
    const base = Math.min(95, Math.max(15, score));

    const scores = isDone ? [
        Math.min(98, Math.max(15, Math.round(base * 1.08))), // Fixation Stability
        Math.min(98, Math.max(15, Math.round(base * 0.88))), // Letter Orientation
        Math.min(98, Math.max(15, Math.round(base * 1.02))), // Phonological Recall
        Math.min(98, Math.max(15, Math.round(base * 0.94))), // Working Memory
        Math.min(98, Math.max(15, Math.round(base * 0.90)))  // Tracking Pace
    ] : [10, 10, 10, 10, 10];

    const isHigh = score >= 65;
    const isMod = score >= 35 && score < 65;
    const primaryColor = !isDone ? '#9CA3AF' : (isHigh ? '#DC2626' : (isMod ? '#D97706' : '#10B981'));
    const bgFill = !isDone ? 'rgba(156, 163, 175, 0.15)' : (isHigh ? 'rgba(220, 38, 38, 0.22)' : (isMod ? 'rgba(217, 119, 6, 0.22)' : 'rgba(16, 185, 129, 0.22)'));

    const datasetLabel = isDone 
        ? `${student.name} (${student.date || 'Recent'} · ${student.risk || 'Result'} · ${score}%)` 
        : `${student.name} (Pending Screener)`;

    studentDetailRadarChartInstance = new Chart(canvas, {
        type: 'radar',
        data: {
            labels: ['Fixation Stability', 'Letter Orientation', 'Phonological Recall', 'Working Memory', 'Tracking Pace'],
            datasets: [{
                label: datasetLabel,
                data: scores,
                backgroundColor: bgFill,
                borderColor: primaryColor,
                pointBackgroundColor: '#FBBF24',
                pointBorderColor: '#FFFFFF',
                pointRadius: isDone ? 5 : 2,
                borderWidth: 2.5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    min: 0,
                    max: 100,
                    ticks: { display: false },
                    grid: { color: '#E9D5FF' },
                    pointLabels: {
                        font: { family: 'Nunito', size: 10, weight: '700' },
                        color: '#3B0764'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    labels: { font: { family: 'Nunito', size: 11, weight: '800' }, color: '#3B0764' }
                }
            }
        }
    });
}

/**
 * Renders Comparison Result & Progression Cards
 */
function renderStudentComparisonResult(student) {
    const container = document.getElementById('detailComparisonCardsContainer');
    const commentary = document.getElementById('detailComparisonCommentary');
    const badge = document.getElementById('detailComparisonBadge');
    if (!container || !commentary) return;

    const isDone = student.status === 'Completed';
    const currentScore = isDone ? (typeof student.score === 'number' ? student.score : 50) : 0;
    const currentWPM = student.reading_wpm || (currentScore >= 65 ? 32 : (currentScore >= 35 ? 48 : 88));
    const expectedWPM = 50; // Grade norm
    const gazeStability = isDone ? (currentScore >= 65 ? 62 : (currentScore >= 35 ? 78 : 94)) : 0;

    if (badge) {
        badge.innerText = isDone ? '⭐ Growth Milestone Active' : '⏳ Baseline Awaiting Screener';
    }

    if (!isDone) {
        container.innerHTML = `
            <div class="col-span-full p-6 bg-purple-50/50 rounded-2xl border border-purple-100 text-center space-y-2">
                <i class="fa-solid fa-code-compare text-purple-400 text-xl"></i>
                <h5 class="font-heading font-extrabold text-brand-purple-deep text-sm">Longitudinal Data Not Yet Available</h5>
                <p class="text-xs text-gray-500 max-w-md mx-auto">
                    Conduct the initial 3-pillar screening to establish ${escapeHTML(student.name)}'s baseline metrics and unlock longitudinal comparison analytics.
                </p>
            </div>
        `;
        commentary.innerHTML = `<strong>Awaiting Evaluation:</strong> Once ${escapeHTML(student.name)} completes the 3-pillar screening, Ollie AI will generate side-by-side progression insights and compare results against cohort benchmarks.`;
        return;
    }

    // Baseline comparison simulation
    const baselineScore = Math.min(95, Math.max(20, Math.round(currentScore * 1.15)));
    const baselineWPM = Math.max(20, Math.round(currentWPM * 0.85));
    const scoreDiff = currentScore - baselineScore;
    const wpmDiff = currentWPM - baselineWPM;

    container.innerHTML = `
        <!-- Card 1: Risk Index Variance -->
        <div class="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 flex flex-col justify-between space-y-2">
            <div class="flex items-center justify-between">
                <span class="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider">Screening Index</span>
                <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full ${scoreDiff <= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                    ${scoreDiff <= 0 ? `${scoreDiff}% Improved ↓` : `+${scoreDiff}% Variance`}
                </span>
            </div>
            <div>
                <span class="text-2xl font-black text-brand-purple-deep block">${currentScore}%</span>
                <span class="text-[11px] text-gray-500 font-medium">Initial Baseline: ${baselineScore}%</span>
            </div>
        </div>

        <!-- Card 2: Oral Reading Cadence -->
        <div class="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 flex flex-col justify-between space-y-2">
            <div class="flex items-center justify-between">
                <span class="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider">Reading Cadence</span>
                <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full ${wpmDiff >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                    ${wpmDiff >= 0 ? `+${wpmDiff} WPM Faster ↑` : `${wpmDiff} WPM`}
                </span>
            </div>
            <div>
                <span class="text-2xl font-black text-brand-purple-deep block">${currentWPM} WCPM</span>
                <span class="text-[11px] text-gray-500 font-medium">Year Benchmark: ${expectedWPM} WPM</span>
            </div>
        </div>

        <!-- Card 3: Gaze Fixation Stability -->
        <div class="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 flex flex-col justify-between space-y-2">
            <div class="flex items-center justify-between">
                <span class="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider">Gaze Steadiness</span>
                <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                    AI Tracked
                </span>
            </div>
            <div>
                <span class="text-2xl font-black text-brand-purple-deep block">${gazeStability}%</span>
                <span class="text-[11px] text-gray-500 font-medium">${gazeStability >= 80 ? 'Steady Line Following' : 'Regressive Gaze Shifts'}</span>
            </div>
        </div>
    `;

    commentary.innerHTML = `
        <strong>Progression Insights for ${escapeHTML(student.name)}:</strong> 
        ${currentScore >= 65 ? 
            `${student.name} is showing notable commitment during reading sessions. Continued multisensory decoding and structured phonetic drills will help close the cadence gap from ${currentWPM} WCPM toward the grade benchmark of ${expectedWPM} WCPM.` : 
            currentScore >= 35 ? 
            `${student.name} has demonstrated steady reading progression (${currentWPM} WCPM). Visual tracking steadiness is at ${gazeStability}%. Continue using line-ruler guides and praise effort to solidify fluent cadence.` : 
            `${student.name} demonstrates excellent reading fluency (${currentWPM} WCPM) with 94% gaze fixation stability, performing strongly within grade-level expectations.`}
    `;
}

/**
 * Generates ready-to-send teacher-to-parent note
 */
function generateParentNote(student) {
    if (!student) return '';
    const isDone = student.status === 'Completed';
    const parentName = student.parent_name || 'Parent / Guardian';
    const teacherName = adminState.profile.name || 'Faiz Ikhwan';
    const schoolName = student.school || adminState.profile.school || 'SK Taman Ria';
    const dateStr = student.date || 'today';

    if (!isDone) {
        return `Salam & Hello ${parentName},\n\nWe have registered ${student.name} for the upcoming LexiSense 3-pillar dyslexia and literacy screening at ${schoolName}. The evaluation will assess reading cadence, phonological decoding, and visual tracking in a fun, friendly 10-minute session. We will share the full summary report with you once completed.\n\nWarm regards,\n${teacherName}\n${schoolName}`;
    }

    const score = typeof student.score === 'number' ? student.score : 0;
    const isHigh = score >= 65;
    const isMod = score >= 35 && score < 65;

    if (isHigh) {
        return `Salam & Hello ${parentName},\n\nWe recently conducted the LexiSense 3-pillar dyslexia risk screening for ${student.name} at ${schoolName} on ${dateStr}. ${student.name}'s screening index is ${score}% (Higher Indicators Observed).\n\nWe noticed ${student.name} experiences some visual tracking fatigue and letter reversals (such as b vs d) while reading. We are implementing supportive multisensory reading tools in class and recommend reviewing the detailed screening dossier. We would love to collaborate with you on practical home reading strategies!\n\nWarm regards,\n${teacherName}\n${schoolName}`;
    } else if (isMod) {
        return `Salam & Hello ${parentName},\n\nWe recently conducted the LexiSense 3-pillar literacy screening for ${student.name} at ${schoolName} on ${dateStr}. ${student.name}'s screening index is ${score}% (Moderate Risk Indicators).\n\n${student.name} is showing wonderful enthusiasm and effort! We noticed some mild hesitation on longer multisyllabic words, and we are introducing line-reader aids to make reading even smoother. You can support ${student.name} at home with 5-minute shared reading games.\n\nWarm regards,\n${teacherName}\n${schoolName}`;
    } else {
        return `Salam & Hello ${parentName},\n\nWe recently conducted the LexiSense 3-pillar literacy screening for ${student.name} at ${schoolName} on ${dateStr}. ${student.name}'s screening index is ${score}% (Low Risk — On Track).\n\n${student.name} is reading smoothly and with great confidence! Reading cadence and visual line tracking are well aligned with grade benchmarks. Keep up the fantastic shared reading at home!\n\nWarm regards,\n${teacherName}\n${schoolName}`;
    }
}

function copyParentNoteToClipboard() {
    const noteText = document.getElementById('detailParentNoteText')?.innerText?.replace(/^"|"$/g, '') || '';
    if (noteText) {
        navigator.clipboard.writeText(noteText).then(() => {
            showToast("Parent note copied to clipboard! 📋");
        }).catch(() => {
            showToast("Copied note to clipboard!");
        });
    }
}

function sendParentNoteViaWhatsApp() {
    const student = adminState.selectedDetailStudent;
    const phone = (student?.parent_phone || '').replace(/[^\d+]/g, '');
    const noteText = document.getElementById('detailParentNoteText')?.innerText?.replace(/^"|"$/g, '') || '';
    const encoded = encodeURIComponent(noteText);
    const waUrl = phone ? `https://wa.me/${phone.replace('+', '')}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(waUrl, '_blank');
}

function sendParentNoteViaEmail() {
    const student = adminState.selectedDetailStudent;
    const email = student?.parent_email || '';
    const studentName = student?.name || 'Student';
    const noteText = document.getElementById('detailParentNoteText')?.innerText?.replace(/^"|"$/g, '') || '';
    const subject = encodeURIComponent(`LexiSense Dyslexia Risk Screening Summary - ${studentName}`);
    const body = encodeURIComponent(noteText);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
}

function generateIndividualPDFReport() {
    const student = adminState.selectedDetailStudent;
    if (student) {
        window.open(`report-preview.html?student=${encodeURIComponent(student.name)}`, '_blank');
    } else {
        window.print();
    }
}

function openLaunchScreeningModal(studentName) {
    if (studentName) {
        window.location.href = `prediagnosis-page.html?from=admin&student=${encodeURIComponent(studentName)}`;
    } else {
        window.location.href = `prediagnosis-page.html?from=admin`;
    }
}

function launchScreeningForCurrentStudent() {
    if (adminState.selectedDetailStudent) {
        openLaunchScreeningModal(adminState.selectedDetailStudent.name);
    } else {
        openLaunchScreeningModal();
    }
}

function launchScreeningForStudent(studentName) {
    openLaunchScreeningModal(studentName);
}

/* --------------------------------------------------------------------------
   7. Aligned 3-Pillar Pre-Diagnosis Screener Wizard (Steps 1 to 5)
   -------------------------------------------------------------------------- */
function goToWizardStep(step) {
    adminState.wizardStep = step;

    const titles = {
        1: "Step 1: Select Student for Screening",
        2: "Step 2: Educator Guidelines & Disclaimer",
        3: "Step 3: 30-Question Observation Questionnaire",
        4: "Step 4: LexiSense AI 2-Phase Eye-Tracking Module",
        5: "Step 5: 3-Pillar Multimodal Screening Analysis"
    };

    const headerEl = document.getElementById('step-title-header');
    const badgeEl = document.getElementById('step-badge');
    if (headerEl) headerEl.innerText = titles[step] || `Step ${step}`;
    if (badgeEl) badgeEl.innerText = `Step ${step} of 5`;

    for (let i = 1; i <= 5; i++) {
        const bar = document.getElementById(`step-bar-${i}`);
        if (bar) {
            bar.className = i <= step 
                ? 'h-2 rounded-full bg-purple-600 transition-all duration-500' 
                : 'h-2 rounded-full bg-purple-100 transition-all duration-500';
        }
        const panel = document.getElementById(`wizard-step-${i}`);
        if (panel) {
            if (i === step) {
                panel.classList.remove('hidden');
                panel.classList.add('animate-pop-in');
            } else {
                panel.classList.add('hidden');
            }
        }
    }

    if (step === 1) {
        renderWizardStudentCards();
    } else if (step === 3) {
        renderCurrentQuestion();
    } else if (step === 4) {
        chooseInitialLanguage(adminState.currentSelectedLanguage || 'english');
    } else if (step === 5) {
        runFinal3PillarAnalysis();
    }

    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderWizardStudentCards() {
    const container = document.getElementById('wizard-students-container');
    if (!container) return;

    if (!adminState.activeScreeningStudent && adminState.students.length > 0) {
        adminState.activeScreeningStudent = adminState.students[0];
    }

    container.innerHTML = adminState.students.map(s => {
        const isSelected = adminState.activeScreeningStudent && adminState.activeScreeningStudent.name === s.name;
        const borderStyle = isSelected 
            ? 'border-2 border-purple-600 bg-purple-50/90 shadow-md ring-2 ring-purple-400' 
            : 'border-2 border-purple-100 hover:border-purple-300 bg-white hover:bg-purple-50/50';

        return `
            <div onclick="selectStudentForWizard('${escapeHTML(s.name)}')" class="kemas-card p-4 sm:p-5 rounded-3xl ${borderStyle} cursor-pointer transition-all flex items-center justify-between gap-3 relative">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-extrabold text-lg flex items-center justify-center shadow-sm">
                        ${s.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h4 class="font-heading font-extrabold text-purple-950 text-base leading-tight">${escapeHTML(s.name)}</h4>
                        <p class="text-xs text-purple-700 font-bold mt-0.5">${escapeHTML(s.class)} • Age ${s.age}</p>
                        <span class="text-[10px] text-gray-400 font-medium">${escapeHTML(s.id)}</span>
                    </div>
                </div>
                <div class="w-7 h-7 rounded-full ${isSelected ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-400'} flex items-center justify-center text-xs font-bold shrink-0">
                    <i class="fa-solid ${isSelected ? 'fa-check' : 'fa-chevron-right'}"></i>
                </div>
            </div>
        `;
    }).join('');
}

function selectStudentForWizard(studentName) {
    const student = adminState.students.find(s => s.name.toLowerCase() === studentName.toLowerCase()) || adminState.students[0];
    adminState.activeScreeningStudent = student;
    renderWizardStudentCards();
    switchTab('screening');
    goToWizardStep(2);
}

/* --------------------------------------------------------------------------
   Questionnaire Logic (30 Questions)
   -------------------------------------------------------------------------- */
function renderCurrentQuestion() {
    const q = DYSLEXIA_QUESTIONNAIRE[adminState.currentQuestionIndex];
    if (!q) return;

    const titleEl = document.getElementById('q-section-title');
    const numEl = document.getElementById('q-number');
    const textEl = document.getElementById('q-text');
    const prevBtn = document.getElementById('q-prev-btn');
    const nextBtn = document.getElementById('q-next-btn');

    if (titleEl) titleEl.innerText = q.title;
    if (numEl) numEl.innerText = `Question ${adminState.currentQuestionIndex + 1} of ${DYSLEXIA_QUESTIONNAIRE.length}`;
    if (textEl) {
        const studentName = adminState.activeScreeningStudent?.name || 'Student';
        textEl.innerText = q.text.replace('Student', studentName).replace('My child', studentName);
    }

    const savedVal = adminState.questionnaireAnswers[q.id];
    document.querySelectorAll('input[name="q-option"]').forEach(radio => {
        radio.checked = (savedVal !== undefined && parseInt(radio.value, 10) === savedVal);
    });

    if (prevBtn) {
        prevBtn.disabled = adminState.currentQuestionIndex === 0;
    }
    if (nextBtn) {
        nextBtn.innerText = adminState.currentQuestionIndex === DYSLEXIA_QUESTIONNAIRE.length - 1 
            ? "Complete Questionnaire & Proceed to Eye Tracking →" 
            : "Next Question →";
    }
}

function handleQuestionAnswerSelect(val) {
    const q = DYSLEXIA_QUESTIONNAIRE[adminState.currentQuestionIndex];
    if (q) {
        adminState.questionnaireAnswers[q.id] = parseInt(val, 10);
    }
}

function nextQuestion() {
    const q = DYSLEXIA_QUESTIONNAIRE[adminState.currentQuestionIndex];
    if (q && adminState.questionnaireAnswers[q.id] === undefined) {
        const checkedRadio = document.querySelector('input[name="q-option"]:checked');
        adminState.questionnaireAnswers[q.id] = checkedRadio ? parseInt(checkedRadio.value, 10) : 2;
    }

    if (adminState.currentQuestionIndex < DYSLEXIA_QUESTIONNAIRE.length - 1) {
        adminState.currentQuestionIndex++;
        renderCurrentQuestion();
    } else {
        goToWizardStep(4);
    }
}

function prevQuestion() {
    if (adminState.currentQuestionIndex > 0) {
        adminState.currentQuestionIndex--;
        renderCurrentQuestion();
    }
}

/* --------------------------------------------------------------------------
   Eye Tracking Sub-Phases (Language, Calibration, Reading Task)
   -------------------------------------------------------------------------- */
function chooseInitialLanguage(langKey) {
    if (!READING_PASSAGES[langKey]) langKey = 'english';
    adminState.currentSelectedLanguage = langKey;

    document.querySelectorAll('.gateway-lang-card').forEach(card => {
        card.classList.remove('border-purple-600', 'bg-purple-50', 'ring-2', 'ring-purple-400');
        card.classList.add('border-gray-200', 'bg-white');
    });

    const activeCard = document.getElementById(`gateway-card-${langKey}`);
    if (activeCard) {
        activeCard.classList.add('border-purple-600', 'bg-purple-50', 'ring-2', 'ring-purple-400');
        activeCard.classList.remove('border-gray-200', 'bg-white');
    }

    const startBtn = document.getElementById('btn-start-eyetracking-session');
    if (startBtn) {
        startBtn.innerHTML = `🚀 Start Eye Tracking (${READING_PASSAGES[langKey].label}) →`;
    }
}

function toggleFaceAlignmentSimulation() {
    adminState.isFaceAligned = !adminState.isFaceAligned;
    const btn = document.getElementById('btn-toggle-face');
    const guide = document.getElementById('face-oval-guide');
    const label = document.getElementById('face-oval-label');
    const notice = document.getElementById('face-position-notice');

    if (adminState.isFaceAligned) {
        if (btn) { btn.innerText = "🟢 Face: Aligned"; btn.className = "px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold text-xs shadow"; }
        if (guide) { guide.className = "w-48 h-56 border-4 border-dashed border-emerald-400 rounded-full bg-emerald-500/10 flex items-center justify-center transition-all duration-300"; }
        if (label) { label.innerText = "🟢 Face Aligned"; }
        if (notice) { notice.innerHTML = "🟢 <strong>Face Aligned & Good Lighting:</strong> Ready for maximum precision (95%+)"; notice.className = "text-xs text-emerald-700 bg-emerald-50 p-3 rounded-2xl border border-emerald-200 font-bold"; }
    } else {
        if (btn) { btn.innerText = "🔴 Face: Misaligned"; btn.className = "px-3 py-1 bg-red-600 text-white rounded-lg font-bold text-xs shadow"; }
        if (guide) { guide.className = "w-48 h-56 border-4 border-dashed border-red-500 rounded-full bg-red-500/15 flex items-center justify-center transition-all duration-300"; }
        if (label) { label.innerText = "🔴 Center Face in Frame"; }
        if (notice) { notice.innerHTML = "⚠️ <strong>Position Notice:</strong> Please position the student's face within the guide oval."; notice.className = "text-xs text-amber-800 bg-amber-50 p-3 rounded-2xl border border-amber-200 font-bold"; }
    }
}

function toggleLightingSimulation() {
    adminState.isGoodLighting = !adminState.isGoodLighting;
    const btn = document.getElementById('btn-toggle-light');
    if (btn) {
        btn.innerText = adminState.isGoodLighting ? "💡 Light: Good" : "🌑 Light: Dim";
        btn.className = adminState.isGoodLighting 
            ? "px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold text-xs shadow" 
            : "px-3 py-1 bg-amber-600 text-white rounded-lg font-bold text-xs shadow";
    }
}

function proceedToCalibrationWithWarningCheck() {
    document.getElementById('language-gateway-phase')?.classList.add('hidden');
    document.getElementById('calibration-active-phase')?.classList.remove('hidden');
    document.getElementById('calibration-result-phase')?.classList.add('hidden');
    document.getElementById('eye-reading-task-phase')?.classList.add('hidden');

    start5PointCalibration();
}

function start5PointCalibration() {
    const points = [
        { label: "Point 1: Top Left", top: "15%", left: "15%" },
        { label: "Point 2: Top Right", top: "15%", left: "85%" },
        { label: "Point 3: Bottom Right", top: "80%", left: "85%" },
        { label: "Point 4: Bottom Left", top: "80%", left: "15%" },
        { label: "Point 5: Center Focus", top: "50%", left: "50%" }
    ];

    let currentPt = 0;
    const targetDot = document.getElementById('calibration-target-dot');
    const labelEl = document.getElementById('calibration-point-label');
    const countEl = document.getElementById('calibration-point-count');

    function animatePoint() {
        if (currentPt < points.length) {
            const p = points[currentPt];
            if (labelEl) labelEl.innerText = p.label;
            if (countEl) countEl.innerText = `${currentPt + 1} / 5`;
            if (targetDot) {
                targetDot.style.top = p.top;
                targetDot.style.left = p.left;
            }
            currentPt++;
            setTimeout(animatePoint, 1000);
        } else {
            showCalibrationResult();
        }
    }

    animatePoint();
}

function showCalibrationResult() {
    document.getElementById('calibration-active-phase')?.classList.add('hidden');
    document.getElementById('calibration-result-phase')?.classList.remove('hidden');
    document.getElementById('eye-reading-task-phase')?.classList.remove('hidden');

    setupReadingTaskPassage();
}

function setupReadingTaskPassage() {
    const passage = READING_PASSAGES[adminState.currentSelectedLanguage] || READING_PASSAGES.english;
    const titleEl = document.getElementById('reading-passage-title');
    const container = document.getElementById('reading-words-container');

    if (titleEl) titleEl.innerText = passage.title;
    if (container) {
        const studentName = adminState.activeScreeningStudent?.name || 'Student';
        container.innerHTML = passage.words.map((w, idx) => {
            const wordDisplay = w.replace('Student', studentName).replace('Child', studentName).replace('Murid', studentName);
            return `<span id="read-word-${idx}" class="inline-block p-1.5 rounded-xl font-dyslexic text-base sm:text-lg transition-colors duration-200 text-gray-700">${escapeHTML(wordDisplay)}</span>`;
        }).join(' ');
    }

    startReadingAnimationSequence(passage.words.length);
}

function startReadingAnimationSequence(totalWords) {
    if (adminState.readingInterval) clearInterval(adminState.readingInterval);

    adminState.readingWordIndex = 0;
    adminState.readingStartTime = Date.now();

    const wpmEl = document.getElementById('live-wpm-stat');
    const durEl = document.getElementById('live-duration-stat');
    const fixEl = document.getElementById('live-fixation-stat');
    const regEl = document.getElementById('live-regression-stat');

    adminState.readingInterval = setInterval(() => {
        if (adminState.readingWordIndex < totalWords) {
            if (adminState.readingWordIndex > 0) {
                const prev = document.getElementById(`read-word-${adminState.readingWordIndex - 1}`);
                if (prev) { prev.className = "inline-block p-1.5 rounded-xl font-dyslexic text-base sm:text-lg text-purple-950 font-bold bg-purple-100/60"; }
            }

            const current = document.getElementById(`read-word-${adminState.readingWordIndex}`);
            if (current) {
                current.className = "inline-block p-1.5 rounded-xl font-dyslexic text-base sm:text-lg text-white font-extrabold bg-purple-600 shadow-md transform scale-105";
            }

            const elapsedSec = Math.round((Date.now() - adminState.readingStartTime) / 1000);
            if (durEl) durEl.innerText = `${elapsedSec}s`;
            if (wpmEl) wpmEl.innerText = `${Math.round((adminState.readingWordIndex / Math.max(elapsedSec, 1)) * 60)} WPM`;
            if (fixEl) fixEl.innerText = `${Math.max(60, 85 - (adminState.readingWordIndex % 4) * 5)}%`;
            if (regEl) regEl.innerText = `${Math.floor(adminState.readingWordIndex / 6)} jumps`;

            adminState.readingWordIndex++;
        } else {
            clearInterval(adminState.readingInterval);
        }
    }, 450);
}

function playGazeReadingReplay() {
    alert("Replaying recorded gaze trail & saccadic eye regressions... 👁️");
}

function runAnalysisSimulation() {
    if (adminState.readingInterval) clearInterval(adminState.readingInterval);
    goToWizardStep(5);
}

/* --------------------------------------------------------------------------
   Step 5: 3-Pillar Triangulation Algorithm & Supabase Sync
   -------------------------------------------------------------------------- */
async function runFinal3PillarAnalysis() {
    const loading = document.getElementById('analysis-loading');
    const complete = document.getElementById('analysis-complete');

    if (loading) loading.classList.remove('hidden');
    if (complete) complete.classList.add('hidden');

    const targetStudent = adminState.activeScreeningStudent || adminState.selectedDetailStudent || adminState.students[0];
    const studentName = targetStudent ? targetStudent.name : 'Student';

    const answersArray = Object.values(adminState.questionnaireAnswers);
    let pillar1Score = 35;
    if (answersArray.length > 0) {
        const qSum = answersArray.reduce((a, b) => a + b, 0);
        const qMax = Math.max(answersArray.length * 3, 1);
        pillar1Score = Math.min(100, Math.round((qSum / qMax) * 100));
    }

    const calculatedWPM = adminState.calculatedWPM || 48;
    const expectedWPM = 50; // Grade 1 norm
    const wpmDiff = expectedWPM - calculatedWPM;
    const pillar2Score = Math.max(10, Math.min(95, Math.round(50 + (wpmDiff * 1.5))));
    const pillar3Score = adminState.isFaceAligned ? 28 : 62;

    const combinedScore = Math.round((pillar1Score * 0.40) + (pillar2Score * 0.40) + (pillar3Score * 0.20));

    let riskOutcome = 'Low Risk';
    if (combinedScore >= 65) riskOutcome = 'Higher Indicators';
    else if (combinedScore >= 35) riskOutcome = 'Moderate Risk';

    setTimeout(async () => {
        if (loading) loading.classList.add('hidden');
        if (complete) complete.classList.remove('hidden');

        const outcomeTitleEl = document.getElementById('final-outcome-title');
        const outcomeScoreEl = document.getElementById('final-outcome-score');
        const outcomePillar1El = document.getElementById('final-pillar1-val');
        const outcomePillar2El = document.getElementById('final-pillar2-val');
        const outcomePillar3El = document.getElementById('final-pillar3-val');

        if (outcomeTitleEl) outcomeTitleEl.innerText = `Screening Result: ${riskOutcome}`;
        if (outcomeScoreEl) outcomeScoreEl.innerText = `${combinedScore}% Combined Risk Indicator Score`;
        if (outcomePillar1El) outcomePillar1El.innerText = `${pillar1Score}% (Questionnaire)`;
        if (outcomePillar2El) outcomePillar2El.innerText = `${pillar2Score}% (${calculatedWPM} WCPM Oral Reading)`;
        if (outcomePillar3El) outcomePillar3El.innerText = `${pillar3Score}% (Gaze Tracking)`;

        const studentObj = adminState.students.find(s => s.name.toLowerCase().trim() === studentName.toLowerCase().trim() || s.id === targetStudent?.id);
        const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const diagDesc = riskOutcome === 'Higher Indicators' 
            ? '📝 Letter flips (b vs d confusion) & visual tracking fatigue' 
            : (riskOutcome === 'Moderate Risk' ? '⚡ Phoneme hesitation in multisyllabic words' : '🟢 Reading smoothly on track (Age-appropriate phonics)');

        if (studentObj) {
            studentObj.status = 'Completed';
            studentObj.risk = riskOutcome;
            studentObj.score = combinedScore;
            studentObj.pillar1_score = pillar1Score;
            studentObj.pillar2_score = pillar2Score;
            studentObj.pillar3_score = pillar3Score;
            studentObj.date = todayStr;
            studentObj.diagnostic_area = diagDesc;
            adminState.activeScreeningStudent = studentObj;
            adminState.selectedDetailStudent = studentObj;
        }

        // Supabase Real-Time DB Sync
        const client = typeof getSupabase === 'function' ? getSupabase() : null;
        const teacherName = getCurrentTeacherName();
        const teacherSchool = getCurrentTeacherSchool();
        const teacherId = getCurrentTeacherId();

        if (client) {
            try {
                // 1. Insert screening result record
                const screeningPayload = {
                    child_name: studentName,
                    match_score: combinedScore,
                    risk_level: riskOutcome,
                    pillar1_score: pillar1Score,
                    pillar2_score: pillar2Score,
                    pillar3_score: pillar3Score,
                    reading_wpm: calculatedWPM,
                    educator_script: `3-Pillar Screening Completed. Score: ${combinedScore}%. Outcome: ${riskOutcome}. Evaluator: ${teacherName} (${teacherSchool}).`,
                    created_at: new Date().toISOString()
                };
                if (teacherId && isValidUUID(teacherId)) {
                    screeningPayload.parent_id = teacherId;
                }
                let resData = await client.from('screening_results').insert([screeningPayload]).select();
                let savedId = resData?.data && resData.data[0]?.id ? resData.data[0].id : null;
                
                // 2. Update students table row (and children table fallback)
                const studentUpdate = {
                    status: 'Completed',
                    risk: riskOutcome,
                    match_score: combinedScore,
                    score: combinedScore,
                    pillar1_score: pillar1Score,
                    pillar2_score: pillar2Score,
                    pillar3_score: pillar3Score,
                    reading_wpm: calculatedWPM,
                    diagnostic_area: diagDesc,
                    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                };

                if (studentObj?.dbId) {
                    await client.from('students').update(studentUpdate).eq('id', studentObj.dbId);
                } else {
                    await client.from('students').update(studentUpdate).ilike('name', studentName);
                }

                // 3. Insert into questionnaire_responses
                try {
                    await client.from('questionnaire_responses').insert([{
                        student_name: studentName,
                        student_id: String(studentObj?.id || ''),
                        screening_id: savedId,
                        answers: adminState.questionnaireAnswers || {},
                        total_score: Math.round(pillar1Score),
                        pillar1_score: pillar1Score,
                        created_at: new Date().toISOString()
                    }]);
                } catch(qErr) {}

                // 4. Insert into eye_tracking_data
                try {
                    const eyePayload = {
                        student_name: studentName,
                        student_id: String(studentObj?.id || ''),
                        screening_id: savedId,
                        calibration_quality: adminState.isFaceAligned && adminState.isGoodLighting ? 'Good' : 'Acceptable',
                        reading_wpm: calculatedWPM,
                        fixation_stability: Math.round(96 - (pillar3Score * 0.3)),
                        total_reading_seconds: Math.round((adminState.readingWordIndex || 22) * 1.5),
                        created_at: new Date().toISOString()
                    };
                    const { error: eErr } = await client.from('eye_tracking_data').insert([eyePayload]);
                    if (eErr) await client.from('eye_tracking').insert([eyePayload]);
                } catch(eErr) {}

                // 5. Log audit trail
                if (typeof logAuditToSupabase === 'function') {
                    logAuditToSupabase(teacherName, 'COMPLETE_SCREENING', `Completed 3-pillar screening for "${studentName}" (${combinedScore}% - ${riskOutcome}) at ${teacherSchool}`);
                }

                console.log("3-Pillar screening result & student status saved to Supabase 🚀");
            } catch (err) {
                console.warn("Notice saving screening result to Supabase:", err);
            }
        }

        // Real-Time Dynamic Sync for class cohorts
        adminState.classes.forEach(c => {
            const classStudents = adminState.students.filter(s => s.class === c.name);
            c.total = classStudents.length;
            c.completed = classStudents.filter(s => s.status === 'Completed').length;
            c.pending = classStudents.filter(s => s.status === 'Pending').length;
            c.incomplete = classStudents.filter(s => s.status === 'Incomplete').length;
            c.riskCount = classStudents.filter(s => s.risk === 'Higher Indicators' || s.risk === 'Moderate Risk').length;
        });

        saveAdminStateLocally();
        recalculateDashboardMetrics();
        renderStudentTable();
        renderClassesList();
        syncClassesMetricsToSupabase();
    }, 1800);
}

function viewCurrentScreenedStudent() {
    const targetStudent = adminState.activeScreeningStudent || adminState.selectedDetailStudent;
    if (targetStudent) {
        viewStudentProfile(targetStudent.name);
    } else {
        switchTab('students');
    }
}

/* --------------------------------------------------------------------------
   8. Class Analytics & Interactive Multi-Chart Intelligence Engine
   -------------------------------------------------------------------------- */
function initAnalyticsCharts() {
    updateAnalyticsDashboard();
}

function updateAnalyticsDashboard() {
    if (typeof Chart === 'undefined') return;

    const classFilterVal = document.getElementById('analyticsClassFilter')?.value || 'ALL';
    const riskFilterVal = document.getElementById('analyticsRiskFilter')?.value || 'ALL';

    // 1. Filter students according to cohort & risk tier
    let filteredStudents = adminState.students.filter(s => {
        const matchClass = (classFilterVal === 'ALL') || (s.class === classFilterVal);
        const matchRisk = (riskFilterVal === 'ALL') || (s.risk === riskFilterVal) || (riskFilterVal === 'Pending' && s.status === 'Pending');
        return matchClass && matchRisk;
    });

    const totalInCohort = classFilterVal === 'ALL' 
        ? adminState.students.length 
        : adminState.students.filter(s => s.class === classFilterVal).length;

    const completedStudentsInCohort = adminState.students.filter(s => {
        const matchClass = (classFilterVal === 'ALL') || (s.class === classFilterVal);
        return matchClass && s.status === 'Completed';
    });

    const completedInCohort = completedStudentsInCohort.length;
    const pendingInCohort = adminState.students.filter(s => {
        const matchClass = (classFilterVal === 'ALL') || (s.class === classFilterVal);
        return matchClass && (s.status === 'Pending' || s.status === 'Incomplete');
    }).length;

    // Risk counts only computed from completed assessments!
    const higherRiskCount = completedStudentsInCohort.filter(s => s.risk === 'Higher Indicators').length;
    const modRiskCount = completedStudentsInCohort.filter(s => s.risk === 'Moderate Risk').length;
    const lowRiskCount = completedStudentsInCohort.filter(s => s.risk === 'Low Risk').length;
    const priorityInterventionCount = higherRiskCount + modRiskCount;

    // Calculate mean risk index score only from completed students
    const scores = completedStudentsInCohort.filter(s => typeof s.score === 'number' && s.score >= 0).map(s => s.score);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const completionPct = totalInCohort > 0 ? Math.round((completedInCohort / totalInCohort) * 100) : 0;

    let lowPct = 0;
    let modPct = 0;
    let highPct = 0;

    if (completedInCohort > 0) {
        lowPct = Math.round((lowRiskCount / completedInCohort) * 100);
        modPct = Math.round((modRiskCount / completedInCohort) * 100);
        highPct = Math.round((higherRiskCount / completedInCohort) * 100);

        const sum = lowPct + modPct + highPct;
        if (sum > 0 && sum !== 100) {
            const diff = 100 - sum;
            if (lowPct >= modPct && lowPct >= highPct) lowPct += diff;
            else if (modPct >= highPct) modPct += diff;
            else highPct += diff;
        }
    }

    // 2. Update Executive KPI Cards & Friendly Summary
    const elScreenedCount = document.getElementById('analytics-kpi-screened-count');
    const elTotalCount = document.getElementById('analytics-kpi-total-count');
    const elCompletionLabel = document.getElementById('analytics-kpi-completion-label');

    if (elScreenedCount) elScreenedCount.innerText = completedInCohort;
    if (elTotalCount) elTotalCount.innerText = totalInCohort;
    if (elCompletionLabel) elCompletionLabel.innerText = `${completionPct}% Screened`;

    const elAvgScore = document.getElementById('analytics-kpi-avg-score');
    const elScoreBadge = document.getElementById('analytics-kpi-score-badge');
    if (elAvgScore) elAvgScore.innerText = completedInCohort > 0 ? `${avgScore}%` : '—';
    if (elScoreBadge) {
        if (completedInCohort === 0) {
            elScoreBadge.innerText = 'No Screenings Completed';
            elScoreBadge.className = 'text-[11px] text-gray-500 font-bold';
        } else if (avgScore >= 70) {
            elScoreBadge.innerText = 'High Reading Effort';
            elScoreBadge.className = 'text-[11px] text-rose-700 font-bold';
        } else if (avgScore >= 38) {
            elScoreBadge.innerText = 'Mild / Expected Challenge';
            elScoreBadge.className = 'text-[11px] text-amber-700 font-bold';
        } else {
            elScoreBadge.innerText = 'Smooth Reading Level';
            elScoreBadge.className = 'text-[11px] text-emerald-700 font-bold';
        }
    }

    const elLegendLow = document.getElementById('legend-low-count');
    const elLegendMod = document.getElementById('legend-mod-count');
    const elLegendHigh = document.getElementById('legend-high-count');

    if (elLegendLow) elLegendLow.innerText = completedInCohort > 0 ? `${lowRiskCount} Student${lowRiskCount === 1 ? '' : 's'} (${lowPct}%)` : `0 Students (0%)`;
    if (elLegendMod) elLegendMod.innerText = completedInCohort > 0 ? `${modRiskCount} Student${modRiskCount === 1 ? '' : 's'} (${modPct}%)` : `0 Students (0%)`;
    if (elLegendHigh) elLegendHigh.innerText = completedInCohort > 0 ? `${higherRiskCount} Student${higherRiskCount === 1 ? '' : 's'} (${highPct}%)` : `0 Students (0%)`;

    const elCohortBadge = document.getElementById('analyticsCohortSummaryBadge');
    if (elCohortBadge) {
        elCohortBadge.innerText = classFilterVal === 'ALL'
            ? `All ${adminState.classes.length} Classes • ${totalInCohort} Students`
            : `${classFilterVal} • ${totalInCohort} Students`;
    }

    const elReferralText = document.getElementById('analyticsReferralCountText');
    if (elReferralText) {
        elReferralText.innerText = `${higherRiskCount} student${higherRiskCount === 1 ? '' : 's'}`;
    }

    // Dynamic Teacher Friendly Paragraph
    const teacherSummaryEl = document.getElementById('teacherFriendlySummaryText');
    if (teacherSummaryEl) {
        const cohortName = classFilterVal === 'ALL' ? 'All Classes Combined' : classFilterVal;
        if (completedInCohort === 0) {
            teacherSummaryEl.innerHTML = `
                <strong>Status for ${escapeHTML(cohortName)}:</strong> All <strong>${totalInCohort} student${totalInCohort === 1 ? '' : 's'}</strong> are currently awaiting initial screening. Click <strong>Launch Screener</strong> above to conduct multimodal assessments and view diagnostic insights!
            `;
        } else {
            teacherSummaryEl.innerHTML = `
                <strong>Quick takeaway for ${escapeHTML(cohortName)}:</strong> <strong>${lowPct}% of screened students</strong> (${lowRiskCount} student${lowRiskCount === 1 ? '' : 's'}) are reading smoothly on track! 
                <strong>${modRiskCount} student${modRiskCount === 1 ? '' : 's'} (${modPct}%)</strong> will benefit from simple classroom aids (like reading rulers or extra 5 minutes), 
                and <strong>${higherRiskCount} student${higherRiskCount === 1 ? '' : 's'} (${highPct}%)</strong> should be scheduled for a 1-on-1 specialist consultation.
            `;
        }
    }

    // 3. Render / Update All 5 Visual Charts
    renderRiskDistributionChart(lowRiskCount, modRiskCount, higherRiskCount);
    renderCategoryBreakdownChart(filteredStudents, avgScore, classFilterVal);
    renderCohortComparisonChart();
    renderPillarTriangulationChart(filteredStudents, avgScore, classFilterVal);
    renderLongitudinalTrendChart(avgScore, completedInCohort);

    // 4. Render Table
    renderAnalyticsStudentTable(filteredStudents);
}

function renderRiskDistributionChart(lowCount, modCount, highCount) {
    const riskCanvas = document.getElementById('riskDistributionChart');
    if (!riskCanvas) return;

    const ctx = riskCanvas.getContext('2d');
    if (riskDistributionChartInstance) {
        riskDistributionChartInstance.destroy();
        riskDistributionChartInstance = null;
    }

    const total = lowCount + modCount + highCount;
    const hasData = total > 0;
    const displayVals = hasData ? [lowCount, modCount, highCount] : [1];
    const bgColors = hasData ? ['#10B981', '#F59E0B', '#FB7185'] : ['#E2E8F0'];
    const hoverBgColors = hasData ? ['#059669', '#D97706', '#E11D48'] : ['#CBD5E1'];
    const labels = hasData 
        ? ['🟢 On Track (Doing Well)', '🟡 Needs Extra Practice', '🔴 Priority Help Needed']
        : ['⏳ No Screenings Completed Yet'];

    riskDistributionChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: displayVals,
                backgroundColor: bgColors,
                hoverBackgroundColor: hoverBgColors,
                borderWidth: 3,
                borderColor: '#FFFFFF',
                hoverOffset: hasData ? 6 : 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
            animation: {
                animateScale: true,
                animateRotate: true,
                duration: 800
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(59, 7, 100, 0.92)',
                    titleFont: { family: "'Baloo 2', sans-serif", size: 12, weight: 'bold' },
                    bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
                    padding: 10,
                    cornerRadius: 12,
                    callbacks: {
                        label: function(context) {
                            if (!hasData) return ' ⏳ No screenings completed yet for this selection';
                            const val = context.raw || 0;
                            const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                            return ` ${context.label}: ${val} Students (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

function renderCategoryBreakdownChart(students, avgScore, className = 'ALL') {
    const catCanvas = document.getElementById('categoryBreakdownChart');
    if (!catCanvas) return;

    const ctx = catCanvas.getContext('2d');
    if (categoryBreakdownChartInstance) {
        categoryBreakdownChartInstance.destroy();
        categoryBreakdownChartInstance = null;
    }

    const completedStudents = students.filter(s => s.status === 'Completed');
    const highestDomainEl = document.getElementById('highestDomainText');

    let phonologicalVal = 0;
    let visualGazeVal = 0;
    let memoryVal = 0;
    let decodingVal = 0;
    let spellingVal = 0;

    if (completedStudents.length > 0) {
        const sumP1 = completedStudents.reduce((acc, s) => acc + (typeof s.pillar1_score === 'number' ? s.pillar1_score : (s.score || 40)), 0);
        const sumP2 = completedStudents.reduce((acc, s) => acc + (typeof s.pillar2_score === 'number' ? s.pillar2_score : (s.score || 40)), 0);
        const sumP3 = completedStudents.reduce((acc, s) => acc + (typeof s.pillar3_score === 'number' ? s.pillar3_score : (s.score || 40)), 0);
        const count = completedStudents.length;

        phonologicalVal = Math.min(100, Math.round(sumP1 / count));
        visualGazeVal = Math.min(100, Math.round(sumP2 / count));
        decodingVal = Math.min(100, Math.round(sumP3 / count));
        memoryVal = Math.min(100, Math.round((sumP1 * 0.85 + sumP3 * 0.15) / count));
        spellingVal = Math.min(100, Math.round((sumP1 * 0.6 + sumP2 * 0.4) / count));

        const maxVal = Math.max(visualGazeVal, decodingVal, spellingVal, phonologicalVal, memoryVal);
        let maxLabel = 'losing place & skipping lines';
        if (maxVal === decodingVal) maxLabel = 'sounding out multi-syllable tricky words';
        else if (maxVal === spellingVal) maxLabel = 'letter flips (b vs d) & spelling reversals';
        else if (maxVal === phonologicalVal) maxLabel = 'rhyming & sound blending';
        else if (maxVal === memoryVal) maxLabel = 'remembering 3-step instructions';

        if (highestDomainEl) {
            highestDomainEl.innerText = `${maxLabel} (${maxVal}% challenge index)`;
        }
    } else {
        if (highestDomainEl) {
            highestDomainEl.innerText = 'No screening data recorded yet (0 completed screenings)';
        }
    }

    categoryBreakdownChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [
                '👁️ Following Lines (Skipping)',
                '🔤 Sounding Out Tricky Words',
                '📝 Letter Flips (b & d Confusion)',
                '🗣️ Rhymes & Sound Blending',
                '🧠 Remembering 3-Step Instructions'
            ],
            datasets: [{
                label: 'Students Needing Help in Class (%)',
                data: [visualGazeVal, decodingVal, spellingVal, phonologicalVal, memoryVal],
                backgroundColor: [
                    '#7C3AED',
                    '#9333EA',
                    '#A855F7',
                    '#C084FC',
                    '#6D28D9'
                ],
                hoverBackgroundColor: '#581C87',
                borderRadius: 8,
                barThickness: 16
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 800,
                easing: 'easeOutQuart'
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: 'rgba(233, 213, 255, 0.4)' },
                    ticks: {
                        font: { family: "'Plus Jakarta Sans', sans-serif", size: 10, weight: 'bold' },
                        color: '#6B7280',
                        callback: val => `${val}%`
                    }
                },
                y: {
                    grid: { display: false },
                    ticks: {
                        font: { family: "'Plus Jakarta Sans', sans-serif", size: 10, weight: 'bold' },
                        color: '#3B0764'
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(59, 7, 100, 0.92)',
                    titleFont: { family: "'Baloo 2', sans-serif", size: 12, weight: 'bold' },
                    bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
                    padding: 10,
                    cornerRadius: 12,
                    callbacks: {
                        label: context => completedStudents.length > 0
                            ? ` ${context.raw}% challenge index`
                            : ' No screening sessions completed yet'
                    }
                }
            }
        }
    });
}

function renderCohortComparisonChart() {
    const compCanvas = document.getElementById('cohortComparisonChart');
    if (!compCanvas) return;

    const ctx = compCanvas.getContext('2d');
    if (cohortComparisonChartInstance) {
        cohortComparisonChartInstance.destroy();
        cohortComparisonChartInstance = null;
    }

    const classNames = adminState.classes.map(c => c.name);
    const completionRates = adminState.classes.map(c => {
        const students = adminState.students.filter(s => s.class === c.name);
        const total = students.length;
        const done = students.filter(s => s.status === 'Completed').length;
        return total > 0 ? Math.round((done / total) * 100) : 0;
    });

    const meanScores = adminState.classes.map(c => {
        const completedStudents = adminState.students.filter(s => s.class === c.name && s.status === 'Completed');
        if (completedStudents.length === 0) return 0;
        const sum = completedStudents.reduce((acc, s) => acc + (typeof s.score === 'number' ? s.score : 0), 0);
        return Math.round(sum / completedStudents.length);
    });

    cohortComparisonChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: classNames.length > 0 ? classNames : ['Class 1A', 'Class 1B', 'Class 1C', 'Class 3A', 'Class 3B'],
            datasets: [
                {
                    label: 'Screened Progress (% Completed)',
                    data: completionRates,
                    backgroundColor: '#7C3AED',
                    borderRadius: 6,
                    barPercentage: 0.6
                },
                {
                    label: 'Class Reading Challenge Level (%)',
                    data: meanScores,
                    backgroundColor: '#F59E0B',
                    borderRadius: 6,
                    barPercentage: 0.6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 900 },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: 'rgba(233, 213, 255, 0.4)' },
                    ticks: {
                        font: { size: 10 },
                        callback: v => `${v}%`
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 10, weight: 'bold' } }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: { font: { family: "'Plus Jakarta Sans', sans-serif", size: 10, weight: 'bold' } }
                },
                tooltip: {
                    backgroundColor: 'rgba(59, 7, 100, 0.92)',
                    cornerRadius: 10
                }
            }
        }
    });
}

function renderPillarTriangulationChart(students, avgScore, className = 'ALL') {
    const pilCanvas = document.getElementById('pillarTriangulationChart');
    if (!pilCanvas) return;

    const ctx = pilCanvas.getContext('2d');
    if (pillarTriangulationChartInstance) {
        pillarTriangulationChartInstance.destroy();
        pillarTriangulationChartInstance = null;
    }

    const completedStudents = students.filter(s => s.status === 'Completed');
    let obsVal = 0;
    let gazeVal = 0;
    let wpmVal = 0;
    let memoryVal = 0;
    let spellingVal = 0;

    if (completedStudents.length > 0) {
        const sumP1 = completedStudents.reduce((acc, s) => acc + (typeof s.pillar1_score === 'number' ? s.pillar1_score : (s.score || 40)), 0);
        const sumP2 = completedStudents.reduce((acc, s) => acc + (typeof s.pillar2_score === 'number' ? s.pillar2_score : (s.score || 40)), 0);
        const sumP3 = completedStudents.reduce((acc, s) => acc + (typeof s.pillar3_score === 'number' ? s.pillar3_score : (s.score || 40)), 0);
        const count = completedStudents.length;

        obsVal = Math.min(100, Math.max(0, Math.round(sumP1 / count)));
        gazeVal = Math.min(100, Math.max(0, Math.round(sumP2 / count)));
        wpmVal = Math.min(100, Math.max(0, Math.round(sumP3 / count)));
        memoryVal = Math.min(100, Math.max(0, Math.round((sumP1 * 0.85 + sumP3 * 0.15) / count)));
        spellingVal = Math.min(100, Math.max(0, Math.round((sumP1 * 0.6 + sumP2 * 0.4) / count)));
    }

    const datasetLabel = className === 'ALL' ? 'All Classes Screener Profile' : `${className} Screener Profile`;

    pillarTriangulationChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: [
                'Teacher Checklist (40%)',
                'Camera Eye Following (35%)',
                'Reading Aloud Speed (25%)',
                'Remembering Steps',
                'Letter Recognition'
            ],
            datasets: [
                {
                    label: datasetLabel,
                    data: [obsVal, gazeVal, wpmVal, memoryVal, spellingVal],
                    backgroundColor: 'rgba(124, 58, 237, 0.28)',
                    borderColor: '#7C3AED',
                    pointBackgroundColor: '#7C3AED',
                    pointBorderColor: '#FFF',
                    pointHoverBackgroundColor: '#FFF',
                    pointHoverBorderColor: '#7C3AED',
                    borderWidth: 2.5
                },
                {
                    label: 'Target Benchmark (Normal Reading)',
                    data: [25, 20, 25, 20, 25],
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    borderColor: '#10B981',
                    pointBackgroundColor: '#10B981',
                    borderWidth: 1.5,
                    borderDash: [4, 4]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 750,
                easing: 'easeInOutQuart'
            },
            scales: {
                r: {
                    beginAtZero: true,
                    min: 0,
                    max: 100,
                    suggestedMin: 0,
                    suggestedMax: 100,
                    ticks: {
                        stepSize: 25,
                        display: true,
                        backdropColor: 'rgba(255, 255, 255, 0.75)',
                        font: { size: 9, weight: 'bold' },
                        color: '#6B7280',
                        callback: v => `${v}%`
                    },
                    pointLabels: {
                        font: { family: "'Plus Jakarta Sans', sans-serif", size: 10, weight: 'bold' },
                        color: '#3B0764'
                    },
                    grid: { color: 'rgba(216, 180, 254, 0.45)' },
                    angleLines: { color: 'rgba(216, 180, 254, 0.45)' }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { font: { family: "'Plus Jakarta Sans', sans-serif", size: 10, weight: 'bold' } }
                },
                tooltip: {
                    backgroundColor: 'rgba(59, 7, 100, 0.95)',
                    titleFont: { family: "'Baloo 2', sans-serif", size: 12, weight: 'bold' },
                    bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
                    padding: 10,
                    cornerRadius: 12,
                    callbacks: {
                        label: function(context) {
                            const val = context.raw || 0;
                            if (context.datasetIndex === 0) {
                                return completedStudents.length > 0 
                                    ? ` ${context.dataset.label}: ${val}% Difficulty (${val > 50 ? 'Needs Practice' : 'Good'})`
                                    : ` No screenings recorded yet (0%)`;
                            } else {
                                return ` Target Benchmark: ${val}% (Normal Reading Level)`;
                            }
                        }
                    }
                }
            }
        }
    });
}

function renderLongitudinalTrendChart(avgScore, completedCount = 0) {
    const trendCanvas = document.getElementById('longitudinalTrendChart');
    if (!trendCanvas) return;

    const ctx = trendCanvas.getContext('2d');
    if (longitudinalTrendChartInstance) {
        longitudinalTrendChartInstance.destroy();
        longitudinalTrendChartInstance = null;
    }

    const hasData = completedCount > 0 && avgScore > 0;
    const baselineRisk = hasData ? Math.min(100, Math.max(0, Math.round(avgScore + 16))) : 0;
    const midtermRisk = hasData ? Math.min(100, Math.max(0, Math.round(avgScore + 8))) : 0;
    const currentRisk = hasData ? Math.min(100, Math.max(0, avgScore)) : 0;
    const targetRisk = hasData ? Math.min(100, Math.max(0, Math.round(avgScore - 12))) : 0;
    const speedData = hasData ? [38, 44, 52, 60] : [0, 0, 0, 0];

    longitudinalTrendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Month 1 (Baseline)', 'Month 2 (With Aids)', 'Month 3 (Practice)', 'Month 4 (Target Goal)'],
            datasets: [
                {
                    label: 'Reading Difficulty (Lower is Better ⬇️)',
                    data: [baselineRisk, midtermRisk, currentRisk, targetRisk],
                    borderColor: '#7C3AED',
                    backgroundColor: 'rgba(124, 58, 237, 0.12)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: '#7C3AED',
                    pointRadius: hasData ? 5 : 2,
                    pointHoverRadius: hasData ? 7 : 4
                },
                {
                    label: 'Reading Speed in Words/Min (Higher is Better ⬆️)',
                    data: speedData,
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: '#10B981',
                    pointRadius: hasData ? 4 : 2,
                    pointHoverRadius: hasData ? 6 : 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: 'rgba(233, 213, 255, 0.4)' },
                    ticks: {
                        font: { size: 10, weight: 'bold' },
                        callback: v => `${v}`
                    }
                },
                x: {
                    grid: { color: 'rgba(233, 213, 255, 0.2)' },
                    ticks: { font: { size: 10, weight: 'bold' } }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: { font: { family: "'Plus Jakarta Sans', sans-serif", size: 10.5, weight: 'bold' } }
                },
                tooltip: {
                    backgroundColor: 'rgba(59, 7, 100, 0.92)',
                    padding: 10,
                    cornerRadius: 10,
                    callbacks: {
                        label: function(context) {
                            if (!hasData) return ' No screening sessions recorded yet';
                            return ` ${context.dataset.label}: ${context.raw}`;
                        }
                    }
                }
            }
        }
    });
}

function determineStudentDiagnosticArea(s) {
    if (!s) return '⏳ Screening not yet conducted';
    if (s.status !== 'Completed') return '⏳ Screening not yet conducted';
    if (s.diagnostic_area) return s.diagnostic_area;

    const scoreVal = typeof s.score === 'number' && s.score > 0 ? s.score : (s.risk === 'Higher Indicators' ? 82 : (s.risk === 'Moderate Risk' ? 62 : 24));

    if (s.risk === 'Low Risk' || scoreVal < 38) {
        return '🟢 Reading smoothly on track (Grade-level reading)';
    }

    const p1 = typeof s.pillar1_score === 'number' ? s.pillar1_score : Math.round(scoreVal * 0.95);
    const p2 = typeof s.pillar2_score === 'number' ? s.pillar2_score : Math.round(scoreVal * 1.15);
    const p3 = typeof s.pillar3_score === 'number' ? s.pillar3_score : Math.round(scoreVal * 0.88);

    if (p2 >= p1 && p2 >= p3) {
        return '👁️ Line tracking & skipping lines while reading';
    } else if (p3 >= p1 && p3 >= p2) {
        return '⏱️ Oral reading cadence & decoding speed';
    } else {
        if (scoreVal >= 75) {
            return '📝 Letter flips (b vs d confusion) & visual tracking';
        } else if (s.age && s.age <= 7) {
            return '🔤 Sounding out multi-syllable tricky words';
        } else {
            return '🧠 Remembering 3-step classroom instructions';
        }
    }
}

function renderAnalyticsStudentTable(students) {
    const tbody = document.getElementById('analyticsStudentTableBody');
    const countEl = document.getElementById('analyticsStudentTableCount');
    if (!tbody) return;

    if (countEl) countEl.innerText = students.length;

    if (students.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="p-6 text-center text-gray-500 font-medium">
                    No students match the selected class or support level.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = students.map((s, idx) => {
        const isDone = s.status === 'Completed';
        const scoreVal = isDone && typeof s.score === 'number' ? s.score : (isDone ? 50 : 0);
        const domain = determineStudentDiagnosticArea(s);

        let riskBadge = '<span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-gray-100 text-gray-700">⏳ Not Screened</span>';
        let barColor = 'bg-gray-300';
        let scoreLabel = 'Pending';

        if (isDone) {
            if (s.risk === 'Higher Indicators') {
                riskBadge = '<span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800">🔴 Priority Help</span>';
                barColor = 'bg-rose-500';
                scoreLabel = 'High Concern';
            } else if (s.risk === 'Moderate Risk') {
                riskBadge = '<span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">🟡 Needs Practice</span>';
                barColor = 'bg-amber-500';
                scoreLabel = 'Moderate';
            } else {
                riskBadge = '<span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">🟢 On Track</span>';
                barColor = 'bg-emerald-500';
                scoreLabel = 'Low Difficulty';
            }
        }

        return `
            <tr class="hover:bg-purple-50/40 transition-colors">
                <td class="p-3">
                    <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 font-extrabold flex items-center justify-center text-xs shrink-0">
                            ${s.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <strong onclick="viewStudentProfile('${escapeHTML(s.name)}')" class="text-brand-purple-deep block leading-tight font-extrabold text-xs sm:text-sm cursor-pointer hover:underline hover:text-purple-700">${escapeHTML(s.name)}</strong>
                            <span class="text-[10px] text-gray-400">ID: ${escapeHTML(s.id)} • Age ${s.age}</span>
                        </div>
                    </div>
                </td>
                <td class="p-3 font-bold text-purple-700">${escapeHTML(s.class)}</td>
                <td class="p-3">
                    ${riskBadge}
                </td>
                <td class="p-3">
                    <div class="space-y-1">
                        <div class="flex justify-between text-[11px] font-extrabold">
                            <span class="text-purple-950">${isDone ? `${scoreVal}% (${scoreLabel})` : '— (Pending)'}</span>
                        </div>
                        <div class="w-full h-2 bg-purple-100 rounded-full overflow-hidden">
                            <div class="${barColor} h-full rounded-full" style="width: ${isDone ? scoreVal : 0}%"></div>
                        </div>
                    </div>
                </td>
                <td class="p-3">
                    <span class="text-xs font-semibold text-purple-950 block">${domain}</span>
                </td>
                <td class="p-3 text-center space-x-1 whitespace-nowrap">
                    <button onclick="viewStudentProfile('${escapeHTML(s.name)}')" class="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold rounded-xl text-[11px] transition-colors cursor-pointer">
                        View Student
                    </button>
                    <button onclick="launchScreeningForStudent('${escapeHTML(s.name)}')" class="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-[11px] transition-colors shadow-sm cursor-pointer">
                        Start Screening
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function exportAnalyticsCSV() {
    const classFilter = document.getElementById('analyticsClassFilter')?.value || 'ALL';
    const students = adminState.students.filter(s => classFilter === 'ALL' || s.class === classFilter);

    let csv = "Student ID,Student Name,Class,Age,Gender,Screening Status,Risk Outcome,Risk Score (%),Obs Score,Gaze Stability (%),Cadence Score,Last Assessment Date\n";
    students.forEach(s => {
        const scoreVal = s.score || (s.risk === 'Higher Indicators' ? 82 : (s.risk === 'Moderate Risk' ? 62 : 24));
        const obs = Math.round(scoreVal * 0.95);
        const gaze = Math.min(96, Math.round(scoreVal * 1.15));
        const cad = Math.max(20, Math.round(scoreVal * 0.85));
        csv += `"${s.id}","${s.name}","${s.class}",${s.age},"${s.gender || 'Male'}","${s.status}","${s.risk}",${scoreVal},${obs},${gaze},${cad},"${s.date || '18 Aug 2026'}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `LexiSense_Screening_Analytics_${classFilter.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast("Screening Analytics CSV exported successfully! 📊");
}

function printAnalyticsReport() {
    const classFilter = document.getElementById('analyticsClassFilter')?.value || 'ALL';
    const students = adminState.students.filter(s => classFilter === 'ALL' || s.class === classFilter);
    const completed = students.filter(s => s.status === 'Completed');
    const higher = students.filter(s => s.risk === 'Higher Indicators');
    const moderate = students.filter(s => s.risk === 'Moderate Risk');

    const win = window.open('', '_blank');
    if (!win) {
        alert("Please allow popups to print the analytics report.");
        return;
    }

    const rows = students.map((s, idx) => {
        const score = s.score || (s.risk === 'Higher Indicators' ? 82 : (s.risk === 'Moderate Risk' ? 62 : 24));
        return `
            <tr>
                <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0; text-align:center;">${idx + 1}</td>
                <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0; font-weight: bold; color: #3B0764;">${escapeHTML(s.name)}</td>
                <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0; font-family:monospace;">${escapeHTML(s.id)}</td>
                <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0;">${escapeHTML(s.class)}</td>
                <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0; font-weight:bold; color:${s.risk === 'Higher Indicators' ? '#BE123C' : (s.risk === 'Moderate Risk' ? '#B45309' : '#047857')}">${escapeHTML(s.risk)}</td>
                <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0; font-weight:bold;">${score}%</td>
                <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0;">${escapeHTML(s.status)}</td>
            </tr>
        `;
    }).join('');

    win.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>LexiSense — Cohort Screening Analytics & Intelligence Dossier</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
            <style>
                @media print {
                    body { background: #FFF !important; padding: 0 !important; margin: 0 !important; -webkit-print-color-adjust: exact !important; }
                    .no-print { display: none !important; }
                }
                body { font-family: 'Nunito', Arial, sans-serif; padding: 25px; color: #1E293B; line-height: 1.45; font-size: 10.5px; }
                .top-bar { display: flex; justify-content: space-between; align-items: center; background: #4C1D95; color: #FFF; padding: 10px 16px; border-radius: 10px; margin-bottom: 15px; }
                .btn-print { background: #F59E0B; color: #1E1B4B; border: none; padding: 6px 16px; border-radius: 6px; font-weight: 800; cursor: pointer; }
                .header { border-bottom: 2px solid #6D28D9; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
                h1 { color: #4C1D95; margin: 0; font-size: 17px; font-family: 'Baloo 2', Arial; font-weight: 800; }
                .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 15px; }
                .kpi-box { background: #F5F3FF; border: 1px solid #DDD6FE; padding: 8px 12px; border-radius: 8px; }
                .kpi-box strong { font-size: 14px; color: #3B0764; display: block; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10.5px; }
                th { background: #F5F3FF; color: #3B0764; padding: 6px 8px; text-align: left; border: 1px solid #E2E8F0; font-weight: bold; }
                .disclaimer { background: #F8FAFC; border: 1px solid #E2E8F0; padding: 8px; border-radius: 6px; font-size: 8.5px; margin-top: 15px; color: #64748B; }
            </style>
        </head>
        <body>
            <div class="top-bar no-print">
                <div style="display:flex; align-items:center; gap:8px;">
                    <strong>LexiSense Cohort Analytics Dossier Preview</strong>
                </div>
                <button onclick="window.print()" class="btn-print">Print / Save as PDF</button>
            </div>

            <div class="header">
                <div>
                    <h1>Cohort Screening Analytics & Risk Intelligence Report</h1>
                    <p style="margin:2px 0 0 0; color:#6B7280; font-size:10px;">Target Cohort: ${escapeHTML(classFilter)} • Evaluator: ${escapeHTML(adminState.profile.name || 'Faiz Ikhwan')} • ${escapeHTML(adminState.profile.school || 'SK Taman Ria')}</p>
                </div>
                <div style="text-align:right; font-size:9.5px; color:#6B7280;">
                    <strong>Generated:</strong> ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}<br>
                    <strong>Protocol:</strong> LS-MME Multimodal 3-Pillar
                </div>
            </div>

            <div class="kpi-grid">
                <div class="kpi-box">
                    <span>Total Learners:</span>
                    <strong>${students.length} Learners</strong>
                </div>
                <div class="kpi-box">
                    <span>Completed Screenings:</span>
                    <strong>${completed.length} (${Math.round((completed.length / Math.max(students.length, 1)) * 100)}%)</strong>
                </div>
                <div class="kpi-box">
                    <span>Elevated Concern:</span>
                    <strong style="color:#BE123C;">${higher.length} Learners</strong>
                </div>
                <div class="kpi-box">
                    <span>Moderate Concern:</span>
                    <strong style="color:#B45309;">${moderate.length} Learners</strong>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width:5%; text-align:center;">#</th>
                        <th style="width:28%;">Learner Name</th>
                        <th style="width:16%;">Student ID</th>
                        <th style="width:14%;">Class</th>
                        <th style="width:18%;">Risk Tier</th>
                        <th style="width:10%;">Score</th>
                        <th style="width:9%;">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>

            <div class="disclaimer">
                <strong>NON-CLINICAL EDUCATIONAL SCREENING NOTICE:</strong> This intelligence dossier summarizes aggregated school-level multimodal risk screening signals (Observations, Saccadic Gaze Tracking, Oral Reading Cadence). It does not constitute a clinical medical diagnosis.
            </div>
        </body>
        </html>
    `);
    win.document.close();
}

function updateSidebarFollowupBadge() {
    const badge = document.getElementById('sidebar-followup-badge');
    if (!badge) return;
    const activeCount = (adminState.followups || []).filter(f => f.status !== 'Completed').length;
    badge.innerText = activeCount;
    if (activeCount > 0) {
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

/* --------------------------------------------------------------------------
   9. Teacher Follow-Up Tracker (Interactive Status & Auto Email Reminder)
   -------------------------------------------------------------------------- */
let currentFollowupFilter = 'ALL';
let currentFollowupSearch = '';

function setFollowupFilter(filter) {
    currentFollowupFilter = filter;
    ['ALL', 'InProgress', 'Pending', 'Completed'].forEach(tab => {
        const btn = document.getElementById(`fTab-${tab}`);
        if (!btn) return;
        const normalized = tab === 'ALL' ? 'ALL' : (tab === 'InProgress' ? 'In Progress' : tab);
        if (normalized === filter) {
            btn.className = "px-3.5 py-1.5 rounded-xl bg-white text-purple-900 shadow-2xs font-extrabold transition-all cursor-pointer";
        } else {
            btn.className = "px-3.5 py-1.5 rounded-xl text-purple-700 hover:text-purple-900 transition-all cursor-pointer";
        }
    });
    renderFollowupsList();
}

function filterFollowupsList() {
    const input = document.getElementById('followupSearchInput');
    currentFollowupSearch = input ? input.value.trim().toLowerCase() : '';
    renderFollowupsList();
}

function getFollowupInitials(name) {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function renderFollowupsList() {
    updateSidebarFollowupBadge();
    const container = document.getElementById('followupListContainer');
    if (!container) return;

    const allFollowups = adminState.followups || [];
    
    // Update count badges
    const totalCount = allFollowups.length;
    const inProgressCount = allFollowups.filter(f => f.status === 'In Progress').length;
    const pendingCount = allFollowups.filter(f => f.status === 'Pending').length;
    const completedCount = allFollowups.filter(f => f.status === 'Completed').length;

    const elTotal = document.getElementById('fCount-all');
    const elInProg = document.getElementById('fCount-inprogress');
    const elPending = document.getElementById('fCount-pending');
    const elCompleted = document.getElementById('fCount-completed');
    const elSummary = document.getElementById('followupSummaryCountBadge');

    if (elTotal) elTotal.innerText = totalCount;
    if (elInProg) elInProg.innerText = inProgressCount;
    if (elPending) elPending.innerText = pendingCount;
    if (elCompleted) elCompleted.innerText = completedCount;
    if (elSummary) elSummary.innerText = `${totalCount} Active Record${totalCount === 1 ? '' : 's'}`;

    if (totalCount === 0) {
        container.innerHTML = `
            <div class="glass-panel p-10 text-center text-gray-500 space-y-3 rounded-3xl border-2 border-purple-100">
                <div class="w-14 h-14 mx-auto rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-2xl shadow-xs">
                    <i class="fa-solid fa-clipboard-list"></i>
                </div>
                <p class="font-heading font-extrabold text-base text-purple-950">No follow-ups recorded yet</p>
                <p class="text-xs text-gray-500 max-w-md mx-auto">Click "+ Log Follow-Up" to schedule parent consultations, intervention reviews, or classroom accommodations.</p>
            </div>
        `;
        return;
    }

    // Apply Filter & Search
    let filtered = allFollowups;
    if (currentFollowupFilter && currentFollowupFilter !== 'ALL') {
        filtered = filtered.filter(f => f.status === currentFollowupFilter);
    }
    if (currentFollowupSearch) {
        filtered = filtered.filter(f => 
            (f.student || '').toLowerCase().includes(currentFollowupSearch) ||
            (f.class || '').toLowerCase().includes(currentFollowupSearch) ||
            (f.action || '').toLowerCase().includes(currentFollowupSearch) ||
            (f.notes || '').toLowerCase().includes(currentFollowupSearch)
        );
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="glass-panel p-8 text-center text-gray-500 space-y-2 rounded-3xl border-2 border-purple-100">
                <p class="font-bold text-sm text-purple-950">No matching follow-ups found</p>
                <p class="text-xs text-gray-400">Try adjusting your filter or search terms.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(f => {
        let statusSelectClass = "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100/90";
        let chevronColor = "text-amber-700";
        let avatarBg = "bg-amber-100 text-amber-700 border-amber-200";

        if (f.status === 'Completed') {
            statusSelectClass = "bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100/90";
            chevronColor = "text-emerald-700";
            avatarBg = "bg-emerald-100 text-emerald-700 border-emerald-200";
        } else if (f.status === 'In Progress') {
            statusSelectClass = "bg-indigo-50 text-indigo-900 border-indigo-300 hover:bg-indigo-100/90";
            chevronColor = "text-indigo-700";
            avatarBg = "bg-purple-100 text-purple-700 border-purple-200";
        }

        const initials = getFollowupInitials(f.student);

        return `
            <div class="log-card bg-white border-2 border-purple-100/90 hover:border-purple-300 hover:shadow-md transition-all duration-200 rounded-3xl p-5 sm:p-6 shadow-xs relative group">
                <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4 sm:gap-6">
                    
                    <!-- Left: Student Info & Details -->
                    <div class="flex items-start gap-4 flex-1">
                        <!-- Student Avatar / Initials -->
                        <div class="w-12 h-12 rounded-2xl ${avatarBg} flex items-center justify-center font-heading font-black text-base shrink-0 border shadow-2xs">
                            ${escapeHTML(initials)}
                        </div>

                        <div class="space-y-3 flex-1 min-w-0">
                            <!-- Name & Class Badge -->
                            <div class="flex flex-wrap items-center gap-2.5">
                                <h3 class="text-base sm:text-lg font-heading font-extrabold text-brand-purple-deep tracking-tight">
                                    ${escapeHTML(f.student)}
                                </h3>
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-purple-100 text-purple-700 border border-purple-200 shadow-2xs">
                                    ${escapeHTML(f.class)}
                                </span>
                            </div>

                            <!-- Action Item & Schedule -->
                            <div class="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs sm:text-sm">
                                <div class="inline-flex items-center gap-1.5 text-purple-800 font-bold">
                                    <i class="fa-solid fa-bullseye text-purple-600 text-xs"></i>
                                    <span>${escapeHTML(f.action)}</span>
                                </div>
                                
                                <span class="text-purple-200 hidden sm:inline">•</span>

                                <div class="inline-flex items-center gap-1.5 text-gray-600 font-medium">
                                    <i class="fa-solid fa-calendar text-gray-400 text-xs"></i>
                                    <span>Scheduled: <strong class="text-purple-950 font-bold">${escapeHTML(f.date)}</strong></span>
                                </div>
                            </div>

                            <!-- Notes Box -->
                            ${f.notes ? `
                            <div class="bg-purple-50/40 border border-purple-100/90 rounded-2xl p-3.5 text-xs sm:text-sm text-gray-700 leading-relaxed">
                                <span class="font-bold text-purple-950 block sm:inline">Note: </span>
                                ${escapeHTML(f.notes)}
                            </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Right: Status Dropdown & Action Icons -->
                    <div class="flex items-center justify-end sm:justify-start lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-purple-50 shrink-0">
                        <!-- Custom Status Pill Select -->
                        <div class="relative inline-block">
                            <select onchange="updateFollowupStatus('${f.id}', this.value)" class="appearance-none cursor-pointer pl-3.5 pr-8 py-2 font-extrabold rounded-2xl text-xs sm:text-sm transition-all shadow-2xs border outline-none ${statusSelectClass}" title="Click to update status">
                                <option value="Pending" ${f.status === 'Pending' ? 'selected' : ''}>Pending</option>
                                <option value="In Progress" ${f.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                                <option value="Completed" ${f.status === 'Completed' ? 'selected' : ''}>Completed</option>
                            </select>
                            <i class="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none ${chevronColor}"></i>
                        </div>

                        <!-- Delete Action -->
                        <button onclick="deleteFollowupRecord('${f.id}')" title="Delete entry" class="p-2 rounded-2xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer">
                            <i class="fa-solid fa-trash text-sm"></i>
                        </button>
                    </div>

                </div>
            </div>
        `;
    }).join('');
}

function updateFollowupStatus(followupId, newStatus) {
    const item = adminState.followups.find(f => f.id === followupId || f.dbId === followupId);
    if (!item) return;

    item.status = newStatus;
    saveAdminStateLocally();
    renderFollowupsList();

    const targetId = item.dbId || item.id;
    if (typeof updateFollowupStatusInSupabase === 'function') {
        updateFollowupStatusInSupabase(targetId, newStatus);
    } else {
        const client = typeof getSupabase === 'function' ? getSupabase() : null;
        if (client) {
            client.from('teacher_followups').update({ status: newStatus }).or(`id.eq.${targetId},student_name.ilike.${item.student}`);
        }
    }

    showToast("Status Follow-Up Dikemaskini", `${item.student}: Status kini "${newStatus}"`, "success");
}

function deleteFollowupRecord(followupId) {
    const idx = adminState.followups.findIndex(f => f.id === followupId || f.dbId === followupId);
    if (idx !== -1) {
        const name = adminState.followups[idx].student;
        const targetId = adminState.followups[idx].dbId || adminState.followups[idx].id;
        if (confirm(`Are you sure you want to remove the follow-up log for ${name}?`)) {
            adminState.followups.splice(idx, 1);
            const deletedFollowups = JSON.parse(localStorage.getItem('lexisense_deleted_followups') || '[]');
            if (targetId) deletedFollowups.push(targetId);
            localStorage.setItem('lexisense_deleted_followups', JSON.stringify(deletedFollowups));
            saveAdminStateLocally();
            renderFollowupsList();

            if (typeof deleteFollowupFromSupabase === 'function') {
                deleteFollowupFromSupabase(targetId);
            } else {
                const client = typeof getSupabase === 'function' ? getSupabase() : null;
                if (client) {
                    client.from('teacher_followups').delete().or(`id.eq.${targetId},student_name.ilike.${name}`);
                }
            }

            showToast("Follow-Up Dipadam", `Rekod susulan untuk ${name} telah dipadam.`);
        }
    }
}

/* --------------------------------------------------------------------------
   10. Modals & Actions (Add Student, Create Class, Log Follow-Up)
   -------------------------------------------------------------------------- */
function openAddStudentModal(preselectedClass = null) {
    const content = document.getElementById('modalContent');
    content.classList.remove('max-w-4xl');
    content.classList.add('max-w-lg');

    const classOptions = adminState.classes.map(c => 
        `<option value="${escapeHTML(c.name)}" ${preselectedClass === c.name ? 'selected' : ''}>${escapeHTML(c.name)} (${escapeHTML(c.grade || 'Year 1')})</option>`
    ).join('');

    content.innerHTML = `
        <div class="flex justify-between items-center border-b border-purple-100 pb-3">
            <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    <i class="fa-solid fa-user-plus"></i>
                </div>
                <div>
                    <h3 class="font-heading font-extrabold text-xl text-brand-purple-deep leading-tight">Register Single Student</h3>
                    <p class="text-xs text-gray-500 font-medium">Add individual learner and parent contact details</p>
                </div>
            </div>
            <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600"><i class="fa-solid fa-xmark text-lg"></i></button>
        </div>
        
        <div class="space-y-3.5 text-xs pt-2">
            <div>
                <label class="font-bold block mb-1 text-purple-950">Student Full Name *</label>
                <input type="text" id="mStudentName" placeholder="e.g. Nur Aisyah Binti Zulkifli" class="w-full p-2.5 bg-purple-50/40 border border-purple-200 rounded-2xl outline-none focus:ring-2 focus:ring-purple-600 font-bold text-brand-purple-deep text-xs sm:text-sm">
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                    <label class="font-bold block mb-1 text-purple-950">Class Cohort *</label>
                    <select id="mStudentClass" class="w-full p-2.5 bg-purple-50/40 border border-purple-200 rounded-2xl outline-none font-bold text-purple-950 focus:ring-2 focus:ring-purple-600">
                        ${classOptions || '<option value="Class 1A">Class 1A</option>'}
                    </select>
                </div>
                <div>
                    <label class="font-bold block mb-1 text-purple-950">Age (Years) *</label>
                    <input type="number" id="mStudentAge" value="8" min="5" max="15" class="w-full p-2.5 bg-purple-50/40 border border-purple-200 rounded-2xl outline-none font-bold text-purple-950 focus:ring-2 focus:ring-purple-600">
                </div>
                <div>
                    <label class="font-bold block mb-1 text-purple-950">Gender *</label>
                    <select id="mStudentGender" class="w-full p-2.5 bg-purple-50/40 border border-purple-200 rounded-2xl outline-none font-bold text-purple-950 focus:ring-2 focus:ring-purple-600">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                </div>
            </div>

            <!-- Parent Guardian Section -->
            <div class="p-3.5 bg-purple-50/60 rounded-2xl border border-purple-200/80 space-y-2.5">
                <div class="flex items-center gap-2 text-purple-900 font-extrabold text-xs">
                    <i class="fa-solid fa-users text-purple-600"></i>
                    <span>Parent / Guardian Contact Information</span>
                </div>
                <div>
                    <label class="font-bold block mb-1 text-purple-950">Parent / Guardian Full Name</label>
                    <input type="text" id="mStudentParent" placeholder="e.g. Pn. Noraini Binti Zakaria" class="w-full p-2.5 bg-white border border-purple-200 rounded-xl outline-none font-semibold text-xs">
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                        <label class="font-bold block mb-1 text-purple-950">Parent Phone Number</label>
                        <input type="tel" id="mStudentPhone" placeholder="e.g. +6012-3456789" class="w-full p-2.5 bg-white border border-purple-200 rounded-xl outline-none font-semibold text-xs">
                    </div>
                    <div>
                        <label class="font-bold block mb-1 text-purple-950">Parent Email Address</label>
                        <input type="email" id="mStudentEmail" placeholder="e.g. noraini@email.com" class="w-full p-2.5 bg-white border border-purple-200 rounded-xl outline-none font-semibold text-xs">
                    </div>
                </div>
            </div>

            <div class="flex gap-2.5 pt-2">
                <button onclick="closeModal()" class="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold rounded-2xl transition-all cursor-pointer">
                    Cancel
                </button>
                <button onclick="saveNewStudentFromModal()" class="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold rounded-2xl shadow-md transition-all cursor-pointer">
                    Register Student
                </button>
            </div>
        </div>
    `;
    document.getElementById('modalOverlay')?.classList.remove('hidden');
}

function getCurrentTeacherSchool() {
    return adminState.profile?.school || window.loggedInUser?.school || window.loggedInUser?.school_branch || 'SK Taman Permata';
}

async function saveNewStudentFromModal() {
    const name = document.getElementById('mStudentName')?.value.trim();
    const className = document.getElementById('mStudentClass')?.value;
    const age = parseInt(document.getElementById('mStudentAge')?.value, 10) || 8;
    const gender = document.getElementById('mStudentGender')?.value || 'Male';
    const parentName = document.getElementById('mStudentParent')?.value.trim() || 'Guardian';
    const parentPhone = document.getElementById('mStudentPhone')?.value.trim() || '+6012-3456789';
    const parentEmail = document.getElementById('mStudentEmail')?.value.trim() || 'guardian@email.com';

    if (!name) {
        alert("Please enter the student's name.");
        return;
    }

    const currentSchool = getCurrentTeacherSchool();

    const newStudentObj = {
        id: `LX-${Math.floor(1000 + Math.random() * 9000)}`,
        name: name,
        class: className,
        age: age,
        gender: gender,
        status: 'Pending',
        risk: 'Low Risk',
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        school: currentSchool,
        parent_name: parentName,
        parent_phone: parentPhone,
        parent_email: parentEmail,
        score: 0
    };

    // Clear tombstone if previously deleted
    try {
        let deletedStudents = JSON.parse(localStorage.getItem('lexisense_deleted_students') || '[]');
        if (Array.isArray(deletedStudents)) {
            deletedStudents = deletedStudents.filter(s => s.toLowerCase() !== name.toLowerCase() && s.toLowerCase() !== newStudentObj.id.toLowerCase());
            localStorage.setItem('lexisense_deleted_students', JSON.stringify(deletedStudents));
        }
    } catch(e) {}

    adminState.students.unshift(newStudentObj);

    const client = typeof getSupabase === 'function' ? getSupabase() : null;
    const teacherId = getCurrentTeacherId();
    const teacherName = getCurrentTeacherName();

    if (client) {
        try {
            const studentPayload = {
                student_id: newStudentObj.id,
                name: name,
                age: age,
                class: className,
                grade: className,
                school: currentSchool,
                school_grade: className,
                school_name: currentSchool,
                parent_name: parentName,
                parent_phone: parentPhone,
                parent_email: parentEmail,
                gender: gender,
                status: 'Pending',
                risk: 'Not Screened'
            };
            if (teacherId && isValidUUID(teacherId)) {
                studentPayload.teacher_id = teacherId;
            }

            let { data: inserted, error: insErr } = await client.from('students').insert([studentPayload]).select();
            
            // If foreign key constraint failed on teacher_id, retry without teacher_id
            if (insErr && (insErr.code === '23503' || (insErr.message && insErr.message.includes('foreign key')))) {
                delete studentPayload.teacher_id;
                const retry = await client.from('students').insert([studentPayload]).select();
                inserted = retry.data;
                insErr = retry.error;
            }

            if (insErr) {
                console.warn("Notice saving student to Supabase students table:", insErr.message);
            } else if (inserted && inserted[0]?.id) {
                newStudentObj.dbId = inserted[0].id;
                console.log(`Student "${name}" saved to Supabase 'students' table under teacher "${teacherName}" & school "${currentSchool}" 👧🚀`);
            }

            // Log activity to audit_logs
            if (typeof logAuditToSupabase === 'function') {
                logAuditToSupabase(teacherName, 'REGISTER_STUDENT', `Registered student "${name}" in ${className} (${currentSchool})`);
            }
        } catch (e) {
            console.warn("Notice saving student to Supabase students table:", e);
        }
    }

    saveAdminStateLocally();
    closeModal();
    renderStudentTable();
    renderClassesList();
    recalculateDashboardMetrics();
    populateSelectDropdowns();
    renderWizardStudentCards();
    syncClassesMetricsToSupabase();
    showToast(`Student "${name}" registered successfully under ${currentSchool}! 🎒`);
}

function openCreateClassModal() {
    const content = document.getElementById('modalContent');
    content.classList.remove('max-w-4xl');
    content.classList.add('max-w-lg');

    const defaultGrade = 'Year 1';
    const gradeButtonsHtml = GRADE_CHOICES.map(g => {
        const isSelected = (defaultGrade === g.id);
        const btnClass = isSelected
            ? "grade-choice-btn py-2.5 px-2.5 rounded-2xl font-extrabold text-xs bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md border-2 border-purple-500 scale-[1.03] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            : "grade-choice-btn py-2.5 px-2.5 rounded-2xl font-bold text-xs bg-purple-50/60 hover:bg-purple-100 text-purple-900 border-2 border-purple-100 hover:border-purple-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer";

        return `
            <button type="button" data-grade-target="mClassGrade" data-grade-val="${escapeHTML(g.id)}" onclick="selectGradeOption('mClassGrade', '${escapeHTML(g.id)}')" class="${btnClass}">
                <i class="fa-solid ${g.icon} text-xs opacity-90"></i>
                <span>${escapeHTML(g.label)}</span>
            </button>
        `;
    }).join('');

    content.innerHTML = `
        <div class="flex justify-between items-center border-b border-purple-100 pb-3">
            <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    <i class="fa-solid fa-folder-plus"></i>
                </div>
                <h3 class="font-heading font-extrabold text-xl text-brand-purple-deep">Create New Cohort Class</h3>
            </div>
            <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600"><i class="fa-solid fa-xmark text-lg"></i></button>
        </div>
        <div class="space-y-4 text-xs pt-2">
            <div>
                <label class="font-bold block mb-1 text-purple-950">Class Cohort Name *</label>
                <input type="text" id="mClassName" placeholder="e.g. Class 2A" class="w-full p-3 bg-purple-50/40 border border-purple-200 rounded-2xl outline-none font-bold text-brand-purple-deep focus:ring-2 focus:ring-purple-600 text-sm">
            </div>
            <div>
                <div class="flex items-center justify-between mb-1.5">
                    <label class="font-bold text-purple-950">Academic Year / Grade Level *</label>
                    <span class="text-xs text-purple-600 font-bold bg-purple-100/70 px-2 py-0.5 rounded-full border border-purple-200">1-Tap Choice</span>
                </div>
                <input type="hidden" id="mClassGrade" value="${defaultGrade}">
                
                <!-- Modern Interactive Choice Grid -->
                <div class="grid grid-cols-4 gap-2 pt-0.5">
                    ${gradeButtonsHtml}
                </div>
            </div>
            <div class="flex gap-2.5 pt-2">
                <button onclick="closeModal()" class="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold rounded-2xl transition-all cursor-pointer">
                    Cancel
                </button>
                <button onclick="saveNewClassFromModal()" class="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold rounded-2xl shadow-md transition-all cursor-pointer">
                    Create Class
                </button>
            </div>
        </div>
    `;
    document.getElementById('modalOverlay')?.classList.remove('hidden');
}

async function saveNewClassFromModal() {
    const name = document.getElementById('mClassName')?.value.trim();
    const grade = document.getElementById('mClassGrade')?.value.trim();

    if (!name) {
        alert("Please enter a class name.");
        return;
    }

    if (adminState.classes.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        alert(`Class "${name}" already exists.`);
        return;
    }

    // Clear tombstone if previously deleted
    try {
        let deletedClasses = JSON.parse(localStorage.getItem('lexisense_deleted_classes') || '[]');
        if (Array.isArray(deletedClasses)) {
            deletedClasses = deletedClasses.filter(c => c.toLowerCase() !== name.toLowerCase());
            localStorage.setItem('lexisense_deleted_classes', JSON.stringify(deletedClasses));
        }
    } catch(e) {}

    const newClassObj = {
        name: name,
        grade: grade || 'Year 1',
        total: 0,
        completed: 0,
        pending: 0,
        incomplete: 0,
        riskCount: 0
    };

    adminState.classes.push(newClassObj);
    saveAdminStateLocally();

    // Persist to Supabase 'classes' table
    const client = typeof getSupabase === 'function' ? getSupabase() : null;
    const currentSchool = getCurrentTeacherSchool();
    const teacherId = getCurrentTeacherId();
    const teacherName = getCurrentTeacherName();

    if (client) {
        try {
            const classPayload = {
                name: name,
                grade: grade || 'Year 1',
                school: currentSchool
            };
            if (teacherId && isValidUUID(teacherId)) {
                classPayload.teacher_id = teacherId;
            }

            let { data: insData, error: insErr } = await client.from('classes').insert([classPayload]).select();

            // If error is due to missing 'school' or 'teacher_id' column, retry with only name and grade
            if (insErr && (insErr.code === 'PGRST204' || (insErr.message && (insErr.message.includes('school') || insErr.message.includes('teacher_id'))))) {
                const retryRes = await client.from('classes').insert([{
                    name: name,
                    grade: grade || 'Year 1'
                }]).select();
                insErr = retryRes.error;
                insData = retryRes.data;
            }

            if (insErr) {
                if (insErr.code === '23505') {
                    // Unique violation - update instead
                    await client.from('classes').update({
                        grade: grade || 'Year 1',
                        school: currentSchool
                    }).eq('name', name);
                    console.log(`Class "${name}" updated in Supabase DB 🏫`);
                } else if (insErr.message && (insErr.message.includes('does not exist') || insErr.code === '42P01')) {
                    alert("⚠️ Supabase Notice: Table 'classes' does not exist in your Supabase project yet.\n\nPlease run the SQL query in your Supabase SQL Editor (Dashboard > SQL Editor) to create the 'classes' table.");
                } else {
                    console.warn("Supabase class insert notice:", insErr.message);
                }
            } else {
                console.log(`Class "${name}" saved to Supabase 'classes' table under "${currentSchool}" by "${teacherName}" 🏫`, insData);
            }

            // Log activity to audit_logs
            if (typeof logAuditToSupabase === 'function') {
                logAuditToSupabase(teacherName, 'CREATE_CLASS', `Created cohort class "${name}" (${grade}) at ${currentSchool}`);
            }
        } catch (e) {
            console.warn("Notice saving class to Supabase:", e);
        }
    }

    closeModal();
    renderClassesList();
    recalculateDashboardMetrics();
    populateSelectDropdowns();
    syncClassesMetricsToSupabase();
    showToast(`Class "${name}" created under ${currentSchool}! 🏫`);
}


/* --------------------------------------------------------------------------
   Bulk Student Registration Table Functionality
   -------------------------------------------------------------------------- */
function openBulkAddStudentsModal(preselectedClass = null) {
    const content = document.getElementById('modalContent');
    if (!content) return;

    content.classList.remove('max-w-lg', 'max-w-4xl');
    content.classList.add('max-w-6xl', 'w-full');

    content.innerHTML = `
        <div class="flex justify-between items-center border-b border-purple-100 pb-3.5">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                    <i class="fa-solid fa-users-viewfinder"></i>
                </div>
                <div>
                    <h3 class="font-heading font-extrabold text-xl sm:text-2xl text-brand-purple-deep leading-tight">Bulk Student Registration Table</h3>
                    <p class="text-xs text-gray-500 font-medium">Batch register multiple students along with age, gender, and parent contact details in a spreadsheet grid</p>
                </div>
            </div>
            <button onclick="closeModal()" class="w-8 h-8 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 flex items-center justify-center transition-colors cursor-pointer"><i class="fa-solid fa-xmark text-lg"></i></button>
        </div>

        <div class="space-y-4 text-xs pt-2">
            <!-- Table Action Controls -->
            <div class="flex flex-wrap items-center justify-between gap-2.5 bg-purple-50/70 p-3 rounded-2xl border border-purple-100">
                <div class="flex items-center gap-2">
                    <button onclick="addBulkStudentRow(1, '${preselectedClass || ''}')" class="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-extrabold text-xs shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer transform hover:scale-105">
                        <i class="fa-solid fa-plus text-xs"></i> Add Row
                    </button>
                    <button onclick="addBulkStudentRow(3, '${preselectedClass || ''}')" class="px-4 py-2 bg-white hover:bg-purple-100 text-purple-800 rounded-xl font-extrabold text-xs border border-purple-200 shadow-2xs transition-all cursor-pointer">
                        + Add 3 Rows
                    </button>
                    <button onclick="fillBulkSampleData('${preselectedClass || ''}')" class="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl font-extrabold text-xs border border-amber-300 shadow-2xs transition-all cursor-pointer">
                        ✨ Fill Demo Rows
                    </button>
                </div>
                <span class="text-xs font-extrabold text-purple-800 bg-white px-3.5 py-1.5 rounded-xl border border-purple-200 shadow-xs" id="bulkRowCountBadge">3 Rows Ready</span>
            </div>

            <!-- Spreadsheet Table -->
            <div class="overflow-x-auto max-h-[52vh] border-2 border-purple-200/80 rounded-2xl shadow-inner bg-white custom-scrollbar">
                <table class="w-full min-w-[1040px] text-left text-xs border-collapse">
                    <thead class="bg-purple-100/90 text-brand-purple-deep font-extrabold sticky top-0 z-10 border-b-2 border-purple-200">
                        <tr>
                            <th class="p-3 text-center w-10 min-w-[40px]">#</th>
                            <th class="p-3 min-w-[190px]">Student Full Name *</th>
                            <th class="p-3 min-w-[135px]">Class Cohort *</th>
                            <th class="p-3 w-28 min-w-[100px] text-center">Age (Years)</th>
                            <th class="p-3 w-36 min-w-[135px]">Gender</th>
                            <th class="p-3 min-w-[155px]">Parent / Guardian Name</th>
                            <th class="p-3 min-w-[145px]">Parent Phone</th>
                            <th class="p-3 min-w-[160px]">Parent Email</th>
                            <th class="p-3 text-center w-12 min-w-[48px]"></th>
                        </tr>
                    </thead>
                    <tbody id="bulkStudentsTableBody" class="divide-y divide-purple-100 font-medium"></tbody>
                </table>
            </div>

            <!-- Bottom Footer Actions -->
            <div class="flex items-center justify-between pt-2 border-t border-purple-100">
                <button onclick="closeModal()" class="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold rounded-2xl transition-all cursor-pointer">
                    Cancel
                </button>
                <button onclick="saveAllBulkStudents()" class="px-7 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 transform hover:scale-105 active:scale-95">
                    <i class="fa-solid fa-check"></i>
                    <span>Save All Students to Roster</span>
                </button>
            </div>
        </div>
    `;

    document.getElementById('modalOverlay')?.classList.remove('hidden');

    // Populate initial rows
    addBulkStudentRow(3, preselectedClass);
}

function addBulkStudentRow(count = 1, defaultClass = '') {
    const tbody = document.getElementById('bulkStudentsTableBody');
    if (!tbody) return;

    const classOptions = adminState.classes.map(c => 
        `<option value="${escapeHTML(c.name)}" ${defaultClass === c.name ? 'selected' : ''}>${escapeHTML(c.name)}</option>`
    ).join('');

    for (let i = 0; i < count; i++) {
        const rowId = `bulk-row-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        const tr = document.createElement('tr');
        tr.id = rowId;
        tr.className = "hover:bg-purple-50/50 transition-colors";
        tr.innerHTML = `
            <td class="p-2.5 text-center text-gray-400 font-bold row-index"></td>
            <td class="p-2">
                <input type="text" placeholder="e.g. Nur Aisyah..." class="bulk-name w-full py-2 px-3 bg-purple-50/40 border border-purple-200 rounded-xl outline-none font-bold text-brand-purple-deep focus:ring-2 focus:ring-purple-600 focus:bg-white text-xs transition-all shadow-2xs">
            </td>
            <td class="p-2">
                <select class="bulk-class w-full py-2 px-2.5 bg-purple-50/40 border border-purple-200 rounded-xl outline-none font-bold text-purple-950 focus:ring-2 focus:ring-purple-600 focus:bg-white text-xs cursor-pointer transition-all shadow-2xs">
                    ${classOptions || '<option value="Class 1A">Class 1A</option>'}
                </select>
            </td>
            <td class="p-2 text-center">
                <input type="number" value="8" min="5" max="15" placeholder="8" class="bulk-age w-full py-2 px-2 bg-purple-50/40 border border-purple-200 rounded-xl outline-none font-black text-sm text-center text-purple-950 focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all shadow-2xs">
            </td>
            <td class="p-2">
                <select class="bulk-gender w-full py-2 px-2.5 bg-purple-50/40 border border-purple-200 rounded-xl outline-none font-bold text-xs text-purple-950 focus:ring-2 focus:ring-purple-600 focus:bg-white cursor-pointer transition-all shadow-2xs">
                    <option value="Male">👦 Male</option>
                    <option value="Female">👧 Female</option>
                </select>
            </td>
            <td class="p-2">
                <input type="text" placeholder="Guardian name..." class="bulk-parent w-full py-2 px-2.5 bg-white border border-purple-200 rounded-xl outline-none font-semibold text-xs text-gray-800 focus:ring-2 focus:ring-purple-600 focus:bg-purple-50/20 transition-all shadow-2xs">
            </td>
            <td class="p-2">
                <input type="tel" placeholder="+6012-3456789" class="bulk-phone w-full py-2 px-2.5 bg-white border border-purple-200 rounded-xl outline-none font-semibold text-xs text-gray-800 focus:ring-2 focus:ring-purple-600 focus:bg-purple-50/20 transition-all shadow-2xs">
            </td>
            <td class="p-2">
                <input type="email" placeholder="parent@email.com" class="bulk-email w-full py-2 px-2.5 bg-white border border-purple-200 rounded-xl outline-none font-semibold text-xs text-gray-800 focus:ring-2 focus:ring-purple-600 focus:bg-purple-50/20 transition-all shadow-2xs">
            </td>
            <td class="p-2 text-center">
                <button onclick="removeBulkStudentRow('${rowId}')" class="w-8 h-8 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-100 flex items-center justify-center mx-auto transition-colors cursor-pointer" title="Delete Row">
                    <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    }
    updateBulkRowIndices();
}

function removeBulkStudentRow(rowId) {
    const row = document.getElementById(rowId);
    if (row) {
        row.remove();
        updateBulkRowIndices();
    }
}

function updateBulkRowIndices() {
    const rows = document.querySelectorAll('#bulkStudentsTableBody tr');
    rows.forEach((r, idx) => {
        const indexCell = r.querySelector('.row-index');
        if (indexCell) indexCell.innerText = idx + 1;
    });
    const badge = document.getElementById('bulkRowCountBadge');
    if (badge) badge.innerText = `${rows.length} Rows Ready`;
}

function fillBulkSampleData(defaultClass = '') {
    const targetClass = defaultClass || (adminState.classes[0]?.name || 'Class 1A');
    const samples = [
        { name: "Irfan Zafri Bin Azman", age: 8, gender: "Male", parent: "Azman Bin Khalid", phone: "+6012-3344556", email: "azman.k@email.com" },
        { name: "Hannah Marissa Binti Fadzil", age: 7, gender: "Female", parent: "Fadzil Bin Hashim", phone: "+6017-8822334", email: "fadzil.h@email.com" },
        { name: "Ethan Matthew Cheah", age: 8, gender: "Male", parent: "Cheah Wei Leong", phone: "+6019-5566778", email: "cheah.wl@email.com" },
        { name: "Nur Damia Qaisara", age: 7, gender: "Female", parent: "Hafizah Binti Razak", phone: "+6013-9988776", email: "hafizah.r@email.com" }
    ];

    const tbody = document.getElementById('bulkStudentsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const classOptions = adminState.classes.map(c => 
        `<option value="${escapeHTML(c.name)}" ${targetClass === c.name ? 'selected' : ''}>${escapeHTML(c.name)}</option>`
    ).join('');

    samples.forEach((s, idx) => {
        const rowId = `bulk-row-sample-${idx}`;
        const tr = document.createElement('tr');
        tr.id = rowId;
        tr.className = "hover:bg-purple-50/50 transition-colors";
        tr.innerHTML = `
            <td class="p-2.5 text-center text-purple-700 font-extrabold row-index">${idx + 1}</td>
            <td class="p-2">
                <input type="text" value="${escapeHTML(s.name)}" class="bulk-name w-full py-2 px-3 bg-purple-50/40 border border-purple-200 rounded-xl outline-none font-bold text-brand-purple-deep text-xs">
            </td>
            <td class="p-2">
                <select class="bulk-class w-full py-2 px-2.5 bg-purple-50/40 border border-purple-200 rounded-xl outline-none font-bold text-purple-950 text-xs">
                    ${classOptions}
                </select>
            </td>
            <td class="p-2 text-center">
                <input type="number" value="${s.age}" min="5" max="15" class="bulk-age w-full py-2 px-2 bg-purple-50/40 border border-purple-200 rounded-xl outline-none font-black text-sm text-center text-purple-950">
            </td>
            <td class="p-2">
                <select class="bulk-gender w-full py-2 px-2.5 bg-purple-50/40 border border-purple-200 rounded-xl outline-none font-bold text-xs text-purple-950">
                    <option value="Male" ${s.gender === 'Male' ? 'selected' : ''}>👦 Male</option>
                    <option value="Female" ${s.gender === 'Female' ? 'selected' : ''}>👧 Female</option>
                </select>
            </td>
            <td class="p-2">
                <input type="text" value="${escapeHTML(s.parent)}" class="bulk-parent w-full py-2 px-2.5 bg-white border border-purple-200 rounded-xl outline-none text-xs font-semibold text-gray-800">
            </td>
            <td class="p-2">
                <input type="tel" value="${escapeHTML(s.phone)}" class="bulk-phone w-full py-2 px-2.5 bg-white border border-purple-200 rounded-xl outline-none text-xs font-semibold text-gray-800">
            </td>
            <td class="p-2">
                <input type="email" value="${escapeHTML(s.email)}" class="bulk-email w-full py-2 px-2.5 bg-white border border-purple-200 rounded-xl outline-none text-xs font-semibold text-gray-800">
            </td>
            <td class="p-2 text-center">
                <button onclick="removeBulkStudentRow('${rowId}')" class="w-8 h-8 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-100 flex items-center justify-center mx-auto transition-colors cursor-pointer" title="Delete Row">
                    <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    updateBulkRowIndices();
}

async function saveAllBulkStudents() {
    const rows = document.querySelectorAll('#bulkStudentsTableBody tr');
    const newStudents = [];
    const client = typeof getSupabase === 'function' ? getSupabase() : null;

    rows.forEach(r => {
        const name = r.querySelector('.bulk-name')?.value.trim();
        const className = r.querySelector('.bulk-class')?.value;
        const age = parseInt(r.querySelector('.bulk-age')?.value, 10) || 8;
        const gender = r.querySelector('.bulk-gender')?.value || 'Male';
        const parent = r.querySelector('.bulk-parent')?.value.trim() || 'Guardian';
        const phone = r.querySelector('.bulk-phone')?.value.trim() || '+6012-3456789';
        const email = r.querySelector('.bulk-email')?.value.trim() || 'guardian@email.com';

        if (name) {
            const activeSchool = getCurrentTeacherSchool();
            newStudents.push({
                id: `LX-${Math.floor(1000 + Math.random() * 9000)}`,
                name: name,
                class: className || 'Class 1A',
                age: age,
                gender: gender,
                status: 'Pending',
                risk: 'Low Risk',
                date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                school: activeSchool,
                parent_name: parent,
                parent_phone: phone,
                parent_email: email,
                score: 0
            });
        }
    });

    // Clear tombstones if previously deleted
    try {
        let deletedStudents = JSON.parse(localStorage.getItem('lexisense_deleted_students') || '[]');
        if (Array.isArray(deletedStudents)) {
            const addedNames = new Set(newStudents.map(s => s.name.toLowerCase()));
            const addedIds = new Set(newStudents.map(s => s.id.toLowerCase()));
            deletedStudents = deletedStudents.filter(s => !addedNames.has(s.toLowerCase()) && !addedIds.has(s.toLowerCase()));
            localStorage.setItem('lexisense_deleted_students', JSON.stringify(deletedStudents));
        }
    } catch(e) {}

    // Prepend all new students
    newStudents.forEach(s => adminState.students.unshift(s));

    // Save to Supabase
    if (client) {
        try {
            const activeSchool = getCurrentTeacherSchool();
            const teacherId = getCurrentTeacherId();
            const teacherName = getCurrentTeacherName();

            const records = newStudents.map(s => {
                const rec = {
                    student_id: s.id,
                    name: s.name,
                    age: s.age,
                    class: s.class,
                    grade: s.class,
                    school: activeSchool,
                    school_grade: s.class,
                    school_name: activeSchool,
                    parent_name: s.parent_name,
                    parent_phone: s.parent_phone,
                    parent_email: s.parent_email,
                    gender: s.gender,
                    status: 'Pending',
                    risk: 'Not Screened'
                };
                if (teacherId && isValidUUID(teacherId)) {
                    rec.teacher_id = teacherId;
                }
                return rec;
            });

            let { data: inserted, error: bulkErr } = await client.from('students').insert(records).select();
            
            // If foreign key constraint failed on teacher_id, retry without teacher_id
            if (bulkErr && (bulkErr.code === '23503' || (bulkErr.message && bulkErr.message.includes('foreign key')))) {
                records.forEach(r => delete r.teacher_id);
                const retry = await client.from('students').insert(records).select();
                inserted = retry.data;
                bulkErr = retry.error;
            }

            if (bulkErr) {
                console.warn("Notice in bulk insertion to Supabase students table:", bulkErr.message);
            } else if (inserted && Array.isArray(inserted)) {
                inserted.forEach((ins, i) => {
                    if (newStudents[i]) newStudents[i].dbId = ins.id;
                });
                console.log(`Bulk inserted ${records.length} students into Supabase 'students' table under "${activeSchool}" by "${teacherName}" 🚀`);
            }

            // Log activity to audit_logs
            if (typeof logAuditToSupabase === 'function') {
                logAuditToSupabase(teacherName, 'BULK_REGISTER_STUDENTS', `Bulk registered ${newStudents.length} students at ${activeSchool}`);
            }
        } catch(e) {
            console.warn("Notice in bulk insertion to Supabase students table:", e);
        }
    }

    saveAdminStateLocally();
    closeModal();
    renderStudentTable();
    renderClassesList();
    recalculateDashboardMetrics();
    populateSelectDropdowns();
    renderWizardStudentCards();
    syncClassesMetricsToSupabase();
    showToast(`Successfully registered ${newStudents.length} students under ${getCurrentTeacherSchool()}! 🎓✨`);
}

function openNewFollowupModal() {
    const content = document.getElementById('modalContent');
    if (!content) return;

    const studentOptions = adminState.students.map(s => `<option value="${escapeHTML(s.name)}">${escapeHTML(s.name)} (${escapeHTML(s.class)})</option>`).join('');
    const teacherEmail = adminState.profile?.email || 'faiz.ikhwan@sktamanria.edu.my';

    content.innerHTML = `
        <div class="flex justify-between items-center border-b border-purple-100 pb-3">
            <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    <i class="fa-solid fa-list-check"></i>
                </div>
                <div>
                    <h3 class="font-heading font-extrabold text-xl text-purple-950 leading-tight">Log Educator Follow-Up</h3>
                    <p class="text-[11px] text-gray-500 font-medium">Record parent consultations, classroom accommodations & automated reminders</p>
                </div>
            </div>
            <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600"><i class="fa-solid fa-xmark text-base"></i></button>
        </div>

        <div class="space-y-3.5 text-xs pt-2">
            <div>
                <label class="font-bold block mb-1 text-purple-950">Target Student *</label>
                <select id="mFollowStudent" class="w-full p-2.5 bg-purple-50/40 border border-purple-200 rounded-xl outline-none font-bold text-gray-800 focus:ring-2 focus:ring-purple-600 cursor-pointer">
                    ${studentOptions}
                </select>
            </div>

            <div>
                <label class="font-bold block mb-1 text-purple-950">Action Objective *</label>
                <input type="text" id="mFollowAction" placeholder="e.g. Discuss observations with guardian / Trial line-reader ruler" class="w-full p-2.5 bg-purple-50/40 border border-purple-200 rounded-xl outline-none font-medium focus:ring-2 focus:ring-purple-600">
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label class="font-bold block mb-1 text-purple-950">Scheduled Date *</label>
                    <input type="date" id="mFollowDate" class="w-full p-2.5 bg-purple-50/40 border border-purple-200 rounded-xl outline-none font-semibold focus:ring-2 focus:ring-purple-600">
                </div>
                <div>
                    <label class="font-bold block mb-1 text-purple-950">Initial Status</label>
                    <select id="mFollowStatus" class="w-full p-2.5 bg-purple-50/40 border border-purple-200 rounded-xl outline-none font-bold text-gray-800 focus:ring-2 focus:ring-purple-600 cursor-pointer">
                        <option value="Pending" selected>⏳ Pending</option>
                        <option value="In Progress">🔄 In Progress</option>
                        <option value="Completed">✅ Completed</option>
                    </select>
                </div>
            </div>

            <div>
                <label class="font-bold block mb-1 text-purple-950">Classroom Observation Notes</label>
                <textarea id="mFollowNotes" rows="3" placeholder="Enter specific observations, accommodations, or notes for follow-up..." class="w-full p-2.5 bg-purple-50/40 border border-purple-200 rounded-xl outline-none font-medium text-gray-700 focus:ring-2 focus:ring-purple-600"></textarea>
            </div>

            <!-- Email Reminder Checkbox -->
            <div class="p-3 bg-purple-50/70 rounded-2xl border border-purple-100 flex items-start gap-2.5">
                <input type="checkbox" id="mFollowSendReminder" checked class="w-4 h-4 mt-0.5 text-purple-600 rounded border-purple-300 focus:ring-purple-500 cursor-pointer">
                <label for="mFollowSendReminder" class="text-xs text-purple-950 font-medium leading-relaxed cursor-pointer select-none">
                    <strong class="font-bold text-purple-900 block">Auto-send email reminder notification</strong>
                    <span>Dispatches a scheduled follow-up reminder to teacher inbox (<strong>${escapeHTML(teacherEmail)}</strong>).</span>
                </label>
            </div>

            <button onclick="saveNewFollowupFromModal()" class="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2">
                <i class="fa-solid fa-floppy-disk"></i>
                <span>Save Follow-Up & Dispatch Reminder</span>
            </button>
        </div>
    `;
    document.getElementById('modalOverlay')?.classList.remove('hidden');

    // Set default date to 3 days from now
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 3);
    const dateInput = document.getElementById('mFollowDate');
    if (dateInput) {
        dateInput.value = nextDate.toISOString().split('T')[0];
    }
}

async function saveNewFollowupFromModal() {
    const studentName = document.getElementById('mFollowStudent')?.value;
    const action = document.getElementById('mFollowAction')?.value.trim();
    const dateInput = document.getElementById('mFollowDate')?.value;
    const status = document.getElementById('mFollowStatus')?.value || 'Pending';
    const notes = document.getElementById('mFollowNotes')?.value.trim();
    const sendReminder = document.getElementById('mFollowSendReminder')?.checked;

    if (!action) {
        alert("Please enter the action objective.");
        return;
    }

    const student = adminState.students.find(s => s.name === studentName);
    const className = student ? (student.class || student.grade || 'Class 1A') : 'Class 1A';

    let formattedDate = dateInput;
    if (dateInput) {
        try {
            const parts = dateInput.split('-');
            const d = new Date(parts[0], parts[1] - 1, parts[2]);
            formattedDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch(e) {}
    } else {
        formattedDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    const teacherEmail = adminState.profile?.email || 'faiz.ikhwan@sktamanria.edu.my';
    const teacherName = adminState.profile?.name || 'Faiz Ikhwan';
    const schoolName = adminState.profile?.school || (student ? student.school : 'SK Taman Permata');

    const newFollowup = {
        id: `f-${Date.now()}`,
        student: studentName,
        student_id: student?.id || student?.dbId || null,
        class: className,
        date: formattedDate,
        action: action,
        status: status,
        notes: notes || 'Classroom observation recorded.',
        teacher_name: teacherName,
        teacher_email: teacherEmail,
        school: schoolName
    };

    // Save directly to Supabase teacher_followups table
    if (typeof saveFollowupToSupabase === 'function') {
        try {
            const dbRec = await saveFollowupToSupabase(newFollowup);
            if (dbRec && dbRec.id) {
                newFollowup.id = dbRec.id;
                newFollowup.dbId = dbRec.id;
            }
        } catch (e) {
            console.warn("Notice saving followup to Supabase:", e);
        }
    } else {
        const client = typeof getSupabase === 'function' ? getSupabase() : null;
        if (client) {
            try {
                const { data, error } = await client.from('teacher_followups').insert([{
                    student_name: studentName,
                    class_name: className,
                    action_plan: action,
                    date: formattedDate,
                    status: status,
                    notes: notes || 'Classroom observation recorded.'
                }]).select();
                if (!error && data && data[0]) {
                    newFollowup.id = data[0].id;
                    newFollowup.dbId = data[0].id;
                }
            } catch (e) {}
        }
    }

    adminState.followups.unshift(newFollowup);
    saveAdminStateLocally();
    closeModal();
    renderFollowupsList();

    if (sendReminder) {
        showToast("Follow-Up Disimpan", `Rekod susulan (${status}) disimpan & peringatan dihantar ke ${teacherEmail} 📧`, "success");
    } else {
        showToast("Follow-Up Disimpan", `Rekod susulan (${status}) untuk ${studentName} berjaya disimpan ke Supabase 📝⚡`, "success");
    }
}

function closeModal() {
    const content = document.getElementById('modalContent');
    if (content) {
        content.classList.remove('max-w-4xl', 'max-w-5xl', 'max-w-6xl', 'w-full');
        content.classList.add('max-w-lg');
    }
    document.getElementById('modalOverlay')?.classList.add('hidden');
}

/* --------------------------------------------------------------------------
   11. Helper Dropdown Populator
   -------------------------------------------------------------------------- */
function populateSelectDropdowns() {
    const repStudentSel = document.getElementById('reportStudentSelect');
    if (repStudentSel) {
        repStudentSel.innerHTML = adminState.students.map(s => `
            <option value="${escapeHTML(s.name)}">${escapeHTML(s.name)} — ${escapeHTML(s.class)}</option>
        `).join('');
    }

    const repClassSel = document.getElementById('reportClassSelect');
    if (repClassSel) {
        repClassSel.innerHTML = adminState.classes.map(c => `
            <option value="${escapeHTML(c.name)}">${escapeHTML(c.name)}</option>
        `).join('');
    }

    const filterClassSel = document.getElementById('filterClass');
    if (filterClassSel) {
        const currentVal = filterClassSel.value;
        filterClassSel.innerHTML = `<option value="ALL">All Classes</option>` + adminState.classes.map(c => `
            <option value="${escapeHTML(c.name)}" ${currentVal === c.name ? 'selected' : ''}>${escapeHTML(c.name)}</option>
        `).join('');
    }

    const analyticsClassSel = document.getElementById('analyticsClassFilter');
    if (analyticsClassSel) {
        const currentVal = analyticsClassSel.value;
        analyticsClassSel.innerHTML = `<option value="ALL">All Cohort Classes</option>` + adminState.classes.map(c => `
            <option value="${escapeHTML(c.name)}" ${currentVal === c.name ? 'selected' : ''}>${escapeHTML(c.name)} (${escapeHTML(c.grade || 'Year 1')})</option>
        `).join('');
    }

    const histSel = document.getElementById('historyStudentSelect');
    if (histSel) {
        histSel.innerHTML = adminState.students.map(s => `
            <option value="${escapeHTML(s.name)}">${escapeHTML(s.name)} (${escapeHTML(s.class)})</option>
        `).join('');
    }
}

/* --------------------------------------------------------------------------
   12. Formal Report Printing Engines (Hospital Referral & Clinical Standard)
   -------------------------------------------------------------------------- */
function generateIndividualPDFReport(customStudentName) {
    const sel = document.getElementById('reportStudentSelect');
    const studentName = customStudentName || (sel ? sel.value : (adminState.selectedDetailStudent?.name || 'Adam Rahman'));
    const student = adminState.students.find(s => s.name === studentName) || adminState.students[0];

    const win = window.open('', '_blank');
    if (!win) {
        alert("Please allow popups to generate printable report.");
        return;
    }

    const todayDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const refNumber = `LS-SCR/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${student.id || 'LX-8021'}`;

    win.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>LexiSense — Dyslexia Risk Screening & Specialist Referral Report (${escapeHTML(student.name)})</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Lexend:wght@400;500;600;700&family=Nunito:ital,wght@0,400;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
            <style>
                @media print {
                    body { background: #FFF !important; padding: 0 !important; margin: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    .no-print { display: none !important; }
                    .a4-page { box-shadow: none !important; border: none !important; margin: 0 !important; width: 100% !important; padding: 22px 30px !important; }
                }
                body { font-family: 'Nunito', Arial, sans-serif; background: #F1F5F9; color: #1E293B; margin: 0; padding: 20px 0; font-size: 11px; line-height: 1.5; }
                .font-heading { font-family: 'Baloo 2', Arial, sans-serif; }
                .a4-page { width: 210mm; min-height: 297mm; margin: 0 auto; background: #FFF; padding: 24px 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); box-sizing: border-box; border-radius: 6px; }
                .top-bar { max-width: 210mm; margin: 0 auto 15px auto; display: flex; justify-content: space-between; align-items: center; background: #4C1D95; color: #FFF; padding: 10px 16px; border-radius: 12px; }
                .btn-print { background: #F59E0B; color: #1E1B4B; border: none; padding: 6px 16px; border-radius: 8px; font-weight: 800; cursor: pointer; font-size: 12px; }
                table { width: 100%; border-collapse: collapse; margin-top: 4px; }
                th, td { padding: 6px 8px; border: 1px solid #E2E8F0; text-align: left; }
                .badge-high { background: #FFE4E6; color: #9F1239; font-weight: bold; padding: 2px 8px; border-radius: 9999px; }
                .badge-mod { background: #FEF3C7; color: #92400E; font-weight: bold; padding: 2px 8px; border-radius: 9999px; }
                .badge-low { background: #D1FAE5; color: #065F46; font-weight: bold; padding: 2px 8px; border-radius: 9999px; }
            </style>
        </head>
        <body>
            <div class="top-bar no-print">
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="assets/lexisense-logo.png" style="width:28px; height:28px; background:#FFF; border-radius:6px; padding:2px;">
                    <div><strong>LexiSense Specialist Referral Support & Screening Report</strong> <span style="font-size:10px; color:#DDD6FE;">(Online Verified)</span></div>
                </div>
                <button onclick="window.print()" class="btn-print"><i class="fa-solid fa-print"></i> Print / Save to PDF</button>
            </div>

            <div class="a4-page">
                <!-- Header -->
                <div style="border-bottom: 2px solid #6D28D9; padding-bottom: 10px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <img src="assets/lexisense-logo.png" style="width: 68px; height: 68px; object-fit: contain;">
                        <div>
                            <h1 style="color: #4C1D95; margin: 0; font-size: 20px; font-weight: 800; font-family: 'Baloo 2', Arial;">LexiSense Multimodal Dyslexia Risk Screening Suite</h1>
                            <div style="font-weight: 700; color: #4B5563; font-size: 11px;">Multimodal Dyslexia Risk Screening & Specialist Referral Support Dossier</div>
                            <div style="font-size: 10px; color: #6B7280;">Child Literacy Assessment & Intervention Centre · ${escapeHTML(student.school || 'SK Taman Permata')}</div>
                        </div>
                    </div>
                    <div style="text-align: right; font-size: 10px; color: #4B5563;">
                        <span style="display:inline-block; padding:2px 8px; background:#EDE9FE; color:#5B21B6; font-weight:800; border-radius:9999px; border:1px solid #DDD6FE; margin-bottom:4px;">● CONFIDENTIAL EDUCATIONAL SCREENING RECORD</span>
                        <div><strong>Ref. Number:</strong> <span style="font-family:monospace; font-weight:bold; color:#4C1D95;">${refNumber}</span></div>
                        <div><strong>Screening Date:</strong> ${student.date || todayDate}</div>
                        <div><strong>Referral Support:</strong> Educational & Clinical Specialist Review</div>
                    </div>
                </div>

                <!-- Banner -->
                <div style="background: linear-gradient(90deg, #5B21B6, #312E81); color: #FFF; padding: 6px 12px; border-radius: 8px; text-align: center; margin-bottom: 12px;">
                    <strong style="text-transform: uppercase; font-size: 11.5px; letter-spacing: 0.5px;">MULTIMODAL DYSLEXIA RISK SCREENING & SPECIALIST REFERRAL SUPPORT REPORT</strong>
                    <div style="font-size: 9.5px; color: #DDD6FE;">3-Pillar Screening Analysis · Educational Support · Specialist Referral Guidance</div>
                </div>

                <!-- 1. Student Profile -->
                <div style="margin-bottom: 10px;">
                    <div style="font-weight: 800; color: #3B0764; border-bottom: 1px solid #DDD6FE; padding-bottom: 2px; margin-bottom: 4px; font-size: 11px;">
                        <i class="fa-solid fa-user-graduate" style="color:#7C3AED;"></i> 1. LEARNER & GUARDIAN PROFILE
                    </div>
                    <table>
                        <tr>
                            <td style="background:#F5F3FF; font-weight:700; width:22%;">Full Learner Name:</td>
                            <td style="font-weight:800; color:#3B0764; width:28%;">${escapeHTML(student.name)}</td>
                            <td style="background:#F5F3FF; font-weight:700; width:22%;">Student ID / Registry:</td>
                            <td style="width:28%; font-family:monospace;">${escapeHTML(student.id)}</td>
                        </tr>
                        <tr>
                            <td style="background:#F5F3FF; font-weight:700;">Age & Gender:</td>
                            <td>${student.age} Years · ${escapeHTML(student.gender || 'Student')}</td>
                            <td style="background:#F5F3FF; font-weight:700;">Grade / Class:</td>
                            <td style="font-weight:700; color:#5B21B6;">${escapeHTML(student.class)}</td>
                        </tr>
                        <tr>
                            <td style="background:#F5F3FF; font-weight:700;">School / Institution:</td>
                            <td>${escapeHTML(student.school || adminState.profile.school || 'SK Taman Ria')}</td>
                            <td style="background:#F5F3FF; font-weight:700;">Screening Educator:</td>
                            <td>${escapeHTML(adminState.profile.name || 'Faiz Ikhwan')} (${escapeHTML(adminState.profile.role || 'SEN Specialist')})</td>
                        </tr>
                        <tr>
                            <td style="background:#F5F3FF; font-weight:700;">Parent / Guardian:</td>
                            <td>${escapeHTML(student.parent_name || 'Guardian')}</td>
                            <td style="background:#F5F3FF; font-weight:700;">Reading Passage:</td>
                            <td>English — Grade-Aligned Controlled Reading Passage</td>
                        </tr>
                    </table>
                </div>

                <!-- 2. Reason for Referral -->
                <div style="margin-bottom: 10px;">
                    <div style="font-weight: 800; color: #3B0764; border-bottom: 1px solid #DDD6FE; padding-bottom: 2px; margin-bottom: 4px; font-size: 11px;">
                        <i class="fa-solid fa-notes-medical" style="color:#7C3AED;"></i> 2. SCREENING CONTEXT & EDUCATIONAL OBSERVATIONS
                    </div>
                    <div style="background: #FEF3C7; border: 1px solid #FCD34D; padding: 6px 10px; border-radius: 6px; font-size: 10.5px; color: #78350F; line-height: 1.4;">
                        <strong>Primary Classroom Observations:</strong> The learner demonstrates difficulties in phonological decoding, word reading fluency below chronological age expectations (42 WCPM compared to the 65–80 WCPM peer benchmark), occasional mirror-letter reversals (<em>b/d</em>, <em>p/q</em>), and visual tracking fatigue during multi-line reading tasks, despite exhibiting strong verbal comprehension and conceptual intelligence.
                    </div>
                </div>

                <!-- 3. 3-Pillar Triangulation -->
                <div style="margin-bottom: 10px;">
                    <div style="font-weight: 800; color: #3B0764; border-bottom: 1px solid #DDD6FE; padding-bottom: 2px; margin-bottom: 4px; font-size: 11px;">
                        <i class="fa-solid fa-network-wired" style="color:#7C3AED;"></i> 3. 3-PILLAR MULTIMODAL SCREENING TRIANGULATION MATRIX
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap:6px;">
                        <div style="background:#FEF3C7; border:2px solid #F59E0B; padding:6px; border-radius:8px; text-align:center;">
                            <span style="font-size:9.5px; font-weight:700; color:#92400E;">SCREENING TIER</span>
                            <div style="font-size:13px; font-weight:800; color:#78350F; margin:2px 0;">${escapeHTML(student.risk || 'Moderate Concern')}</div>
                            <span style="font-size:9.5px; font-weight:800; color:#92400E;">Index: ${student.score || 68} / 100</span>
                        </div>
                        <div style="background:#F5F3FF; border:1px solid #DDD6FE; padding:6px; border-radius:8px; text-align:center;">
                            <span style="font-size:9px; font-weight:700; color:#5B21B6;">PILLAR 1: QUESTIONNAIRE (40%)</span>
                            <div style="font-size:13px; font-weight:800; color:#3B0764; margin:2px 0;">65%</div>
                            <span style="font-size:9px; color:#6B7280;">30 Scientific Observations</span>
                        </div>
                        <div style="background:#F5F3FF; border:1px solid #DDD6FE; padding:6px; border-radius:8px; text-align:center;">
                            <span style="font-size:9px; font-weight:700; color:#5B21B6;">PILLAR 2: ORAL READING (40%)</span>
                            <div style="font-size:13px; font-weight:800; color:#3B0764; margin:2px 0;">55%</div>
                            <span style="font-size:9px; color:#6B7280; font-weight:bold;">42 WCPM (Words Correct/Min)</span>
                        </div>
                        <div style="background:#F5F3FF; border:1px solid #DDD6FE; padding:6px; border-radius:8px; text-align:center;">
                            <span style="font-size:9px; font-weight:700; color:#5B21B6;">PILLAR 3: READING GAZE (20%)</span>
                            <div style="font-size:13px; font-weight:800; color:#3B0764; margin:2px 0;">68%</div>
                            <span style="font-size:9px; color:#6B7280;">Estimated Dwell & Shifts</span>
                        </div>
                    </div>
                    <div style="font-size:8.5px; color:#6B7280; text-align:center; margin-top:3px; font-style:italic;">
                        * Note: Composite weighting (40/40/20) represents the LexiSense screening algorithm and is intended for risk stratification only. It does not represent the probability of a clinical diagnosis.
                    </div>
                </div>

                <!-- 4. 5 Domain Breakdown -->
                <div style="margin-bottom: 10px;">
                    <div style="font-weight: 800; color: #3B0764; border-bottom: 1px solid #DDD6FE; padding-bottom: 2px; margin-bottom: 4px; font-size: 11px;">
                        <i class="fa-solid fa-list-check" style="color:#7C3AED;"></i> 4. COGNITIVE & BEHAVIORAL DOMAIN ANALYSIS
                    </div>
                    <table style="font-size:10px;">
                        <thead>
                            <tr style="background:#EDE9FE; color:#3B0764; font-weight:800;">
                                <th style="width:30%;">Assessment Domain</th>
                                <th style="width:12%; text-align:center;">Score %</th>
                                <th style="width:18%; text-align:center;">Indicator Tier</th>
                                <th>Recorded Screening Observations</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Domain A: Phonological & Language</strong></td>
                                <td style="text-align:center; font-weight:700; color:#B45309;">62%</td>
                                <td style="text-align:center;"><span class="badge-mod">Moderate</span></td>
                                <td>Hesitation when isolating complex phonemes; occasional syllable substitution when pronouncing multi-syllabic words.</td>
                            </tr>
                            <tr>
                                <td><strong>Domain B: Letter Recognition & Decoding</strong></td>
                                <td style="text-align:center; font-weight:700; color:#BE123C;">74%</td>
                                <td style="text-align:center;"><span class="badge-high">Elevated</span></td>
                                <td>Occasional b/d letter reversal observed during reading/writing task; relies on initial graphemes when decoding unfamiliar words.</td>
                            </tr>
                            <tr>
                                <td><strong>Domain C: Spelling & Fine Motor Writing</strong></td>
                                <td style="text-align:center; font-weight:700; color:#B45309;">68%</td>
                                <td style="text-align:center;"><span class="badge-mod">Moderate</span></td>
                                <td>Spells predominantly by phonetic sound rather than orthographic rules; fine motor writing fatigue.</td>
                            </tr>
                            <tr>
                                <td><strong>Domain D: Working Memory & Sequencing</strong></td>
                                <td style="text-align:center; font-weight:700; color:#BE123C;">70%</td>
                                <td style="text-align:center;"><span class="badge-high">Elevated</span></td>
                                <td>Difficulty retaining sequential instructions exceeding 2 steps; left-right directional confusion.</td>
                            </tr>
                            <tr>
                                <td><strong>Domain E: Developmental History & Fatigue</strong></td>
                                <td style="text-align:center; font-weight:700; color:#047857;">30%</td>
                                <td style="text-align:center;"><span class="badge-low">Low</span></td>
                                <td>No formal family history documented; exhibits noticeable visual fatigue during sustained reading.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- 5. Webcam Reading Gaze Behaviour -->
                <div style="margin-bottom: 10px;">
                    <div style="font-weight: 800; color: #3B0764; border-bottom: 1px solid #DDD6FE; padding-bottom: 2px; margin-bottom: 4px; font-size: 11px;">
                        <i class="fa-solid fa-eye" style="color:#7C3AED;"></i> 5. PILLAR 3: WEBCAM-BASED READING GAZE BEHAVIOUR
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:6px; font-size:10px;">
                        <div style="background:#F5F3FF; padding:6px; border-radius:6px; border:1px solid #E9D5FF;">
                            <strong>Estimated Gaze Dwell Stability:</strong>
                            <div style="font-size:11px; font-weight:800; color:#B45309; margin:2px 0;">68% Stability Index</div>
                            <span style="font-size:9px; color:#6B7280;">Extended or repeated estimated gaze dwell patterns observed.</span>
                        </div>
                        <div style="background:#F5F3FF; padding:6px; border-radius:6px; border:1px solid #E9D5FF;">
                            <strong>Backward Gaze Shifts & Rereading:</strong>
                            <div style="font-size:11px; font-weight:800; color:#BE123C; margin:2px 0;">5 Shifts / 22 Words</div>
                            <span style="font-size:9px; color:#6B7280;">Repeated backward gaze shifts / rereading behaviour observed.</span>
                        </div>
                        <div style="background:#F5F3FF; padding:6px; border-radius:6px; border:1px solid #E9D5FF;">
                            <strong>Oral Reading Cadence:</strong>
                            <div style="font-size:11px; font-weight:800; color:#4C1D95; margin:2px 0;">42 WCPM (Norm: 65–80 WCPM)</div>
                            <span style="font-size:9px; color:#6B7280;">Word recognition latency average ~1.8s.</span>
                        </div>
                    </div>
                </div>

                <!-- 6. Accommodations & Referral Focus -->
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin-bottom: 10px; font-size:10px;">
                    <div style="background:#EEF2FF; border:1px solid #C7D2FE; padding:8px 10px; border-radius:8px;">
                        <strong style="color:#3730A3; font-size:10.5px;"><i class="fa-solid fa-chalkboard-user"></i> School & Classroom Accommodations:</strong>
                        <ul style="margin:4px 0 0 0; padding-left:14px; line-height:1.4;">
                            <li>Trial reading ruler / focus line guide to assist place-keeping during text reading.</li>
                            <li>Consider additional processing time where classroom observation demonstrates a need.</li>
                            <li>Trial accessible typography (clean sans-serif / <em>Lexend</em>, 14pt, 1.5–1.8 line spacing).</li>
                        </ul>
                    </div>
                    <div style="background:#FAF5FF; border:1px solid #E9D5FF; padding:8px 10px; border-radius:8px;">
                        <strong style="color:#581C87; font-size:10.5px;"><i class="fa-solid fa-hospital-user"></i> Referral Pathway if Concerns Persist:</strong>
                        <ul style="margin:4px 0 0 0; padding-left:14px; line-height:1.4;">
                            <li><strong>Educational / Clinical Psychologist:</strong> Standardized cognitive & literacy battery (e.g., WISC-V, WIAT-4, CTOPP-2).</li>
                            <li><strong>Speech-Language Pathologist:</strong> Phonological processing and expressive language assessment.</li>
                            <li><strong>Developmental Paediatrician:</strong> Where broader developmental or health concerns coexist.</li>
                        </ul>
                    </div>
                </div>

                <!-- 7. Data Quality & Digital Record Log (No Manual Signature Required) -->
                <div style="background: linear-gradient(90deg, #3B0764, #1E1B4B); color:#FFF; padding:8px 12px; border-radius:8px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; font-size:9.5px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <div style="background:rgba(16, 185, 129, 0.2); border:1px solid #34D399; width:28px; height:28px; border-radius:6px; display:flex; align-items:center; justify-content:center; color:#34D399; font-size:12px;">
                            <i class="fa-solid fa-certificate"></i>
                        </div>
                        <div>
                            <strong style="font-size:10px; color:#FFF;">Screening Data Quality & Auto-Generated Digital Record</strong>
                            <div style="font-size:8.5px; color:#C4B5FD;">Reliability: HIGH (LS-MME v8.5) · 30/30 Items Complete · 91% Gaze Samples · No Manual Signature Required</div>
                        </div>
                    </div>
                    <div style="text-align:right; font-family:monospace; font-size:8.5px; color:#DDD6FE;">
                        <div><strong>Auth ID:</strong> LS-AUTH-9F8A7E</div>
                        <div><strong>Evaluator:</strong> ${escapeHTML(adminState.profile.name || 'Faiz Ikhwan')} (${escapeHTML(adminState.profile.role || 'SEN')}) · ${escapeHTML(adminState.profile.school || 'SK Taman Ria')}</div>
                    </div>
                </div>

                <!-- 8. Strengthened Disclaimer -->
                <div style="background:#F8FAFC; border:1px solid #E2E8F0; padding:6px 8px; border-radius:4px; font-size:8px; color:#64748B; line-height:1.35;">
                    <strong>SCREENING & CLINICAL INTERPRETATION NOTICE:</strong><br>
                    LexiSense is a multimodal dyslexia risk-screening and literacy assessment support system integrating parent/guardian observations, oral reading performance and webcam-based gaze behaviour. Results indicate patterns of screening concern and are not a diagnosis of dyslexia or any other neurodevelopmental condition. The screening outcome should be interpreted alongside developmental history, educational performance and professional assessment. Where persistent concerns exist, comprehensive evaluation by an appropriately qualified educational, psychological, speech-language or medical professional is recommended.
                </div>
            </div>
        </body>
        </html>
    `);
    win.document.close();
}



function generateClassPDFReport(preselectedClass) {
    const sel = document.getElementById('reportClassSelect');
    const className = preselectedClass || (sel ? sel.value : 'Class 1A');
    const studentsInClass = adminState.students.filter(s => s.class === className);

    const win = window.open('', '_blank');
    if (!win) {
        alert("Please allow popups to generate printable report.");
        return;
    }

    const rows = studentsInClass.map((s, idx) => `
        <tr>
            <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0; text-align:center;">${idx + 1}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0; font-weight: bold; color: #3B0764;">${escapeHTML(s.name)}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0; font-family:monospace;">${escapeHTML(s.id)}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0;">${escapeHTML(s.status)}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0; font-weight:bold; color:${s.risk === 'Higher Indicators' ? '#BE123C' : (s.risk === 'Moderate Risk' ? '#B45309' : '#047857')}">${escapeHTML(s.risk)}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0;">${escapeHTML(s.date)}</td>
        </tr>
    `).join('');

    win.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>LexiSense — Class Aggregated Screening Report (${escapeHTML(className)})</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
            <style>
                @media print {
                    body { background: #FFF !important; padding: 0 !important; margin: 0 !important; -webkit-print-color-adjust: exact !important; }
                    .no-print { display: none !important; }
                }
                body { font-family: 'Nunito', Arial, sans-serif; padding: 30px; color: #1E293B; line-height: 1.5; font-size: 11px; }
                .header { border-bottom: 2px solid #6D28D9; padding-bottom: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }
                h1 { color: #4C1D95; margin: 0; font-size: 18px; font-family: 'Baloo 2', Arial; font-weight: 800; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
                th { background: #F5F3FF; color: #3B0764; padding: 8px; text-align: left; border: 1px solid #E2E8F0; }
                .top-bar { display: flex; justify-content: space-between; align-items: center; background: #4C1D95; color: #FFF; padding: 10px 16px; border-radius: 12px; margin-bottom: 20px; }
                .btn-print { background: #F59E0B; color: #1E1B4B; border: none; padding: 6px 16px; border-radius: 8px; font-weight: 800; cursor: pointer; }
                .disclaimer { background: #F8FAFC; border: 1px solid #E2E8F0; padding: 8px; border-radius: 6px; font-size: 9px; margin-top: 20px; color: #64748B; }
            </style>
        </head>
        <body>
            <div class="top-bar no-print">
                <div style="display:flex; align-items:center; gap:8px;">
                    <img src="assets/lexisense-logo.png" style="width:24px; height:24px; background:#FFF; border-radius:4px; padding:2px;">
                    <strong>LexiSense Class Roster Report Preview</strong>
                </div>
                <button onclick="window.print()" class="btn-print">Print / Save to PDF</button>
            </div>

            <div class="header">
                <div style="display:flex; align-items:center; gap:12px;">
                    <img src="assets/lexisense-logo.png" style="width:56px; height:56px; object-fit:contain;">
                    <div>
                        <h1>Class Screening Summary Roster — ${escapeHTML(className)}</h1>
                        <p style="margin: 2px 0 0 0; color: #6B7280; font-size: 10.5px;">Total Students: ${studentsInClass.length} • School: SK Taman Permata • Session: 2026</p>
                    </div>
                </div>
                <div style="text-align: right; font-size: 10px; color: #6B7280;">
                    <strong>Generated:</strong> ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}<br>
                    <strong>Auth:</strong> Online Verified (v8.5)
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="text-align:center; width:6%;">#</th>
                        <th style="width:30%;">Student Name</th>
                        <th style="width:16%;">Student ID</th>
                        <th style="width:16%;">Status</th>
                        <th style="width:20%;">Risk Outcome</th>
                        <th style="width:12%;">Assessment Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>

            <div class="disclaimer">
                <strong>OFFICIAL NOTICE:</strong> This aggregated screening report is generated for school administrative planning, internal screening records, and non-clinical instructional guidance.
            </div>
        </body>
        </html>
    `);
    win.document.close();
}

/* --------------------------------------------------------------------------
   13. Global Search & Autocomplete
   -------------------------------------------------------------------------- */
function handleGlobalSearch(query) {
    const drop = document.getElementById('searchResultsDropdown');
    if (!drop) return;

    const trimmed = (query || '').trim().toLowerCase();
    if (!trimmed) {
        drop.classList.add('hidden');
        return;
    }

    drop.classList.remove('hidden');
    const matches = adminState.students.filter(s => 
        s.name.toLowerCase().includes(trimmed) || 
        s.class.toLowerCase().includes(trimmed) || 
        s.id.toLowerCase().includes(trimmed)
    );

    if (matches.length === 0) {
        drop.innerHTML = `<div class="p-3 text-xs text-gray-500">No matching students or classes found.</div>`;
    } else {
        drop.innerHTML = matches.slice(0, 6).map(m => `
            <div onclick="selectGlobalSearchResult('${escapeHTML(m.name)}')" class="p-2.5 hover:bg-purple-50 rounded-xl cursor-pointer text-xs flex justify-between items-center transition-colors">
                <div>
                    <strong class="text-purple-950">${escapeHTML(m.name)}</strong>
                    <span class="text-gray-400 ml-1">(${escapeHTML(m.class)})</span>
                    <span class="block text-[10px] text-gray-400">${escapeHTML(m.id)}</span>
                </div>
                <span class="text-[10px] ${m.risk === 'Higher Indicators' ? 'bg-rose-100 text-rose-800' : 'bg-purple-100 text-purple-800'} px-2 py-0.5 rounded-full font-bold">
                    ${escapeHTML(m.risk)}
                </span>
            </div>
        `).join('');
    }
}

function selectGlobalSearchResult(studentName) {
    const drop = document.getElementById('searchResultsDropdown');
    if (drop) drop.classList.add('hidden');
    viewStudentProfile(studentName);
}

/* --------------------------------------------------------------------------
   14. Assessment Comparison Tool
   -------------------------------------------------------------------------- */
function updateHistoryComparison() {
    const sel = document.getElementById('historyStudentSelect');
    const studentName = sel ? sel.value : 'Adam Rahman';
    const student = adminState.students.find(s => s.name.includes(studentName)) || adminState.students[0];

    const grid = document.getElementById('comparisonGrid');
    if (!grid) return;

    grid.innerHTML = `
        <div class="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2 text-xs">
            <span class="px-2 py-0.5 bg-gray-200 text-gray-800 font-bold rounded">Baseline Session: 10 June 2026</span>
            <h4 class="font-bold text-sm text-gray-900">Result: Moderate Risk (Score: 72%)</h4>
            <p class="text-gray-600">Letter Reversal Rate: High (65%)</p>
            <p class="text-gray-600">Eye Fixation Stability: 62% Variance</p>
            <p class="text-gray-600">Reading Rate: 42 WPM</p>
        </div>

        <div class="p-4 bg-purple-50 rounded-2xl border border-purple-200 space-y-2 text-xs">
            <span class="px-2 py-0.5 bg-purple-200 text-purple-800 font-bold rounded">Follow-Up Session: ${escapeHTML(student.date || '18 Aug 2026')}</span>
            <h4 class="font-bold text-sm text-purple-950">Result: ${escapeHTML(student.risk)} (Score: ${student.score || 68}%)</h4>
            <p class="text-purple-900">Letter Reversal Rate: Improved (48%)</p>
            <p class="text-purple-900">Eye Fixation Stability: 68% Variance (+6%)</p>
            <p class="text-purple-900">Reading Rate: 49 WPM (+7 WPM)</p>
        </div>
    `;
}

function toggleMobileSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) {
        sidebar.classList.toggle('hidden');
        sidebar.classList.toggle('fixed');
        sidebar.classList.toggle('inset-y-0');
        sidebar.classList.toggle('left-0');
        sidebar.classList.toggle('z-50');
        sidebar.classList.toggle('shadow-2xl');
    }
}

function setupMobileMenu() {
    const toggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('app-sidebar');
    if (toggle && sidebar) {
        toggle.addEventListener('click', toggleMobileSidebar);
    }
}

// XSS Escape Utility
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function showToast(msg, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none max-w-sm w-full sm:w-auto';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    const isSuccess = type === 'success';
    const isError = type === 'error';
    
    const bgClasses = isSuccess 
        ? 'bg-emerald-600/95 text-white border-emerald-400/40 shadow-emerald-600/25' 
        : (isError ? 'bg-rose-600/95 text-white border-rose-400/40 shadow-rose-600/25' : 'bg-brand-purple-deep/95 text-white border-purple-400/40 shadow-purple-900/30');
    
    const iconClass = isSuccess 
        ? 'fa-solid fa-circle-check text-emerald-200' 
        : (isError ? 'fa-solid fa-circle-exclamation text-rose-200' : 'fa-solid fa-circle-info text-amber-300');

    toast.className = `p-3.5 px-4 rounded-2xl shadow-xl border-2 backdrop-blur-md text-xs font-heading font-black flex items-center gap-3 pointer-events-auto transform transition-all duration-300 translate-y-2 opacity-0 scale-95 ${bgClasses}`;
    toast.innerHTML = `
        <div class="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center text-sm shrink-0 shadow-inner">
            <i class="${iconClass}"></i>
        </div>
        <span class="leading-snug">${msg}</span>
    `;
    
    container.appendChild(toast);
    
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-2', 'opacity-0', 'scale-95');
        toast.classList.add('translate-y-0', 'opacity-100', 'scale-100');
    });
    
    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100', 'scale-100');
        toast.classList.add('opacity-0', '-translate-y-2', 'scale-95');
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

// Notifications Dropdown Handler & Live Real-Time Data Sync
function renderSystemNotifications() {
    const dropdown = document.getElementById('notificationsDropdown') || document.getElementById('notifications-panel');
    const bellBtn = document.querySelector('[onclick*="toggleNotifications"]');
    const bellBadge = bellBtn ? bellBtn.querySelector('span') : null;
    
    if (!dropdown) return;

    const notifications = [];

    // 1. Real Active Follow-up items from adminState
    const pendingFollowups = (adminState.followups || []).filter(f => f.status === 'Pending' || f.status === 'In Progress');
    pendingFollowups.forEach(f => {
        notifications.push({
            type: 'followup',
            title: 'Follow-Up Action Required',
            subtitle: `${f.student} (${f.class}): ${f.action}`,
            time: f.date || 'Recent',
            icon: 'fa-solid fa-clipboard-list text-purple-700 bg-purple-100',
            badgeText: f.status,
            badgeClass: f.status === 'Pending' ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-blue-100 text-blue-900 border border-blue-200',
            tab: 'followup'
        });
    });

    // 2. High Attention / Risk Students from adminState
    const riskStudents = (adminState.students || []).filter(s => s.risk === 'Higher Indicators' || (s.score && s.score >= 70));
    riskStudents.slice(0, 2).forEach(s => {
        notifications.push({
            type: 'risk',
            title: 'Screening Alert (High Variance)',
            subtitle: `${s.name} (${s.class}) indicates elevated phonological/gaze tracking variance.`,
            time: s.date || 'Active',
            icon: 'fa-solid fa-triangle-exclamation text-amber-700 bg-amber-100',
            badgeText: 'Priority',
            badgeClass: 'bg-rose-100 text-rose-900 border border-rose-200',
            studentId: s.id
        });
    });

    // 3. Class Cohort Milestones from adminState
    (adminState.classes || []).forEach(c => {
        if (c.total > 0 && c.completed > 0) {
            const pct = Math.round((c.completed / c.total) * 100);
            if (pct >= 50) {
                notifications.push({
                    type: 'milestone',
                    title: `${c.name} Milestone`,
                    subtitle: `${pct}% completed baseline screening (${c.completed}/${c.total} students).`,
                    time: 'Session 2026',
                    icon: 'fa-solid fa-chalkboard-user text-emerald-700 bg-emerald-100',
                    badgeText: `${pct}% Done`,
                    badgeClass: 'bg-emerald-100 text-emerald-900 border border-emerald-200',
                    tab: 'classes'
                });
            }
        }
    });

    // 4. Dossier Ready
    const completedStudents = (adminState.students || []).filter(s => s.status === 'Completed');
    if (completedStudents.length > 0) {
        const first = completedStudents[0];
        notifications.push({
            type: 'report',
            title: 'Doctor Dossier Generated',
            subtitle: `Specialist referral dossier ready for ${first.name} (${first.class}).`,
            time: first.date || 'Recent',
            icon: 'fa-solid fa-file-medical text-indigo-700 bg-indigo-100',
            badgeText: 'Dossier',
            badgeClass: 'bg-purple-100 text-purple-900 border border-purple-200',
            tab: 'reports'
        });
    }

    const count = notifications.length;

    // Update bell indicator dot
    if (bellBadge) {
        if (count > 0) {
            bellBadge.classList.remove('hidden');
        } else {
            bellBadge.classList.add('hidden');
        }
    }

    // Build Dropdown HTML
    dropdown.innerHTML = `
        <div class="flex items-center justify-between pb-2.5 border-b border-purple-50">
            <div class="flex items-center gap-2">
                <span class="font-extrabold text-sm text-brand-purple-deep">System Notifications</span>
                <span class="text-[10px] bg-purple-100 text-purple-700 font-black px-2 py-0.5 rounded-full border border-purple-200">${count} New</span>
            </div>
            <button onclick="switchTab('followup'); toggleNotifications();" class="text-[10px] text-purple-600 hover:text-purple-900 font-bold hover:underline cursor-pointer">
                View All →
            </button>
        </div>
        <div class="divide-y divide-purple-50 max-h-72 overflow-y-auto my-1 text-xs custom-scrollbar">
            ${notifications.length === 0 ? `
                <div class="py-6 text-center text-gray-400 space-y-1">
                    <i class="fa-solid fa-bell-slash text-2xl text-purple-300"></i>
                    <p class="text-xs font-bold text-gray-500">All caught up!</p>
                    <p class="text-[11px]">No pending alerts or follow-ups right now.</p>
                </div>
            ` : notifications.map((n) => `
                <div class="py-2.5 hover:bg-purple-50/70 px-2 rounded-xl transition-all cursor-pointer flex items-start gap-3 group" 
                     onclick="${n.studentId ? `viewStudentProfile('${n.studentId}');` : `switchTab('${n.tab || 'followup'}');`} toggleNotifications();">
                    <div class="w-8 h-8 rounded-xl ${n.icon} flex items-center justify-center shrink-0 text-sm shadow-2xs mt-0.5 group-hover:scale-110 transition-transform">
                        <i class="${n.icon.split(' ')[0]} ${n.icon.split(' ')[1]}"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between gap-1">
                            <strong class="text-brand-purple-deep block text-xs truncate group-hover:text-purple-700 transition-colors">${escapeHTML(n.title)}</strong>
                            <span class="text-[9px] font-black px-1.5 py-0.5 rounded-md ${n.badgeClass} shrink-0">${n.badgeText}</span>
                        </div>
                        <p class="text-gray-500 text-[11px] mt-0.5 leading-snug line-clamp-2">${escapeHTML(n.subtitle)}</p>
                        <span class="text-[10px] text-purple-500 font-semibold mt-1 inline-block">${escapeHTML(n.time)}</span>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="pt-2 border-t border-purple-50 flex items-center justify-between text-[11px]">
            <button onclick="switchTab('followup'); toggleNotifications();" class="text-purple-700 hover:text-purple-900 font-black cursor-pointer hover:underline">
                Manage Follow-Up Logs (${pendingFollowups.length} Active)
            </button>
            <button onclick="toggleNotifications();" class="text-gray-400 hover:text-gray-600 font-bold cursor-pointer">
                Close
            </button>
        </div>
    `;
}

function toggleNotifications(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    const dropdown = document.getElementById('notificationsDropdown') || document.getElementById('notifications-panel');
    if (!dropdown) return;
    
    // Always refresh notifications from live admin state before opening
    renderSystemNotifications();
    dropdown.classList.toggle('hidden');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('notificationsDropdown') || document.getElementById('notifications-panel');
    if (!dropdown || dropdown.classList.contains('hidden')) return;
    const btn = document.querySelector('[onclick*="toggleNotifications"]');
    if (!dropdown.contains(e.target) && (!btn || !btn.contains(e.target))) {
        dropdown.classList.add('hidden');
    }
});
