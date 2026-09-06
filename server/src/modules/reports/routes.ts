import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { sendReportEmailHandler } from './controller';

const router = Router();
router.use(authenticate);

const run = requireRole(["HR_MANAGER", "HR_PAYROLL_USER", "HR_PAYROLL_MANAGER", "ADMIN"]);

router.post('/send-email', run, sendReportEmailHandler);

export default router;
