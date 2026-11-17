const express = require('express');

function createProtectedRouter(requireAuth) {
  const router = express.Router();

  router.get('/profile', requireAuth, (req, res) => {
    const { id, email, created_at } = req.user;
    return res.json({ id, email, created_at });
  });

  router.get('/dashboard', requireAuth, (req, res) => {
    res.json({ message: 'Welcome to your dashboard' });
  });

  return router;
}

module.exports = createProtectedRouter;
