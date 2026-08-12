const express = require('express');
const webpush = require('web-push');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Cargar claves VAPID desde vapid-keys.json o variables de entorno
const path = require('path');
let vapid = null;
const vapidPath = path.join(__dirname, 'vapid-keys.json');
if (fs.existsSync(vapidPath)) {
  try {
    vapid = JSON.parse(fs.readFileSync(vapidPath, 'utf8'));
  } catch (e) {
    console.warn('Could not parse vapid-keys.json, falling back to env vars', e.message);
    vapid = null;
  }
}
if (!vapid) {
  vapid = {
    publicKey: process.env.VAPID_PUBLIC_KEY || null,
    privateKey: process.env.VAPID_PRIVATE_KEY || null,
    mailto: process.env.VAPID_MAILTO || 'mailto:you@example.com'
  };
}

if (!vapid.publicKey || !vapid.privateKey) {
  console.warn('Warning: VAPID keys missing. Generate with web-push and add vapid-keys.json or set env vars.');
}

console.log('Loaded VAPID config:', vapid);

// No establecer VAPID globalmente si faltan claves; se establecerá justo antes de enviar
// Ensure a subject (mailto) is present
if (!vapid.mailto) vapid.mailto = process.env.VAPID_MAILTO || 'mailto:you@example.com';
if (vapid.publicKey && vapid.privateKey) {
  webpush.setVapidDetails(vapid.mailto, vapid.publicKey, vapid.privateKey);
} else {
  console.warn('VAPID keys not set - send endpoints will return error until configured.');
}

// Almacén simple en memoria para pruebas
const subscriptionsFile = path.join(__dirname, 'subscriptions.json');
let subscriptions = [];

function loadSubscriptions() {
  try {
    if (fs.existsSync(subscriptionsFile)) {
      const raw = fs.readFileSync(subscriptionsFile, 'utf8');
      subscriptions = JSON.parse(raw) || [];
    } else {
      subscriptions = [];
    }
  } catch (err) {
    console.warn('No se pudieron cargar subscriptions.json, usando array vacío', err.message);
    subscriptions = [];
  }
}

function saveSubscriptions() {
  try {
    fs.writeFileSync(subscriptionsFile, JSON.stringify(subscriptions, null, 2), 'utf8');
  } catch (err) {
    console.error('Error guardando subscriptions.json', err.message);
  }
}

// Cargar al inicio
loadSubscriptions();

app.get('/vapidPublicKey', (req, res) => {
  if (!vapid.publicKey) return res.status(500).json({ error: 'VAPID public key not configured' });
  res.send(vapid.publicKey);
});

app.post('/subscribe', (req, res) => {
  const subscription = req.body;
  if (!subscription || !subscription.endpoint) return res.status(400).json({ error: 'Invalid subscription' });
  // Evitar duplicados por endpoint
  const exists = subscriptions.find(s => s && s.endpoint === subscription.endpoint);
  if (!exists) {
    subscriptions.push(subscription);
    saveSubscriptions();
  }
  return res.json({ ok: true });
});

app.post('/send', async (req, res) => {
  const { subscription, title, body, url, playSound } = req.body;
  if (!subscription) return res.status(400).json({ error: 'subscription required' });
  if (!vapid.publicKey || !vapid.privateKey) return res.status(500).json({ error: 'VAPID keys not configured' });
  // Asegurar que web-push tiene las VAPID actualizadas
  webpush.setVapidDetails(vapid.mailto, vapid.publicKey, vapid.privateKey);
  const payload = JSON.stringify({ title: title || 'Notificación', body: body || '', url: url || '/', playSound: !!playSound });
  try {
    await webpush.sendNotification(subscription, payload);
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('send error', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/send-stored', async (req, res) => {
  const { title, body, url, playSound } = req.body;
  if (!vapid.publicKey || !vapid.privateKey) return res.status(500).json({ error: 'VAPID keys not configured' });
  webpush.setVapidDetails(vapid.mailto, vapid.publicKey, vapid.privateKey);
  const payload = JSON.stringify({ title: title || 'Notificación', body: body || '', url: url || '/', playSound: !!playSound });
  const results = [];
  for (const s of subscriptions) {
    try {
      await webpush.sendNotification(s, payload);
      results.push({ endpoint: s.endpoint, status: 'ok' });
    } catch (err) {
      results.push({ endpoint: s.endpoint, status: 'error', message: err.message });
    }
  }
  res.json(results);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Push test server listening on http://localhost:${port}`));
