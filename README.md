¡Hecho! He implementado la **Opción 1** para ti. Ahora tu aplicación **TaskFlow** es una **PWA (Progressive Web App)** totalmente configurada.

### Cambios realizados:
1. **Creado `todo_app/manifest.json`**: Contiene la configuración de la aplicación (nombre, colores temáticos, comportamiento a pantalla completa y enlaces a iconos de alta resolución de uso libre para que luzca excelente en tu dispositivo).
2. **Creado `todo_app/sw.js` (Service Worker)**: Se encarga de guardar en caché los archivos locales (`index.html`, `style.css`, `app.js`) y dependencias críticas (Tailwind CSS, FontAwesome, Google Fonts) para que la aplicación funcione y cargue de forma instantánea, incluso **sin conexión a Internet**.
3. **Actualizado `todo_app/index.html`**: Se agregaron las etiquetas meta necesarias en el `<head>` para enlazar el manifiesto, definir el color de la barra del sistema y registrar el Service Worker automáticamente al cargar la aplicación.

---

### ¿Cómo instalarla ahora en tu iPhone o Android?

#### Paso 1: Subirla a Internet (Gratis y en 2 minutos)
Para que tu celular pueda instalar la PWA, los archivos deben estar alojados en un servidor seguro (`https://`). Puedes usar cualquiera de estas opciones gratuitas:
* **GitHub Pages**: Si tienes el código en un repositorio de GitHub, activa GitHub Pages en la configuración del repositorio (`Settings > Pages`).
* **Vercel** o **Netlify**: Solo arrastra y suelta la carpeta `todo_app` en [Vercel](https://vercel.com) o [Netlify](https://www.netlify.com). Te darán un enlace `https://` seguro de inmediato.

#### Paso 2: Instalación en tu Celular
Abre el enlace seguro (`https://...`) de tu aplicación en tu teléfono:

* **En Android (usando Google Chrome):**
  1. Verás un mensaje emergente en la parte inferior que dice **"Agregar TaskFlow a la pantalla de inicio"**. Pulsa sobre él.
  2. Si no aparece, presiona el botón de menú (los tres puntos arriba a la derecha) y selecciona **"Instalar aplicación"** o **"Agregar a la pantalla de inicio"**.

* **En iPhone (usando Safari):**
  1. Pulsa el botón **Compartir** (el icono de un cuadrado con una flecha hacia arriba en la barra inferior).
  2. Desplázate hacia abajo y selecciona **"Agregar a inicio"** (o "Add to Home Screen").
  3. Confirma el nombre y pulsa **"Agregar"**.

¡Listo! Tendrás un icono de **TaskFlow** en tu pantalla de inicio que abrirá la aplicación a pantalla completa (sin barra del navegador), brindándote una experiencia idéntica a una aplicación nativa descargada de la App Store o Google Play Store.

---

### Notificaciones Push (configuración rápida)

La aplicación está preparada para recibir notificaciones push, pero necesitas generar claves VAPID y un servidor que envíe los mensajes.

- Generar claves VAPID (en tu máquina o servidor):

```bash
npm install -g web-push
web-push generate-vapid-keys --json > vapid-keys.json
```

- Copia la clave pública al archivo `app.js` reemplazando `REPLACE_WITH_YOUR_PUBLIC_VAPID_KEY`.

- Ejemplo mínimo de servidor Node para enviar notificaciones (usa el paquete `web-push`):

```js
// server.js
const webpush = require('web-push');
const express = require('express');
const bodyParser = require('body-parser');

const VAPID = require('./vapid-keys.json');
webpush.setVapidDetails('mailto:tu@correo.com', VAPID.publicKey, VAPID.privateKey);

const app = express();
app.use(bodyParser.json());

app.post('/send', async (req, res) => {
  const { subscription, title, body, url, playSound } = req.body;
  try {
    await webpush.sendNotification(subscription, JSON.stringify({ title, body, url, playSound }));
    res.sendStatus(201);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000);
```

Guarda las suscripciones de los clientes en tu servidor y usa este endpoint para enviar notificaciones programadas.

Si quieres, aplico la integración del servidor aquí (archivo `server.js`) y guardo la suscripción automáticamente.

---

### Notificaciones Push (configuración rápida)

La aplicación cuenta con un **sistema completo de notificaciones push y recordatorios**:

#### ✅ Funcionalidades implementadas

1. **Recordatorios de tareas programadas**: Cuando creas una tarea con fecha y hora de vencimiento, TaskFlow te notifica automáticamente **el día y hora** a la hora programada. El mensaje de la notificación incluye **el título y la descripción de la tarea**.

2. **Recordatorio anticipado configurable**: El panel de configuración te permite elegir **cuántos minutos antes** del vencimiento quieres la alerta (de 0 a 30 minutos).

3. **Notificación de tareas vencidas**: Habilítalo opcionalmente para recibir una alerta cuando una tarea ya venció y sigue pendiente.

4. **Timbre opcional**: Activa o desactiva el **timbre de campana** (chime) de las notificaciones. Generado con WebAudio, no requiere archivos externos.

5. **Vibración**: Compatible con dispositivos móviles, activable/desactivable.

6. **Notificación de prueba**: Botón para enviar una notificación de prueba y verificar que todo funciona.

7. **Estado en tiempo real**: Indicador en el header que muestra si las notificaciones están "Activadas", "Bloqueadas" o "Sin permiso".

8. **Notificaciones Push (server)**: Cuando el navegador está cerrado, el servidor puede enviar notificaciones push a todos los suscriptores mediante `/send`, `/send-stored` o `/schedule-notification`.

9. **Botón flotante en móvil**: Un botón de ⚙️ flotante en móviles abre el panel de configuración.

#### 🔐 Configuración necesaria

1. **Generar claves VAPID**:

```bash
cd todo_app_web
npm install
npx web-push generate-vapid-keys --json > vapid-keys.json
```

2. **Configurar variables de entorno** (producción):
   - `VAPID_PUBLIC_KEY` = valor `publicKey` de `vapid-keys.json`
   - `VAPID_PRIVATE_KEY` = valor `privateKey` de `vapid-keys.json`
   - `VAPID_MAILTO` = tu email (ej. `mailto:tu@correo.com`)

3. **Suscripción automática**: El botón 🔔 (campana) en el header solicita el permiso y registra la suscripción en el servidor local (`/subscribe`) o en Netlify Functions.

#### 🖥️ Endpoints del servidor

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/vapidPublicKey` | Devuelve la clave pública VAPID |
| `POST` | `/subscribe` | Guarda una suscripción push |
| `POST` | `/send` | Envía notificación a una suscripción |
| `POST` | `/send-stored` | Envía a todas las suscripciones guardadas |
| `POST` | `/schedule-notification` | Programa una notificación para una hora futura |
| `GET` | `/scheduled-notifications` | Lista notificaciones programadas |
| `DELETE` | `/schedule-notification/:id` | Cancela una notificación programada |
| `POST` | `/send-to-subscription` | Envía a una suscripción específica |

#### 🔄 Flujo de recordatorio de tarea

1. El usuario crea una tarea con fecha/hora de vencimiento.
2. `checkTaskDeadlines()` se ejecuta cada minuto (y al cargar la app).
3. Cuando la tarea está dentro de la ventana de recordatorio, se muestra una notificación con el **título y descripción de la tarea**.
4. Opcionalmente suena un **timbre** y/o vibra.
5. Las tareas vencidas se notifican una vez (si está habilitado).

#### ☁️ Notificaciones push programadas (servidor)

Para enviar notificaciones cuando el navegador está cerrado, usa `/schedule-notification`:

```bash
curl -X POST http://localhost:3000/schedule-notification \
  -H "Content-Type: application/json" \
  -d '{"title":"Recordatorio","body":"Revisa tu tarea","sendAt":"2025-01-01T09:00:00","playSound":true}'
```

---

### Servidor local de prueba (opción 2)

Incluí un `server.js` de ejemplo para pruebas locales con los endpoints:

- `GET /vapidPublicKey` — devuelve la clave pública VAPID si existe.
- `POST /subscribe` — guarda temporalmente una suscripción (en memoria).
- `POST /send` — envía una notificación a la suscripción proporcionada.
- `POST /send-stored` — envía a todas las suscripciones almacenadas en memoria.

Pasos para probar localmente:

1. Instala dependencias:

```bash
cd todo_app_web
npm install
```

2. Genera claves VAPID si no las tienes:

```bash
npx web-push generate-vapid-keys --json > vapid-keys.json
```

3. Inicia el servidor:

```bash
node server.js
```

4. En otra terminal, abre tu app (por ejemplo desde el deploy Netlify) y usa la UI de suscripción. Para pruebas rápidas puedes POSTear a `/send` con una suscripción válida.

Nota: `vapid-keys.json` no debe subirse a repositorios públicos si contiene la privateKey.

---

### Notificaciones programadas (GitHub Actions)

Puedes programar notificaciones automáticas usando GitHub Actions que llamen a la función Netlify `send`.

1. Añadí un workflow de ejemplo en `.github/workflows/scheduled_send.yml`.
2. Configura los siguientes **Secrets** en tu repositorio GitHub:
  - `SITE_URL`: URL pública de tu sitio (ej. https://mi-sitio.netlify.app)
  - `PUSH_SUBSCRIPTION`: el JSON completo de una suscripción (puedes copiarlo desde `localStorage` después de suscribirte)
  - Opcional: `PUSH_TITLE`, `PUSH_BODY` para personalizar el mensaje.

El workflow ejecutará la función `/.netlify/functions/send` según la programación (cron) y enviará la notificación al `PUSH_SUBSCRIPTION` guardado.

Advertencia: Guardar una suscripción en Secrets está bien para uso personal, pero para producción es mejor almacenar suscripciones en una DB y que la función lea desde allí.