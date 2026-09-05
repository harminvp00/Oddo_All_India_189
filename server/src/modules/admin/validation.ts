import { z } from 'zod';

const userRoleEnum = z.enum([
  'EMPLOYEE',
  'HR_MANAGER',
  'HR_PAYROLL_USER',
  'HR_PAYROLL_MANAGER',
  'ADMIN',
]);

const userStatusEnum = z.enum(['ACTIVE', 'DISABLED']);

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address format'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: userRoleEnum,
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  role: userRoleEnum.optional(),
  password: z.string().min(6).optional(),
});

export const toggleUserStatusSchema = z.object({
  status: userStatusEnum,
});
