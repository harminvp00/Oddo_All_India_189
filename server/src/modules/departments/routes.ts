import { Router } from 'express';
import { DepartmentController } from './controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

// Read operations: all authenticated roles
router.get('/', authenticate, DepartmentController.list);
router.get('/:id', authenticate, DepartmentController.getById);

// Write operations: HR_MANAGER and ADMIN
router.post(
  '/',
  authenticate,
  requireRole(['HR_MANAGER', 'HR_PAYROLL_MANAGER', 'ADMIN']),
  DepartmentController.create
);

router.patch(
  '/:id',
  authenticate,
  requireRole(['HR_MANAGER', 'HR_PAYROLL_MANAGER', 'ADMIN']),
  DepartmentController.update
);

router.delete(
  '/:id',
  authenticate,
  requireRole(['HR_MANAGER', 'HR_PAYROLL_MANAGER', 'ADMIN']),
  DepartmentController.delete
);

export default router;
