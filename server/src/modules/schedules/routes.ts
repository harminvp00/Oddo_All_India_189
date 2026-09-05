import { Router } from 'express';
import { WorkingScheduleController } from './controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

// Read operations: all authenticated roles
router.get('/', authenticate, WorkingScheduleController.list);
router.get('/:id', authenticate, WorkingScheduleController.getById);

// Write operations: HR_MANAGER and ADMIN
router.post(
  '/',
  authenticate,
  requireRole(['HR_MANAGER', 'HR_PAYROLL_MANAGER', 'ADMIN']),
  WorkingScheduleController.create
);

router.patch(
  '/:id',
  authenticate,
  requireRole(['HR_MANAGER', 'HR_PAYROLL_MANAGER', 'ADMIN']),
  WorkingScheduleController.update
);

router.delete(
  '/:id',
  authenticate,
  requireRole(['HR_MANAGER', 'HR_PAYROLL_MANAGER', 'ADMIN']),
  WorkingScheduleController.delete
);

export default router;
