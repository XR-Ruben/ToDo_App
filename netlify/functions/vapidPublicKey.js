exports.handler = async function(event, context) {
  const publicKey = process.env.VAPID_PUBLIC_KEY || null;
  if (!publicKey) return { statusCode: 500, body: JSON.stringify({ error: 'VAPID_PUBLIC_KEY not configured' }) };
  return { statusCode: 200, body: JSON.stringify({ publicKey }) };
};
