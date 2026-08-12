const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

const vapidPath = path.join(__dirname, 'vapid-keys.json');
const subsPath = path.join(__dirname, 'subscriptions.json');

if (!fs.existsSync(vapidPath)) {
  console.error('No se encontró vapid-keys.json en el proyecto. Genera con: npx web-push generate-vapid-keys --json > vapid-keys.json');
  process.exit(1);
}
const vapid = JSON.parse(fs.readFileSync(vapidPath, 'utf8'));
if (!vapid.publicKey || !vapid.privateKey) {
  console.error('vapid-keys.json no contiene publicKey/privateKey');
  process.exit(1);
}
webpush.setVapidDetails(process.env.VAPID_MAILTO || vapid.mailto || 'mailto:you@example.com', vapid.publicKey, vapid.privateKey);

if (!fs.existsSync(subsPath)) {
  console.error('No se encontró subscriptions.json — asegúrate de suscribirte desde el navegador.');
  process.exit(1);
}

const subs = JSON.parse(fs.readFileSync(subsPath, 'utf8'));
if (!Array.isArray(subs) || subs.length === 0) {
  console.error('subscriptions.json vacío');
  process.exit(1);
}

const payload = JSON.stringify({ title: 'Prueba desde CLI', body: 'Notificación enviada con send_test.js', url: '/', playSound: true });

(async () => {
  for (const s of subs) {
    try {
      await webpush.sendNotification(s, payload);
      console.log('Enviado a', s.endpoint);
    } catch (err) {
      console.error('Error enviando a', s.endpoint, err.message);
    }
  }
})();
