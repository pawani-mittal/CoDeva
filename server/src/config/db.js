import mongoose from 'mongoose';
import { env } from './env.js';

let memoryServer = null;

export async function connectDB() {
  const primaryUri = env.MONGODB_URI;

  // First attempt to connect to the configured MONGODB_URI with a short timeout
  try {
    console.log(`[Database] Attempting connection to MongoDB at: ${primaryUri}...`);
    await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log('[Database] Successfully connected to configured MongoDB.');
    return;
  } catch (err) {
    console.warn(`[Database] Could not connect to primary MongoDB (${err.message}).`);
  }

  // If in development or test, spin up in-memory MongoDB server as fallback
  if (env.NODE_ENV !== 'production') {
    try {
      console.log('[Database] Starting in-memory MongoDB instance for local zero-config development...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create({
        instance: {
          dbName: 'codeva',
        },
      });
      const memoryUri = memoryServer.getUri();
      console.log(`[Database] In-memory MongoDB started at: ${memoryUri}`);
      await mongoose.connect(memoryUri);
      console.log('[Database] Successfully connected to in-memory development MongoDB.');
      return;
    } catch (memErr) {
      console.error('[Database] Failed to start in-memory MongoDB fallback:', memErr);
      throw new Error(`Failed to establish any MongoDB connection: ${memErr.message}`);
    }
  }

  throw new Error(`Cannot connect to MongoDB at ${primaryUri} in production mode.`);
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
}
