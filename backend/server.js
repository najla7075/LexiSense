import express from 'express';
import OpenAI from 'openai';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const openaiApiKey = process.env.OPENAI_API_KEY;
let openai = null;
if (openaiApiKey && !openaiApiKey.startsWith('your_')) {
    openai = new OpenAI({ apiKey: openaiApiKey });
}

// LexiSense System Prompt Instructions
const LEXISENSE_SYSTEM_PROMPT = `
You are Ollie the Wise Owl (🦉), the AI Assistant for the LexiSense Dyslexia Screening & Reading Support system.

SYSTEM FEATURES & CAPABILITIES:
- Parent: Dashboard, Child Management, Multisensory Screening (Speech & Gaze Tracking), Results, Clinical PDF Reports.
- Admin: Student screening management, screening results, classroom analytics, report generation.
- Super Admin: System administration, account approval, audit logs, security settings.
- Dyslexia Domain Knowledge: Saccadic eye tracking, phonological decoding, mirror reversals (b/d, p/q), 0-30% Baseline risk, 31-69% Moderate risk, 70%+ High risk.

RULES:
1. Explain features step-by-step with Ollie's friendly and encouraging tone.
2. Answer in Bahasa Melayu if the user asks in Bahasa Melayu. Answer in English if the user asks in English.
3. Clarify that LexiSense is a pre-diagnostic tool and suggest consulting a clinical specialist for official diagnosis.
4. Do not request or reveal user passwords, secret keys, or confidential database records.
`;

app.post(['/api/chat', '/api/chatbot/ask/'], async (req, res) => {
    try {
        const { message, query, role = 'guest', history = [] } = req.body;
        const userMessage = message || query;

        if (!userMessage) {
            return res.status(400).json({ error: 'Message parameter is required.' });
        }

        if (openai) {
            const messages = [
                { role: 'system', content: LEXISENSE_SYSTEM_PROMPT + `\n\nActive Role: ${role.toUpperCase()}` }
            ];

            if (Array.isArray(history)) {
                for (const turn of history.slice(-6)) {
                    if (turn.role && turn.content) {
                        messages.push({ role: turn.role, content: turn.content });
                    }
                }
            }

            messages.push({ role: 'user', content: userMessage });

            const completion = await openai.chat.completions.create({
                model: process.env.AI_MODEL || 'gpt-4o-mini',
                messages: messages,
                max_tokens: 650,
                temperature: 0.7
            });

            return res.json({
                reply: completion.choices[0].message.content,
                status: 'success',
                engine: 'OpenAI Express Backend'
            });
        } else {
            // Intelligent Onboard Fallback
            return res.json({
                reply: `Hoo-hoo! 🦉 LexiSense is ready! To enable live OpenAI generation, set your OPENAI_API_KEY in the backend .env file. For now, Ollie can guide you through dyslexia screening, report viewing, and phonics activities.`,
                status: 'success',
                engine: 'LexiSense Onboard Mode'
            });
        }
    } catch (error) {
        console.error('AI Request Error:', error);
        res.status(500).json({ error: 'AI request processing failed.', details: error.message });
    }
});

// Helper to configure SMTP Transporter
function getMailTransporter() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
        return null;
    }

    return nodemailer.createTransport({
        host: host,
        port: port,
        secure: port === 465, // true for 465, false for other ports
        auth: {
            user: user,
            pass: pass
        }
    });
}

// Endpoint to send official screening reports with custom sender (e.g. noreply@mykasih.com.my)
app.post('/api/send-email-report', async (req, res) => {
    try {
        const { to, subject, html, text, childName } = req.body;

        if (!to || !to.includes('@')) {
            return res.status(400).json({ success: false, error: 'Valid recipient email address is required.' });
        }

        const senderEmail = process.env.MAIL_FROM || process.env.SMTP_USER || 'noreply@mykasih.com.my';
        const senderDisplayName = process.env.MAIL_FROM_NAME || 'LexiSense Screening';
        const fromHeader = `"${senderDisplayName}" <${senderEmail}>`;

        const mailSubject = subject || `🦉 LexiSense Screening Dossier: ${childName || 'Child'}`;

        const transporter = getMailTransporter();

        if (!transporter) {
            console.log(`[Email Simulation] Would send to: ${to} from: ${fromHeader}`);
            return res.status(200).json({
                success: true,
                simulated: true,
                sender: fromHeader,
                message: 'SMTP credentials not configured in backend .env. Email dispatch logged in simulated mode.',
                instructions: 'To send real live emails with custom sender (e.g. noreply@mykasih.com.my), configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and MAIL_FROM in backend/.env'
            });
        }

        const info = await transporter.sendMail({
            from: fromHeader,
            to: to,
            subject: mailSubject,
            text: text || 'LexiSense Early Dyslexia Risk Screening Dossier',
            html: html
        });

        console.log(`[Email Sent] Message ID: ${info.messageId} to ${to}`);
        return res.json({
            success: true,
            messageId: info.messageId,
            sender: fromHeader,
            recipient: to
        });

    } catch (error) {
        console.error('Email Dispatch Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to dispatch email.',
            details: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`🦉 LexiSense Backend Server (AI & Email) running at http://localhost:${PORT}`);
});
