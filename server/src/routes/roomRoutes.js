import { Router } from 'express';
import {
  createRoom,
  getUserRooms,
  getRoom,
  joinRoom,
  deleteRoom,
} from '../controllers/roomController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.post('/', createRoom);
router.get('/', getUserRooms);
router.get('/:roomId', getRoom);
router.post('/:roomId/join', joinRoom);
router.delete('/:roomId', deleteRoom);

export default router;
