import { Request, Response } from 'express';
import { WorkingScheduleService } from './service';
import {
  createWorkingScheduleSchema,
  updateWorkingScheduleSchema,
  workingScheduleFilterSchema,
} from './validation';
import { successResponse, errorResponse } from '../../utils/response';

export class WorkingScheduleController {
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const parsedFilters = workingScheduleFilterSchema.safeParse(req.query);
      if (!parsedFilters.success) {
        errorResponse(res, 'VALIDATION_ERROR', 'Invalid query parameters', 400, parsedFilters.error.format());
        return;
      }

      const result = await WorkingScheduleService.listSchedules(parsedFilters.data);
      successResponse(res, result.items, 200, result.meta);
    } catch (error: any) {
      errorResponse(res, 'INTERNAL_SERVER_ERROR', error.message || 'Failed to list working schedules', 500);
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const idParam = req.params.id as string;
      let schedId: bigint;
      try {
        schedId = BigInt(idParam);
      } catch {
        errorResponse(res, 'INVALID_ID', 'Invalid working schedule ID format', 400);
        return;
      }

      const schedule = await WorkingScheduleService.getScheduleById(schedId);
      if (!schedule) {
        errorResponse(res, 'NOT_FOUND', 'Working schedule not found', 404);
        return;
      }

      successResponse(res, schedule);
    } catch (error: any) {
      errorResponse(res, 'INTERNAL_SERVER_ERROR', error.message || 'Failed to get working schedule', 500);
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const parsed = createWorkingScheduleSchema.safeParse(req.body);
      if (!parsed.success) {
        errorResponse(res, 'VALIDATION_ERROR', 'Validation failed', 400, parsed.error.format());
        return;
      }

      const schedule = await WorkingScheduleService.createSchedule(parsed.data);
      successResponse(res, schedule, 201);
    } catch (error: any) {
      if (error.code === 'DUPLICATE_RESOURCE') {
        errorResponse(res, 'DUPLICATE_RESOURCE', error.message, 409);
        return;
      }
      errorResponse(res, 'INTERNAL_SERVER_ERROR', error.message || 'Failed to create working schedule', 500);
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const idParam = req.params.id as string;
      let schedId: bigint;
      try {
        schedId = BigInt(idParam);
      } catch {
        errorResponse(res, 'INVALID_ID', 'Invalid working schedule ID format', 400);
        return;
      }

      const parsed = updateWorkingScheduleSchema.safeParse(req.body);
      if (!parsed.success) {
        errorResponse(res, 'VALIDATION_ERROR', 'Validation failed', 400, parsed.error.format());
        return;
      }

      const schedule = await WorkingScheduleService.updateSchedule(schedId, parsed.data);
      successResponse(res, schedule, 200);
    } catch (error: any) {
      if (error.code === 'NOT_FOUND') {
        errorResponse(res, 'NOT_FOUND', error.message, 404);
        return;
      }
      if (error.code === 'DUPLICATE_RESOURCE') {
        errorResponse(res, 'DUPLICATE_RESOURCE', error.message, 409);
        return;
      }
      errorResponse(res, 'INTERNAL_SERVER_ERROR', error.message || 'Failed to update working schedule', 500);
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const idParam = req.params.id as string;
      let schedId: bigint;
      try {
        schedId = BigInt(idParam);
      } catch {
        errorResponse(res, 'INVALID_ID', 'Invalid working schedule ID format', 400);
        return;
      }

      const result = await WorkingScheduleService.deleteSchedule(schedId);
      successResponse(res, result, 200);
    } catch (error: any) {
      if (error.code === 'NOT_FOUND') {
        errorResponse(res, 'NOT_FOUND', error.message, 404);
        return;
      }
      errorResponse(res, 'INTERNAL_SERVER_ERROR', error.message || 'Failed to delete working schedule', 500);
    }
  }
}
