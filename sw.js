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

// Push Event — Maneja notificaciones push desde el servidor
// Muestra la notificación con el mensaje/tarea programada y, opcionalmente, reproduce un timbre.
self.addEventListener('push', e => {
    if (!e.data) {
        console.warn('Push recibido sin datos');
        return;
    }

    let data;
    try {
        data = e.data.json();
    } catch (err) {
        console.warn('Push con payload no JSON:', err);
        data = { title: 'TaskFlow', body: e.data.text() };
    }

    const options = {
        body: data.body || '',
        icon: 'https://cdn-icons-png.flaticon.com/512/906/906334.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/906/906334.png',
        tag: data.tag || 'taskflow-push',
        data: {
            url: data.url || '/',
            taskId: data.taskId || null,
            playSound: !!data.playSound
        },
        vibrate: data.vibrate !== false ? [200, 100, 200] : [],
        requireInteraction: data.requireInteraction || false,
        silent: data.playSound === false
    };

    e.waitUntil(
        self.registration.showNotification(data.title || 'TaskFlow', options)
        .catch(err => console.warn('Error mostrando notificación push:', err))
    );

    // Si se solicita sonido, notificar a los clientes abiertos para reproducirlo
    // (los Service Workers no pueden reproducir audio directamente)
    if (data.playSound) {
        e.waitUntil((async () => {
            try {
                const clientsList = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
                // Usar postMessage simple a todos los clientes (sin MessageChannel para mayor compatibilidad)
                clientsList.forEach(client => {
                    try {
                        client.postMessage({ action: 'play-sound', soundUrl: data.soundUrl || null });
                    } catch (err) {
                        // Ignorar errores de postMessage
                    }
                });
            } catch (err) {
                console.warn('Error notificando a clientes para sonido:', err);
            }
        })());
    }
});

// Notification Click Event
self.addEventListener('notificationclick', e => {
    e.notification.close();
    
    const targetUrl = (e.notification.data && e.notification.data.url) ? e.notification.data.url : '/';
    
    // Cerrar todas las notificaciones con el mismo tag
    if (e.notification.tag) {
        e.waitUntil(
            self.getNotifications({ tag: e.notification.tag }).then(notifications => {
                notifications.forEach(n => n.close());
            })
        );
    }
    
    // Enfocar o abrir la ventana con la URL de la notificación
    e.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            for (const client of clientList) {
                if (client.url === targetUrl && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
