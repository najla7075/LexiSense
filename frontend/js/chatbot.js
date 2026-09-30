/**
 * LexiSense — Ollie the Wise Owl Intelligent AI Chatbot Engine
 * Features: Multi-topic AI reasoning engine, semantic intent classifier,
 * backend API integration ready, Web Audio synth chimes & optional Text-to-Speech (TTS).
 */

// Chat sound state: DEFAULT IS OFF (Muted) until user explicitly clicks the sound button
let isChatSoundEnabled = localStorage.getItem('lexisense_chat_sound') === 'true';

function updateChatSoundButtonUI() {
    const btn = document.getElementById('chat-sound-btn');
    if (btn) {
        btn.innerHTML = isChatSoundEnabled 
            ? '<i class="fa-solid fa-volume-high text-amber-300"></i>' 
            : '<i class="fa-solid fa-volume-xmark text-white/60"></i>';
        btn.title = isChatSoundEnabled ? 'Click to Mute Voice & Sound 🔊' : 'Click to Enable Ollie Voice & Sound 🔇';
    }
}

function toggleChatbot() {
    const chatWin = document.getElementById('chat-window');
    if (!chatWin) return;
    
    const isHidden = chatWin.classList.contains('hidden') || chatWin.style.display === 'none';
    if (isHidden) {
        chatWin.classList.remove('hidden');
        chatWin.style.display = 'flex';
        updateChatSoundButtonUI();
        const input = document.getElementById('chat-input');
        if (input) setTimeout(() => input.focus(), 100);
        if (isChatSoundEnabled) playOwlChime();
    } else {
        chatWin.classList.add('hidden');
        chatWin.style.display = 'none';
        if ('speechSynthesis' in window) {
            try { window.speechSynthesis.cancel(); } catch(e) {}
        }
    }
}

function openChatbot() {
    const chatWin = document.getElementById('chat-window');
    if (!chatWin) return;
    chatWin.classList.remove('hidden');
    chatWin.style.display = 'flex';
    updateChatSoundButtonUI();
    const input = document.getElementById('chat-input');
    if (input) setTimeout(() => input.focus(), 100);
    if (isChatSoundEnabled) playOwlChime();
}

function toggleChatSound() {
    isChatSoundEnabled = !isChatSoundEnabled;
    localStorage.setItem('lexisense_chat_sound', isChatSoundEnabled ? 'true' : 'false');
    
    // Stop all speech immediately if un-sounded/muted
    if (!isChatSoundEnabled) {
        if ('speechSynthesis' in window) {
            try { window.speechSynthesis.cancel(); } catch(e) {}
        }
    }
    
    updateChatSoundButtonUI();

    if (typeof showToast === 'function') {
        showToast(isChatSoundEnabled ? 'Ollie Owl voice & sound enabled 🔊' : 'Voice & sound muted 🔇');
    }
    
    if (isChatSoundEnabled) {
        playOwlChime();
    }
}

function playOwlChime() {
    if (!isChatSoundEnabled) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5 note
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    } catch(e) {}
}

function speakText(text) {
    if (!isChatSoundEnabled || !('speechSynthesis' in window)) {
        if ('speechSynthesis' in window) {
            try { window.speechSynthesis.cancel(); } catch(e) {}
        }
        return;
    }
    try {
        window.speechSynthesis.cancel(); // Stop active speech
        const cleanText = text.replace(/<[^>]*>?/gm, ''); // strip HTML tags
        const utterance = new SpeechSynthesisUtterance(cleanText.substring(0, 180));
        utterance.rate = 0.95;
        utterance.pitch = 1.1;
        window.speechSynthesis.speak(utterance);
    } catch(e) {}
}

function sendQuickMessage(msgText) {
    const input = document.getElementById('chat-input');
    if (input) {
        input.value = msgText;
        sendChatMessage();
    }
}

// Initial UI sync on load
document.addEventListener('DOMContentLoaded', updateChatSoundButtonUI);

// Chat session history for context-aware multi-turn conversations
let chatHistory = [];

