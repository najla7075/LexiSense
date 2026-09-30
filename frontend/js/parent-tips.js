/**
 * LexiSense - Parent Action Plan & Interactive Toolkit Controller
 * Evidence-based home literacy strategies, live simulators, and teacher accommodations.
 */

let parentTimerInterval = null;
let parentTimerSeconds = 300; // 5 minutes default
let parentTimerRunning = false;
let parentTimerTotal = 300;

let starStickersCount = 0;

// Filter categories for action plan cards
function filterTipCards(category) {
    const cards = document.querySelectorAll('.tip-action-card');
    const buttons = document.querySelectorAll('.tip-filter-btn');

    buttons.forEach(btn => {
        if (btn.dataset.category === category) {
            btn.className = "tip-filter-btn px-4 py-2 rounded-2xl text-xs font-black transition-all bg-purple-600 text-white shadow-sm scale-105";
        } else {
            btn.className = "tip-filter-btn px-4 py-2 rounded-2xl text-xs font-bold transition-all bg-white text-gray-700 hover:bg-purple-50 border border-purple-200";
        }
    });

    cards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
            card.classList.remove('hidden');
            card.classList.add('animate-fade-in');
        } else {
            card.classList.add('hidden');
        }
    });
}

// 1. Interactive Color Tint Overlay Simulator
function applyTintOverlay(color, label) {
    const previewBox = document.getElementById('tint-preview-box');
    const tintBadge = document.getElementById('tint-active-label');
    if (!previewBox) return;

    previewBox.style.backgroundColor = color;
    if (tintBadge) {
        tintBadge.textContent = `Active Tint: ${label}`;
    }

    if (typeof showToast === 'function') {
        showToast(`Applied ${label} overlay! Notice how the visual glare softens ?`);
    }
}

// 2. Interactive Syllable Word Chunker
const SYLLABLE_WORDS = {
    butterfly: { syllables: ['but', 'ter', 'fly'], colors: ['bg-purple-100 text-purple-900 border-purple-300', 'bg-amber-100 text-amber-900 border-amber-300', 'bg-emerald-100 text-emerald-900 border-emerald-300'], hint: '3 Claps · Compound Word' },
    dinosaur: { syllables: ['di', 'no', 'saur'], colors: ['bg-blue-100 text-blue-900 border-blue-300', 'bg-rose-100 text-rose-900 border-rose-300', 'bg-amber-100 text-amber-900 border-amber-300'], hint: '3 Claps · Open & Closed Syllables' },
    astronaut: { syllables: ['as', 'tro', 'naut'], colors: ['bg-indigo-100 text-indigo-900 border-indigo-300', 'bg-purple-100 text-purple-900 border-purple-300', 'bg-teal-100 text-teal-900 border-teal-300'], hint: '3 Claps · Greek Root /astro/' },
    adventure: { syllables: ['ad', 'ven', 'ture'], colors: ['bg-amber-100 text-amber-900 border-amber-300', 'bg-emerald-100 text-emerald-900 border-emerald-300', 'bg-purple-100 text-purple-900 border-purple-300'], hint: '3 Claps · Prefix + Root' },
    chocolate: { syllables: ['choc', 'o', 'late'], colors: ['bg-rose-100 text-rose-900 border-rose-300', 'bg-purple-100 text-purple-900 border-purple-300', 'bg-amber-100 text-amber-900 border-amber-300'], hint: '3 Claps · Soft Vowel Sound' }
};

function chunkWordInteractive(wordKey) {
    const data = SYLLABLE_WORDS[wordKey];
    const display = document.getElementById('syllable-display-area');
    const hintText = document.getElementById('syllable-hint-text');
    if (!data || !display) return;

    display.innerHTML = data.syllables.map((syl, i) => `
        <div class="px-4 py-2.5 rounded-2xl border-2 font-heading font-black text-lg sm:text-xl shadow-sm ${data.colors[i]} transform hover:scale-110 transition-transform animate-pop cursor-pointer" onclick="pronounceSyllable('${syl}')" title="Click to sound out">
            ${syl}
        </div>
    `).join('<span class="text-xl font-black text-purple-400">·</span>');

    if (hintText) {
        hintText.innerHTML = `<span>??</span> <strong>${data.hint}</strong> — Tap each chunk to sound it out!`;
    }
}

function pronounceSyllable(syl) {
    if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(syl);
        u.rate = 0.8;
        u.pitch = 1.1;
        window.speechSynthesis.speak(u);
    }
}

