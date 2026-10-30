import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer = null;

export async function setupTestDB() {
  if (global.__testMongoInstance) {
    mongoServer = global.__testMongoInstance;
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoServer.getUri());
    }
    return true;
  }

  try {
    mongoServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'codeva_test',
      },
    });
    global.__testMongoInstance = mongoServer;
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    return true;
  } catch (err) {
    console.warn('[TestDB] MongoMemoryServer error:', err.message);
    try {
      await mongoose.connect('mongodb://127.0.0.1:27017/codeva_test', {
        serverSelectionTimeoutMS: 2000,
      });
      return true;
    } catch (localErr) {
      throw new Error(`Failed to connect to any test database: ${err.message}`);
    }
  }
}

export async function clearTestDB() {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
}

export async function teardownTestDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
    global.__testMongoInstance = null;
  }
}
