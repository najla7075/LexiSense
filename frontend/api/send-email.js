export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { to, from, subject, html } = req.body;

        if (!to || !subject || !html) {
            return res.status(400).json({ error: 'Missing required fields (to, subject, html).' });
        }

        const apiKey = process.env.RESEND_API_KEY;

        const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: from || 'LexiSense Support <noreply@lexisense.my>',
                to: Array.isArray(to) ? to : [to],
                subject: subject,
                html: html
            })
        });

        const data = await resendRes.json();

        if (!resendRes.ok) {
            console.error('[Vercel Resend Serverless Error]', resendRes.status, data);
            return res.status(resendRes.status).json({ success: false, error: data.message || 'Resend error', data });
        }

        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('[Vercel Serverless Catch Error]', error);
        return res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
    }
}
