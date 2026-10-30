import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Room } from '../models/Room.js';
import { Message } from '../models/Message.js';
import { registerYjsHandlers, flushFileSave } from './yjsSync.js';

// Map: roomId -> Map<userId, { name, email, sockets: Set<string>, activeFileId }>
const roomPresence = new Map();

function getRoomPresenceList(roomId) {
  const presence = roomPresence.get(roomId);
  if (!presence) return [];
  const list = [];
  for (const [userId, data] of presence.entries()) {
    list.push({
      userId,
      name: data.name,
      email: data.email,
      activeFileId: data.activeFileId,
      connectedTabs: data.sockets.size,
      online: true,
    });
  }
  return list;
}

export function initSocketServer(io) {
  // Socket.IO authentication middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication required for real-time collaboration.'));
      }

      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('User account not found.'));
      }

      socket.user = user;
      next();
    } catch (err) {
      console.warn('[SocketManager] Socket auth error:', err.message);
      next(new Error('Invalid or expired authentication token.'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    let currentRoomId = null;
    let currentFileId = null;

    console.log(`[Socket] User connected: ${user.name} (${user._id}) [Socket ID: ${socket.id}]`);

    // Register Yjs collaborative document handlers
    registerYjsHandlers(io, socket);

    // Join coding room
    socket.on('room:join', async ({ roomId }, callback) => {
      try {
        if (!roomId) {
          if (callback) callback({ success: false, message: 'Room ID required' });
          return;
        }

        const room = await Room.findOne({ roomId });
        if (!room) {
          if (callback) callback({ success: false, message: 'Room not found' });
          return;
        }

        // Verify membership or public access
        const isMember = room.members.some((m) => m.user.toString() === user._id.toString());
        const isOwner = room.owner.toString() === user._id.toString();

        if (!isMember && !isOwner) {
          // Add user as member if public
          room.members.push({
            user: user._id,
            role: 'member',
            joinedAt: new Date(),
          });
          await room.save();
        }

        currentRoomId = roomId;
        const socketRoom = `room:${roomId}`;
        socket.join(socketRoom);

        // Track presence
        if (!roomPresence.has(roomId)) {
          roomPresence.set(roomId, new Map());
        }
        const presence = roomPresence.get(roomId);
        const userIdStr = user._id.toString();

        if (!presence.has(userIdStr)) {
          presence.set(userIdStr, {
            name: user.name,
            email: user.email,
            sockets: new Set([socket.id]),
            activeFileId: null,
          });
        } else {
          presence.get(userIdStr).sockets.add(socket.id);
        }

        // Broadcast presence update to all clients in room
        io.to(socketRoom).emit('presence:update', {
          roomId,
          members: getRoomPresenceList(roomId),
        });

        // Send recent chat messages to joining client
        const recentMessages = await Message.find({ roomId })
          .populate('sender', 'name email')
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();

        socket.emit('chat:history', {
          roomId,
          messages: recentMessages.reverse().map((m) => ({
            id: m._id,
            content: m.content,
            sender: {
              id: m.sender?._id,
              name: m.sender?.name,
              email: m.sender?.email,
            },
            createdAt: m.createdAt,
          })),
        });

        if (callback) {
          callback({
            success: true,
            room: {
              id: room._id,
              roomId: room.roomId,
              name: room.name,
              isOwner,
            },
          });
        }
      } catch (err) {
        console.error('[Socket] Error in room:join:', err);
        if (callback) callback({ success: false, message: 'Internal error joining room' });
      }
    });

    // Notify file activity switch
    socket.on('file:active', ({ roomId, fileId }) => {
      currentFileId = fileId;
      if (roomId && roomPresence.has(roomId)) {
        const presence = roomPresence.get(roomId);
        const userEntry = presence.get(user._id.toString());
        if (userEntry) {
          userEntry.activeFileId = fileId;
          io.to(`room:${roomId}`).emit('presence:update', {
            roomId,
            members: getRoomPresenceList(roomId),
          });
        }
      }
    });

    // Cursor position updates
    socket.on('cursor:update', ({ roomId, fileId, position }) => {
      if (!roomId) return;
      socket.to(`room:${roomId}`).emit('cursor:update', {
        roomId,
        fileId,
        position,
        user: {
          id: user._id,
          name: user.name,
        },
      });
    });

    // Chat message sending
    socket.on('chat:send', async ({ roomId, content }, callback) => {
      try {
        if (!roomId || !content || !content.trim()) {
          if (callback) callback({ success: false, message: 'Message content cannot be empty' });
          return;
        }

        const trimmedContent = content.trim().slice(0, 2000);

        const message = await Message.create({
          roomId,
          sender: user._id,
          content: trimmedContent,
        });

        const formattedMsg = {
          id: message._id,
          content: message.content,
          sender: {
            id: user._id,
            name: user.name,
            email: user.email,
          },
          createdAt: message.createdAt,
        };

        io.to(`room:${roomId}`).emit('chat:message', {
          roomId,
          message: formattedMsg,
        });

        if (callback) callback({ success: true, message: formattedMsg });
      } catch (err) {
        console.error('[Socket] Error in chat:send:', err);
        if (callback) callback({ success: false, message: 'Failed to send message' });
      }
    });

    // File explorer events (broadcast so other clients update file list in real time)
    socket.on('file:created', ({ roomId, file }) => {
      if (roomId) socket.to(`room:${roomId}`).emit('file:created', { roomId, file });
    });

    socket.on('file:deleted', ({ roomId, fileId }) => {
      if (roomId) socket.to(`room:${roomId}`).emit('file:deleted', { roomId, fileId });
    });

    socket.on('file:renamed', ({ roomId, file }) => {
      if (roomId) socket.to(`room:${roomId}`).emit('file:renamed', { roomId, file });
    });

    // Execution broadcast (optional notification to peers)
    socket.on('execution:status', ({ roomId, status, language }) => {
      if (roomId) {
        socket.to(`room:${roomId}`).emit('execution:status', {
          userName: user.name,
          status,
          language,
        });
      }
    });

    // Disconnect handling
    socket.on('disconnect', async () => {
      console.log(`[Socket] User disconnected: ${user.name} [Socket ID: ${socket.id}]`);

      if (currentRoomId && currentFileId) {
        await flushFileSave(currentRoomId, currentFileId);
      }

      if (currentRoomId && roomPresence.has(currentRoomId)) {
        const presence = roomPresence.get(currentRoomId);
        const userIdStr = user._id.toString();
        const userEntry = presence.get(userIdStr);

        if (userEntry) {
          userEntry.sockets.delete(socket.id);
          if (userEntry.sockets.size === 0) {
            presence.delete(userIdStr);
          }
        }

        io.to(`room:${currentRoomId}`).emit('presence:update', {
          roomId: currentRoomId,
          members: getRoomPresenceList(currentRoomId),
        });
      }
    });
  });
}
