import { Request, Response } from 'express';
import { EmployeeService } from './service';
import { EmployeeSummaryService } from './summary.service';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeFilterSchema,
} from './validation';
import { successResponse, errorResponse } from '../../utils/response';

export class EmployeeController {
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const parsedFilters = employeeFilterSchema.safeParse(req.query);
      if (!parsedFilters.success) {
        errorResponse(res, 'VALIDATION_ERROR', 'Invalid query parameters', 400, parsedFilters.error.format());
        return;
      }

      const result = await EmployeeService.listEmployees(parsedFilters.data, req.user);
      successResponse(res, result.items, 200, result.meta);
    } catch (error: any) {
      errorResponse(res, 'INTERNAL_SERVER_ERROR', error.message || 'Failed to list employees', 500);
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const idParam = req.params.id as string;
      let empId: bigint;
      try {
        empId = BigInt(idParam);
      } catch {
        errorResponse(res, 'INVALID_ID', 'Invalid employee ID format', 400);
        return;
      }

      const employee = await EmployeeService.getEmployeeById(empId, req.user);
      if (!employee) {
        errorResponse(res, 'NOT_FOUND', 'Employee not found', 404);
        return;
      }

      successResponse(res, employee);
    } catch (error: any) {
      if (error.code === 'FORBIDDEN') {
        errorResponse(res, 'FORBIDDEN', error.message, 403);
        return;
      }
      errorResponse(res, 'INTERNAL_SERVER_ERROR', error.message || 'Failed to get employee', 500);
    }
  }

  static async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const idParam = req.params.id as string;
      let empId: bigint;
      try {
        empId = BigInt(idParam);
      } catch {
        errorResponse(res, 'INVALID_ID', 'Invalid employee ID format', 400);
        return;
      }

      const summary = await EmployeeSummaryService.getEmployeeSummary(empId, req.user);
      successResponse(res, summary);
    } catch (error: any) {
      if (error.code === 'NOT_FOUND') {
        errorResponse(res, 'NOT_FOUND', error.message, 404);
        return;
      }
      if (error.code === 'FORBIDDEN') {
        errorResponse(res, 'FORBIDDEN', error.message, 403);
        return;
      }
      errorResponse(res, 'INTERNAL_SERVER_ERROR', error.message || 'Failed to get employee summary', 500);
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const parsed = createEmployeeSchema.safeParse(req.body);
      if (!parsed.success) {
        errorResponse(res, 'VALIDATION_ERROR', 'Validation failed', 400, parsed.error.format());
        return;
      }

      const employee = await EmployeeService.createEmployee(parsed.data);
      successResponse(res, employee, 201);
    } catch (error: any) {
      if (error.code === 'DUPLICATE_RESOURCE') {
        errorResponse(res, 'DUPLICATE_RESOURCE', error.message, 409);
        return;
      }
      if (error.code === 'INVALID_REFERENCE') {
        errorResponse(res, 'INVALID_REFERENCE', error.message, 400);
        return;
      }
      errorResponse(res, 'INTERNAL_SERVER_ERROR', error.message || 'Failed to create employee', 500);
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const idParam = req.params.id as string;
      let empId: bigint;
      try {
        empId = BigInt(idParam);
      } catch {
        errorResponse(res, 'INVALID_ID', 'Invalid employee ID format', 400);
        return;
      }

      const parsed = updateEmployeeSchema.safeParse(req.body);
      if (!parsed.success) {
        errorResponse(res, 'VALIDATION_ERROR', 'Validation failed', 400, parsed.error.format());
        return;
      }

      const employee = await EmployeeService.updateEmployee(empId, parsed.data);
      successResponse(res, employee, 200);
    } catch (error: any) {
      if (error.code === 'NOT_FOUND') {
        errorResponse(res, 'NOT_FOUND', error.message, 404);
        return;
      }
      if (error.code === 'DUPLICATE_RESOURCE') {
        errorResponse(res, 'DUPLICATE_RESOURCE', error.message, 409);
        return;
      }
      if (error.code === 'INVALID_REFERENCE') {
        errorResponse(res, 'INVALID_REFERENCE', error.message, 400);
        return;
      }
      errorResponse(res, 'INTERNAL_SERVER_ERROR', error.message || 'Failed to update employee', 500);
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const idParam = req.params.id as string;
      let empId: bigint;
      try {
        empId = BigInt(idParam);
      } catch {
        errorResponse(res, 'INVALID_ID', 'Invalid employee ID format', 400);
        return;
      }

      const result = await EmployeeService.deleteEmployee(empId);
      successResponse(res, result, 200);
    } catch (error: any) {
      if (error.code === 'NOT_FOUND') {
        errorResponse(res, 'NOT_FOUND', error.message, 404);
        return;
      }
      errorResponse(res, 'INTERNAL_SERVER_ERROR', error.message || 'Failed to delete employee', 500);
    }
  }
}

export const employeeController = EmployeeController;
