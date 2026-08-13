const CACHE_NAME = 'taskflow-v2';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap'
];

// Install Event
self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Separar assets locales (misma origen) de recursos externos (CDN)
    const localFiles = ASSETS.filter(url => url.startsWith('.'));
    const externalFiles = ASSETS.filter(url => !url.startsWith('.'));

    try {
      if (localFiles.length) await cache.addAll(localFiles);
    } catch (err) {
      console.warn('Error al cachear archivos locales:', err);
    }

    // Para recursos externos usamos fetch con mode 'no-cors' y cache.put cuando sea posible.
    await Promise.all(externalFiles.map(async url => {
      try {
        const resp = await fetch(url, { mode: 'no-cors' });
        if (resp) {
          try { await cache.put(url, resp); } catch (err) { /* put puede fallar en algunos entornos */ }
        }
      } catch (err) {
        console.warn('No se pudo obtener recurso externo para cache:', url, err);
      }
    }));

    await self.skipWaiting();
  })());
});

// Activate Event
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});

// Push Event
self.addEventListener('push', e => {
    const data = e.data.json();
  const options = {
    body: data.body,
    icon: 'https://cdn-icons-png.flaticon.com/512/906/906334.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/', playSound: !!data.playSound }
  };
  self.registration.showNotification(data.title, options);
  // Si se pide que se reproduzca sonido, enviar mensaje a clientes para reproducirlo (los SW no pueden reproducir audio directamente)
  if (data.playSound) {
    // Mantener el SW vivo mientras intentamos notificar clientes y esperar confirmación
    e.waitUntil((async () => {
      try {
        const clientsList = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
        const tasks = clientsList.map(client => new Promise(resolve => {
          const channel = new MessageChannel();
          let finished = false;
          const timer = setTimeout(() => {
            if (!finished) { finished = true; channel.port1.onmessage = null; resolve(false); }
          }, 3000);

          channel.port1.onmessage = (ev) => {
            if (!finished) {
              finished = true;
              clearTimeout(timer);
              channel.port1.onmessage = null;
              resolve(true);
            }
          };

          try {
            client.postMessage({ action: 'play-sound', soundUrl: data.soundUrl || null }, [channel.port2]);
          } catch (err) {
            clearTimeout(timer);
            resolve(false);
          }
        }));

        await Promise.all(tasks);
      } catch (err) {
        console.warn('clients.matchAll falló al intentar postMessage:', err);
      }
    })());
  }
});

// Notification Click Event
self.addEventListener('notificationclick', e => {
    e.notification.close();
    e.waitUntil(
        clients.matchAll({ type: 'window' }).then(clientsArr => {
      // Intentar enfocar una ventana existente que apunte a la URL de la notificación
      const targetUrl = e.notification.data && e.notification.data.url ? e.notification.data.url : '/';
      for (const windowClient of clientsArr) {
        if (windowClient.url === targetUrl) {
          return windowClient.focus();
        }
      }
      // Si no hay una ventana abierta, abrir la URL
      return clients.openWindow(targetUrl).then(windowClient => windowClient ? windowClient.focus() : null);
        })
    );
});
