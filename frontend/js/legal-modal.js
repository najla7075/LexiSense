/**
 * LexiSense - Interactive Legal & Policy Modal System
 * Provides seamless, dyslexia-friendly, multi-tab popout for:
 * 1. Privacy Policy (Child Privacy, COPPA/PDPA, Eye-Tracking Data)
 * 2. Terms of Service (Clinical Disclaimer, Parent/Teacher Use)
 * 3. Accessibility Statement (WCAG 2.1 AA/AAA, Dyslexia Accommodations)
 */

const LEXISENSE_LEGAL_DATA = {
    privacy: {
        title: "Privacy & Child Data Protection Policy",
        subtitle: "How LexiSense protects your child's data, eye-tracking metrics & phonics privacy",
        badge: "🔒 COPPA & PDPA Compliant",
        lastUpdated: "Updated: September 2026",
        pageUrl: "privacy-policy.html",
        speechSummary: "Welcome to LexiSense Privacy Policy. We take child privacy very seriously. Camera eye-tracking is processed live in your browser and never stored as video. Voice recordings are processed only for phoneme accuracy scoring. All data is encrypted with Row Level Security. Parents have full rights to export or delete their child's data anytime.",
        summaryPoints: [
            {
                icon: "👁️",
                title: "Live Camera Eye-Tracking is Private & Ephemeral",
                desc: "Webcam gaze tracking is processed locally in your browser (via WebGazer & client-side AI). We NEVER record, stream, or save raw video footage of your child. Only mathematical fixation points (X, Y coordinates and saccadic durations) are analyzed."
            },
            {
                icon: "🎙️",
                title: "Voice & Phonics Audio Safeguards",
                desc: "Microphone input during reading quests is used in real-time to compute phoneme decoding speed and pronunciation accuracy. Audio streams are encrypted and never sold or shared with third-party advertisers."
            },
            {
                icon: "🛡️",
                title: "Child-First Compliance (COPPA & PDPA)",
                desc: "LexiSense strictly abides by the Children's Online Privacy Protection Act (COPPA) and Malaysia Personal Data Protection Act (PDPA). Child profiles require verifiable parental or school authorization."
            },
            {
                icon: "🔑",
                title: "Zero Selling of Personal Data",
                desc: "We do not sell, rent, or monetize your or your child's personal data. Screening insights are strictly accessible by you, and optionally your designated school educator or clinical specialist."
            },
            {
                icon: "🗑️",
                title: "Parental Control & Complete Right to Deletion",
                desc: "Parents can review, download PDF screening dossiers, or permanently wipe child profiles and history directly from the Parent Portal settings at any time."
            }
        ],
        fullSections: [
            {
                heading: "1. Scope and Commitment to Child Privacy",
                content: "LexiSense AI Inc. ('LexiSense', 'we', 'our') is committed to safeguarding the privacy and digital well-being of young learners (ages 3–12), parents, and educators. This policy governs data collected through the LexiSense web platform, AI screening modules, eye-tracking decoders, and multisensory phonics companions."
            },
            {
                heading: "2. Categories of Information We Collect",
                content: `• <strong>Child Profile Metadata:</strong> Nickname or first name, age group, grade level, and language preference.<br>
• <strong>Biometric-Derived Telemetry (Eye Gaze & Saccades):</strong> In-browser mathematical tracking of reading gaze regressions, fixation durations, and line-tracking drift. <em>Raw camera video or face imagery is NEVER stored, recorded, or transmitted to any server.</em><br>
• <strong>Phonics Speech Metrics:</strong> Audio phoneme confidence score, speech pause frequency, and reading hesitation intervals.<br>
• <strong>Parent & Educator Account Information:</strong> Name, verified email address, chosen username, password hash, and optional school branch affiliation.`
            },
            {
                heading: "3. Technical Architecture & Security Protocols",
                content: "All stored database records are hosted on hardened cloud infrastructure utilizing Supabase PostgreSQL with strict Row Level Security (RLS). Data in transit is protected via TLS 1.3 encryption, and resting databases are encrypted with AES-256 standards. Direct database queries are strictly token-authenticated."
            },
            {
                heading: "4. Third-Party Integrations & Data Sharing",
                content: "LexiSense integrates client-side WebGazer.js and Chart.js. We do NOT incorporate advertising trackers, social media pixel trackers, or behavioral data brokers. Aggregated, fully anonymized statistical benchmarks (e.g. average saccadic latency across age groups) may be used for academic algorithm calibration."
            },
            {
                heading: "5. Parental Rights and Data Portability",
                content: "Under COPPA and PDPA regulations, parents and legal guardians maintain the right to: (a) Inspect all recorded screening assessments; (b) Export diagnostic PDF summaries for clinical consultations; (c) Request total deletion of child records and account deletion by contacting privacy@lexisense.ai or through portal settings."
            }
        ]
    },
    terms: {
        title: "Terms of Service & Clinical Disclaimer",
        subtitle: "Rules of engagement, clinical screening disclaimers & acceptable platform usage",
        badge: "📜 User Agreement & Clinical Notice",
        lastUpdated: "Updated: September 2026",
        pageUrl: "terms-of-service.html",
        speechSummary: "Welcome to LexiSense Terms of Service. LexiSense is an observational pre-diagnosis and risk-screening tool designed to assist parents and teachers. It does not replace a clinical diagnosis from a registered medical specialist. By using this service, you agree to respectful, safe usage for supporting child education.",
        summaryPoints: [
            {
                icon: "🩺",
                title: "Observational Pre-Diagnosis Notice (Not Medical Advice)",
                desc: "LexiSense provides early risk indicators and phonics screening metrics. It is NOT a formal medical or neuropsychological diagnosis. Screening results are intended to guide parents and educators when seeking certified pediatric specialist evaluation."
            },
            {
                icon: "👨‍👩‍👧",
                title: "Parental Supervision Recommended",
                desc: "Screening activities, calibration minigames, and home reading exercises are best performed with parent or teacher guidance in a well-lit, quiet environment."
            },
            {
                icon: "🏫",
                title: "Educator & School Responsibilities",
                desc: "Teachers utilizing LexiSense classroom screening must obtain necessary institutional or parental consents before administering group reading quests."
            },
            {
                icon: "✨",
                title: "Intellectual Property & Mascot Rights",
                desc: "All original illustrations, Ollie the Owl mascot characters, reading decoder algorithms, and screening questionnaires are protected intellectual property of LexiSense AI Inc."
            },
            {
                icon: "🤝",
                title: "Account Security & Truthful Information",
                desc: "Users agree to provide accurate age metrics during screening calibration to ensure optimal phoneme and gaze accuracy."
            }
        ],
        fullSections: [
            {
                heading: "1. Acceptance of Terms",
                content: "By creating an account, launching a reading quest, or accessing any service provided by LexiSense, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you should discontinue platform usage immediately."
            },
            {
                heading: "2. Medical & Clinical Pre-Diagnosis Disclaimer",
                content: "<strong>CRITICAL NOTICE:</strong> LexiSense is an artificial intelligence-assisted pre-diagnosis screening and multisensory learning platform. Results, risk percentages (Low / Moderate / High Risk), gaze regression heatmaps, and Ollie Owl suggestions DO NOT constitute a definitive medical, psychological, or clinical diagnosis of Dyslexia, Dyscalculia, or related learning differences. Always consult a licensed clinical psychologist, speech-language pathologist, or developmental pediatrician."
            },
            {
                heading: "3. Account Types and Access Tiers",
                content: "• <strong>Parent Portal:</strong> Individual household accounts for tracking child reading progress, generating PDF screening dossiers, and accessing daily multisensory home exercises.<br>• <strong>Educator / Teacher Portal:</strong> Multi-student screening rosters for school branches with aggregate cohort tracking.<br>• <strong>Clinical Specialist / Admin Portal:</strong> Clinical case management, deep saccadic metric inspections, and diagnostic validation."
            },
            {
                heading: "4. User Conduct and Acceptable Use",
                content: "Users shall not: (a) Reverse engineer, decompile, or extract proprietary eye-tracking or phoneme recognition algorithms; (b) Impersonate clinical specialists or educational institutions; (c) Submit abusive, fraudulent, or harmful data; (d) Attempt to circumvent authentication guards or Supabase Row Level Security."
            },
            {
                heading: "5. Limitation of Liability & Warranties",
                content: "LexiSense is provided on an 'as-is' and 'as-available' basis. LexiSense AI Inc. and its contributors shall not be held liable for educational placement decisions, diagnostic interpretations, or third-party reliance made solely upon automated screening indicators."
            }
        ]
    },
    accessibility: {
        title: "Accessibility & Universal Design Statement",
        subtitle: "Our dedication to neuroinclusive, dyslexia-friendly & WCAG 2.1 AA compliant design",
        badge: "♿ WCAG 2.1 AA & Dyslexia First",
        lastUpdated: "Updated: September 2026",
        pageUrl: "accessibility-statement.html",
        speechSummary: "Welcome to LexiSense Accessibility Statement. We believe digital reading should be welcoming to every neurodivergent mind. LexiSense incorporates dyslexia-friendly typography with weighted bases, visual tint overlays, line rulers, text scaling up to two hundred percent, and high contrast modes.",
        summaryPoints: [
            {
                icon: "🔤",
                title: "Weighted Dyslexia-Friendly Typography",
                desc: "Integrated with Lexend and OpenDyslexic fonts. Heavy weighted baselines, distinct ascenders, and unique letter apertures prevent mirror-flipping (b ↔ d, p ↔ q) and word floating."
            },
            {
                icon: "🎨",
                title: "Visual Color Tint Overlays (Irlen Syndrome Relief)",
                desc: "1-Click switch to Warm Yellow, Soft Blue, or Soft Green background tints to ease visual glare, text vibration, and Scotopic Sensitivity syndrome."
            },
            {
                icon: "📏",
                title: "Interactive Reading Focus Ruler",
                desc: "An intelligent cursor-following line overlay that isolates current reading lines and eliminates accidental line-skipping during long passages."
            },
            {
                icon: "🔍",
                title: "Dynamic Text Scaling (Up to 200%)",
                desc: "Fluid text resizer preserving layout integrity, proportional line heights, and ample paragraph breathing room."
            },
            {
                icon: "🌓",
                title: "High Contrast & Non-Glare Modes",
                desc: "Engineered with WCAG AAA color contrast ratios (7:1+) to support low-vision readers and reduce eye strain in varying lighting environments."
            },
            {
                icon: "🔊",
                title: "Multimodal Speech & Screen Reader Ready",
                desc: "Full ARIA landmark tagging, keyboard Tab/Shift+Tab navigational flow, and interactive voice assistance powered by Ollie the Wise Owl."
            }
        ],
        fullSections: [
            {
                heading: "1. Our Accessibility Philosophy",
                content: "At LexiSense, accessibility is not a retrofit—it is our fundamental design blueprint. We believe children and adults with dyslexia, ADHD, dyspraxia, and visual processing nuances deserve digital tools crafted specifically to celebrate and support how their minds perceive language."
            },
            {
                heading: "2. Standards & Compliance Benchmarks",
                content: "LexiSense targets full conformance with the <strong>Web Content Accessibility Guidelines (WCAG) 2.1 Level AA</strong>, with multiple critical components satisfying Level AAA criteria (such as visual contrast ratios, typography spacing, and non-reliance on color alone)."
            },
            {
                heading: "3. Neuroinclusive Features Matrix",
                content: `• <strong>Bespoke Font Stacks:</strong> OpenDyslexic, Lexend, Nunito, and Baloo 2.<br>
• <strong>Line Height & Letter Spacing:</strong> Standard 1.6+ line heights with expanded character tracking to minimize crowding.<br>
• <strong>Motor & Focus Support:</strong> Large touch targets (minimum 44x44px), visible focus rings, and full keyboard navigability (Escape to close modals, Arrow keys for tabs).<br>
• <strong>Sensory Calming:</strong> Soft pastel palettes, non-flashing animations, and optional sound effects toggle.`
            },
            {
                heading: "4. Assistive Technology Compatibility",
                content: "LexiSense is systematically tested with modern screen readers (NVDA, JAWS, VoiceOver, TalkBack) across Chrome, Firefox, Safari, and Edge on Windows, macOS, iPadOS, and Android tablets."
            },
            {
                heading: "5. Feedback, Support & Continuous Co-Design",
                content: "We actively collaborate with pediatric special education coordinators, occupational therapists, and parents. If you encounter any accessibility barrier or have a feature suggestion, please contact our Accessibility Lead at <strong>accessibility@lexisense.ai</strong>."
            }
        ]
    }
};

