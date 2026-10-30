import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { setupTestDB, teardownTestDB, clearTestDB } from './testDb.js';

let app;

before(async () => {
  await setupTestDB();
  app = createApp();
});

after(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearTestDB();
});

test('POST /api/auth/register - Successfully registers a new user', async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Alice Developer',
    email: 'alice@example.com',
    password: 'password123',
  });

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.ok(res.body.token);
  assert.equal(res.body.user.name, 'Alice Developer');
  assert.equal(res.body.user.email, 'alice@example.com');
});

test('POST /api/auth/register - Rejects registration with duplicate email', async () => {
  await request(app).post('/api/auth/register').send({
    name: 'Alice Developer',
    email: 'alice@example.com',
    password: 'password123',
  });

  const res = await request(app).post('/api/auth/register').send({
    name: 'Alice Two',
    email: 'alice@example.com',
    password: 'password456',
  });

  assert.equal(res.status, 409);
  assert.equal(res.body.success, false);
});

test('POST /api/auth/register - Rejects passwords shorter than 6 characters', async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Short Pass',
    email: 'short@example.com',
    password: '123',
  });

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
});

test('POST /api/auth/login - Successfully logs in with valid credentials', async () => {
  await request(app).post('/api/auth/register').send({
    name: 'Bob Coder',
    email: 'bob@example.com',
    password: 'securePassword!',
  });

  const res = await request(app).post('/api/auth/login').send({
    email: 'bob@example.com',
    password: 'securePassword!',
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.token);
  assert.equal(res.body.user.name, 'Bob Coder');
});

test('POST /api/auth/login - Rejects incorrect password', async () => {
  await request(app).post('/api/auth/register').send({
    name: 'Bob Coder',
    email: 'bob@example.com',
    password: 'securePassword!',
  });

  const res = await request(app).post('/api/auth/login').send({
    email: 'bob@example.com',
    password: 'wrongPassword',
  });

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

test('GET /api/auth/me - Rejects requests without authentication token', async () => {
  const res = await request(app).get('/api/auth/me');
  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

test('GET /api/auth/me - Returns current user with valid Bearer token', async () => {
  const regRes = await request(app).post('/api/auth/register').send({
    name: 'Charlie',
    email: 'charlie@example.com',
    password: 'charliePassword',
  });

  const token = regRes.body.token;

  const res = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.user.email, 'charlie@example.com');
});
