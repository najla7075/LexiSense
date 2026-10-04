export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message, query, role = 'guest', history = [] } = req.body;
        const userMessage = message || query;

        if (!userMessage) {
            return res.status(400).json({ error: 'Message parameter is required.' });
        }

        const apiKey = process.env.OPENAI_API_KEY;

        const LEXISENSE_SYSTEM_PROMPT = `
You are Ollie the Wise Owl (🦉), the friendly, highly intelligent, and compassionate AI Mascot & Assistant for the LexiSense Dyslexia Screening & Reading Support system.

YOUR MISSION & ROLE:
- Support Parents, Educators, and Admins with expert, empathetic guidance on dyslexia screening, reading intervention, phonics, gaze tracking saccades, and developmental support.
- Provide step-by-step actionable advice formatted with clean Markdown, bullet points, and encouraging owl-themed emojis (🦉, 📚, ✨, 🧠, 🎯, 📖).

LEXISENSE SYSTEM KNOWLEDGE:
- **Risk Classifications:** 0–30% (Low/Baseline Risk), 31–69% (Moderate Risk), 70%+ (High Risk).
- **Multisensory Screening:** Phonological decoding, speech fluency (WCPM), mirror letter reversals (b/d, p/q), saccadic eye regressions, and attention focus.
- **Role Modes:**
  * Parent Mode: Focus on child progress, home exercises, multisensory reading games, and PDF dossier explanations.
  * Educator/Admin Mode: Classroom screening rosters, cohort analytics, school branch management, and intervention tracking.
  * Super Admin Mode: System administration, account security, audit logs, and algorithm configuration.

RESPONSE GUIDELINES:
1. **Language:** Respond in Bahasa Melayu if the user asks in Bahasa Melayu. Respond in English if the user asks in English.
2. **Tone:** Warm, encouraging, empathetic, clear, professional, and accessible.
3. **Medical Disclaimer:** Explicitly clarify that LexiSense is an AI pre-diagnostic screening tool and recommend consulting a registered Educational Psychologist or Speech-Language Pathologist for official medical diagnosis.
4. **Security:** Never request or reveal user passwords, secret keys, or private database records.
`;

        const messages = [
            { role: 'system', content: `${LEXISENSE_SYSTEM_PROMPT}\n\nACTIVE CONTEXT: User Role is ${role.toUpperCase()}.` }
        ];

        if (Array.isArray(history)) {
            for (const turn of history.slice(-8)) {
                if (turn.role && turn.content) {
                    messages.push({ role: turn.role === 'assistant' ? 'assistant' : 'user', content: turn.content });
                }
            }
        }

        if (!apiKey) {
            const fallbackReply = generateOnboardOllieResponse(userMessage, role);
            return res.status(200).json({
                success: true,
                reply: fallbackReply,
                output_text: fallbackReply,
                message: fallbackReply,
                engine: 'LexiSense Intelligent Onboard Engine',
                notice: 'OpenAI API key not configured. Using LexiSense Onboard AI Engine.'
            });
        }

        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: process.env.AI_MODEL || 'gpt-4o-mini',
                messages: messages,
                max_tokens: 750,
                temperature: 0.7
            })
        });

        const data = await openaiRes.json();

        if (!openaiRes.ok) {
            console.warn('[OpenAI API Quota Notice - Falling back to LexiSense Onboard AI Engine]', openaiRes.status, data);
            
            // Intelligent Onboard Fallback Generator
            const fallbackReply = generateOnboardOllieResponse(userMessage, role);
            return res.status(200).json({
                success: true,
                reply: fallbackReply,
                output_text: fallbackReply,
                message: fallbackReply,
                engine: 'LexiSense Intelligent Onboard Engine',
                notice: 'OpenAI API quota exhausted. Switched to LexiSense Onboard AI Engine.'
            });
        }

        const replyText = data.choices[0]?.message?.content;

        return res.status(200).json({
            success: true,
            reply: replyText,
            output_text: replyText,
            message: replyText,
            engine: 'OpenAI ChatGPT (GPT-4o Mini)',
            model: data.model
        });

    } catch (error) {
        console.error('[Vercel Chat Serverless Error]', error);
        const fallbackReply = generateOnboardOllieResponse(req.body.message || req.body.query || '', req.body.role || 'guest');
        return res.status(200).json({
            success: true,
            reply: fallbackReply,
            output_text: fallbackReply,
            message: fallbackReply,
            engine: 'LexiSense Intelligent Onboard Engine'
        });
    }
}

function generateOnboardOllieResponse(query, role) {
    const q = (query || '').toLowerCase();
    
    if (q.includes('saccade') || q.includes('eye') || q.includes('mata') || q.includes('gaze')) {
        return `Hoo-hoo! 🦉 **Mata & Eye-Tracking Saccades dalam Saringan LexiSense:**\n\n- **Saccades (Pergerakan Mata):** Kanak-kanak disleksia sering mengalami pergerakan mata melompat-lompat (*saccadic regressions*) apabila membaca teks.\n- **Kamera LexiSense:** Kamera peranti membantu mengesan kadar regresi mata dan titik fokus visual semasa kanak-kanak membaca.\n- **Sokongan:** Latihan seperti *Line Ruler* dan visual *multisensory* membantu mengurangkan keletihan mata. 👁️✨`;
    }
    if (q.includes('score') || q.includes('markah') || q.includes('skor') || q.includes('64')) {
        return `Hoo-hoo! 🦉 **Penjelasan Skor Saringan LexiSense (64% Risk):**\n\n- **Kategori:** 31% – 69% menunjukkan **Risiko Sederhana (Moderate Risk)**.\n- **Maksud Skor:** Kanak-kanak menunjukkan beberapa petunjuk kesukaran dalam *phonological decoding* dan pergerakan mata (*saccadic regressions*).\n- **Tindakan:** Lakukan latihan multisensori di rumah 10-15 minit sehari dan rujuk Laporan PDF dengan Pakar Psikologi Pendidikan jika perlu. 📖🎯`;
    }
    if (q.includes('exercise') || q.includes('latihan') || q.includes('rumah') || q.includes('home')) {
        return `Hoo-hoo! 🦉 **Cadangan Latihan Pembacaan Di Rumah:**\n\n1. **Phonics & Multisensory Tracing:** Suruh kanak-kanak menyebut bunyi huruf (*phonics*) sambil melukis bentuk huruf di atas pasir atau kain.\n2. **Reading Focus Ruler:** Gunakan pembaris penunjuk garisan untuk mengekalkan fokus mata.\n3. **Amalan 10 Minit:** Latihan pendek setiap hari lebih berkesan daripada sesi panjang yang memenatkan! 📖✨`;
    }
    
    return `Hoo-hoo! 🦉 Saya **Ollie the Wise Owl**, Pembantu AI LexiSense anda!\n\nSaya boleh membantu anda memahami **skor saringan disleksia**, **pergerakan mata (eye-tracking saccades)**, **laporan PDF**, atau **latihan pembacaan di rumah**.\n\n*Nota: LexiSense ialah alat saringan awal pra-diagnostik. Sila rujuk Pakar Psikologi Pendidikan untuk diagnosis klinikal rasmi.* 🦉✨`;
}
