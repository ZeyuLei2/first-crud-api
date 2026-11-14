const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const createAuthRouter = require('../src/routes/auth');

async function withServer(createClient, run) {
  const app = express();
  app.use(express.json());
  app.use('/auth', createAuthRouter(createClient));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const post = (route, body) => fetch(`http://127.0.0.1:${server.address().port}/auth/${route}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  try { await run(post); }
  finally { await new Promise(resolve => server.close(resolve)); }
}

test('missing, empty, and non-string credentials return 400 without calling Supabase', async () => {
  await withServer(() => { throw new Error('Unexpected client creation'); }, async post => {
    for (const route of ['signup', 'login']) {
      for (const body of [{}, [], { email: 'a@example.com' },
        { email: 42, password: 'secret' }, { email: ' ', password: 'secret' },
        { email: 'a@example.com', password: ' ' }]) {
        const response = await post(route, body);
        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { error: 'Email and password are required' });
      }
    }
  });
});

test('signup returns 201 and user, with a fresh client for each request', async () => {
  let clients = 0;
  await withServer(() => {
    clients++;
    return { auth: { signUp: async credentials => {
      assert.deepEqual(credentials, { email: 'a@example.com', password: ' secret ' });
      return { data: { user: { id: 'user-1' } }, error: null };
    } } };
  }, async post => {
    for (let i = 0; i < 2; i++) {
      const response = await post('signup', { email: ' a@example.com ', password: ' secret ' });
      assert.equal(response.status, 201);
      assert.deepEqual(await response.json(), { user: { id: 'user-1' } });
    }
    assert.equal(clients, 2);
  });
});

test('login returns tokens and prevents response caching', async () => {
  const session = { access_token: 'access', refresh_token: 'refresh', token_type: 'bearer', expires_in: 3600 };
  await withServer(() => ({ auth: { signInWithPassword: async () => ({ data: { session }, error: null }) } }), async post => {
    const response = await post('login', { email: 'a@example.com', password: 'secret' });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), session);
  });
});

test('authentication rejection, rate limiting, and upstream failures have distinct responses', async () => {
  for (const [route, upstreamStatus, expectedStatus, message] of [
    ['login', 400, 401, 'Invalid login credentials'],
    ['signup', 422, 400, 'Unable to sign up'],
    ['login', 429, 429, 'Too many login attempts'],
    ['signup', 429, 429, 'Unable to sign up'],
    ['login', 503, 503, 'Authentication service unavailable'],
    ['signup', 503, 503, 'Authentication service unavailable'],
  ]) {
    const reject = async () => ({ data: null, error: { status: upstreamStatus, message: 'Private upstream detail' } });
    await withServer(() => ({ auth: { signUp: reject, signInWithPassword: reject } }), async post => {
      const response = await post(route, { email: 'a@example.com', password: 'secret' });
      assert.equal(response.status, expectedStatus);
      assert.deepEqual(await response.json(), { error: message });
    });
  }
});

test('network exceptions return 503 without exposing error details', async () => {
  await withServer(() => { throw new Error('Private connection detail'); }, async post => {
    for (const route of ['signup', 'login']) {
      const response = await post(route, { email: 'a@example.com', password: 'secret' });
      assert.equal(response.status, 503);
      assert.deepEqual(await response.json(), { error: 'Authentication service unavailable' });
    }
  });
});
