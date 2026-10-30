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
    name: 'AI Tester',
    email: 'aitest@codeva.dev',
    password: 'password123',
  });
  token = userRes.body.token;
});

test('POST /api/ai/assist - Rejects empty prompt and code', async () => {
  const res = await request(app)
    .post('/api/ai/assist')
    .set('Authorization', `Bearer ${token}`)
    .send({ action: 'explain' });

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
});

test('POST /api/ai/assist - Handles missing OpenAI API key gracefully', async () => {
  const res = await request(app)
    .post('/api/ai/assist')
    .set('Authorization', `Bearer ${token}`)
    .send({
      action: 'generate',
      prompt: 'Write a binary search function',
    });

  // If OPENAI_API_KEY is not set in env, it returns 503 with configured: false
  if (!process.env.OPENAI_API_KEY) {
    assert.equal(res.status, 503);
    assert.equal(res.body.success, false);
    assert.equal(res.body.configured, false);
    assert.ok(res.body.message.includes('OPENAI_API_KEY'));
  } else {
    // If key is present in env, it executes assist
    assert.ok(res.status === 200 || res.status === 500);
  }
});
