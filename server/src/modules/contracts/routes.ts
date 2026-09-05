import { Router } from 'express';
import { ContractController } from './controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

// Read operations: all authenticated roles (self-service boundary enforced in service/controller)
router.get('/salary-structures', authenticate, ContractController.listSalaryStructures);
router.get('/', authenticate, ContractController.list);
router.get('/:id', authenticate, ContractController.getById);

// Write operations: HR_MANAGER and ADMIN
router.post(
  '/',
  authenticate,
  requireRole(['HR_MANAGER', 'HR_PAYROLL_MANAGER', 'ADMIN']),
  ContractController.create
);

router.patch(
  '/:id',
  authenticate,
  requireRole(['HR_MANAGER', 'HR_PAYROLL_MANAGER', 'ADMIN']),
  ContractController.update
);

router.delete(
  '/:id',
  authenticate,
  requireRole(['HR_MANAGER', 'HR_PAYROLL_MANAGER', 'ADMIN']),
  ContractController.delete
);

export default router;
