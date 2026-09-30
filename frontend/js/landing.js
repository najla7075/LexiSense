/**
 * LexiSense - Landing Page & Interactive Screener Module
 * Handles symptoms age selection, live parent quick-screener calculator,
 * dyslexia reading decoder simulator, authentication modal, toast notifications, and smooth scrolling.
 */

// 1. Dyslexia Reading Decoder Simulator & Word Phonics Carousel
const decoderWords = [
    { word: 'bat', letters: ['b', 'a', 't'], dyslexicLetters: ['d', 'a', 'ʇ'], icon: '🦇', label: 'Bat', note: 'Great! You sounded it out! The letter B makes a /b/ sound!', phonics: ['b', 'æ', 't'] },
    { word: 'cat', letters: ['c', 'a', 't'], dyslexicLetters: ['ɔ', 'a', 'ʇ'], icon: '🐱', label: 'Cat', note: 'Awesome! The letter C makes a crisp /k/ sound!', phonics: ['k', 'æ', 't'] },
    { word: 'dog', letters: ['d', 'o', 'g'], dyslexicLetters: ['b', 'o', 'ƃ'], icon: '🐶', label: 'Dog', note: 'Super! Letter D has its belly to the right: /d/ /ɒ/ /g/!', phonics: ['d', 'ɒ', 'g'] },
    { word: 'sun', letters: ['s', 'u', 'n'], dyslexicLetters: ['ƨ', 'u', 'ᴎ'], icon: '☀️', label: 'Sun', note: 'Bright job! S sounds like a gentle warm breeze: /s/ /ʌ/ /n/!', phonics: ['s', 'ʌ', 'n'] },
    { word: 'book', letters: ['b', 'o', 'o', 'k'], dyslexicLetters: ['d', 'o', 'o', 'ʞ'], icon: '📖', label: 'Book', note: 'Fantastic! Double "O" makes the smooth /ʊ/ sound!', phonics: ['b', 'ʊ', 'k'] }
];

let currentDecoderIndex = 0;
let currentDecoderMode = 'normal';

function renderDecoder() {
    const item = decoderWords[currentDecoderIndex];
    if (!item) return;

    const tilesContainer = document.getElementById('decoder-letter-tiles');
    const iconElem = document.getElementById('decoder-word-icon');
    const labelElem = document.getElementById('decoder-word-label');
    const noteElem = document.getElementById('decoder-phonics-note');
    const boxElem = document.getElementById('sim-display-box');
    const captionElem = document.getElementById('sim-caption');

    if (iconElem) iconElem.textContent = item.icon;
    if (labelElem) labelElem.textContent = item.label;
    if (noteElem) noteElem.textContent = item.note;

    if (tilesContainer) {
        tilesContainer.innerHTML = '';
        const lettersToDisplay = (currentDecoderMode === 'dyslexic') ? item.dyslexicLetters : item.letters;
        
        lettersToDisplay.forEach((char, idx) => {
            const tile = document.createElement('div');
            
            if (currentDecoderMode === 'normal') {
                tile.className = 'w-12 h-14 sm:w-14 sm:h-16 rounded-2xl bg-white border-2 border-purple-200 shadow-md flex items-center justify-center font-heading text-2xl sm:text-3xl font-extrabold text-purple-950 transition-all hover:scale-105';
            } else if (currentDecoderMode === 'dyslexic') {
                const rotateClasses = ['rotate-3 text-red-600', '-rotate-6 text-amber-700', 'rotate-6 text-purple-700', '-rotate-3 text-pink-600'];
                const rot = rotateClasses[idx % rotateClasses.length];
                tile.className = `w-12 h-14 sm:w-14 sm:h-16 rounded-2xl bg-pink-50 border-2 border-pink-300 shadow-sm flex items-center justify-center font-mono text-2xl sm:text-3xl font-bold transition-all transform ${rot} animate-pulse`;
            } else if (currentDecoderMode === 'lexisense') {
                tile.className = 'w-12 h-14 sm:w-14 sm:h-16 rounded-2xl bg-amber-200 border-2 border-amber-400 shadow-lg flex items-center justify-center font-dyslexic text-2xl sm:text-3xl font-extrabold text-purple-950 transition-all transform hover:scale-110 tracking-widest';
            }
            
            tile.textContent = char;
            tilesContainer.appendChild(tile);
        });
    }

    if (boxElem && captionElem) {
        if (currentDecoderMode === 'normal') {
            boxElem.className = 'p-5 sm:p-6 rounded-2xl bg-purple-50/70 border-2 border-purple-200 min-h-[170px] flex flex-col justify-center transition-all duration-300 relative overflow-hidden';
            captionElem.innerHTML = '<strong>Standard View:</strong> Regular text rendering without sensory decoding assistance.';
        } else if (currentDecoderMode === 'dyslexic') {
            boxElem.className = 'p-5 sm:p-6 rounded-2xl bg-pink-50/80 border-2 border-pink-300 min-h-[170px] flex flex-col justify-center transition-all duration-300 relative overflow-hidden';
            captionElem.innerHTML = '<strong>Dyslexia View 🌀:</strong> Letters may rotate, mirror swap (b ↔ d), or lose visual baseline anchor.';
        } else if (currentDecoderMode === 'lexisense') {
            boxElem.className = 'p-5 sm:p-6 rounded-2xl bg-amber-100/80 border-2 border-amber-300 min-h-[170px] flex flex-col justify-center transition-all duration-300 relative overflow-hidden shadow-inner';
            captionElem.innerHTML = '<strong>LexiSense View ✨:</strong> OpenDyslexic weighted gravity font, wide kerning & warm contrast overlay anchor each phoneme!';
        }
    }
}

