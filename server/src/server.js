import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { initSocketServer } from './sockets/socketManager.js';

async function bootstrap() {
  try {
    // 1. Establish database connection
    await connectDB();

    // 2. Create Express app
    const app = createApp();

    // 3. Create HTTP & Socket.IO server
    const httpServer = http.createServer(app);
    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
        credentials: true,
        methods: ['GET', 'POST'],
      },
      pingTimeout: 30000,
      pingInterval: 15000,
    });

    // 4. Initialize Socket.IO logic
    initSocketServer(io);

    // 5. Start listening
    httpServer.listen(env.PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 CoDeva Backend running on port ${env.PORT}`);
      console.log(`📡 Client URL: ${env.CLIENT_URL}`);
      console.log(`🤖 OpenAI AI Integration: ${env.OPENAI_API_KEY ? 'Configured' : 'Missing (Will guide user)'}`);
      console.log(`⚡ Judge0 Code Execution: ${env.JUDGE0_URL ? 'Configured' : 'Missing'}`);
      console.log(`===============================================`);
    });

    // Graceful shutdown
    const handleShutdown = (signal) => {
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
      httpServer.close(() => {
        console.log('[Server] HTTP and Socket server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  } catch (err) {
    console.error('[Server] Fatal startup error:', err);
    process.exit(1);
  }
}

bootstrap();
