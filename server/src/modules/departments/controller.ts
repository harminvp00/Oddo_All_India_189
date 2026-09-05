import { Request, Response } from 'express';
import { DepartmentService } from './service';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  departmentFilterSchema,
} from './validation';
import { successResponse, errorResponse } from '../../utils/response';

export class DepartmentController {
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const parsedFilters = departmentFilterSchema.safeParse(req.query);
      if (!parsedFilters.success) {
        errorResponse(res, 'VALIDATION_ERROR', 'Invalid query parameters', 400, parsedFilters.error.format());
        return;
      }

      const result = await DepartmentService.listDepartments(parsedFilters.data);
      successResponse(res, result.items, 200, result.meta);
    } catch (error: any) {
      errorResponse(res, 'INTERNAL_SERVER_ERROR', error.message || 'Failed to list departments', 500);
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const idParam = req.params.id as string;
      let deptId: bigint;
      try {
        deptId = BigInt(idParam);
      } catch {
        errorResponse(res, 'INVALID_ID', 'Invalid department ID format', 400);
        return;
      }

      const department = await DepartmentService.getDepartmentById(deptId);
      if (!department) {
        errorResponse(res, 'NOT_FOUND', 'Department not found', 404);
        return;
      }

      successResponse(res, department);
    } catch (error: any) {
      errorResponse(res, 'INTERNAL_SERVER_ERROR', error.message || 'Failed to get department', 500);
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const parsed = createDepartmentSchema.safeParse(req.body);
      if (!parsed.success) {
        errorResponse(res, 'VALIDATION_ERROR', 'Validation failed', 400, parsed.error.format());
        return;
      }

      const department = await DepartmentService.createDepartment(parsed.data);
      successResponse(res, department, 201);
    } catch (error: any) {
      if (error.code === 'DUPLICATE_RESOURCE') {
        errorResponse(res, 'DUPLICATE_RESOURCE', error.message, 409);
        return;
      }
      errorResponse(res, 'INTERNAL_SERVER_ERROR', error.message || 'Failed to create department', 500);
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const idParam = req.params.id as string;
      let deptId: bigint;
      try {
        deptId = BigInt(idParam);
      } catch {
        errorResponse(res, 'INVALID_ID', 'Invalid department ID format', 400);
        return;
      }

      const parsed = updateDepartmentSchema.safeParse(req.body);
      if (!parsed.success) {
        errorResponse(res, 'VALIDATION_ERROR', 'Validation failed', 400, parsed.error.format());
        return;
      }

      const department = await DepartmentService.updateDepartment(deptId, parsed.data);
      successResponse(res, department, 200);
    } catch (error: any) {
      if (error.code === 'NOT_FOUND') {
        errorResponse(res, 'NOT_FOUND', error.message, 404);
        return;
      }
      if (error.code === 'DUPLICATE_RESOURCE') {
        errorResponse(res, 'DUPLICATE_RESOURCE', error.message, 409);
        return;
      }
      errorResponse(res, 'INTERNAL_SERVER_ERROR', error.message || 'Failed to update department', 500);
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const idParam = req.params.id as string;
      let deptId: bigint;
      try {
        deptId = BigInt(idParam);
      } catch {
        errorResponse(res, 'INVALID_ID', 'Invalid department ID format', 400);
        return;
      }

      const result = await DepartmentService.deleteDepartment(deptId);
      successResponse(res, result, 200);
    } catch (error: any) {
      if (error.code === 'NOT_FOUND') {
        errorResponse(res, 'NOT_FOUND', error.message, 404);
        return;
      }
      errorResponse(res, 'INTERNAL_SERVER_ERROR', error.message || 'Failed to delete department', 500);
    }
  }
}
