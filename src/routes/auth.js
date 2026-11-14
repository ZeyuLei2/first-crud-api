const express = require('express');

function createAuthRouter(createClient) {
  const router = express.Router();
  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  router.post('/signup', async (req, res) => {
    const credentials = parseCredentials(req.body);
    if (!credentials) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
      const { data, error } = await createClient().auth.signUp(credentials);
      if (error) {
        if (isServiceError(error)) return serviceUnavailable(res);
        return res.status(error.status === 429 ? 429 : 400).json({ error: 'Unable to sign up' });
      }
      if (!data?.user) return serviceUnavailable(res);
      return res.status(201).json({ user: data.user });
    } catch {
      return serviceUnavailable(res);
    }
  });

  router.post('/login', async (req, res) => {
    const credentials = parseCredentials(req.body);
    if (!credentials) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
      const { data, error } = await createClient().auth.signInWithPassword(credentials);
      if (error) {
        if (isServiceError(error)) return serviceUnavailable(res);
        if (error.status === 429) {
          return res.status(429).json({ error: 'Too many login attempts' });
        }
        return res.status(401).json({ error: 'Invalid login credentials' });
      }
      const session = data?.session;
      if (!session?.access_token || !session?.refresh_token) return serviceUnavailable(res);
      return res.status(200).json({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        token_type: session.token_type,
        expires_in: session.expires_in,
      });
    } catch {
      return serviceUnavailable(res);
    }
  });

  return router;
}

function parseCredentials(body) {
  if (typeof body?.email !== 'string' || !body.email.trim() ||
      typeof body?.password !== 'string' || !body.password.trim()) return null;
  return { email: body.email.trim(), password: body.password };
}

function isServiceError(error) {
  return !error.status || error.status >= 500;
}

function serviceUnavailable(res) {
  return res.status(503).json({ error: 'Authentication service unavailable' });
}

module.exports = createAuthRouter;