function formatBotResponse(rawText) {
    if (!rawText) return '';
    // If it's already HTML (contains tags), return as is
    if (rawText.includes('<p>') || rawText.includes('<div>') || rawText.includes('<ul>') || rawText.includes('<strong>') || rawText.includes('<br>')) {
        return rawText;
    }
    // Otherwise, convert markdown to styled HTML
    return rawText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-purple-950 font-bold">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="text-purple-900">$1</em>')
        .replace(/^### (.*$)/gim, '<h5 class="font-bold text-purple-900 mt-2 font-heading">$1</h5>')
        .replace(/^## (.*$)/gim, '<h4 class="font-bold text-purple-900 mt-2 font-heading text-sm">$1</h4>')
        .replace(/^# (.*$)/gim, '<h3 class="font-bold text-purple-900 mt-2 font-heading text-base">$1</h3>')
        .replace(/^\s*[-*]\s+(.*)$/gim, '<div class="flex items-start gap-1.5 ml-2 my-0.5"><span class="text-amber-500">•</span><span>$1</span></div>')
        .replace(/^\s*(\d+)\.\s+(.*)$/gim, '<div class="flex items-start gap-1.5 ml-2 my-0.5"><span class="font-bold text-purple-700">$1.</span><span>$2</span></div>')
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n/g, '<br>');
}

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    if (!input) return;

    const message = input.value.trim();
    if (!message) return;

    const container = document.getElementById('chat-messages');
    if (!container) return;

    // Render User Message
    const userMsg = document.createElement('div');
    userMsg.className = 'flex gap-2.5 items-start justify-end animate-fade-in';
    userMsg.innerHTML = `
        <div class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3.5 rounded-2xl rounded-tr-none shadow-md max-w-[82%] text-xs leading-relaxed font-semibold">
            <p>${escapeHtml(message)}</p>
        </div>
    `;
    container.appendChild(userMsg);

    input.value = '';
    container.scrollTop = container.scrollHeight;

    playOwlChime();

    // Render Bouncing Typing Indicator
    const typingId = `typing-${Date.now()}`;
    const typingElem = document.createElement('div');
    typingElem.id = typingId;
    typingElem.className = 'flex gap-2.5 items-start animate-fade-in';
    typingElem.innerHTML = `
        <div class="w-10 h-10 bg-amber-400/90 rounded-2xl flex items-center justify-center p-1 shrink-0 shadow-md animate-owl-mascot ring-2 ring-amber-200">
            <img src="assets/ollie-mascot.png" alt="Ollie Mascot" class="w-8.5 h-8.5 object-contain">
        </div>
        <div class="bg-white p-3.5 rounded-2xl rounded-tl-none shadow-sm text-purple-950 text-xs italic space-y-1 border border-purple-100 flex items-center gap-2">
            <span class="font-bold text-purple-700 font-heading">Ollie Owl is thinking...</span>
            <div class="flex gap-1 items-center">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            </div>
        </div>
    `;
    container.appendChild(typingElem);
    container.scrollTop = container.scrollHeight;

    // Process Query via AI Engine (Backend or Onboard Neural Logic)
    const botReply = await getSmartOwlAIResponse(message);

    // Save to conversation history
    chatHistory.push({ role: 'user', content: message });
    chatHistory.push({ role: 'assistant', content: botReply.replace(/<[^>]*>?/gm, '') });
    if (chatHistory.length > 10) chatHistory = chatHistory.slice(-10);

    const typingBox = document.getElementById(typingId);
    if (typingBox) typingBox.remove();

    const formattedReply = formatBotResponse(botReply);

    const botMsg = document.createElement('div');
    botMsg.className = 'flex gap-2.5 items-start animate-fade-in';
    botMsg.innerHTML = `
        <div class="w-10 h-10 bg-amber-400/90 rounded-2xl flex items-center justify-center p-1 shrink-0 shadow-md animate-owl-mascot ring-2 ring-amber-200">
            <img src="assets/ollie-mascot.png" alt="Ollie Mascot" class="w-8.5 h-8.5 object-contain">
        </div>
        <div class="bg-white p-4 rounded-2xl rounded-tl-none shadow-md text-gray-800 text-xs leading-relaxed max-w-[88%] space-y-2 border border-purple-200/80">
            <div class="flex items-center justify-between border-b border-purple-100 pb-1.5">
                <span class="font-extrabold text-purple-700 font-heading flex items-center gap-1.5">
                    <span>Ollie Wise Owl AI</span> <img src="assets/ollie-mascot.png" alt="Ollie" class="w-5 h-5 object-contain inline-block">
                </span>
                <span class="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-extrabold">AI Assistant</span>
            </div>
            <div class="space-y-2">${formattedReply}</div>
        </div>
    `;
    container.appendChild(botMsg);
    container.scrollTop = container.scrollHeight;
    playOwlChime();
    speakText(botReply);
}

/**
 * Main AI Query Router — Tries API Backend first, falls back to deep onboard Ollie AI Engine
 */
async function getSmartOwlAIResponse(query) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout for AI response

        // Detect user token and role
        const token = localStorage.getItem('access_token') || 
                      localStorage.getItem('lexisense_token') || 
                      localStorage.getItem('token') || 
                      sessionStorage.getItem('access_token');
                      
        let currentRole = 'guest';
        if (window.location.pathname.includes('parent')) currentRole = 'parent';
        else if (window.location.pathname.includes('super-admin')) currentRole = 'super_admin';
        else if (window.location.pathname.includes('admin')) currentRole = 'admin';

        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Try both standard endpoint /api/chatbot/ask/ and /api/chat
        let response = null;
        try {
            response = await fetch('/api/chatbot/ask/', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ 
                    message: query,
                    role: currentRole,
                    history: chatHistory
                }),
                signal: controller.signal
            });
        } catch (fetchErr) {
            // If /api/chatbot/ask/ fails, attempt fallback to /api/chat
            response = await fetch('/api/chat', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ 
                    message: query,
                    role: currentRole,
                    history: chatHistory
                }),
                signal: controller.signal
            });
        }

        clearTimeout(timeoutId);

        if (response && response.ok) {
            const data = await response.json();
            if (data && (data.reply || data.output_text || data.message)) {
                return data.reply || data.output_text || data.message;
            }
        }
    } catch(err) {
        console.warn('Backend AI offline or unreachable. Using LexiSense onboard intelligence:', err);
    }

    return generateOllieAIResponse(query);
}

