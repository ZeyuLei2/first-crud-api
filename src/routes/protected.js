const express = require('express');

const router = express.Router();

router.get('/profile', (req, res) => {
  res.set('Cache-Control', 'no-store');
  const authorization = req.get('Authorization');
  const match = authorization?.match(/^Bearer +([A-Za-z0-9\-._~+/]+=*)$/i);

  if (!match) {
    return res.status(401).json({ error: 'Access token required' });
  }

  return res.json({ message: 'Token received but not verified. Profile data is unavailable.' });
});

module.exports = router;
