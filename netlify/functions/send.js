const webpush = require('web-push');

exports.handler = async function(event, context) {
  try {
        const body = JSON.parse(event.body || '{}');
    const subscription = body.subscription;
    const title = body.title || 'Notificación';
    const message = body.body || '';
    const url = body.url || '/';
    const playSound = !!body.playSound;

    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const mailto = process.env.VAPID_MAILTO || 'mailto:you@example.com';

    if (!publicKey || !privateKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'VAPID keys missing in env' }) };
    }

    webpush.setVapidDetails(mailto, publicKey, privateKey);

    if (!subscription) return { statusCode: 400, body: JSON.stringify({ error: 'subscription required' }) };

    // Construir payload con todas las opciones de la notificación
    const payload = JSON.stringify({
        title,
        body: message,
        url,
        playSound,
        tag: body.tag || 'taskflow-push',
        taskId: body.taskId || null,
        vibrate: body.vibrate !== false,
        requireInteraction: !!body.requireInteraction
    });

    await webpush.sendNotification(subscription, payload);
    return { statusCode: 201, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('send error', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