// 3. Bed Visual Trick (b vs d)
function triggerBedDemo(letter) {
    const bHand = document.getElementById('bed-b-hand');
    const dHand = document.getElementById('bed-d-hand');
    const textDesc = document.getElementById('bed-demo-desc');

    if (letter === 'b') {
        if (bHand) bHand.classList.add('scale-125', 'ring-4', 'ring-purple-400');
        if (dHand) dHand.classList.remove('scale-125', 'ring-4', 'ring-purple-400');
        if (textDesc) textDesc.innerHTML = `<strong class="text-purple-800">Left Hand = 'b'</strong>: Thumbs up on your left hand forms the belly of letter <strong>b</strong> (bat before ball)! ??`;
        pronounceSyllable('buh');
    } else {
        if (dHand) dHand.classList.add('scale-125', 'ring-4', 'ring-amber-400');
        if (bHand) bHand.classList.remove('scale-125', 'ring-4', 'ring-purple-400');
        if (textDesc) textDesc.innerHTML = `<strong class="text-amber-800">Right Hand = 'd'</strong>: Thumbs up on your right hand forms the round body of letter <strong>d</strong> (doorknob before door)! ??`;
        pronounceSyllable('duh');
    }
}

// 4. Live Guided Paired Reading Timer
function setParentTimerDuration(seconds) {
    if (parentTimerInterval) {
        clearInterval(parentTimerInterval);
        parentTimerInterval = null;
        parentTimerRunning = false;
    }
    parentTimerTotal = seconds;
    parentTimerSeconds = seconds;
    updateParentTimerDisplay();
    updateTimerPlayBtn();
}

function toggleParentTimer() {
    if (parentTimerRunning) {
        if (parentTimerInterval) clearInterval(parentTimerInterval);
        parentTimerRunning = false;
    } else {
        parentTimerRunning = true;
        parentTimerInterval = setInterval(() => {
            if (parentTimerSeconds > 0) {
                parentTimerSeconds--;
                updateParentTimerDisplay();
            } else {
                clearInterval(parentTimerInterval);
                parentTimerInterval = null;
                parentTimerRunning = false;
                onParentTimerComplete();
            }
        }, 1000);
    }
    updateTimerPlayBtn();
}

function resetParentTimer() {
    if (parentTimerInterval) clearInterval(parentTimerInterval);
    parentTimerInterval = null;
    parentTimerRunning = false;
    parentTimerSeconds = parentTimerTotal;
    updateParentTimerDisplay();
    updateTimerPlayBtn();
}

function updateParentTimerDisplay() {
    const timerText = document.getElementById('parent-timer-display');
    const timerBar = document.getElementById('parent-timer-progress');
    if (!timerText) return;

    const mins = Math.floor(parentTimerSeconds / 60);
    const secs = parentTimerSeconds % 60;
    timerText.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (timerBar && parentTimerTotal > 0) {
        const pct = Math.round(((parentTimerTotal - parentTimerSeconds) / parentTimerTotal) * 100);
        timerBar.style.width = `${pct}%`;
    }
}

function updateTimerPlayBtn() {
    const playBtn = document.getElementById('parent-timer-play-btn');
    if (!playBtn) return;
    if (parentTimerRunning) {
        playBtn.innerHTML = `<i class="fa-solid fa-pause mr-1.5"></i> Pause Session`;
        playBtn.className = "px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer";
    } else {
        playBtn.innerHTML = `<i class="fa-solid fa-play mr-1.5"></i> Start Reading`;
        playBtn.className = "px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer";
    }
}

function onParentTimerComplete() {
    updateTimerPlayBtn();
    if (typeof showToast === 'function') {
        showToast('?? Fantastic job! Reading session completed with flying colors! ???');
    }
    awardStarSticker();
}

// 5. Interactive Token / Star Sticker Board
function awardStarSticker() {
    starStickersCount = (starStickersCount % 5) + 1;
    renderStarStickers();
    if (typeof showToast === 'function') {
        showToast(`? Earned Star #${starStickersCount}! High five for wonderful reading focus!`);
    }
}

function resetStarStickers() {
    starStickersCount = 0;
    renderStarStickers();
}

