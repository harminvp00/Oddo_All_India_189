import { Router } from 'express';
import { JobPositionController } from './controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

// Read operations: all authenticated roles
router.get('/', authenticate, JobPositionController.list);
router.get('/:id', authenticate, JobPositionController.getById);

// Write operations: HR_MANAGER and ADMIN
router.post(
  '/',
  authenticate,
  requireRole(['HR_MANAGER', 'HR_PAYROLL_MANAGER', 'ADMIN']),
  JobPositionController.create
);

router.patch(
  '/:id',
  authenticate,
  requireRole(['HR_MANAGER', 'HR_PAYROLL_MANAGER', 'ADMIN']),
  JobPositionController.update
);

router.delete(
  '/:id',
  authenticate,
  requireRole(['HR_MANAGER', 'HR_PAYROLL_MANAGER', 'ADMIN']),
  JobPositionController.delete
);

export default router;
