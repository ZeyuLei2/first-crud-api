const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');

test('public access, bearer header checks, and verified profiles', async () => {
  let calls = 0;
  const app = createApp({}, () => ({ auth: { getUser: async token => {
    calls++;
    if (token === 'valid-token') return { data: { user: {
      id: 'user-1', email: 'user@example.com', created_at: '2026-01-01T00:00:00Z',
      user_metadata: { private_detail: 'not returned' },
    } }, error: null };
    if (token === 'network-failure') throw new Error('Private connection detail');
    if (token === 'empty-user') return { data: { user: null }, error: null };
    const status = token === 'service-failure' ? 503 : token === 'rate-limited' ? 429 : 401;
    return { data: { user: null }, error: { status, message: 'Private upstream detail' } };
  } } }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    const publicResponse = await fetch(`${base}/public/info`);
    assert.equal(publicResponse.status, 200);
    assert.deepEqual(await publicResponse.json(), { message: 'Welcome stranger! This info is public.' });

    for (const authorization of [null, '', 'Basic abc', 'Bearer', 'Bearer ',
      'Bearer fake token', 'Bearer first, Bearer second']) {
      const response = await fetch(`${base}/protected/profile`, {
        headers: authorization === null ? {} : { Authorization: authorization },
      });
      assert.equal(response.status, 401);
      assert.deepEqual(await response.json(), { error: 'Access token required' });
    }

    assert.equal(calls, 0);

    for (const token of ['fake-token', 'expired-token', 'tampered-token', 'empty-user',
      'service-failure', 'network-failure', 'rate-limited']) {
      const response = await fetch(`${base}/protected/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const unavailable = ['service-failure', 'network-failure', 'rate-limited'].includes(token);
      assert.equal(response.status, unavailable ? 503 : 401);
      assert.deepEqual(await response.json(), {
        error: unavailable ? 'Authentication service unavailable' : 'Invalid or expired token',
      });
    }

    for (const authorization of ['Bearer valid-token', 'bearer valid-token']) {
      const response = await fetch(`${base}/protected/profile`, {
        headers: { Authorization: authorization },
      });
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.deepEqual(await response.json(), {
        id: 'user-1', email: 'user@example.com', created_at: '2026-01-01T00:00:00Z',
      });
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
