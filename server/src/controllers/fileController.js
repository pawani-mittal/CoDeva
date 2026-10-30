import { File } from '../models/File.js';
import { Room } from '../models/Room.js';

// Detect language from file extension
function detectLanguage(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'mjs':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'py':
      return 'python';
    case 'cpp':
    case 'cc':
    case 'cxx':
    case 'h':
    case 'hpp':
      return 'cpp';
    case 'c':
      return 'c';
    case 'java':
      return 'java';
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
      return 'css';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    case 'sql':
      return 'sql';
    default:
      return 'plaintext';
  }
}

// Verify user has access to the room
async function verifyRoomAccess(roomId, userId) {
  const room = await Room.findOne({ roomId });
  if (!room) return null;
  const isMember = room.members.some((m) => m.user.toString() === userId.toString());
  const isOwner = room.owner.toString() === userId.toString();
  if (!isMember && !isOwner && !room.isPublic) {
    return false;
  }
  return room;
}

export async function getRoomFiles(req, res, next) {
  try {
    const { roomId } = req.params;
    const room = await verifyRoomAccess(roomId, req.user._id);

    if (room === null) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }
    if (room === false) {
      return res.status(403).json({ success: false, message: 'Access denied to this room.' });
    }

    const files = await File.find({ roomId }).sort({ isDefault: -1, name: 1 });
    res.json({
      success: true,
      files: files.map((f) => ({
        id: f._id,
        roomId: f.roomId,
        name: f.name,
        language: f.language,
        content: f.content,
        isDefault: f.isDefault,
        updatedAt: f.updatedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function createFile(req, res, next) {
  try {
    const { roomId } = req.params;
    const { name, content = '' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'File name is required.' });
    }

    const trimmedName = name.trim();
    const room = await verifyRoomAccess(roomId, req.user._id);

    if (room === null) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }
    if (room === false) {
      return res.status(403).json({ success: false, message: 'Access denied to this room.' });
    }

    const existing = await File.findOne({ roomId, name: trimmedName });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A file named '${trimmedName}' already exists in this room.`,
      });
    }

    const language = detectLanguage(trimmedName);
    const file = await File.create({
      roomId,
      name: trimmedName,
      language,
      content,
    });

    res.status(201).json({
      success: true,
      message: 'File created successfully.',
      file: {
        id: file._id,
        roomId: file.roomId,
        name: file.name,
        language: file.language,
        content: file.content,
        isDefault: file.isDefault,
        updatedAt: file.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getFile(req, res, next) {
  try {
    const { roomId, fileId } = req.params;
    const room = await verifyRoomAccess(roomId, req.user._id);

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found or access denied.' });
    }

    const file = await File.findOne({ _id: fileId, roomId });
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    res.json({
      success: true,
      file: {
        id: file._id,
        roomId: file.roomId,
        name: file.name,
        language: file.language,
        content: file.content,
        isDefault: file.isDefault,
        updatedAt: file.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateFile(req, res, next) {
  try {
    const { roomId, fileId } = req.params;
    const { content, language } = req.body;

    const room = await verifyRoomAccess(roomId, req.user._id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found or access denied.' });
    }

    const file = await File.findOne({ _id: fileId, roomId });
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    if (content !== undefined) {
      file.content = content;
    }
    if (language) {
      file.language = language;
    }

    await file.save();

    res.json({
      success: true,
      message: 'File saved successfully.',
      file: {
        id: file._id,
        roomId: file.roomId,
        name: file.name,
        language: file.language,
        content: file.content,
        updatedAt: file.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function renameFile(req, res, next) {
  try {
    const { roomId, fileId } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'New file name is required.' });
    }

    const trimmedName = name.trim();
    const room = await verifyRoomAccess(roomId, req.user._id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found or access denied.' });
    }

    const file = await File.findOne({ _id: fileId, roomId });
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    const duplicate = await File.findOne({ roomId, name: trimmedName, _id: { $ne: fileId } });
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: `A file named '${trimmedName}' already exists in this room.`,
      });
    }

    file.name = trimmedName;
    file.language = detectLanguage(trimmedName);
    await file.save();

    res.json({
      success: true,
      message: 'File renamed successfully.',
      file: {
        id: file._id,
        name: file.name,
        language: file.language,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteFile(req, res, next) {
  try {
    const { roomId, fileId } = req.params;

    const room = await verifyRoomAccess(roomId, req.user._id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found or access denied.' });
    }

    const count = await File.countDocuments({ roomId });
    if (count <= 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the only file in the room. A room must have at least one file.',
      });
    }

    const file = await File.findOneAndDelete({ _id: fileId, roomId });
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    res.json({
      success: true,
      message: 'File deleted successfully.',
      fileId,
    });
  } catch (err) {
    next(err);
  }
}
