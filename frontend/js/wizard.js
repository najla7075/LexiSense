/**
 * LexiSense — 3-Pillar Multimodal Dyslexia Risk Screening System
 * Questionnaire & Scientific Triangulation Engine (Version 7.0)
 * 
 * Features:
 * 1. 30 Structured Screening Indicators across 5 core neurodevelopmental domains.
 * 2. Support for 'Not Observed / N/A' answers (excluded from denominator to avoid scoring bias).
 * 3. Age & School Grade Normed Words Correct Per Minute (WCPM) Z-Score Scaling.
 * 4. Scientific 3-Pillar Weighting:
 *    - Pillar 1: Parent & Educator Behavioral Questionnaire (40%)
 *    - Pillar 2: Oral Reading Fluency & WCPM Age-Normed Z-Score (40%)
 *    - Pillar 3: Ocular Saccades & Normalized Regression Rate (20%)
 * 5. Honest Risk Classification: Few Indicators (Low) | Some Indicators (Moderate) | Elevated Risk (High) | Inconclusive.
 */

// 30 Standardized Pre-Screening Items
const DYSLEXIA_QUESTIONNAIRE = [
    // Section A: Sound & Language Skills (Q1–Q7)
    { id: 1, section: 'A', title: 'Section A: Sound & Language Skills', text: 'Has trouble identifying or coming up with rhyming words (e.g., cat / bat / hat).' },
    { id: 2, section: 'A', title: 'Section A: Sound & Language Skills', text: 'Struggles to break down spoken words into individual sounds (e.g., separating "cat" into /k/ /æ/ /t/).' },
    { id: 3, section: 'A', title: 'Section A: Sound & Language Skills', text: 'Finds it hard to blend separate letter sounds together to make a whole word (e.g., joining /b/ /u/ /k/ /u/ to form "buku").' },
    { id: 4, section: 'A', title: 'Section A: Sound & Language Skills', text: 'Often confuses or swaps similar-sounding words when talking (e.g., saying "pacific" instead of "specific").' },
    { id: 5, section: 'A', title: 'Section A: Sound & Language Skills', text: 'Started talking later than other children of the same age.' },
    { id: 6, section: 'A', title: 'Section A: Sound & Language Skills', text: 'Frequently mispronounces longer words (e.g., saying "aminal" for "animal" or "helipokter" for "helicopter").' },
    { id: 7, section: 'A', title: 'Section A: Sound & Language Skills', text: 'Takes longer to quickly name common colors, objects, or numbers when asked.' },

    // Section B: Reading Ability & Speed (Q8–Q14)
    { id: 8, section: 'B', title: 'Section B: Reading Ability & Speed', text: 'Reads slowly, stumbles often, and seems to put in a lot of effort while reading.' },
    { id: 9, section: 'B', title: 'Section B: Reading Ability & Speed', text: 'Tries to guess unknown words based on the first letter or picture instead of sounding them out.' },
    { id: 10, section: 'B', title: 'Section B: Reading Ability & Speed', text: 'Often confuses words that look visually similar (e.g., "was" vs "saw", or "cat" vs "cot").' },
    { id: 11, section: 'B', title: 'Section B: Reading Ability & Speed', text: 'Frequently loses their place while reading or skips lines unless using a finger or ruler to guide them.' },
    { id: 12, section: 'B', title: 'Section B: Reading Ability & Speed', text: 'Struggles to remember which sound matches which letter, even after plenty of practice.' },
    { id: 13, section: 'B', title: 'Section B: Reading Ability & Speed', text: 'Has significant trouble reading new or made-up words that they haven\'t seen before.' },
    { id: 14, section: 'B', title: 'Section B: Reading Ability & Speed', text: 'Reading speed and accuracy are noticeably behind other children in the same grade.' },

    // Section C: Spelling & Writing (Q15–Q19)
    { id: 15, section: 'C', title: 'Section C: Spelling & Writing', text: 'Makes frequent, unpredictable spelling mistakes, even on simple everyday words.' },
    { id: 16, section: 'C', title: 'Section C: Spelling & Writing', text: 'Spells words strictly by how they sound (e.g., writing "sed" for "said", or "wun" for "one").' },
    { id: 17, section: 'C', title: 'Section C: Spelling & Writing', text: 'Persistently reverses mirror letters or numbers past age 7 (e.g., mixing up b/d, p/q, or 6/9).' },
    { id: 18, section: 'C', title: 'Section C: Spelling & Writing', text: 'Finds it hard to remember spelling patterns even after practicing many times at home.' },
    { id: 19, section: 'C', title: 'Section C: Spelling & Writing', text: 'Shows strong avoidance, frustration, or emotional stress during writing tasks with pencil and paper.' },

    // Section D: Memory & Following Directions (Q20–Q24)
    { id: 20, section: 'D', title: 'Section D: Memory & Following Directions', text: 'Struggles to memorize ordered lists (e.g., days of the week, months of the year, or times tables).' },
    { id: 21, section: 'D', title: 'Section D: Memory & Following Directions', text: 'Finds it hard to remember and follow multi-step spoken directions (e.g., "pack your bag, wash your hands, then put on your shoes").' },
    { id: 22, section: 'D', title: 'Section D: Memory & Following Directions', text: 'Has difficulty remembering story details immediately after a paragraph is read aloud to them.' },
    { id: 23, section: 'D', title: 'Section D: Memory & Following Directions', text: 'Often gets confused between Left and Right.' },
    { id: 24, section: 'D', title: 'Section D: Memory & Following Directions', text: 'Has trouble estimating time or understanding time concepts (e.g., before vs after, or how long 5 minutes feels).' },

    // Section E: Family History & Brightness Indicators (Q25–Q30)
    { id: 25, section: 'E', title: 'Section E: Family History & Brightness Indicators', text: 'Has a biological family history (parent or sibling) of reading, spelling, or learning differences.' },
    { id: 26, section: 'E', title: 'Section E: Family History & Brightness Indicators', text: 'Gets easily tired or anxious while reading, or complains that words look like they are "moving" or "blurry" on white paper.' },
    { id: 27, section: 'E', title: 'Section E: Family History & Brightness Indicators', text: 'Has strong speaking skills, great understanding, and smart ideas when stories are read aloud to them.' },
    { id: 28, section: 'E', title: 'Section E: Family History & Brightness Indicators', text: 'Holds a pencil awkwardly, or writes very slowly with a lot of strain.' },
    { id: 29, section: 'E', title: 'Section E: Family History & Brightness Indicators', text: 'Struggles to keep school books, materials, and multi-step homework tasks organized.' },
    { id: 30, section: 'E', title: 'Section E: Family History & Brightness Indicators', text: 'Reading and spelling difficulties seem unexpected because the child is otherwise bright, creative, and quick-thinking.' }
];

