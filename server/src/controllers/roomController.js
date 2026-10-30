import { Room } from '../models/Room.js';
import { File } from '../models/File.js';
import { Message } from '../models/Message.js';
import { nanoid } from 'nanoid';

const DEFAULT_CODE_SNIPPETS = {
  javascript: `// CoDeva Collaborative IDE
// Welcome to your shared session!
console.log("Hello from CoDeva!");

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log("Fibonacci(7):", fibonacci(7));
`,
  python: `# CoDeva Collaborative IDE
# Welcome to your shared session!
print("Hello from CoDeva!")

def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print("Fibonacci(7):", fibonacci(7))
`,
};

export async function createRoom(req, res, next) {
  try {
    const { name, description = '', language = 'javascript' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Room name is required.',
      });
    }

    const roomId = nanoid(8);
    const ownerId = req.user._id;

    const room = await Room.create({
      name: name.trim(),
      description: description.trim(),
      roomId,
      owner: ownerId,
      members: [
        {
          user: ownerId,
          role: 'owner',
          joinedAt: new Date(),
        },
      ],
      isPublic: true,
    });

    // Create starter file for this room
    const defaultFileName = language === 'python' ? 'main.py' : 'index.js';
    const defaultSnippet = DEFAULT_CODE_SNIPPETS[language] || DEFAULT_CODE_SNIPPETS.javascript;

    const initialFile = await File.create({
      roomId,
      name: defaultFileName,
      language: language === 'python' ? 'python' : 'javascript',
      content: defaultSnippet,
      isDefault: true,
    });

    res.status(201).json({
      success: true,
      message: 'Room created successfully.',
      room: {
        id: room._id,
        roomId: room.roomId,
        name: room.name,
        description: room.description,
        owner: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
        },
        membersCount: 1,
        createdAt: room.createdAt,
      },
      defaultFile: initialFile,
    });
  } catch (err) {
    next(err);
  }
}

export async function getUserRooms(req, res, next) {
  try {
    const userId = req.user._id;

    // Find rooms where user is owner OR member
    const rooms = await Room.find({
      $or: [{ owner: userId }, { 'members.user': userId }],
    })
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .sort({ updatedAt: -1 })
      .lean();

    const formatted = rooms.map((r) => ({
      id: r._id,
      roomId: r.roomId,
      name: r.name,
      description: r.description,
      owner: r.owner,
      isOwner: r.owner?._id?.toString() === userId.toString(),
      membersCount: r.members.length,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    res.json({
      success: true,
      rooms: formatted,
    });
  } catch (err) {
    next(err);
  }
}

export async function getRoom(req, res, next) {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId })
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .lean();

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found. Check the room ID and try again.',
      });
    }

    const userId = req.user._id.toString();
    const isMember = room.members.some((m) => m.user?._id?.toString() === userId);
    const isOwner = room.owner?._id?.toString() === userId;

    res.json({
      success: true,
      room: {
        id: room._id,
        roomId: room.roomId,
        name: room.name,
        description: room.description,
        owner: room.owner,
        isOwner,
        isMember,
        members: room.members.map((m) => ({
          id: m.user?._id,
          name: m.user?.name,
          email: m.user?.email,
          role: m.role,
        })),
        createdAt: room.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function joinRoom(req, res, next) {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found. Please verify the room ID.',
      });
    }

    // Check if already member
    const alreadyMember = room.members.some((m) => m.user.toString() === userId.toString());
    if (!alreadyMember) {
      room.members.push({
        user: userId,
        role: 'member',
        joinedAt: new Date(),
      });
      await room.save();
    }

    res.json({
      success: true,
      message: 'Joined room successfully.',
      roomId: room.roomId,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteRoom(req, res, next) {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found.',
      });
    }

    // Only owner can delete room
    if (room.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the room owner is authorized to delete this room.',
      });
    }

    await Room.deleteOne({ _id: room._id });
    await File.deleteMany({ roomId });
    await Message.deleteMany({ roomId });

    res.json({
      success: true,
      message: 'Room deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}
