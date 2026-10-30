import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as ioClient } from 'socket.io-client';
import request from 'supertest';
import * as Y from 'yjs';

import { createApp } from '../src/app.js';
import { initSocketServer } from '../src/sockets/socketManager.js';
import { setupTestDB, teardownTestDB, clearTestDB } from './testDb.js';

let httpServer;
let ioServer;
let port;
let app;
let user1Token;
let user2Token;
let testRoomId;
let testFileId;

before(async () => {
  await setupTestDB();
  await clearTestDB();

  app = createApp();
  httpServer = http.createServer(app);
  ioServer = new SocketIOServer(httpServer);
  initSocketServer(ioServer);

  await new Promise((resolve) => {
    httpServer.listen(0, '127.0.0.1', () => {
      port = httpServer.address().port;
      console.log(`[Test Server] Listening on http://127.0.0.1:${port}`);
      resolve();
    });
  });

  // Register User 1
  const u1 = await request(app).post('/api/auth/register').send({
    name: 'Collaborator Alice',
    email: 'alice@collab.test',
    password: 'password123',
  });
  user1Token = u1.body.token;

  // Register User 2
  const u2 = await request(app).post('/api/auth/register').send({
    name: 'Collaborator Bob',
    email: 'bob@collab.test',
    password: 'password123',
  });
  user2Token = u2.body.token;

  // User 1 creates room
  const r = await request(app)
    .post('/api/rooms')
    .set('Authorization', `Bearer ${user1Token}`)
    .send({ name: 'Live Collab Room', language: 'javascript' });

  testRoomId = r.body.room.roomId;
  testFileId = r.body.defaultFile._id;
});

after(async () => {
  ioServer.disconnectSockets();
  ioServer.close();
  await new Promise((resolve) => httpServer.close(resolve));
  await teardownTestDB();
});

test('Socket.IO - Rejects connection without valid authentication token', async () => {
  await new Promise((resolve, reject) => {
    const socket = ioClient(`http://127.0.0.1:${port}`, {
      transports: ['websocket'],
      reconnection: false,
      auth: { token: '' },
    });

    socket.on('connect_error', (err) => {
      assert.ok(err.message.includes('Authentication required'));
      socket.close();
      resolve();
    });

    socket.on('connect', () => {
      socket.close();
      reject(new Error('Should not have connected unauthenticated'));
    });
  });
});

test('Socket.IO - Multi-user presence, room join, and live chat delivery', async () => {
  // Connect Alice
  const aliceSocket = ioClient(`http://127.0.0.1:${port}`, {
    transports: ['websocket'],
    reconnection: false,
    auth: { token: user1Token },
  });

  // Connect Bob
  const bobSocket = ioClient(`http://127.0.0.1:${port}`, {
    transports: ['websocket'],
    reconnection: false,
    auth: { token: user2Token },
  });

  await new Promise((resolve) => {
    let connected = 0;
    const check = () => {
      connected++;
      if (connected === 2) resolve();
    };
    aliceSocket.on('connect', check);
    bobSocket.on('connect', check);
  });

  // 1. Join room
  await new Promise((resolve) => {
    aliceSocket.emit('room:join', { roomId: testRoomId }, (res) => {
      assert.equal(res.success, true);
      resolve();
    });
  });

  // Bob joins and Alice gets presence update
  const presencePromise = new Promise((resolve) => {
    aliceSocket.on('presence:update', ({ roomId, members }) => {
      if (members.length === 2) {
        assert.equal(roomId, testRoomId);
        resolve();
      }
    });
  });

  bobSocket.emit('room:join', { roomId: testRoomId });
  await presencePromise;

  // 2. Test Live Chat between Alice and Bob
  const chatPromise = new Promise((resolve) => {
    bobSocket.on('chat:message', ({ roomId, message }) => {
      assert.equal(roomId, testRoomId);
      assert.equal(message.content, 'Hello from Alice via real-time Socket.IO!');
      assert.equal(message.sender.name, 'Collaborator Alice');
      resolve();
    });
  });

  aliceSocket.emit('chat:send', {
    roomId: testRoomId,
    content: 'Hello from Alice via real-time Socket.IO!',
  });
  await chatPromise;

  // 3. Test Yjs CRDT Synchronization Step-1 & Step-2
  const syncPromise = new Promise((resolve) => {
    aliceSocket.on('doc:sync-step-2', ({ roomId, fileId, update }) => {
      assert.equal(roomId, testRoomId);
      assert.equal(fileId, testFileId);
      assert.ok(update.length > 0);
      resolve();
    });
  });

  aliceSocket.emit('doc:sync-step-1', {
    roomId: testRoomId,
    fileId: testFileId,
    stateVector: [],
  });
  await syncPromise;

  // 4. Test Yjs Document Update Broadcast
  const docUpdatePromise = new Promise((resolve) => {
    bobSocket.on('doc:update', ({ roomId, fileId, update }) => {
      assert.equal(roomId, testRoomId);
      assert.equal(fileId, testFileId);
      assert.ok(update.length > 0);
      resolve();
    });
  });

  // Alice sends a Yjs update
  const clientDoc = new Y.Doc();
  const yText = clientDoc.getText('monaco');
  yText.insert(0, '// Concurrent edit line\n');
  const update = Y.encodeStateAsUpdate(clientDoc);

  aliceSocket.emit('doc:update', {
    roomId: testRoomId,
    fileId: testFileId,
    update: Array.from(update),
  });
  await docUpdatePromise;

  // Clean up sockets
  aliceSocket.disconnect();
  bobSocket.disconnect();
});