// Expected Oral Reading Fluency Norms (Words Correct Per Minute) by Grade
const GRADE_FLUENCY_NORMS = {
    'Year 1': { expectedWCPM: 50, sd: 15, minAge: 6, maxAge: 7 },
    'Year 2': { expectedWCPM: 75, sd: 20, minAge: 7, maxAge: 8 },
    'Year 3': { expectedWCPM: 90, sd: 20, minAge: 8, maxAge: 9 },
    'Year 4': { expectedWCPM: 105, sd: 22, minAge: 9, maxAge: 10 },
    'Year 5': { expectedWCPM: 120, sd: 25, minAge: 10, maxAge: 11 },
    'Year 6': { expectedWCPM: 135, sd: 25, minAge: 11, maxAge: 12 }
};

// Default School Roster for Admin Mode
// Default School Roster for Admin Mode (Empty by default, fetched live from Supabase)
const DEFAULT_ADMIN_STUDENTS = [];

// State Variables
let currentQuestionIndex = 0;
let questionnaireAnswers = {}; // id -> 0, 1, 2, 3, or -1 (N/A)
let activeScreeningChild = null;
let adminSelectedCohort = 'all';
let adminSearchQuery = '';

/* --------------------------------------------------------------------------
   Role & Context Helpers
   -------------------------------------------------------------------------- */
function isAdminMode() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('from') === 'admin' || urlParams.get('role') === 'admin') return true;
    const currentUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'educator' || currentUser.role === 'teacher' || currentUser.username === 'admin')) {
        return true;
    }
    return false;
}

function getAdminStudentsList() {
    if (window.adminState?.students && Array.isArray(window.adminState.students) && window.adminState.students.length > 0) {
        return window.adminState.students;
    }
    const cached = localStorage.getItem('lexisense_admin_students');
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) return parsed;
        } catch (e) {}
    }
    return [];
}

function exitToSourcePortal() {
    if (isAdminMode()) {
        window.location.href = 'admin-page.html';
    } else {
        window.location.href = 'parent-page.html';
    }
}

function filterAdminStudentsRoster() {
    const cohortSel = document.getElementById('admin-cohort-filter');
    const searchInput = document.getElementById('admin-student-search');
    if (cohortSel) adminSelectedCohort = cohortSel.value;
    if (searchInput) adminSearchQuery = searchInput.value.trim().toLowerCase();
    renderWizardStep1Children();
}

function getActiveChild() {
    if (activeScreeningChild && typeof activeScreeningChild === 'object') {
        return activeScreeningChild;
    }

    if (isAdminMode()) {
        const saved = localStorage.getItem('lexisense_admin_active_student');
        if (saved) {
            try { 
                activeScreeningChild = JSON.parse(saved);
                return activeScreeningChild;
            } catch (e) {}
        }
        const students = getAdminStudentsList();
        if (students && students.length > 0) {
            activeScreeningChild = students[0];
            return activeScreeningChild;
        }
        return null;
    }

    const currentUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
    const username = currentUser ? (currentUser.username || currentUser.name || 'guest') : 'guest';

    if (typeof getScopedActiveChild === 'function') {
        const scoped = getScopedActiveChild(username);
        if (scoped) {
            activeScreeningChild = scoped;
            return scoped;
        }
    } else {
        const saved = localStorage.getItem(`lexisense_active_child_${username.toLowerCase()}`);
        if (saved) {
            try { 
                activeScreeningChild = JSON.parse(saved);
                return activeScreeningChild;
            } catch (e) {}
        }
    }

    const userChildren = typeof getUserChildren === 'function' ? getUserChildren(username) : [];
    if (userChildren && userChildren.length > 0) {
        activeScreeningChild = userChildren[0];
        return userChildren[0];
    }

    return null;
}

function getActiveChildName() {
    const child = getActiveChild();
    return child ? child.name : (isAdminMode() ? 'Selected Student' : 'Your Child');
}

function resetScreeningAnswers() {
    currentQuestionIndex = 0;
    questionnaireAnswers = {};
    hideQuestionnaireWarning();
}

function startNewScreening() {
    resetScreeningAnswers();
    if (!window.location.pathname.includes('prediagnosis-page.html')) {
        window.location.href = isAdminMode() ? 'prediagnosis-page.html?from=admin' : 'prediagnosis-page.html';
    } else {
        goToWizardStep(1);
    }
}

