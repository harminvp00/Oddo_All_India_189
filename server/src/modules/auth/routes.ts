import { Router } from 'express';
import { handleLogin, handleGoogleAuth, handleMe } from './controller';
import { authenticateToken } from '../../middleware/auth';

const router = Router();

router.post('/login', handleLogin);
router.post('/google', handleGoogleAuth);
router.get('/me', authenticateToken, handleMe);

export default router;
