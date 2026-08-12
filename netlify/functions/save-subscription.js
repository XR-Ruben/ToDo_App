const fs = require('fs');

exports.handler = async function(event, context) {
  try {
    const subscription = JSON.parse(event.body || '{}');
    // En funciones serverless no podemos confiar en almacenar en disco en producción.
    // Aquí mostramos dos opciones: si existe la variable STORE_SUBSCRIPTIONS_FILE, se escribe en un archivo (útil para pruebas locales).
    if (process.env.STORE_SUBSCRIPTIONS_FILE === 'true') {
      const file = './subscriptions.json';
      let arr = [];
      if (fs.existsSync(file)) {
        try { arr = JSON.parse(fs.readFileSync(file)); } catch (e) { arr = []; }
      }
      arr.push(subscription);
      fs.writeFileSync(file, JSON.stringify(arr, null, 2));
    }
    // En producción, deberías guardar subscription en una base de datos (Supabase, Firebase, etc.)
    console.log('Saved subscription (non-persistent in serverless):', subscription && subscription.endpoint ? subscription.endpoint : 'no-endpoint');
    return { statusCode: 201, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
