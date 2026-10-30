import { Router } from 'express';
import { runCode } from '../controllers/executeController.js';
import { authenticateToken } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.use(authenticateToken);

// Rate limit execution requests to 15 runs per minute per user to prevent abuse
const executionLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 15,
  message: 'Code execution limit reached. Please wait before executing again.',
});

router.post('/', executionLimiter, runCode);

export default router;