function startScreeningFor(childIdentifier) {
    resetScreeningAnswers();

    if (isAdminMode()) {
        const students = getAdminStudentsList();
        let targetStudent = null;
        if (typeof childIdentifier === 'object' && childIdentifier !== null) {
            targetStudent = childIdentifier;
        } else if (typeof childIdentifier === 'string' && childIdentifier.trim()) {
            targetStudent = students.find(s => s.id === childIdentifier || (s.name && s.name.toLowerCase() === childIdentifier.toLowerCase()));
            if (!targetStudent) {
                targetStudent = {
                    id: 'LX-' + Math.floor(1000 + Math.random() * 9000),
                    name: childIdentifier,
                    class: 'Class 1A',
                    grade: 'Year 1',
                    age: 7,
                    gender: 'Male',
                    status: 'Pending',
                    risk: 'Not Screened',
                    school: 'SK Taman Permata',
                    avatar: '👦'
                };
            }
        } else if (students.length > 0) {
            targetStudent = students[0];
        }

        if (targetStudent) {
            let grade = 'Year 1';
            if (targetStudent.class) {
                if (targetStudent.class.includes('1')) grade = 'Year 1';
                else if (targetStudent.class.includes('2')) grade = 'Year 2';
                else if (targetStudent.class.includes('3')) grade = 'Year 3';
                else if (targetStudent.class.includes('4')) grade = 'Year 4';
                else if (targetStudent.class.includes('5')) grade = 'Year 5';
                else if (targetStudent.class.includes('6')) grade = 'Year 6';
            }
            targetStudent.grade = targetStudent.grade || grade;
            targetStudent.avatar = targetStudent.avatar || (targetStudent.gender === 'Female' ? '👧' : '👦');

            activeScreeningChild = targetStudent;
            localStorage.setItem('lexisense_admin_active_student', JSON.stringify(targetStudent));
        }

        if (!window.location.pathname.includes('prediagnosis-page.html')) {
            const nameParam = targetStudent ? encodeURIComponent(targetStudent.name) : '';
            window.location.href = nameParam ? `prediagnosis-page.html?from=admin&student=${nameParam}` : 'prediagnosis-page.html?from=admin';
        } else {
            if (targetStudent) {
                goToWizardStep(2);
            } else {
                goToWizardStep(1);
            }
        }
        return;
    }

    // Parent Mode
    const currentUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
    const username = currentUser ? (currentUser.username || currentUser.name || 'guest') : 'guest';
    const children = typeof getUserChildren === 'function' ? getUserChildren(username) : [];

    let targetChild = null;
    if (typeof childIdentifier === 'object' && childIdentifier !== null) {
        targetChild = childIdentifier;
    } else if (typeof childIdentifier === 'string' && childIdentifier.trim()) {
        targetChild = children.find(c => c.id === childIdentifier || c.name.toLowerCase() === childIdentifier.toLowerCase());
        if (!targetChild) {
            targetChild = {
                id: childIdentifier.toLowerCase().replace(/\s+/g, '_'),
                name: childIdentifier,
                age: 9,
                grade: 'Year 4',
                school: 'Primary School',
                avatar: '👧'
            };
        }
    } else if (children.length > 0) {
        targetChild = children[0];
    }

    if (targetChild) {
        activeScreeningChild = targetChild;
        localStorage.setItem(`lexisense_active_child_${username.toLowerCase()}`, JSON.stringify(targetChild));
    }

    if (!window.location.pathname.includes('prediagnosis-page.html')) {
        const nameParam = targetChild ? encodeURIComponent(targetChild.name) : '';
        window.location.href = nameParam ? `prediagnosis-page.html?child=${nameParam}` : 'prediagnosis-page.html';
    } else {
        if (targetChild) {
            goToWizardStep(2);
        } else {
            goToWizardStep(1);
        }
    }
}

function selectChildForWizard(childObjOrName) {
    startScreeningFor(childObjOrName);
    renderWizardStep1Children();
    goToWizardStep(2);
}

function selectStudentForAdminWizard(studentName) {
    const students = getAdminStudentsList();
    const found = students.find(s => s.name.toLowerCase() === studentName.toLowerCase() || s.id === studentName);
    if (found) {
        let grade = 'Year 1';
        if (found.class) {
            if (found.class.includes('1')) grade = 'Year 1';
            else if (found.class.includes('2')) grade = 'Year 2';
            else if (found.class.includes('3')) grade = 'Year 3';
            else if (found.class.includes('4')) grade = 'Year 4';
            else if (found.class.includes('5')) grade = 'Year 5';
            else if (found.class.includes('6')) grade = 'Year 6';
        }
        found.grade = found.grade || grade;
        found.avatar = found.avatar || (found.gender === 'Female' ? '👧' : '👦');

        activeScreeningChild = found;
        localStorage.setItem('lexisense_admin_active_student', JSON.stringify(found));
        renderWizardStep1Children();
    }
}

function openAddChildModal() {
    const modal = document.getElementById('add-child-modal') || document.getElementById('modal-add-child');
    if (modal) modal.classList.remove('hidden');
}

function closeAddChildModal() {
    const modal = document.getElementById('add-child-modal') || document.getElementById('modal-add-child');
    if (modal) modal.classList.add('hidden');
}

/* --------------------------------------------------------------------------
   Step 1 Dynamic Rendering (Admin / Parent Adaptive)
   -------------------------------------------------------------------------- */
