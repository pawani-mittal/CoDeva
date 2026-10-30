import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import executeRoutes from './routes/executeRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Middleware
  app.use(
    cors({
      origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check
  const healthHandler = (req, res) => {
    res.json({
      status: 'healthy',
      service: 'CoDeva Collaborative Backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      features: {
        aiConfigured: !!env.OPENAI_API_KEY,
        judge0Configured: !!env.JUDGE0_URL,
      },
    });
  };

  app.get('/health', healthHandler);
  app.get('/api/health', healthHandler);

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/rooms', roomRoutes);
  app.use('/api/rooms', fileRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/execute', executeRoutes);

  // 404 Route Not Found
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Route not found: ${req.method} ${req.url}`,
    });
  });

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
}