function nextDecoderWord() {
    currentDecoderIndex = (currentDecoderIndex + 1) % decoderWords.length;
    renderDecoder();
    triggerAudioWiggle();
}

function prevDecoderWord() {
    currentDecoderIndex = (currentDecoderIndex - 1 + decoderWords.length) % decoderWords.length;
    renderDecoder();
    triggerAudioWiggle();
}

function triggerAudioWiggle() {
    const soundBtn = document.getElementById('decoder-sound-btn');
    if (soundBtn) {
        soundBtn.classList.add('animate-bounce');
        setTimeout(() => soundBtn.classList.remove('animate-bounce'), 800);
    }
}

function soundOutCurrentWord() {
    const item = decoderWords[currentDecoderIndex];
    if (!item) return;

    triggerAudioWiggle();

    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        
        // Speak phonics then whole word
        const fullUtterance = new SpeechSynthesisUtterance(`${item.word}. ${item.word}!`);
        fullUtterance.rate = 0.85;
        fullUtterance.pitch = 1.15; // friendly tone
        window.speechSynthesis.speak(fullUtterance);
    } else {
        showToast(`🔊 Sounding out: /${item.letters.join(' - ')}/ → ${item.word}!`);
    }
}

function setSimulatorMode(mode) {
    currentDecoderMode = mode;
    ['normal', 'dyslexic', 'lexisense'].forEach(m => {
        const btn = document.getElementById(`sim-btn-${m}`);
        if (btn) btn.className = 'py-2 px-2 rounded-xl transition-all text-gray-600 hover:text-purple-900 text-xs font-bold text-center';
    });

    const activeBtn = document.getElementById(`sim-btn-${mode}`);
    if (activeBtn) activeBtn.className = 'py-2 px-2 rounded-xl transition-all bg-white text-purple-900 shadow-sm font-extrabold text-xs text-center border border-purple-200';

    renderDecoder();
}

// Initialise decoder on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    renderDecoder();
});

// 2. Symptom Age Data Repository & Selection Engine
const symptomData = {
    preschool: {
        title: "Preschool (Ages 3 to 5 Years)",
        badge: "Early Speech & Rhyming Stage",
        items: [
            { title: "Delayed Speech Onset", desc: "Takes longer to speak in full sentences or mispronounces familiar words (e.g. 'beddy-tear' for 'teddy bear')." },
            { title: "Trouble Learning Rhymes", desc: "Struggles with simple nursery rhymes or recognizing words that sound alike (cat, bat, hat)." },
            { title: "Difficulty Recognizing Name Letters", desc: "Has trouble remembering or identifying the letters in their own first name." },
            { title: "Directional & Sequencing Confusion", desc: "Struggles to follow multi-step instructions ('put shoes on, then get bag')." }
        ]
    },
    early: {
        title: "Early Primary (Ages 6 to 8 Years)",
        badge: "Phonics & Letter Decoding Stage",
        items: [
            { title: "Letter Reversals (b/d/p/q)", desc: "Persistently flips mirror letters like 'b' & 'd' or numbers like '3' & 'E' past age 7." },
            { title: "Hesitant Sounding Out", desc: "Struggles to connect letter sounds (phonemes) to symbols, sounding out simple words line by line." },
            { title: "Skipping Small Words", desc: "Loses place on the page or skips small connecting words like 'in', 'and', 'the'." },
            { title: "Visual Text Stress", desc: "Complains that letters look blurry, crowded, or seem to 'dance' on bright white paper." }
        ]
    },
    upper: {
        title: "Upper Primary (Ages 9 to 12 Years)",
        badge: "Fluent Reading & Comprehension Stage",
        items: [
            { title: "Slow Reading Speed", desc: "Reads significantly below grade level with visible physical fatigue or headache." },
            { title: "Phonetic Spelling Errors", desc: "Spells words purely by sound (e.g. 'sed' for 'said', 'wot' for 'what') without visual memory." },
            { title: "Avoidance of Reading Aloud", desc: "Expresses anxiety or embarrassment when asked to read aloud in front of peers." },
            { title: "Written Thought Organization", desc: "Can speak brilliantly about a topic, but struggles to translate ideas onto paper." }
        ]
    },
    teens: {
        title: "Teens & Adults",
        badge: "Advanced Academic & Executive Function",
        items: [
            { title: "High Mental Effort Required", desc: "Takes 3x longer to finish reading chapters or exam papers." },
            { title: "Memorizing Sequences & Codes", desc: "Difficulty recalling PIN codes, phone numbers, or memorized multiplication tables." },
            { title: "Mispronouncing Complex Words", desc: "Confuses similar long words or hesitates on unfamiliar terminology during presentations." },
            { title: "Preference for Visual / Audio Learning", desc: "Thrives when using audiobooks, diagrams, charts, and video demonstrations." }
        ]
    }
};

