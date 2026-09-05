import { Router } from 'express';
import { EmployeeController } from './controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

// Read operations: all authenticated roles (self-service boundary enforced in service/controller)
router.get('/', authenticate, EmployeeController.list);
router.get('/:id', authenticate, EmployeeController.getById);

// Write operations: HR_MANAGER and ADMIN
router.post(
  '/',
  authenticate,
  requireRole(['HR_MANAGER', 'HR_PAYROLL_MANAGER', 'ADMIN']),
  EmployeeController.create
);

router.patch(
  '/:id',
  authenticate,
  requireRole(['HR_MANAGER', 'HR_PAYROLL_MANAGER', 'ADMIN']),
  EmployeeController.update
);

router.delete(
  '/:id',
  authenticate,
  requireRole(['HR_MANAGER', 'HR_PAYROLL_MANAGER', 'ADMIN']),
  EmployeeController.delete
);

export default router;
