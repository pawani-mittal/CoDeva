import { Router } from 'express';
import {
  getRoomFiles,
  createFile,
  getFile,
  updateFile,
  renameFile,
  deleteFile,
} from '../controllers/fileController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

router.use(authenticateToken);

router.get('/:roomId/files', getRoomFiles);
router.post('/:roomId/files', createFile);
router.get('/:roomId/files/:fileId', getFile);
router.put('/:roomId/files/:fileId', updateFile);
router.patch('/:roomId/files/:fileId/rename', renameFile);
router.delete('/:roomId/files/:fileId', deleteFile);

export default router;