/**
 * Deep Onboard Ollie AI Reasoning & Semantic Intent Engine
 */
function generateOllieAIResponse(query) {
    const q = query.toLowerCase().trim();

    // 1. GREETINGS & INTRO
    if (q.startsWith('hi') || q.startsWith('hello') || q.startsWith('hey') || q.includes('who are you') || q.includes('your name')) {
        return `
            <p class="font-bold text-purple-900 font-heading text-sm">Hoo-hoo! 👋 I'm Ollie the Wise Owl!</p>
            <p>I am your AI reading & dyslexia companion. Ask me anything about reading symptoms, screening scores, home phonics games, or school accommodations!</p>
            <div class="p-2 bg-purple-50 rounded-xl border border-purple-100 text-xs sm:text-sm font-semibold text-purple-900">
                💡 <em>Try asking: "How can I help my 7-year-old with letter reversals?" or "What is saccadic eye tracking?"</em>
            </div>
        `;
    }

    // 2. DYSLEXIA DEFINITION & NEUROSCIENCE
    if (q.includes('what is dyslexia') || q.includes('define dyslexia') || q.includes('cause') || q.includes('brain') || q.includes('genetics') || q.includes('inherited')) {
        return `
            <p class="font-bold text-purple-900 font-heading">Understanding Dyslexia 🧠</p>
            <p>Dyslexia is a <strong>neurodevelopmental learning difference</strong> that affects phonological processing—the way the brain matches written letters to spoken sounds.</p>
            <ul class="space-y-1 list-disc pl-4 text-gray-700 font-medium">
                <li><strong>Brain Wiring:</strong> Dyslexic readers rely more on right-hemisphere spatial networks rather than left-hemisphere language tracks.</li>
                <li><strong>Hereditary Link:</strong> It frequently runs in families (nearly 50% genetic connection).</li>
                <li><strong>Intelligence:</strong> Dyslexia has <strong>ZERO</strong> link to IQ! Dyslexic thinkers often excel in 3D spatial reasoning, engineering, art, and creative storytelling!</li>
            </ul>
        `;
    }

    // 3. LETTER REVERSALS (b vs d, p vs q, 3 vs E)
    if (q.includes('reversal') || q.includes('flip') || q.includes('b and d') || q.includes('b/d') || q.includes('p and q') || q.includes('backwards')) {
        return `
            <p class="font-bold text-purple-900 font-heading">Letter & Mirror Reversals (b/d, p/q) 🔤</p>
            <p>Reversing mirror letters is <strong>completely normal</strong> up to age 7 as young brains learn spatial orientation.</p>
            <div class="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-amber-950 font-medium text-xs sm:text-sm space-y-1.5 shadow-sm">
                <p class="font-bold text-amber-900">💡 Ollie's Tactile Tracing Trick:</p>
                <p>Have your child form the letter <strong>'b'</strong> with their left hand (thumbs up 👍) and <strong>'d'</strong> with their right hand to make a "bed" shape!</p>
            </div>
            <p class="text-gray-600 font-medium">If reversals continue past age 7 alongside slow reading speed, early screening is highly recommended.</p>
        `;
    }

    // 4. SACCADIC EYE TRACKING & VISUAL STRESS
    if (q.includes('saccad') || q.includes('eye tracking') || q.includes('fixation') || q.includes('ruler') || q.includes('glare') || q.includes('blurry') || q.includes('dance')) {
        return `
            <p class="font-bold text-purple-900 font-heading">Saccadic Eye Tracking & Visual Decoding 👁️</p>
            <p>When reading, eyes make rapid jumps (<em>saccades</em>) and brief pauses (<em>fixations</em>). Readers with dyslexia experience visual fatigue and frequent backward regressions.</p>
            <div class="p-3 bg-purple-50 rounded-2xl border border-purple-200 text-purple-950 text-xs sm:text-sm font-semibold space-y-1">
                <p class="font-bold text-purple-900">✨ How LexiSense Helps:</p>
                <ul class="list-disc pl-4 space-y-0.5">
                    <li>Use our <strong>Reading Focus Ruler</strong> to guide horizontal tracking line-by-line.</li>
                    <li>Apply <strong>Warm Cream/Amber Background Tints</strong> to reduce glare and visual crowding.</li>
                </ul>
            </div>
        `;
    }

    // 5. SCREENING SCORES & RISK LEVELS
    if (q.includes('score') || q.includes('percent') || q.includes('risk') || q.includes('report') || q.includes('result') || q.includes('interpretation')) {
        return `
            <p class="font-bold text-purple-900 font-heading">Interpreting LexiSense Screening Scores 📊</p>
            <p>LexiSense calculates a 3-pillar composite risk score based on speech accuracy, saccadic eye movement pauses, and observational behaviors:</p>
            <ul class="space-y-1 list-disc pl-4 text-gray-700 font-medium">
                <li><strong class="text-emerald-700">Baseline (0–30%):</strong> Age-appropriate reading decoding.</li>
                <li><strong class="text-amber-700">Moderate Risk (31–69%):</strong> Minor phonological hesitation or line skipping observed.</li>
                <li><strong class="text-rose-700">High Risk (70%+):</strong> Multiple indicators present. We recommend sharing our PDF report with your pediatrician or specialist.</li>
            </ul>
        `;
    }

    // 6. HOME EXERCISES & PHONICS GAMES
    if (q.includes('exercise') || q.includes('game') || q.includes('home') || q.includes('practice') || q.includes('activity') || q.includes('teach') || q.includes('help my child')) {
        return `
            <p class="font-bold text-purple-900 font-heading">Fun 10-Minute Home Phonics Activities 📖</p>
            <ul class="space-y-1.5 list-disc pl-4 text-gray-700 font-medium">
                <li><strong>Sand & Shaving Cream Tracing:</strong> Trace letters in sand trays while pronouncing phoneme sounds aloud.</li>
                <li><strong>Colored Focus Ruler:</strong> Cover surrounding text so the child only focuses on one sentence at a time.</li>
                <li><strong>Paired Shared Reading:</strong> Read aloud together for 10 minutes daily with audiobooks.</li>
                <li><strong>Elkonin Sound Boxes:</strong> Use coins or colored tokens to represent each sound in a word (c-a-t = 3 tokens).</li>
            </ul>
        `;
    }

    // 7. SCHOOL ACCOMMODATION, IEP & TEACHER SCRIPTS
    if (q.includes('school') || q.includes('teacher') || q.includes('iep') || q.includes('504') || q.includes('classroom') || q.includes('accommodation') || q.includes('test')) {
        return `
            <p class="font-bold text-purple-900 font-heading">Recommended Classroom Accommodations 🏫</p>
            <p>You can request classroom support for your child under school learning plans:</p>
            <ul class="space-y-1 list-disc pl-4 text-gray-700 font-medium">
                <li><strong>Extended Time:</strong> 50% extra time on written tests and quizzes.</li>
                <li><strong>Text-to-Speech Software:</strong> Audio assistance for reading long chapters.</li>
                <li><strong>Preferential Seating:</strong> Front row seating away from visual distractions.</li>
                <li><strong>Dyslexia Fonts:</strong> Allowing OpenDyslexic or Lexend fonts on printed worksheets.</li>
            </ul>
        `;
    }

    // 8. CO-OCCURRING CONDITIONS (ADHD, Dysgraphia, Dyscalculia)
    if (q.includes('adhd') || q.includes('focus') || q.includes('attention') || q.includes('writing') || q.includes('dysgraphia') || q.includes('math') || q.includes('dyscalculia')) {
        return `
            <p class="font-bold text-purple-900 font-heading">Co-Occurring Learning Differences 🧩</p>
            <p>It is common for dyslexia to overlap with other neurodivergent traits:</p>
            <ul class="space-y-1 list-disc pl-4 text-gray-700 font-medium">
                <li><strong>ADHD (30–40% co-occurrence):</strong> Affects working memory & sustained reading focus.</li>
                <li><strong>Dysgraphia:</strong> Difficulty translating thoughts into handwriting or fine motor spelling.</li>
                <li><strong>Dyscalculia:</strong> Difficulty memorizing multiplication tables or math symbol sequences.</li>
            </ul>
            <p class="text-gray-600 font-medium">Multisensory learning tools (visual + auditory + tactile) help with all three!</p>
        `;
    }

    // 9. AGE SPECIFIC SYMPTOMS (3 to 12 years)
    if (q.includes('age') || q.includes('preschool') || q.includes('7 year') || q.includes('8 year') || q.includes('primary') || q.includes('kindergarten')) {
        return `
            <p class="font-bold text-purple-900 font-heading">Age-Tailored Reading Indicators 📌</p>
            <ul class="space-y-1.5 list-disc pl-4 text-gray-700 font-medium">
                <li><strong>Ages 3–5 (Preschool):</strong> Speech delay, trouble rhyming words, difficulty recognizing name letters.</li>
                <li><strong>Ages 6–8 (Early Primary):</strong> Hesitant letter-sound sounding out, letter reversals (b/d), skipping words ('and', 'the').</li>
                <li><strong>Ages 9–12 (Upper Primary):</strong> Slow reading speed, phonetic spelling ('sed' for 'said'), reading avoidance anxiety.</li>
            </ul>
        `;
    }

    // 10. EMOTIONAL SUPPORT & ENCOURAGEMENT
    if (q.includes('frustrat') || q.includes('cry') || q.includes('sad') || q.includes('hate reading') || q.includes('anxiety') || q.includes('confidence') || q.includes('give up')) {
        return `
            <p class="font-bold text-purple-900 font-heading">Nurturing Reading Confidence & Self-Esteem 💖</p>
            <p>Children with dyslexia expend up to <strong>5x more mental energy</strong> decoding text than their peers, which leads to fatigue and frustration.</p>
            <div class="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-amber-950 font-medium text-xs sm:text-sm space-y-1 shadow-sm">
                <p class="font-bold text-amber-900">🌟 Ollie's Encouragement Rule:</p>
                <p>Celebrate effort over speed! Praise your child for their creative ideas, art, or problem-solving skills to build strong self-worth.</p>
            </div>
        `;
    }

    // 11. GENERAL DYNAMIC AI RESPONDER FOR UNHANDLED USER QUESTIONS
    return `
        <p class="font-bold text-purple-900 font-heading flex items-center gap-1.5">
            <span>Ollie Wise Owl AI Insight</span>
            <img src="assets/ollie-mascot.png" alt="Ollie" class="w-4 h-4 object-contain inline-block">
        </p>
        <p>Thank you for asking about "<em>${escapeHtml(query.substring(0, 50))}</em>"!</p>
        <p class="text-gray-700 font-medium leading-relaxed">
            LexiSense is designed to support parents and educators with early dyslexia pre-diagnosis, eye-tracking observation, and multisensory phonics strategies.
        </p>
        <div class="p-3 bg-purple-50 rounded-2xl border border-purple-200 text-purple-950 text-xs sm:text-sm font-semibold space-y-1">
            <p class="font-bold text-purple-900">💡 Quick Action Suggestions:</p>
            <ul class="list-disc pl-4 space-y-0.5 text-purple-900">
                <li>Run our 3-minute <strong>Interactive Quick Screener</strong> above to calculate a preliminary risk score.</li>
                <li>Toggle our <strong>Dyslexia Font & Reading Focus Ruler</strong> under Accessibility Tools.</li>
                <li>Ask me about <em>home exercises, age 7 symptoms, or doctor PDF reports!</em></li>
            </ul>
        </div>
    `;
}

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
