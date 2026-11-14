const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');

test('public access and Stage 2 bearer header checks', async () => {
  const app = createApp({}, () => { throw new Error('Unexpected authentication call'); });
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

    for (const authorization of ['Bearer fake-token', 'bearer fake-token']) {
      const response = await fetch(`${base}/protected/profile`, {
        headers: { Authorization: authorization },
      });
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.deepEqual(await response.json(), {
        message: 'Token received but not verified. Profile data is unavailable.',
      });
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