function renderStarStickers() {
    for (let i = 1; i <= 5; i++) {
        const starEl = document.getElementById(`token-star-${i}`);
        if (starEl) {
            if (i <= starStickersCount) {
                starEl.className = "w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-300 via-amber-400 to-yellow-200 border-2 border-amber-400 flex items-center justify-center text-2xl shadow-md transform scale-110 transition-all animate-pop cursor-pointer";
                starEl.innerHTML = "?";
            } else {
                starEl.className = "w-12 h-12 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-lg text-gray-300 transition-all cursor-pointer hover:border-amber-300 hover:bg-amber-50";
                starEl.innerHTML = "?";
            }
        }
    }

    const countText = document.getElementById('token-star-count-text');
    if (countText) {
        countText.textContent = `${starStickersCount} / 5 Stars Collected Today`;
    }
}

// 6. Interactive Live Teacher Accommodation Script Generator
function updateTeacherScriptFromCheckboxes() {
    const childName = (typeof getScopedActiveChild === 'function' && getScopedActiveChild(window.loggedInUser?.username || 'guest')?.name) || 'my child';
    
    const cbExtraTime = document.getElementById('cb-teacher-extra-time')?.checked;
    const cbFrontSeat = document.getElementById('cb-teacher-front-seat')?.checked;
    const cbRuler = document.getElementById('cb-teacher-ruler')?.checked;
    const cbVerbal = document.getElementById('cb-teacher-verbal')?.checked;
    const cbSpelling = document.getElementById('cb-teacher-spelling')?.checked;

    let points = [];
    if (cbExtraTime) points.push("allow approximately 15-20% extra processing time for written and reading activities");
    if (cbFrontSeat) points.push("trial preferential seating near the front to minimize ambient distractions and improve board tracking");
    if (cbRuler) points.push("permit using a transparent colored reading ruler or finger guide during text tasks");
    if (cbVerbal) points.push("support written instructions with a brief verbal overview where feasible");
    if (cbSpelling) points.push("focus marking on content creativity and comprehension rather than deducting heavily for phoneme spelling variations in draft work");

    let scriptText = `"Hello Teacher,\n\nWe recently conducted a literacy risk screening with LexiSense for ${childName}. To best support ${childName}'s learning in class, we would love to collaborate on a few gentle classroom accommodations:\n`;
    
    if (points.length > 0) {
        points.forEach((p, idx) => {
            scriptText += `\n${idx + 1}. ${p.charAt(0).toUpperCase() + p.slice(1)}.`;
        });
    } else {
        scriptText += "\n- Flexible reading time and positive place-keeping encouragement.";
    }

    scriptText += `\n\nThank you so much for your warmth, dedication, and support in helping ${childName} thrive!\n\nWarm regards,\nParent of ${childName}"`;

    const scriptDisplay = document.getElementById('teacher-interactive-script-output');
    if (scriptDisplay) {
        scriptDisplay.textContent = scriptText;
    }
}

function copyTeacherInteractiveScript() {
    const scriptDisplay = document.getElementById('teacher-interactive-script-output');
    if (scriptDisplay) {
        navigator.clipboard.writeText(scriptDisplay.textContent);
        if (typeof showToast === 'function') {
            showToast('?? Customized teacher letter copied to clipboard!');
        }
    }
}

// 7. Daily Quest Tracker Checklist Check
function toggleDailyQuestItem() {
    const checkboxes = document.querySelectorAll('.daily-quest-checkbox');
    let completed = 0;
    checkboxes.forEach(cb => {
        if (cb.checked) completed++;
    });

    const total = checkboxes.length || 3;
    const pct = Math.round((completed / total) * 100);

    const bar = document.getElementById('daily-quest-progress-bar');
    const text = document.getElementById('daily-quest-progress-text');
    const cheer = document.getElementById('daily-quest-cheer-badge');

    if (bar) bar.style.width = `${pct}%`;
    if (text) text.textContent = `${completed}/${total} Completed (${pct}%)`;

    if (completed === total) {
        if (cheer) cheer.classList.remove('hidden');
        if (typeof showToast === 'function') {
            showToast('?? Awesome job! You finished all 3 daily home literacy activities today! ???');
        }
    } else {
        if (cheer) cheer.classList.add('hidden');
    }
}

// 8. Q&A Accordion Toggle
function toggleParentFAQ(faqId) {
    const content = document.getElementById(`faq-content-${faqId}`);
    const icon = document.getElementById(`faq-icon-${faqId}`);
    if (!content) return;

    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        if (icon) icon.className = "fa-solid fa-minus text-purple-600";
    } else {
        content.classList.add('hidden');
        if (icon) icon.className = "fa-solid fa-plus text-gray-400";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateParentTimerDisplay();
    updateTeacherScriptFromCheckboxes();
    renderStarStickers();
});