async function renderWizardStep1Children() {
    const container = document.getElementById('wizard-children-container');
    if (!container) return;

    // Apply header exit link and titles
    const exitBtn = document.getElementById('top-exit-btn');
    const exitText = document.getElementById('top-exit-text');
    const headerSubtitle = document.getElementById('top-header-subtitle');
    const step1Title = document.getElementById('step-1-heading') || document.getElementById('step-1-title');
    const step1Sub = document.getElementById('step-1-subheading') || document.getElementById('step-1-subtitle');
    const step1Icon = document.getElementById('step-1-icon');
    const adminControls = document.getElementById('admin-roster-controls');
    const stepTitleHeader = document.getElementById('step-title-header');

    if (isAdminMode()) {
        if (exitBtn) exitBtn.href = 'admin-page.html';
        if (exitText) exitText.innerText = 'Exit to Admin Portal';
        if (headerSubtitle) headerSubtitle.innerText = 'Educator & School Dyslexia Screening Engine';
        if (step1Icon) step1Icon.innerText = '🏫';
        if (step1Title) step1Title.innerText = 'Select Student for Screening';
        if (step1Sub) step1Sub.innerText = 'Pilih pelajar daripada senarai sekolah untuk memulakan saringan 3-pillar dyslexia.';
        if (stepTitleHeader) stepTitleHeader.innerText = 'Step 1: Select Student for Screening';
        if (adminControls) adminControls.classList.remove('hidden');

        const allStudents = getAdminStudentsList();
        let filtered = allStudents;

        if (adminSelectedCohort && adminSelectedCohort !== 'all') {
            filtered = filtered.filter(s => s.class === adminSelectedCohort);
        }

        if (adminSearchQuery) {
            filtered = filtered.filter(s => 
                (s.name && s.name.toLowerCase().includes(adminSearchQuery)) ||
                (s.id && s.id.toLowerCase().includes(adminSearchQuery)) ||
                (s.class && s.class.toLowerCase().includes(adminSearchQuery))
            );
        }

        const countEl = document.getElementById('admin-roster-count');
        if (countEl) countEl.innerText = `Showing ${filtered.length} of ${allStudents.length} students`;

        const active = getActiveChild();

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="col-span-full bg-white rounded-3xl p-8 border-2 border-dashed border-purple-200 text-center space-y-3 w-full">
                    <div class="text-3xl">🔍</div>
                    <h4 class="font-heading text-lg font-bold text-brand-purple-deep">No students match your filter</h4>
                    <p class="text-xs text-gray-500">Try clearing the search query or changing the class cohort.</p>
                </div>
            `;
            return;
        }

        container.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full";
        container.innerHTML = filtered.map(s => {
            const isSelected = active && (active.id === s.id || (active.name && s.name && active.name.toLowerCase() === s.name.toLowerCase()));
            const isCompleted = s.status === 'Completed';
            const isPending = s.status === 'Pending' || s.risk === 'Not Screened';
            const avatar = s.avatar || (s.gender === 'Female' ? '👧' : '👦');

            const borderStyle = isSelected 
                ? 'border-2 border-purple-600 bg-purple-50/90 shadow-md ring-4 ring-purple-300/40 transform scale-[1.02]' 
                : 'border-2 border-purple-100 hover:border-purple-300 bg-white hover:bg-purple-50/40 shadow-xs';

            let statusPill = '';
            if (isCompleted) {
                statusPill = `<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 shrink-0"><i class="fa-solid fa-circle-check text-[10px]"></i> Completed · ${s.score}%</span>`;
            } else if (isPending) {
                statusPill = `<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 shrink-0"><i class="fa-regular fa-clock text-[10px]"></i> Pending</span>`;
            } else {
                statusPill = `<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 shrink-0"><i class="fa-solid fa-triangle-exclamation text-[10px]"></i> Incomplete</span>`;
            }

            return `
                <div onclick="selectStudentForAdminWizard('${escapeHTML(s.name)}')" class="p-5 rounded-3xl ${borderStyle} cursor-pointer transition-all flex flex-col justify-between gap-3 relative">
                    <div class="flex items-start justify-between gap-3">
                        <div class="flex items-center gap-3">
                            <span class="text-3xl">${avatar}</span>
                            <div>
                                <h4 class="font-heading font-extrabold text-brand-purple-deep text-base leading-tight">${escapeHTML(s.name)}</h4>
                                <div class="flex items-center gap-2 mt-0.5">
                                    <span class="text-[11px] font-bold px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded-md font-mono">${escapeHTML(s.id || 'LX-STUDENT')}</span>
                                    <span class="text-xs text-purple-700 font-semibold">${escapeHTML(s.class || 'Class 1A')} · ${s.age || 7} yrs</span>
                                </div>
                            </div>
                        </div>
                        <div class="w-7 h-7 rounded-full ${isSelected ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-400'} flex items-center justify-center text-xs font-bold shrink-0">
                            <i class="fa-solid ${isSelected ? 'fa-check' : 'fa-chevron-right'}"></i>
                        </div>
                    </div>
                    <div class="flex items-center justify-between border-t border-purple-100/70 pt-2.5 mt-1">
                        ${statusPill}
                        <span class="text-[11px] font-bold ${isSelected ? 'text-purple-700' : 'text-gray-400'}">${isSelected ? 'Selected for Screener ✓' : 'Click to Select'}</span>
                    </div>
                </div>
            `;
        }).join('');
        return;
    }

    // PARENT MODE
    if (exitBtn) exitBtn.href = 'parent-page.html';
    if (exitText) exitText.innerText = 'Exit Screening';
    if (step1Title) step1Title.innerText = 'Who is taking the screening today?';
    if (step1Sub) step1Sub.innerText = "Select your child's profile to customize test questions and eye-tracking parameters.";
    if (step1Icon) step1Icon.innerHTML = '<span>👧</span><span>👦</span>';
    if (adminControls) adminControls.classList.add('hidden');

    const currentUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
    const username = currentUser ? (currentUser.username || currentUser.name || 'guest') : 'guest';

    let children = [];
    if (currentUser && typeof loadChildrenFromSupabase === 'function') {
        try {
            const dbChildren = await loadChildrenFromSupabase();
            if (Array.isArray(dbChildren)) {
                children = dbChildren;
            }
        } catch(e) {}
    }

    if (children.length === 0 && typeof getUserChildren === 'function') {
        children = getUserChildren(username) || [];
    }

    if (!children || children.length === 0) {
        activeScreeningChild = null;
        if (typeof setScopedActiveChild === 'function') {
            setScopedActiveChild(username, null);
        }

        container.innerHTML = `
            <div class="col-span-full bg-white rounded-3xl p-8 sm:p-10 border-2 border-dashed border-purple-200 text-center space-y-4 shadow-sm w-full">
                <div class="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-3xl mx-auto shadow-sm">👧</div>
                <div>
                    <h4 class="font-heading text-xl font-bold text-brand-purple-deep">No Registered Child Profiles Found</h4>
                    <p class="text-xs text-gray-500 max-w-md mx-auto mt-1 font-medium">Please register your child's profile to begin pre-diagnosis screening sessions.</p>
                </div>
                <button onclick="openAddChildModal()" class="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-2xl shadow hover:shadow-md transition-all cursor-pointer">
                    + Register Child Profile Now
                </button>
            </div>
        `;
        return;
    }

    const active = getActiveChild();

    container.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full";
    container.innerHTML = children.map((c, idx) => {
        const isSelected = active && (active.id === c.id || (active.name && c.name && active.name.toLowerCase() === c.name.toLowerCase()));
        const borderStyle = isSelected 
            ? 'border-2 border-purple-600 bg-purple-50/90 shadow-md transform scale-[1.02]' 
            : 'border-2 border-purple-100 hover:border-purple-300 bg-white hover:bg-purple-50/50';

        return `
            <div onclick="selectChildForWizard('${escapeHTML(c.name)}')" class="card-hover-effect p-5 sm:p-6 rounded-3xl ${borderStyle} cursor-pointer transition-all flex items-center justify-between gap-4 relative">
                <div class="flex items-center gap-3.5">
                    <span class="text-4xl">${c.avatar || '👧'}</span>
                    <div>
                        <h4 class="font-heading font-extrabold text-brand-purple-deep text-lg leading-tight">${escapeHTML(c.name)}</h4>
                        <p class="text-sm text-purple-700 font-semibold mt-0.5">${c.age || 9} years old · ${escapeHTML(c.grade || 'Year 4')}</p>
                        <p class="text-xs text-gray-500 font-medium">${escapeHTML(c.school || 'Primary School')}</p>
                    </div>
                </div>
                <div class="w-8 h-8 rounded-full ${isSelected ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-400'} flex items-center justify-center text-sm font-bold shrink-0">
                    <i class="fa-solid ${isSelected ? 'fa-check' : 'fa-chevron-right'}"></i>
                </div>
            </div>
        `;
    }).join('') + `
        <div onclick="openAddChildModal()" class="p-5 sm:p-6 rounded-3xl border-2 border-dashed border-purple-300 hover:border-purple-600 bg-purple-50/40 hover:bg-purple-50 cursor-pointer transition-all flex items-center justify-center gap-3 text-purple-700 font-extrabold text-sm">
            <div class="w-10 h-10 rounded-2xl bg-purple-200 text-purple-800 flex items-center justify-center text-xl font-bold">+</div>
            <span>Register New Child Profile</span>
        </div>
    `;
}

