function createRequireAuth(createClient) {
  return async function requireAuth(req, res, next) {
    res.set('Cache-Control', 'no-store');
    const match = req.get('Authorization')?.match(/^Bearer +([A-Za-z0-9\-._~+/]+=*)$/i);
    if (!match) {
      return res.status(401).json({ error: 'Access token required' });
    }

    try {
      const client = createClient();
      const { data, error } = await client.auth.getUser(match[1]);
      if (error) {
        if (!error.status || error.status >= 500 || error.status === 429) {
          return res.status(503).json({ error: 'Authentication service unavailable' });
        }
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
      if (!data?.user) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
      req.user = data.user;
      req.accessToken = match[1];
      req.authClient = client;
    } catch {
      return res.status(503).json({ error: 'Authentication service unavailable' });
    }

    return next();
  };
}

module.exports = createRequireAuth;
