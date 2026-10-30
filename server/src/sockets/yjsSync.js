import * as Y from 'yjs';
import { File } from '../models/File.js';

// Cache of active Y.Doc instances: Map<docKey, { doc, yText, timeout, roomId, fileId }>
const activeDocs = new Map();

function getDocKey(roomId, fileId) {
  return `${roomId}:${fileId}`;
}

export async function getOrCreateDoc(roomId, fileId) {
  const docKey = getDocKey(roomId, fileId);

  if (activeDocs.has(docKey)) {
    return activeDocs.get(docKey);
  }

  const doc = new Y.Doc();
  const yText = doc.getText('monaco');

  // Load current file content from database
  try {
    const file = await File.findOne({ _id: fileId, roomId });
    if (file && file.content) {
      doc.transact(() => {
        yText.insert(0, file.content);
      }, 'initial-load');
    }
  } catch (err) {
    console.error(`[YjsSync] Failed to load initial content for file ${fileId}:`, err.message);
  }

  const record = {
    doc,
    yText,
    roomId,
    fileId,
    saveTimeout: null,
  };

  activeDocs.set(docKey, record);
  return record;
}

// Debounced save to MongoDB
function scheduleSave(record) {
  if (record.saveTimeout) {
    clearTimeout(record.saveTimeout);
  }

  record.saveTimeout = setTimeout(async () => {
    try {
      const content = record.yText.toString();
      await File.updateOne({ _id: record.fileId, roomId: record.roomId }, { content });
      console.log(`[YjsSync] Persisted file ${record.fileId} to database (${content.length} chars).`);
    } catch (err) {
      console.error(`[YjsSync] Error saving file ${record.fileId} to database:`, err.message);
    }
  }, 1500);
}

export async function flushFileSave(roomId, fileId) {
  const docKey = getDocKey(roomId, fileId);
  const record = activeDocs.get(docKey);
  if (record) {
    if (record.saveTimeout) {
      clearTimeout(record.saveTimeout);
      record.saveTimeout = null;
    }
    const content = record.yText.toString();
    await File.updateOne({ _id: fileId, roomId }, { content });
    console.log(`[YjsSync] Flushed file save for ${fileId}.`);
  }
}

export async function registerYjsHandlers(io, socket) {
  // Client requests initial synchronization for a specific file
  socket.on('doc:sync-step-1', async ({ roomId, fileId, stateVector }) => {
    try {
      const record = await getOrCreateDoc(roomId, fileId);
      const serverDoc = record.doc;

      // Compute diff of missing updates on client
      let update;
      try {
        if (stateVector && stateVector.length > 0) {
          const clientSV = new Uint8Array(stateVector);
          update = Y.encodeStateAsUpdate(serverDoc, clientSV);
        } else {
          update = Y.encodeStateAsUpdate(serverDoc);
        }
      } catch (decodeErr) {
        update = Y.encodeStateAsUpdate(serverDoc);
      }
      const serverSV = Y.encodeStateVector(serverDoc);

      socket.emit('doc:sync-step-2', {
        roomId,
        fileId,
        update: Array.from(update),
        serverStateVector: Array.from(serverSV),
      });
    } catch (err) {
      console.error('[YjsSync] Error handling doc:sync-step-1:', err);
    }
  });

  // Client sends collaborative update (keystrokes / transactions)
  socket.on('doc:update', async ({ roomId, fileId, update }) => {
    try {
      if (!update) return;
      const record = await getOrCreateDoc(roomId, fileId);
      const updateArray = new Uint8Array(update);

      // Apply update to server Y.Doc tagged with socket.id to prevent feedback loops
      Y.applyUpdate(record.doc, updateArray, socket.id);

      // Broadcast update to all other connected clients in this room
      socket.to(`room:${roomId}`).emit('doc:update', {
        roomId,
        fileId,
        update: Array.from(updateArray),
        origin: socket.id,
      });

      // Schedule debounced database persistence
      scheduleSave(record);
    } catch (err) {
      console.error('[YjsSync] Error applying doc:update:', err);
    }
  });
}