let currentLegalTab = 'privacy';
let currentLegalViewMode = 'summary'; // 'summary' or 'full'
let isModalDyslexiaFont = false;
let modalFontScale = 100;
let speechUtterance = null;

/**
 * Initializes and injects the legal modal DOM into the document if missing.
 */
function ensureLegalModalInDOM() {
    if (document.getElementById('lexisense-legal-modal')) return;

    const modalHTML = `
    <!-- CREATIVE INTERACTIVE LEGAL & POLICY MODAL -->
    <div id="lexisense-legal-modal" class="hidden fixed inset-0 bg-purple-950/70 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-6 transition-all duration-300" role="dialog" aria-modal="true" aria-labelledby="legal-modal-title">
        <div class="bg-white rounded-[32px] max-w-3xl w-full shadow-2xl border-2 border-purple-200 animate-pop relative max-h-[92vh] flex flex-col overflow-hidden text-gray-800">
            
            <!-- TOP BRANDED HEADER WITH MASCOT & ACTION CONTROLS -->
            <div class="relative bg-gradient-to-r from-purple-800 via-purple-700 to-indigo-800 p-5 sm:p-6 text-white overflow-hidden shrink-0 shadow-sm">
                <!-- Floating Decorative Background Bubbles -->
                <div class="absolute -top-3 right-20 bg-white/10 backdrop-blur-md px-3 py-1 rounded-xl text-amber-300 font-extrabold text-xs animate-bounce-subtle pointer-events-none">⚖️ LexiSafe</div>
                <div class="absolute bottom-2 right-40 bg-white/10 backdrop-blur-md px-2.5 py-0.5 rounded-lg text-purple-200 font-bold text-[10px] animate-float-slow pointer-events-none">✨ Certified</div>

                <!-- Top Row: Mascot, Title & Main Controls -->
                <div class="flex items-center justify-between gap-3 relative z-10">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-2xl bg-amber-400 flex items-center justify-center p-1 shadow-md animate-owl-mascot shrink-0 border-2 border-amber-300 ring-2 ring-purple-400/40">
                            <img src="assets/ollie-mascot.png" alt="Ollie Mascot" class="w-10 h-10 object-contain">
                        </div>
                        <div>
                            <div class="flex items-center gap-2 flex-wrap">
                                <span id="legal-badge" class="bg-amber-400 text-purple-950 text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">🔒 COPPA & PDPA</span>
                                <span id="legal-last-updated" class="text-purple-200 text-[11px] font-bold">Updated: September 2026</span>
                            </div>
                            <h2 id="legal-modal-title" class="font-heading text-lg sm:text-2xl font-extrabold text-white leading-tight mt-0.5">
                                Privacy & Child Data Protection Policy
                            </h2>
                        </div>
                    </div>

                    <!-- Close & Quick Action Bar -->
                    <div class="flex items-center gap-1.5 shrink-0">
                        <button onclick="toggleModalReadAloud()" id="btn-modal-speech" class="w-9 h-9 rounded-xl bg-white/15 hover:bg-amber-400 hover:text-purple-950 text-white flex items-center justify-center transition-all border border-white/20" title="Listen with Ollie Voice">
                            <i class="fa-solid fa-volume-high text-sm"></i>
                        </button>
                        <button onclick="printLegalDocument()" class="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all border border-white/20 hidden sm:flex" title="Print Document">
                            <i class="fa-solid fa-print text-sm"></i>
                        </button>
                        <button onclick="closeLegalModal()" class="w-9 h-9 rounded-xl bg-white/15 hover:bg-rose-500 hover:text-white text-white flex items-center justify-center transition-all border border-white/20" title="Close (ESC)">
                            <i class="fa-solid fa-xmark text-base"></i>
                        </button>
                    </div>
                </div>

                <!-- SUBTITLE -->
                <p id="legal-modal-subtitle" class="text-xs sm:text-sm text-purple-100 font-semibold mt-2 relative z-10 pr-6">
                    How LexiSense protects your child's data, eye-tracking metrics & phonics privacy.
                </p>

                <!-- 3 DOCUMENT TAB SWITCHERS -->
                <div class="grid grid-cols-3 gap-1.5 sm:gap-2 mt-4 bg-purple-950/40 p-1.5 rounded-2xl border border-purple-400/30 text-xs relative z-10">
                    <button onclick="switchLegalTab('privacy')" id="legal-tab-btn-privacy" class="py-2 px-2 sm:px-3 rounded-xl font-black transition-all flex items-center justify-center gap-1.5 text-center bg-white text-purple-950 shadow-md">
                        <i class="fa-solid fa-shield-halved text-xs sm:text-sm text-purple-600"></i>
                        <span class="truncate">Privacy Policy</span>
                    </button>
                    <button onclick="switchLegalTab('terms')" id="legal-tab-btn-terms" class="py-2 px-2 sm:px-3 rounded-xl font-black transition-all flex items-center justify-center gap-1.5 text-center text-purple-200 hover:text-white hover:bg-white/10">
                        <i class="fa-solid fa-file-contract text-xs sm:text-sm text-amber-300"></i>
                        <span class="truncate">Terms of Service</span>
                    </button>
                    <button onclick="switchLegalTab('accessibility')" id="legal-tab-btn-accessibility" class="py-2 px-2 sm:px-3 rounded-xl font-black transition-all flex items-center justify-center gap-1.5 text-center text-purple-200 hover:text-white hover:bg-white/10">
                        <i class="fa-solid fa-universal-access text-xs sm:text-sm text-sky-300"></i>
                        <span class="truncate">Accessibility</span>
                    </button>
                </div>
            </div>

            <!-- SECONDARY TOOLBAR: VIEW MODE, DYSLEXIA FONT, TEXT RESIZE & SEARCH -->
            <div class="px-5 sm:px-6 py-2.5 bg-purple-50/90 border-b border-purple-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                
                <!-- View Mode: Parent Plain Summary vs Legal Clauses -->
                <div class="flex items-center gap-1 bg-white p-1 rounded-xl border border-purple-200 shadow-sm">
                    <button onclick="toggleLegalViewMode('summary')" id="view-mode-summary" class="px-2.5 py-1 rounded-lg font-black text-purple-950 bg-purple-100 border border-purple-200 flex items-center gap-1">
                        <span>🌟 Parent Summary</span>
                    </button>
                    <button onclick="toggleLegalViewMode('full')" id="view-mode-full" class="px-2.5 py-1 rounded-lg font-bold text-gray-500 hover:text-purple-700 flex items-center gap-1">
                        <span>⚖️ Full Legal Clauses</span>
                    </button>
                </div>

                <!-- Accessibility Quick Toggles (Font & Size) -->
                <div class="flex items-center gap-2">
                    <!-- Dyslexia Font Toggle -->
                    <button onclick="toggleModalDyslexiaFont()" id="btn-modal-font" class="px-2.5 py-1 bg-white border border-purple-200 rounded-lg font-bold text-purple-900 hover:bg-purple-100 transition-all flex items-center gap-1 shadow-sm" title="Toggle Dyslexia Font">
                        <span class="font-dyslexic font-bold">Lexend</span>
                        <span id="modal-font-status" class="text-[10px] bg-purple-100 text-purple-800 px-1 rounded font-extrabold">OFF</span>
                    </button>

                    <!-- Text Resizer -->
                    <div class="flex items-center bg-white border border-purple-200 rounded-lg p-0.5 shadow-sm">
                        <button onclick="changeModalFontSize(-10)" class="px-2 py-0.5 hover:bg-purple-50 rounded text-gray-700 font-black" title="Smaller text">A-</button>
                        <span id="modal-font-scale-display" class="px-1.5 font-bold text-[11px] text-purple-700">100%</span>
                        <button onclick="changeModalFontSize(10)" class="px-2 py-0.5 hover:bg-purple-50 rounded text-gray-700 font-black" title="Larger text">A+</button>
                    </div>

                    <!-- Search Input -->
                    <div class="relative hidden sm:block">
                        <input id="legal-modal-search" type="text" placeholder="Search keywords..." oninput="filterLegalContent(this.value)" class="w-36 lg:w-44 bg-white border border-purple-200 rounded-lg py-1 pl-6 pr-2 text-xs focus:ring-1 focus:ring-purple-600 focus:outline-none font-medium text-gray-700">
                        <i class="fa-solid fa-magnifying-glass absolute left-2 top-2 text-purple-400 text-[10px]"></i>
                    </div>
                </div>
            </div>

            <!-- SCROLLABLE BODY CONTENT -->
            <div id="legal-modal-body" class="p-5 sm:p-7 space-y-4 overflow-y-auto custom-scrollbar flex-1 bg-[#FAF8F5]">
                <!-- Dynamic Content Injected Here -->
            </div>

            <!-- FOOTER BAR: OPEN STANDALONE PAGE, PRINT & CLOSE -->
            <div class="p-3.5 sm:p-4 bg-white border-t-2 border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 text-xs">
                <div class="flex items-center gap-2 text-gray-500 font-semibold">
                    <i class="fa-solid fa-shield-cat text-purple-600 text-sm"></i>
                    <span>LexiSense Neuroinclusive AI Compliance Standard</span>
                </div>

                <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <a id="btn-open-standalone-page" href="privacy-policy.html" target="_blank" class="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl font-extrabold transition-all flex items-center gap-1.5 shadow-sm text-center">
                        <span>Open Standalone Page</span>
                        <i class="fa-solid fa-arrow-up-right-from-square text-[11px]"></i>
                    </a>
                    <button onclick="closeLegalModal()" class="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white rounded-xl font-extrabold shadow-md transition-all flex items-center gap-1.5">
                        <span>Got It & Close</span>
                        <i class="fa-solid fa-check text-xs"></i>
                    </button>
                </div>
            </div>

        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Add ESC key listener to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('lexisense-legal-modal');
            if (modal && !modal.classList.contains('hidden')) {
                closeLegalModal();
            }
        }
    });

    // Add backdrop click close
    const modal = document.getElementById('lexisense-legal-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeLegalModal();
        });
    }
}

/**
 * Open the Legal Modal with a specific document active.
 * @param {'privacy'|'terms'|'accessibility'} docType
 * @param {Event} [event] Optional event to preventDefault
 */
function openLegalModal(docType = 'privacy', event = null) {
    if (event) {
        event.preventDefault();
    }

    ensureLegalModalInDOM();

    const modal = document.getElementById('lexisense-legal-modal');
    if (!modal) return;

    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden'); // Prevent background scrolling

    switchLegalTab(docType);
}

/**
 * Close the Legal Modal and stop voice narration if active.
 */
function closeLegalModal() {
    const modal = document.getElementById('lexisense-legal-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    document.body.classList.remove('overflow-hidden');

    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        const speechBtn = document.getElementById('btn-modal-speech');
        if (speechBtn) {
            speechBtn.innerHTML = '<i class="fa-solid fa-volume-high text-sm"></i>';
            speechBtn.classList.remove('bg-amber-400', 'text-purple-950');
        }
    }
}

/**
 * Switch tabs between Privacy, Terms, and Accessibility.
 */
function switchLegalTab(docType) {
    if (!LEXISENSE_LEGAL_DATA[docType]) docType = 'privacy';
    currentLegalTab = docType;

    const data = LEXISENSE_LEGAL_DATA[docType];

    // Update Header Text & Badges
    const titleElem = document.getElementById('legal-modal-title');
    const subElem = document.getElementById('legal-modal-subtitle');
    const badgeElem = document.getElementById('legal-badge');
    const updatedElem = document.getElementById('legal-last-updated');
    const standaloneLink = document.getElementById('btn-open-standalone-page');

    if (titleElem) titleElem.textContent = data.title;
    if (subElem) subElem.textContent = data.subtitle;
    if (badgeElem) badgeElem.textContent = data.badge;
    if (updatedElem) updatedElem.textContent = data.lastUpdated;
    if (standaloneLink) {
        standaloneLink.href = data.pageUrl;
        standaloneLink.innerHTML = `<span>Open Full ${docType === 'privacy' ? 'Privacy Page' : docType === 'terms' ? 'Terms Page' : 'Accessibility Page'}</span> <i class="fa-solid fa-arrow-up-right-from-square text-[11px]"></i>`;
    }

    // Update Tab Buttons UI
    ['privacy', 'terms', 'accessibility'].forEach(t => {
        const btn = document.getElementById(`legal-tab-btn-${t}`);
        if (btn) {
            if (t === docType) {
                btn.className = 'py-2 px-2 sm:px-3 rounded-xl font-black transition-all flex items-center justify-center gap-1.5 text-center bg-white text-purple-950 shadow-md transform scale-[1.02]';
            } else {
                btn.className = 'py-2 px-2 sm:px-3 rounded-xl font-black transition-all flex items-center justify-center gap-1.5 text-center text-purple-200 hover:text-white hover:bg-white/10';
            }
        }
    });

    // Reset search input
    const searchInput = document.getElementById('legal-modal-search');
    if (searchInput) searchInput.value = '';

    renderLegalModalContent();
}

/**
 * Toggle view mode between Plain Parent Summary and Full Legal Clauses.
 */
function toggleLegalViewMode(mode) {
    currentLegalViewMode = mode;

    const btnSum = document.getElementById('view-mode-summary');
    const btnFull = document.getElementById('view-mode-full');

    if (mode === 'summary') {
        if (btnSum) btnSum.className = 'px-2.5 py-1 rounded-lg font-black text-purple-950 bg-purple-100 border border-purple-200 flex items-center gap-1';
        if (btnFull) btnFull.className = 'px-2.5 py-1 rounded-lg font-bold text-gray-500 hover:text-purple-700 flex items-center gap-1';
    } else {
        if (btnSum) btnSum.className = 'px-2.5 py-1 rounded-lg font-bold text-gray-500 hover:text-purple-700 flex items-center gap-1';
        if (btnFull) btnFull.className = 'px-2.5 py-1 rounded-lg font-black text-purple-950 bg-purple-100 border border-purple-200 flex items-center gap-1';
    }

    renderLegalModalContent();
}

/**
 * Render the modal content cards based on current tab, view mode, and search filter.
 */
function renderLegalModalContent(filterQuery = '') {
    const bodyElem = document.getElementById('legal-modal-body');
    if (!bodyElem) return;

    const data = LEXISENSE_LEGAL_DATA[currentLegalTab];
    if (!data) return;

    let html = '';

    const query = filterQuery.toLowerCase().trim();

    if (currentLegalViewMode === 'summary') {
        // Render Parent & Child Summary Cards
        const filteredPoints = query 
            ? data.summaryPoints.filter(p => p.title.toLowerCase().includes(query) || p.desc.toLowerCase().includes(query))
            : data.summaryPoints;

        if (filteredPoints.length === 0) {
            html = `
                <div class="text-center py-10 space-y-2">
                    <span class="text-3xl">🔍</span>
                    <p class="font-extrabold text-purple-950 text-sm">No matching topics found for "${filterQuery}"</p>
                    <p class="text-xs text-gray-500">Try searching for words like 'camera', 'speech', 'deletion', or 'contrast'.</p>
                </div>
            `;
        } else {
            html += `
                <div class="bg-gradient-to-r from-purple-100 via-amber-50 to-purple-50 p-4 rounded-2xl border-2 border-purple-200 mb-3 flex items-center gap-3">
                    <span class="text-2xl animate-wiggle">💡</span>
                    <div>
                        <h4 class="font-heading font-extrabold text-purple-950 text-sm sm:text-base">Parent & Child Plain-Language Summary</h4>
                        <p class="text-xs text-purple-800 font-semibold">Key highlights written simply so you know exactly how LexiSense protects your family.</p>
                    </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            `;

            filteredPoints.forEach((point, idx) => {
                html += `
                    <div class="kemas-card bg-white p-4 sm:p-5 rounded-2xl border-2 border-purple-100 shadow-sm hover:border-purple-300 transition-all space-y-2 flex flex-col justify-between">
                        <div class="space-y-1.5">
                            <div class="flex items-center gap-2.5">
                                <div class="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-xl shrink-0 shadow-sm">
                                    ${point.icon}
                                </div>
                                <h5 class="font-heading font-extrabold text-brand-purple-deep text-xs sm:text-sm leading-snug">${point.title}</h5>
                            </div>
                            <p class="text-xs text-gray-600 leading-relaxed font-semibold pl-0.5">${point.desc}</p>
                        </div>
                        <div class="pt-2 border-t border-purple-50 flex items-center justify-between text-[10px] text-purple-600 font-bold">
                            <span>Clause #${idx + 1}</span>
                            <span class="bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">Verified ✓</span>
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
        }
    } else {
        // Render Comprehensive Legal / Clinical Clauses
        const filteredSections = query
            ? data.fullSections.filter(s => s.heading.toLowerCase().includes(query) || s.content.toLowerCase().includes(query))
            : data.fullSections;

        if (filteredSections.length === 0) {
            html = `
                <div class="text-center py-10 space-y-2">
                    <span class="text-3xl">🔍</span>
                    <p class="font-extrabold text-purple-950 text-sm">No matching legal clauses found for "${filterQuery}"</p>
                </div>
            `;
        } else {
            html += `
                <div class="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-200 mb-3 flex items-center justify-between">
                    <div class="flex items-center gap-2.5">
                        <i class="fa-solid fa-scale-balanced text-indigo-700 text-lg"></i>
                        <div>
                            <h4 class="font-heading font-extrabold text-indigo-950 text-xs sm:text-sm">Official Legal & Clinical Compliance Clauses</h4>
                            <p class="text-[11px] text-indigo-800 font-semibold">Standard binding provisions for LexiSense AI screening & portal systems.</p>
                        </div>
                    </div>
                    <span class="text-xs font-mono font-bold text-indigo-900 bg-white px-2 py-1 rounded-lg border border-indigo-200 hidden sm:inline">v2.6-2026</span>
                </div>
                <div class="space-y-4">
            `;

            filteredSections.forEach(section => {
                html += `
                    <div class="bg-white p-5 rounded-2xl border-2 border-purple-100 shadow-sm space-y-2">
                        <h5 class="font-heading font-extrabold text-purple-950 text-sm border-b border-purple-50 pb-1.5 flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-purple-600 inline-block"></span>
                            ${section.heading}
                        </h5>
                        <div class="text-xs text-gray-700 leading-relaxed font-normal space-y-1.5">
                            ${section.content}
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
        }
    }

    bodyElem.innerHTML = html;
}

/**
 * Filter modal content via keyword search.
 */
function filterLegalContent(query) {
    renderLegalModalContent(query);
}

/**
 * Toggle Dyslexia Font inside the modal.
 */
function toggleModalDyslexiaFont() {
    isModalDyslexiaFont = !isModalDyslexiaFont;
    const bodyElem = document.getElementById('legal-modal-body');
    const statusElem = document.getElementById('modal-font-status');
    const btnElem = document.getElementById('btn-modal-font');

    if (bodyElem) {
        if (isModalDyslexiaFont) {
            bodyElem.classList.add('font-dyslexic');
            if (statusElem) {
                statusElem.textContent = 'ON';
                statusElem.className = 'text-[10px] bg-purple-600 text-white px-1 rounded font-extrabold';
            }
            if (btnElem) btnElem.classList.add('border-purple-500', 'bg-purple-50');
        } else {
            bodyElem.classList.remove('font-dyslexic');
            if (statusElem) {
                statusElem.textContent = 'OFF';
                statusElem.className = 'text-[10px] bg-purple-100 text-purple-800 px-1 rounded font-extrabold';
            }
            if (btnElem) btnElem.classList.remove('border-purple-500', 'bg-purple-50');
        }
    }
}

/**
 * Change modal font size (+/-).
 */
function changeModalFontSize(delta) {
    modalFontScale += delta;
    if (modalFontScale > 160) modalFontScale = 160;
    if (modalFontScale < 80) modalFontScale = 80;

    const bodyElem = document.getElementById('legal-modal-body');
    const displayElem = document.getElementById('modal-font-scale-display');

    if (bodyElem) {
        bodyElem.style.fontSize = `${(modalFontScale / 100) * 0.75}rem`;
    }
    if (displayElem) {
        displayElem.textContent = `${modalFontScale}%`;
    }
}

/**
 * Speech Narration with Ollie Owl.
 */
function toggleModalReadAloud() {
    if (!('speechSynthesis' in window)) {
        alert("Text-to-Speech is not supported in your browser.");
        return;
    }

    const speechBtn = document.getElementById('btn-modal-speech');

    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        if (speechBtn) {
            speechBtn.innerHTML = '<i class="fa-solid fa-volume-high text-sm"></i>';
            speechBtn.classList.remove('bg-amber-400', 'text-purple-950');
        }
        return;
    }

    const data = LEXISENSE_LEGAL_DATA[currentLegalTab];
    if (!data) return;

    speechUtterance = new SpeechSynthesisUtterance(data.speechSummary);
    speechUtterance.rate = 0.95; // Friendly cadence
    speechUtterance.pitch = 1.1; // Cheerful owl tone

    speechUtterance.onstart = () => {
        if (speechBtn) {
            speechBtn.innerHTML = '<i class="fa-solid fa-volume-xmark text-sm animate-pulse"></i>';
            speechBtn.classList.add('bg-amber-400', 'text-purple-950');
        }
    };

    speechUtterance.onend = () => {
        if (speechBtn) {
            speechBtn.innerHTML = '<i class="fa-solid fa-volume-high text-sm"></i>';
            speechBtn.classList.remove('bg-amber-400', 'text-purple-950');
        }
    };

    speechUtterance.onerror = () => {
        if (speechBtn) {
            speechBtn.innerHTML = '<i class="fa-solid fa-volume-high text-sm"></i>';
            speechBtn.classList.remove('bg-amber-400', 'text-purple-950');
        }
    };

    window.speechSynthesis.speak(speechUtterance);
}

/**
 * Print the current legal document.
 */
function printLegalDocument() {
    const data = LEXISENSE_LEGAL_DATA[currentLegalTab];
    if (data && data.pageUrl) {
        const printWindow = window.open(data.pageUrl, '_blank');
        if (printWindow) {
            printWindow.focus();
            printWindow.onload = () => {
                printWindow.print();
            };
        }
    } else {
        window.print();
    }
}

// Auto-initialize when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureLegalModalInDOM);
} else {
    ensureLegalModalInDOM();
}
