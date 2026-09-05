import { Router } from 'express';
import { authenticateToken, requireRole } from '../../middleware/auth';
import {
  handleListUsers,
  handleGetUser,
  handleCreateUser,
  handleUpdateUser,
  handleToggleStatus,
} from './controller';

const router = Router();

// Protect all /api/users routes: Require valid JWT token and ADMIN role
router.use(authenticateToken, requireRole(['ADMIN']));

router.get('/', handleListUsers);
router.get('/:id', handleGetUser);
router.post('/', handleCreateUser);
router.patch('/:id', handleUpdateUser);
router.patch('/:id/status', handleToggleStatus);

export default router;