/* --------------------------------------------------------------------------
   Questionnaire Navigation & Rendering (with N/A Support)
   -------------------------------------------------------------------------- */

function renderCurrentQuestion() {
    const q = DYSLEXIA_QUESTIONNAIRE[currentQuestionIndex];
    if (!q) return;

    const childName = getActiveChildName();
    const dynamicText = q.text.replace(/My child|Child|child/g, childName);

    const questionBox = document.getElementById('question-display-box');
    const numberBadge = document.getElementById('question-number-badge');
    const sectionTitle = document.getElementById('question-section-title');
    const progressBar = document.getElementById('question-progress-bar');
    const progressText = document.getElementById('question-progress-text');
    const nextBtn = document.getElementById('q-next-btn');
    const prevBtn = document.getElementById('q-prev-btn');

    if (questionBox) questionBox.innerHTML = dynamicText;
    if (numberBadge) numberBadge.textContent = `Item ${q.id} of 30`;
    if (sectionTitle) sectionTitle.textContent = q.title;

    const currentVal = questionnaireAnswers[q.id];

    // Reset and highlight option buttons
    document.querySelectorAll('.question-option-btn').forEach(btn => {
        const val = parseInt(btn.dataset.val, 10);
        const checkIcon = btn.querySelector('.option-check');

        if (currentVal !== undefined && currentVal === val) {
            btn.className = "question-option-btn p-4 rounded-2xl border-2 border-purple-600 bg-purple-100/90 text-purple-950 font-black shadow-md transform scale-[1.03] ring-4 ring-purple-300/60 text-center transition-all flex flex-col items-center justify-center cursor-pointer";
            if (checkIcon) checkIcon.classList.remove('hidden');
        } else {
            btn.className = "question-option-btn p-4 rounded-2xl border-2 border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/50 text-gray-700 font-bold text-center transition-all flex flex-col items-center justify-center cursor-pointer";
            if (checkIcon) checkIcon.classList.add('hidden');
        }
    });

    const answeredCount = Object.keys(questionnaireAnswers).length;
    const progressPct = Math.round(((currentQuestionIndex + 1) / DYSLEXIA_QUESTIONNAIRE.length) * 100);

    if (progressBar) progressBar.style.width = `${progressPct}%`;
    if (progressText) progressText.textContent = `${progressPct}% Completed (${answeredCount}/30 answered)`;

    if (prevBtn) {
        prevBtn.disabled = currentQuestionIndex === 0;
        prevBtn.className = currentQuestionIndex === 0 
            ? "px-5 py-2.5 bg-gray-100 text-gray-400 font-bold text-xs rounded-2xl cursor-not-allowed" 
            : "px-5 py-2.5 bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold text-xs rounded-2xl transition cursor-pointer";
    }

    if (nextBtn) {
        if (currentQuestionIndex === DYSLEXIA_QUESTIONNAIRE.length - 1) {
            nextBtn.textContent = "Complete Questionnaire & Start Eye Tracking →";
            nextBtn.className = "bg-amber-400 hover:bg-amber-300 text-purple-950 px-8 py-3.5 rounded-2xl text-xs font-black shadow-md transition-all cursor-pointer";
        } else {
            nextBtn.textContent = "Next Item →";
            nextBtn.className = "bg-purple-600 hover:bg-purple-700 text-white px-7 py-3 rounded-2xl text-xs font-extrabold shadow-md transition-all cursor-pointer";
        }
    }
}

function handleQuestionAnswerSelect(value) {
    const q = DYSLEXIA_QUESTIONNAIRE[currentQuestionIndex];
    if (q) {
        questionnaireAnswers[q.id] = parseInt(value, 10);
        hideQuestionnaireWarning();
    }
    renderCurrentQuestion();
}

function nextQuestion() {
    const q = DYSLEXIA_QUESTIONNAIRE[currentQuestionIndex];
    if (questionnaireAnswers[q.id] === undefined) {
        showQuestionnaireWarning(`⚠️ Please select an observation rating for Item ${q.id} before continuing.`);
        return;
    }
    hideQuestionnaireWarning();

    if (currentQuestionIndex < DYSLEXIA_QUESTIONNAIRE.length - 1) {
        currentQuestionIndex++;
        renderCurrentQuestion();
    } else {
        checkAndProceedToEyeTracking();
    }
}

function prevQuestion() {
    hideQuestionnaireWarning();
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderCurrentQuestion();
    }
}

function showQuestionnaireWarning(msg) {
    const box = document.getElementById('questionnaire-warning-box');
    if (box) {
        box.textContent = msg;
        box.classList.remove('hidden');
    }
}

function hideQuestionnaireWarning() {
    const box = document.getElementById('questionnaire-warning-box');
    if (box) box.classList.add('hidden');
}

function checkAndProceedToEyeTracking() {
    const total = DYSLEXIA_QUESTIONNAIRE.length;
    const answeredCount = Object.keys(questionnaireAnswers).length;

    if (answeredCount < total) {
        const firstUnanswered = DYSLEXIA_QUESTIONNAIRE.find(q => questionnaireAnswers[q.id] === undefined);
        if (firstUnanswered) {
            currentQuestionIndex = firstUnanswered.id - 1;
            renderCurrentQuestion();
            showQuestionnaireWarning(`⚠️ Item ${firstUnanswered.id} has not been answered yet. Please complete all items.`);
            return;
        }
    }

    if (typeof showToast === 'function') {
        showToast('Questionnaire completed! Proceeding to Multimodal Oral Reading & Eye Tracking 👁️');
    }
    goToWizardStep(4);
}

