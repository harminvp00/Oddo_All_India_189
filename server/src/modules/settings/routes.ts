import { Router } from 'express';
import { authenticateToken, requireRole } from '../../middleware/auth';
import { handleGetSettings, handleUpdateSettings } from './controller';

const router = Router();

// Protect all /api/settings routes: Require authentication and ADMIN or HR_MANAGER role
router.use(authenticateToken, requireRole(['ADMIN', 'HR_MANAGER']));

router.get('/', handleGetSettings);
router.put('/', handleUpdateSettings);
router.post('/', handleUpdateSettings);
router.patch('/', handleUpdateSettings);

export default router;
