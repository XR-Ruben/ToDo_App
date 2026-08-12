# Despliegue en Netlify — Guía rápida

Pasos para desplegar esta aplicación (frontend + funciones) en Netlify y configurar las variables VAPID.

1) Crear un sitio en Netlify y obtener:
   - `NETLIFY_SITE_ID` (ID del sitio) — lo verás en Site settings → General → Site details.
   - Generar un Personal Access Token: User settings → Applications → Personal access tokens (o usar `netlify login` con Netlify CLI).

2) Guardar secretos en GitHub (repo → Settings → Secrets → Actions):
   - `NETLIFY_AUTH_TOKEN` = tu Netlify personal access token
   - `NETLIFY_SITE_ID` = ID del sitio Netlify

3) Variables VAPID (dos opciones):
   - Opción A (Netlify UI): Site settings → Build & deploy → Environment → New variable
     - `VAPID_PUBLIC_KEY` = (valor de `vapid-keys.json` -> publicKey)
     - `VAPID_PRIVATE_KEY` = (valor de `vapid-keys.json` -> privateKey)
     - `VAPID_MAILTO` = `mailto:tu@ejemplo.com`
     - (opcional) `STORE_SUBSCRIPTIONS_FILE` = `true` (solo para pruebas en serverless)

   - Opción B (CLI): instala Netlify CLI y ejecuta (requiere `NETLIFY_AUTH_TOKEN` y `NETLIFY_SITE_ID`):
     ```bash
     npm i -g netlify-cli
     NETLIFY_AUTH_TOKEN=xxx NETLIFY_SITE_ID=yyy npx netlify env:set VAPID_PUBLIC_KEY "<publicKey>" --site $NETLIFY_SITE_ID
     npx netlify env:set VAPID_PRIVATE_KEY "<privateKey>" --site $NETLIFY_SITE_ID
     npx netlify env:set VAPID_MAILTO "mailto:tu@ejemplo.com" --site $NETLIFY_SITE_ID
     npx netlify env:set STORE_SUBSCRIPTIONS_FILE true --site $NETLIFY_SITE_ID
     ```

4) Flujo de despliegue:
   - Empuja a la rama `main` y el workflow `.github/workflows/deploy_netlify.yml` se ejecutará usando `NETLIFY_AUTH_TOKEN` y `NETLIFY_SITE_ID` configurados como secretos en GitHub.
   - La carpeta `netlify/functions` será subida como funciones Lambda.

5) Endpoints importantes después del despliegue:
   - `GET /.netlify/functions/vapidPublicKey` → devuelve la public key
   - `POST /.netlify/functions/save-subscription` → guarda suscripciones (si `STORE_SUBSCRIPTIONS_FILE=true`)
   - `POST /.netlify/functions/send` → envía notificaciones

Notas:
- Por motivos de seguridad, nunca expongas tus claves privadas en repositorios públicos. Usa siempre variables de entorno en Netlify y secretos en GitHub.
- Para producción, guarda las suscripciones en un DB (Supabase, Firebase, Fauna, etc.) en lugar de archivos en serverless.