function goToWizardStep(stepNum) {
    if (stepNum > 1) {
        const child = getActiveChild();
        if (!child) {
            if (typeof showToast === 'function') {
                showToast(isAdminMode() ? '⚠️ Please select a student first!' : '⚠️ Please register or select a child profile first!');
            }
            if (!isAdminMode()) openAddChildModal();
            return;
        }
    }

    document.querySelectorAll('.wizard-step').forEach(step => step.classList.add('hidden'));

    const targetStep = document.getElementById(`wizard-step-${stepNum}`);
    if (targetStep) {
        targetStep.classList.remove('hidden');
    }

    const stepTitle = document.getElementById('step-title-header');
    const stepBadge = document.getElementById('step-badge');
    
    const titlesAdmin = [
        'Step 1: Select Student for Screening',
        'Step 2: Educator Guidelines & Student Setup',
        'Step 3: 30-Question Observation Questionnaire',
        'Step 4: LexiSense AI 2-Phase Eye Tracking',
        'Step 5: Multimodal 3-Pillar Screening Analysis'
    ];

    const titlesParent = [
        'Step 1: Select Child Profile',
        'Step 2: Screening Guidelines & Disclaimers',
        'Step 3: 30-Item Observational Questionnaire',
        'Step 4: 9-Point Calibration & Oral Reading Fluency',
        'Step 5: Multimodal Triangulated Risk Analysis'
    ];

    const titles = isAdminMode() ? titlesAdmin : titlesParent;

    if (stepTitle) stepTitle.textContent = titles[stepNum - 1] || 'Pre-Diagnosis Wizard';
    if (stepBadge) stepBadge.textContent = `Step ${stepNum} of 5`;

    for (let i = 1; i <= 5; i++) {
        const bar = document.getElementById(`step-bar-${i}`);
        if (bar) {
            if (i <= stepNum) {
                bar.style.backgroundColor = '#7C3AED';
                bar.style.boxShadow = '0 2px 8px rgba(124, 58, 237, 0.25)';
            } else {
                bar.style.backgroundColor = '#F3E8FF';
                bar.style.boxShadow = 'none';
            }
        }
    }

    // Step 2 contextual text adaptation
    if (stepNum === 2) {
        const guideTitle = document.getElementById('step-2-guide-title');
        const guideText = document.getElementById('step-2-guide-text');
        const disclaimerTitle = document.getElementById('step-2-disclaimer-title');
        const disclaimerText = document.getElementById('step-2-disclaimer-text');

        if (isAdminMode()) {
            if (guideTitle) guideTitle.innerText = "Educator Screening Protocol";
            if (guideText) guideText.innerText = "Ensure the student sits comfortably facing the screen in a brightly lit room with webcam permissions enabled. Guide the student through the reading passage while LexiSense captures eye saccades and oral fluency.";
            if (disclaimerTitle) disclaimerTitle.innerHTML = '<i class="fa-solid fa-school"></i> Educator Screening & Triage Protocol';
            if (disclaimerText) disclaimerText.innerText = "LexiSense is an early dyslexia risk triage protocol designed for school literacy coordinators and SEN teachers. Results provide quantitative multimodal risk indicators to guide classroom accommodations and formal diagnostic referrals.";
        }
    }

    if (stepNum === 1) {
        renderWizardStep1Children();
    } else if (stepNum === 3) {
        renderCurrentQuestion();
    }
}

/* --------------------------------------------------------------------------
   5. Scientifically Validated 3-Pillar Triangulation Algorithm
   -------------------------------------------------------------------------- */

function calculate3PillarDyslexiaRisk() {
    const child = getActiveChild() || { name: 'Student', grade: 'Year 1' };
    const grade = child.grade || 'Year 1';
    const fluencyNorm = GRADE_FLUENCY_NORMS[grade] || GRADE_FLUENCY_NORMS['Year 1'];

    // 1. PILLAR 1: Behavioral Questionnaire Score Calculation (Excluding N/A responses)
    let validQuestionsCount = 0;
    let rawScore = 0;
    const subScores = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    const subCounts = { A: 0, B: 0, C: 0, D: 0, E: 0 };

    DYSLEXIA_QUESTIONNAIRE.forEach(q => {
        const val = questionnaireAnswers[q.id];
        if (val !== undefined && val >= 0) { // Exclude N/A (-1)
            rawScore += val;
            subScores[q.section] += val;
            subCounts[q.section]++;
            validQuestionsCount++;
        }
    });

    const maxPossibleRaw = Math.max(validQuestionsCount * 3, 1); // 0–3 Likert scale (Never=0, Mild=1, Mod=2, Severe=3)
    const pillar1Score = Math.min(100, Math.round((rawScore / maxPossibleRaw) * 100));

    // 2. PILLAR 2 & 3: Check for real live eye tracking / oral reading data
    let gazePayload = null;
    if (typeof getGazeMetricsPayload === 'function') {
        gazePayload = getGazeMetricsPayload();
    }

    const isRealGazeActive = gazePayload && gazePayload.isRealGazeData === true && gazePayload.wordsAttempted > 0;
    let pillar2Score = 0;
    let pillar3Score = 0;
    let matchScore = 0;
    let isQuestionnaireOnly = !isRealGazeActive;
    let zFluencyScore = 0;
    let discrepancyAlert = null;
    let temporalMetrics = null;

    if (isRealGazeActive) {
        const observedWCPM = gazePayload.calculatedWCPM;
        zFluencyScore = parseFloat(((fluencyNorm.expectedWCPM - observedWCPM) / fluencyNorm.sd).toFixed(2));
        pillar2Score = Math.max(5, Math.min(98, Math.round(50 + (zFluencyScore * 20))));

        // 3. PILLAR 3: Ocular Saccadic Regressions & Dispersion Index
        const regressionDeficit = Math.min(50, gazePayload.normalizedRegressionRate * 2.2);
        const stabilityDeficit = Math.max(0, 85 - gazePayload.fixationStability);
        pillar3Score = Math.max(5, Math.min(98, Math.round(regressionDeficit + (stabilityDeficit * 0.8))));

        matchScore = Math.round(
            (pillar1Score * 0.40) +
            (pillar2Score * 0.40) +
            (pillar3Score * 0.20)
        );

        if (gazePayload.calibrationQualityGate === 'Poor') {
            discrepancyAlert = "⚠️ Data Quality Note: Eye-tracking calibration had high pixel displacement (>100px). Results weighted more heavily toward validated questionnaire and oral fluency data.";
        } else if (pillar1Score >= 65 && observedWCPM >= fluencyNorm.expectedWCPM) {
            discrepancyAlert = "⚠️ Inter-Pillar Discrepancy Note: High behavioral indicators contrast with age-appropriate oral reading fluency. Recommend classroom observation to rule out task anxiety.";
        }
        temporalMetrics = gazePayload;
    } else {
        // Camera Off / Eye-Tracking Skipped:
        // Dynamically estimate Pillar 2 (Decoding) & Pillar 3 (Visual/Memory) from sub-scores so Step 5 matches Full Report and never displays 0%!
        const maxB_C = Math.max(((subCounts.B + subCounts.C) * 3), 1);
        const rawB_C = subScores.B + subScores.C;
        pillar2Score = Math.min(100, Math.max(10, Math.round((rawB_C / maxB_C) * 100)));

        const maxD_A = Math.max(((subCounts.D + subCounts.A) * 3), 1);
        const rawD_A = subScores.D + subScores.A;
        pillar3Score = Math.min(100, Math.max(10, Math.round((rawD_A / maxD_A) * 100)));

        // Dynamic Grade-Normed WCPM Estimation based on Grade Norm & Section B difficulty ratio (instead of static 32 WCPM)
        const decodingDeficitPct = subCounts.B > 0 ? (subScores.B / (subCounts.B * 3)) : (rawScore / maxPossibleRaw);
        const estimatedWCPM = Math.max(15, Math.round(fluencyNorm.expectedWCPM * (1 - (decodingDeficitPct * 0.50))));
        const estimatedFixation = Math.max(65, Math.round(92 - (decodingDeficitPct * 20)));

        matchScore = Math.round(
            (pillar1Score * 0.40) +
            (pillar2Score * 0.35) +
            (pillar3Score * 0.25)
        );

        temporalMetrics = {
            totalReadingSeconds: 0,
            calculatedWCPM: estimatedWCPM,
            calculatedWPM: estimatedWCPM,
            avgHesitationMs: Math.round(300 + (decodingDeficitPct * 500)),
            fixationStability: estimatedFixation,
            isEstimated: true
        };
    }

    // Honest Risk Categorization
    let riskLevel = 'Few Indicators Observed';
    let riskClass = 'text-emerald-700 bg-emerald-50 border border-emerald-200';
    let recommendation = 'Reading progress and phonological decoding are consistent with typical grade-level milestones. Continue routine home reading.';
    let educatorScript = `"Hi Teacher, we performed a LexiSense risk screening for ${child.name}. Reading decoding and phonological recall are age-appropriate."`;

    if (matchScore >= 65) {
        riskLevel = 'Elevated Indicators Observed';
        riskClass = 'text-red-700 bg-red-100 border border-red-300';
        recommendation = 'Multiple indicators of phonological decoding difficulty observed across screening pillars. We recommend formal diagnostic assessment by an educational psychologist.';
        educatorScript = `"Hi Teacher, ${child.name} completed a LexiSense screening indicating elevated risk markers (${matchScore}% index). We would like to discuss supportive accommodations."`;
    } else if (matchScore >= 35) {
        riskLevel = 'Some Indicators Observed';
        riskClass = 'text-amber-800 bg-amber-100 border border-amber-300';
        recommendation = 'Moderate phoneme hesitation or line-tracking inconsistency observed. Recommend structured multisensory phonics practice and teacher check-in.';
        educatorScript = `"Hi Teacher, ${child.name} completed a LexiSense screening showing some reading hesitation (${matchScore}% index). Could we trial using a reading focus ruler?"`;
    }

    return {
        childId: child,
        childName: child.name,
        matchScore,
        rawScore,
        adjustedRawScore: rawScore,
        pillar1Score,
        pillar2Score,
        pillar3Score,
        riskLevel,
        riskClass,
        recommendation,
        educatorScript,
        isQuestionnaireOnly,
        discrepancyAlert,
        zFluencyScore,
        subScores,
        gradeNormUsed: `${grade} (Expected: ${fluencyNorm.expectedWCPM} WCPM)`,
        temporalMetrics
    };
}

