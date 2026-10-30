import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { setupTestDB, teardownTestDB, clearTestDB } from './testDb.js';

let app;
let token;

before(async () => {
  await setupTestDB();
  app = createApp();
});

after(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearTestDB();
  const userRes = await request(app).post('/api/auth/register').send({
    name: 'Exec Tester',
    email: 'exectest@codeva.dev',
    password: 'password123',
  });
  token = userRes.body.token;
});

test('POST /api/execute - Rejects execution with empty code', async () => {
  const res = await request(app)
    .post('/api/execute')
    .set('Authorization', `Bearer ${token}`)
    .send({
      code: '   ',
      language: 'javascript',
    });

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
});

test('POST /api/execute - Rejects unsupported programming language', async () => {
  const res = await request(app)
    .post('/api/execute')
    .set('Authorization', `Bearer ${token}`)
    .send({
      code: 'print("hello")',
      language: 'unsupported_lang_xyz',
    });

  assert.equal(res.status, 200); // 200 with success: false or 400
  assert.equal(res.body.success, false);
  assert.ok(res.body.message.includes('not supported'));
});
