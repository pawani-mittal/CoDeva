import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { setupTestDB, teardownTestDB, clearTestDB } from './testDb.js';

let app;
let token;
let roomId;

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
    name: 'Dev User',
    email: 'dev@codeva.dev',
    password: 'password123',
  });
  token = userRes.body.token;

  const roomRes = await request(app)
    .post('/api/rooms')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'File Test Room' });
  roomId = roomRes.body.room.roomId;
});

test('GET /api/rooms/:roomId/files - Lists files in the room', async () => {
  const res = await request(app)
    .get(`/api/rooms/${roomId}/files`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.files.length >= 1);
  assert.equal(res.body.files[0].name, 'index.js');
});

test('POST /api/rooms/:roomId/files - Creates a new file', async () => {
  const res = await request(app)
    .post(`/api/rooms/${roomId}/files`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'utils.js',
      content: 'export const sum = (a, b) => a + b;',
    });

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.file.name, 'utils.js');
  assert.equal(res.body.file.language, 'javascript');
});

test('POST /api/rooms/:roomId/files - Rejects duplicate file name', async () => {
  await request(app)
    .post(`/api/rooms/${roomId}/files`)
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'duplicate.py' });

  const res = await request(app)
    .post(`/api/rooms/${roomId}/files`)
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'duplicate.py' });

  assert.equal(res.status, 409);
  assert.equal(res.body.success, false);
});

test('PUT /api/rooms/:roomId/files/:fileId - Updates file content', async () => {
  const createRes = await request(app)
    .post(`/api/rooms/${roomId}/files`)
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'test.py', content: 'print("v1")' });

  const fileId = createRes.body.file.id;

  const updateRes = await request(app)
    .put(`/api/rooms/${roomId}/files/${fileId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ content: 'print("v2 updated")' });

  assert.equal(updateRes.status, 200);
  assert.equal(updateRes.body.success, true);
  assert.equal(updateRes.body.file.content, 'print("v2 updated")');
});

test('PATCH /api/rooms/:roomId/files/:fileId/rename - Renames a file and updates language', async () => {
  const createRes = await request(app)
    .post(`/api/rooms/${roomId}/files`)
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'oldName.js' });

  const fileId = createRes.body.file.id;

  const renameRes = await request(app)
    .patch(`/api/rooms/${roomId}/files/${fileId}/rename`)
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'newName.py' });

  assert.equal(renameRes.status, 200);
  assert.equal(renameRes.body.success, true);
  assert.equal(renameRes.body.file.name, 'newName.py');
  assert.equal(renameRes.body.file.language, 'python');
});

test('DELETE /api/rooms/:roomId/files/:fileId - Prevents deleting only file in room', async () => {
  const listRes = await request(app)
    .get(`/api/rooms/${roomId}/files`)
    .set('Authorization', `Bearer ${token}`);

  const defaultFileId = listRes.body.files[0].id;

  const delRes = await request(app)
    .delete(`/api/rooms/${roomId}/files/${defaultFileId}`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(delRes.status, 400);
  assert.equal(delRes.body.success, false);
});

test('DELETE /api/rooms/:roomId/files/:fileId - Successfully deletes file when multiple exist', async () => {
  const createRes = await request(app)
    .post(`/api/rooms/${roomId}/files`)
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'extra.js' });

  const extraFileId = createRes.body.file.id;

  const delRes = await request(app)
    .delete(`/api/rooms/${roomId}/files/${extraFileId}`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(delRes.status, 200);
  assert.equal(delRes.body.success, true);
});
