const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');

test('shared middleware protects dashboard and logout; logout targets the verified session', async () => {
  const signedOut = [];
  const app = createApp({}, () => ({ auth: {
    getUser: async token => token.startsWith('valid-')
      ? { data: { user: { id: token } }, error: null }
      : { data: null, error: { status: 401 } },
    admin: { signOut: async (token, scope) => {
      signedOut.push({ token, scope });
      if (token === 'valid-network') throw new Error('Private error');
      if (token === 'valid-service') return { error: { status: 503 } };
      if (token === 'valid-rejected') return { error: { status: 401 } };
      return { error: null };
    } },
  } }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = (path, token) => fetch(base + path, {
    method: path === '/auth/logout' ? 'POST' : 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  try {
    for (const path of ['/protected/dashboard', '/auth/logout']) {
      for (const token of [null, 'fake-token']) {
        const response = await request(path, token);
        assert.equal(response.status, 401);
        assert.deepEqual(await response.json(), {
          error: token ? 'Invalid or expired token' : 'Access token required',
        });
      }
    }
    assert.equal(signedOut.length, 0);

    const dashboard = await request('/protected/dashboard', 'valid-user');
    assert.equal(dashboard.status, 200);
    assert.deepEqual(await dashboard.json(), { message: 'Welcome to your dashboard' });

    const results = await Promise.all(['valid-user-a', 'valid-user-b'].map(token => request('/auth/logout', token)));
    for (const response of results) {
      assert.equal(response.status, 204);
      assert.equal(await response.text(), '');
      assert.equal(response.headers.get('cache-control'), 'no-store');
    }
    assert.deepEqual(signedOut.map(entry => entry.token).sort(), ['valid-user-a', 'valid-user-b']);
    assert.ok(signedOut.every(entry => entry.scope === 'local'));

    for (const [token, status] of [['valid-rejected', 401], ['valid-service', 503], ['valid-network', 503]]) {
      const response = await request('/auth/logout', token);
      assert.equal(response.status, status);
      assert.deepEqual(await response.json(), {
        error: status === 401 ? 'Invalid or expired token' : 'Authentication service unavailable',
      });
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
