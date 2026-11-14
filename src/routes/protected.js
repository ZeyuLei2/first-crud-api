const express = require('express');

function createProtectedRouter(createClient) {
  const router = express.Router();

router.get('/profile', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const authorization = req.get('Authorization');
  const match = authorization?.match(/^Bearer +([A-Za-z0-9\-._~+/]+=*)$/i);

  if (!match) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const { data, error } = await createClient().auth.getUser(match[1]);
    if (error) {
      if (!error.status || error.status >= 500 || error.status === 429) {
        return res.status(503).json({ error: 'Authentication service unavailable' });
      }
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    if (!data?.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    const { id, email, created_at } = data.user;
    return res.json({ id, email, created_at });
  } catch {
    return res.status(503).json({ error: 'Authentication service unavailable' });
  }
});

  return router;
}

module.exports = createProtectedRouter;
