import { Router } from 'express';
import { assistAI } from '../controllers/aiController.js';
import { authenticateToken } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.use(authenticateToken);

// Rate limit AI requests to 25 requests per minute per user
const aiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 25,
  message: 'AI assistant request rate limit exceeded. Please wait a minute before sending more queries.',
});

router.post('/assist', aiLimiter, assistAI);

export default router;