function selectSymptomAge(ageKey) {
    const data = symptomData[ageKey];
    if (!data) return;

    document.querySelectorAll('.symptom-tab-btn').forEach(btn => {
        btn.className = 'symptom-tab-btn bg-white text-gray-700 border-2 border-purple-200 font-extrabold text-xs sm:text-sm px-5 py-3 rounded-2xl hover:bg-purple-50 transition-all flex items-center gap-2';
    });
    const activeBtn = document.getElementById(`tab-age-${ageKey}`);
    if (activeBtn) {
        activeBtn.className = 'symptom-tab-btn bg-purple-600 text-white font-extrabold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-md transition-all flex items-center gap-2 border-2 border-purple-600';
    }

    const container = document.getElementById('symptom-content-box');
    if (container) {
        let html = `
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-5 border-b-2 border-purple-200/80 mb-6">
                <h3 class="font-heading text-2xl font-extrabold text-brand-purple-deep">${data.title}</h3>
                <span class="bg-purple-100 text-purple-700 font-extrabold text-xs px-3.5 py-1 rounded-full border border-purple-200">${data.badge}</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        `;

        data.items.forEach(item => {
            html += `
                <div class="bg-white p-5 rounded-2xl border-2 border-purple-100 shadow-sm hover:border-purple-300 transition-all space-y-1.5">
                    <div class="flex items-center gap-2 font-heading font-extrabold text-purple-900 text-base">
                        <span class="text-amber-500 text-lg">📌</span>
                        <span>${item.title}</span>
                    </div>
                    <p class="text-gray-600 text-xs font-semibold leading-relaxed pl-6">
                        ${item.desc}
                    </p>
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;
    }
}

// 3. Parent Quick Screener Calculator
function calculateSymptomScore() {
    const checkboxes = document.querySelectorAll('.screener-checkbox');
    let checkedCount = 0;
    checkboxes.forEach(cb => { if (cb.checked) checkedCount++; });

    const badge = document.getElementById('screener-risk-badge');
    const advice = document.getElementById('screener-advice-text');
    const progressBar = document.getElementById('screener-progress-bar');

    const percent = Math.round((checkedCount / 6) * 100);
    if (progressBar) progressBar.style.width = `${percent}%`;

    if (checkedCount === 0) {
        if (badge) {
            badge.textContent = 'Baseline / Low (0%)';
            badge.className = 'font-extrabold text-xs text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full';
        }
        if (advice) advice.textContent = 'Select checkboxes above to calculate an instant preliminary risk score.';
    } else if (checkedCount <= 2) {
        if (badge) {
            badge.textContent = `Mild Indicators (${percent}%)`;
            badge.className = 'font-extrabold text-xs text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full';
        }
        if (advice) advice.innerHTML = '<strong>Mild Indicators:</strong> Minor developmental variation. Simple focus line rulers and daily 10-min phonics can boost confidence!';
    } else if (checkedCount <= 4) {
        if (badge) {
            badge.textContent = `Moderate Risk (${percent}%)`;
            badge.className = 'font-extrabold text-xs text-amber-900 bg-amber-100 px-3 py-1 rounded-full';
        }
        if (advice) advice.innerHTML = '<strong>Moderate Observational Risk:</strong> Notable signs of visual decoding or letter reversals. We recommend running our full AI screener report!';
    } else {
        if (badge) {
            badge.textContent = `High Risk Indicator (${percent}%)`;
            badge.className = 'font-extrabold text-xs text-rose-800 bg-rose-100 px-3 py-1 rounded-full';
        }
        if (advice) advice.innerHTML = '<strong>High Risk Indicator:</strong> Multiple core dyslexia signs present. Generating a full PDF diagnostic report to share with your pediatrician is highly recommended.';
    }
}

// 4. Authentication Modal Controller
// Note: Auth modal functions (openAuthModal, closeAuthModal, switchAuthTab) are managed centrally in js/auth.js

// 5. Toast Notification System
function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'bg-purple-950 text-white font-extrabold text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 pointer-events-auto border border-purple-700 animate-pop-in';
    toast.innerHTML = `<img src="assets/ollie-mascot.png" alt="Ollie" class="w-5 h-5 object-contain inline-block"> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 6. Smooth Section Scroll Utility
function scrollToSection(id) {
    const elem = document.getElementById(id);
    if (elem) elem.scrollIntoView({ behavior: 'smooth' });
}

// Initialize Landing Page on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    selectSymptomAge('preschool');
});
