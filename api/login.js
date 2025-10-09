// api/login.js
// Accepts JSON { user, pass } and returns { token }

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).end();
  try{
    const { user, pass } = req.body;
    const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
    const secret = process.env.ADMIN_SECRET || 'changeme';
    if(user === ADMIN_USER && pass === ADMIN_PASS){
      // create a basic token (random) and sign it by keeping it short-lived in memory is not possible across serverless invocations
      // Instead we create a *signed* token using simple HMAC with SECRET so server can validate without state
      const crypto = await import('crypto');
      const payload = JSON.stringify({ user, iat: Date.now() });
      const secret = process.env.ADMIN_SECRET || 'very-secret-change-me';
      const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      const token = Buffer.from(payload).toString('base64') + '.' + sig;
      res.setHeader('Content-Type','application/json');
      return res.status(200).send({ token });
    } else return res.status(401).send({ error:'Invalid credentials' });
  } catch(err){ console.error(err); return res.status(500).send({ error:'Server error' }); }
}
