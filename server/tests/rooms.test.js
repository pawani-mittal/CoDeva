import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { setupTestDB, teardownTestDB, clearTestDB } from './testDb.js';

let app;
let userToken;
let user2Token;

before(async () => {
  await setupTestDB();
  app = createApp();
});

after(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearTestDB();

  // Create User 1
  const u1 = await request(app).post('/api/auth/register').send({
    name: 'Owner User',
    email: 'owner@codeva.dev',
    password: 'password123',
  });
  userToken = u1.body.token;

  // Create User 2
  const u2 = await request(app).post('/api/auth/register').send({
    name: 'Collaborator User',
    email: 'collab@codeva.dev',
    password: 'password123',
  });
  user2Token = u2.body.token;
});

test('POST /api/rooms - Creates a room and starter file', async () => {
  const res = await request(app)
    .post('/api/rooms')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      name: 'Algorithm Studio',
      description: 'Dynamic Programming practice',
      language: 'javascript',
    });

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.ok(res.body.room.roomId);
  assert.equal(res.body.room.name, 'Algorithm Studio');
  assert.ok(res.body.defaultFile);
  assert.equal(res.body.defaultFile.name, 'index.js');
});

test('GET /api/rooms - Lists rooms created by or joined by the user', async () => {
  await request(app)
    .post('/api/rooms')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ name: 'Room Alpha' });

  await request(app)
    .post('/api/rooms')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ name: 'Room Beta' });

  const res = await request(app)
    .get('/api/rooms')
    .set('Authorization', `Bearer ${userToken}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.rooms.length, 2);
});

test('POST /api/rooms/:roomId/join - Allows collaborator to join existing room', async () => {
  const createRes = await request(app)
    .post('/api/rooms')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ name: 'Shared Lab' });

  const roomId = createRes.body.room.roomId;

  const joinRes = await request(app)
    .post(`/api/rooms/${roomId}/join`)
    .set('Authorization', `Bearer ${user2Token}`);

  assert.equal(joinRes.status, 200);
  assert.equal(joinRes.body.success, true);

  // User 2 should now see the room in their dashboard
  const user2Rooms = await request(app)
    .get('/api/rooms')
    .set('Authorization', `Bearer ${user2Token}`);

  assert.equal(user2Rooms.body.rooms.length, 1);
  assert.equal(user2Rooms.body.rooms[0].roomId, roomId);
});

test('GET /api/rooms/:roomId - Returns 404 for invalid room ID', async () => {
  const res = await request(app)
    .get('/api/rooms/non_existent_room_123')
    .set('Authorization', `Bearer ${userToken}`);

  assert.equal(res.status, 404);
  assert.equal(res.body.success, false);
});

test('DELETE /api/rooms/:roomId - Prevents non-owner from deleting room', async () => {
  const createRes = await request(app)
    .post('/api/rooms')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ name: 'Protected Room' });

  const roomId = createRes.body.room.roomId;

  // User 2 tries to delete User 1's room
  const delRes = await request(app)
    .delete(`/api/rooms/${roomId}`)
    .set('Authorization', `Bearer ${user2Token}`);

  assert.equal(delRes.status, 403);
  assert.equal(delRes.body.success, false);
});

test('DELETE /api/rooms/:roomId - Allows owner to delete room and files', async () => {
  const createRes = await request(app)
    .post('/api/rooms')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ name: 'Temporary Room' });

  const roomId = createRes.body.room.roomId;

  const delRes = await request(app)
    .delete(`/api/rooms/${roomId}`)
    .set('Authorization', `Bearer ${userToken}`);

  assert.equal(delRes.status, 200);
  assert.equal(delRes.body.success, true);

  // Check room is gone
  const getRes = await request(app)
    .get(`/api/rooms/${roomId}`)
    .set('Authorization', `Bearer ${userToken}`);

  assert.equal(getRes.status, 404);
});
