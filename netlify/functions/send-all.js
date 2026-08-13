const fs = require('fs');
const webpush = require('web-push');

exports.handler = async function(event, context) {
    try {
        const body = JSON.parse(event.body || '{}');
        const title = body.title || 'Recordatorio de TaskFlow';
        const message = body.body || '';
        const url = body.url || '/';
        const playSound = !!body.playSound;
        const tag = body.tag || 'taskflow-push';

        const publicKey = process.env.VAPID_PUBLIC_KEY;
        const privateKey = process.env.VAPID_PRIVATE_KEY;
        const mailto = process.env.VAPID_MAILTO || 'mailto:you@example.com';

        if (!publicKey || !privateKey) {
            return { statusCode: 500, body: JSON.stringify({ error: 'VAPID keys missing in env' }) };
        }

        webpush.setVapidDetails(mailto, publicKey, privateKey);

        // Leer suscripciones del archivo (si está habilitado)
        let subscriptions = [];
        const subsFile = './subscriptions.json';
        if (fs.existsSync(subsFile)) {
            try {
                subscriptions = JSON.parse(fs.readFileSync(subsFile, 'utf8'));
                if (!Array.isArray(subscriptions)) subscriptions = [];
            } catch (e) {
                console.error('Error leyendo subscriptions.json:', e.message);
                subscriptions = [];
            }
        }

        if (subscriptions.length === 0) {
            return { statusCode: 200, body: JSON.stringify({ ok: true, sent: 0, message: 'No hay suscripciones almacenadas' }) };
        }

        const payload = JSON.stringify({
            title,
            body: message,
            url,
            playSound,
            tag,
            vibrate: true,
            requireInteraction: !!body.requireInteraction
        });

        const results = [];
        for (const sub of subscriptions) {
            try {
                await webpush.sendNotification(sub, payload);
                results.push({ endpoint: sub.endpoint ? sub.endpoint.substring(0, 50) + '...' : 'unknown', status: 'ok' });
            } catch (err) {
                results.push({ endpoint: sub.endpoint ? sub.endpoint.substring(0, 50) + '...' : 'unknown', status: 'error', message: err.message });
                // Si la suscripción expiró, podríamos eliminarla del archivo
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                ok: true,
                sent: results.filter(r => r.status === 'ok').length,
                failed: results.filter(r => r.status === 'error').length,
                total: subscriptions.length,
                results
            })
        };
    } catch (err) {
        console.error('send-all error:', err);
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
};