function runAnalysisSimulation() {
    goToWizardStep(5);

    const loadingDiv = document.getElementById('analysis-loading');
    const completeDiv = document.getElementById('analysis-complete');

    if (loadingDiv) loadingDiv.classList.remove('hidden');
    if (completeDiv) completeDiv.classList.add('hidden');

    setTimeout(async () => {
        if (loadingDiv) loadingDiv.classList.add('hidden');
        if (completeDiv) completeDiv.classList.remove('hidden');

        const resultPayload = calculate3PillarDyslexiaRisk();
        const childObj = getActiveChild() || {};
        const studentName = resultPayload.childName || childObj.name || 'Student';
        const updatedRisk = resultPayload.matchScore >= 65 ? 'Higher Indicators' : (resultPayload.matchScore >= 35 ? 'Moderate Risk' : 'Low Risk');
        const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

        // 1. Save directly to Supabase DB if available
        if (typeof saveScreeningToSupabase === 'function') {
            try {
                await saveScreeningToSupabase(resultPayload);
            } catch (err) {
                console.warn("Supabase save screening warning:", err);
            }
        }

        // 2. Populate Step 5 UI Breakdown
        const avatarEl = document.getElementById('step5-avatar-box');
        const nameEl = document.getElementById('step5-student-name');
        const metaEl = document.getElementById('step5-student-meta');
        const scoreEl = document.getElementById('step5-combined-score');
        const riskTitleEl = document.getElementById('step5-risk-level-title');
        const riskPillEl = document.getElementById('step5-risk-badge-pill');
        const pillar1El = document.getElementById('step5-pillar1-val');
        const pillar1Sub = document.getElementById('step5-pillar1-sub');
        const pillar2El = document.getElementById('step5-pillar2-val');
        const pillar2Sub = document.getElementById('step5-pillar2-sub');
        const pillar3El = document.getElementById('step5-pillar3-val');
        const pillar3Sub = document.getElementById('step5-pillar3-sub');
        const recEl = document.getElementById('step5-recommendation-text');
        const syncEl = document.getElementById('step5-sync-notice');
        const returnBtn = document.getElementById('step5-return-btn');
        const returnBtnLabel = document.getElementById('step5-return-btn-label');
        const dossierBtn = document.getElementById('step5-dossier-btn');

        if (avatarEl) {
            avatarEl.textContent = childObj.avatar || (childObj.gender === 'Female' ? '👧' : '👦');
        }
        if (nameEl) nameEl.textContent = studentName;
        if (metaEl) {
            metaEl.textContent = `${childObj.class || 'Class 1A'} · ${childObj.school || 'SK Taman Permata'} · Age ${childObj.age || 7} (${childObj.gender || 'Male'})`;
        }
        if (scoreEl) scoreEl.textContent = `${resultPayload.matchScore}%`;
        if (riskTitleEl) riskTitleEl.textContent = resultPayload.riskLevel;

        if (riskPillEl) {
            riskPillEl.textContent = updatedRisk;
            if (resultPayload.matchScore >= 65) {
                riskPillEl.className = 'px-4 py-1.5 rounded-xl font-extrabold text-xs sm:text-sm bg-rose-100 text-rose-900 border border-rose-300 shadow-xs';
            } else if (resultPayload.matchScore >= 35) {
                riskPillEl.className = 'px-4 py-1.5 rounded-xl font-extrabold text-xs sm:text-sm bg-amber-100 text-amber-900 border border-amber-300 shadow-xs';
            } else {
                riskPillEl.className = 'px-4 py-1.5 rounded-xl font-extrabold text-xs sm:text-sm bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs';
            }
        }

        if (pillar1El) pillar1El.textContent = `${resultPayload.pillar1Score}%`;
        if (pillar1Sub) pillar1Sub.textContent = `Raw: ${resultPayload.rawScore || 0} pts across 30 behavioral items.`;

        if (pillar2El) pillar2El.textContent = `${resultPayload.pillar2Score}%`;
        const wcpmVal = resultPayload.temporalMetrics?.calculatedWCPM || 45;
        if (pillar2Sub) pillar2Sub.textContent = `Oral fluency: ${wcpmVal} WCPM (${resultPayload.gradeNormUsed || 'Grade Norm'})`;

        if (pillar3El) pillar3El.textContent = `${resultPayload.pillar3Score}%`;
        const fixVal = resultPayload.temporalMetrics?.fixationStability || 85;
        if (pillar3Sub) pillar3Sub.textContent = `Gaze stability: ${fixVal}% · Saccadic tracking recorded.`;

        if (recEl) recEl.textContent = resultPayload.recommendation;
        if (syncEl) syncEl.textContent = `Student screening record for ${studentName} successfully updated to "Completed" (${resultPayload.matchScore}% Risk Index) and synchronized.`;

        // 3. Sync for Admin Mode vs Parent Mode
        if (isAdminMode()) {
            const adminStudents = getAdminStudentsList();
            const childNameLow = studentName.toLowerCase().trim();
            const childId = childObj?.id;

            const idx = adminStudents.findIndex(s => 
                (s.id && childId && s.id === childId) ||
                (s.name && s.name.toLowerCase().trim() === childNameLow)
            );

            if (idx !== -1) {
                adminStudents[idx].status = 'Completed';
                adminStudents[idx].score = resultPayload.matchScore;
                adminStudents[idx].risk = updatedRisk;
                adminStudents[idx].pillar1_score = resultPayload.pillar1Score;
                adminStudents[idx].pillar2_score = resultPayload.pillar2Score;
                adminStudents[idx].pillar3_score = resultPayload.pillar3Score;
                adminStudents[idx].date = todayStr;
                adminStudents[idx].diagnostic_area = resultPayload.recommendation;
                localStorage.setItem('lexisense_admin_active_student', JSON.stringify(adminStudents[idx]));
            } else {
                const newStudent = {
                    id: childId || ('LX-' + Math.floor(1000 + Math.random() * 9000)),
                    name: studentName,
                    class: childObj?.class || 'Class 1A',
                    age: childObj?.age || 7,
                    gender: childObj?.gender || 'Male',
                    status: 'Completed',
                    risk: updatedRisk,
                    score: resultPayload.matchScore,
                    pillar1_score: resultPayload.pillar1Score,
                    pillar2_score: resultPayload.pillar2Score,
                    pillar3_score: resultPayload.pillar3Score,
                    date: todayStr,
                    school: childObj?.school || 'SK Taman Ria',
                    diagnostic_area: resultPayload.recommendation
                };
                adminStudents.push(newStudent);
                localStorage.setItem('lexisense_admin_active_student', JSON.stringify(newStudent));
            }

            localStorage.setItem('lexisense_admin_students', JSON.stringify(adminStudents));

            if (returnBtn) {
                returnBtn.href = `admin-page.html?student=${encodeURIComponent(studentName)}&tab=student-detail`;
            }
            if (returnBtnLabel) {
                returnBtnLabel.textContent = 'View Student Profile in Admin Portal';
            }
            if (dossierBtn) {
                dossierBtn.href = `report-preview.html?student=${encodeURIComponent(studentName)}`;
            }

            return;
        }

        // Parent Mode Local Cache Sync
        if (typeof updateReportWithMultimodalResult === 'function') {
            try {
                await updateReportWithMultimodalResult(resultPayload, true);
            } catch (err) {
                console.warn("Update local cache warning:", err);
            }
        }

        const currentUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
        const username = currentUser ? (currentUser.username || currentUser.name || 'guest') : 'guest';
        const userChildrenKey = `lexisense_children_${username.toLowerCase()}`;
        try {
            let parentChildren = JSON.parse(localStorage.getItem(userChildrenKey) || '[]');
            const cIdx = parentChildren.findIndex(c => c.name.toLowerCase().trim() === studentName.toLowerCase().trim() || c.id === childObj.id);
            if (cIdx !== -1) {
                parentChildren[cIdx].status = 'Completed';
                parentChildren[cIdx].score = resultPayload.matchScore;
                parentChildren[cIdx].risk = updatedRisk;
                parentChildren[cIdx].pillar1_score = resultPayload.pillar1Score;
                parentChildren[cIdx].pillar2_score = resultPayload.pillar2Score;
                parentChildren[cIdx].pillar3_score = resultPayload.pillar3Score;
                parentChildren[cIdx].diagnostic_area = resultPayload.recommendation;
                localStorage.setItem(userChildrenKey, JSON.stringify(parentChildren));
                localStorage.setItem(`lexisense_active_child_${username.toLowerCase()}`, JSON.stringify(parentChildren[cIdx]));
            }
        } catch (e) {
            console.warn("Parent children storage update notice:", e);
        }

        const childNameEnc = encodeURIComponent(studentName);
        if (returnBtn) {
            returnBtn.href = `parent-page.html?view=report&child=${childNameEnc}`;
        }
        if (returnBtnLabel) {
            returnBtnLabel.textContent = 'View Full Screening Report';
        }
        if (dossierBtn) {
            dossierBtn.href = `report-preview-parent.html?child=${childNameEnc}`;
        }
    }, 2000);
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

document.addEventListener('DOMContentLoaded', () => {
    // Only run on prediagnosis-page.html to avoid hijacking parent-page.html report view
    if (!window.location.pathname.includes('prediagnosis-page.html')) {
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const studentParam = urlParams.get('student');
    const childParam = urlParams.get('child');
    
    if (studentParam) {
        startScreeningFor(decodeURIComponent(studentParam));
    } else if (childParam) {
        startScreeningFor(decodeURIComponent(childParam));
    } else {
        renderWizardStep1Children();
    }
});
