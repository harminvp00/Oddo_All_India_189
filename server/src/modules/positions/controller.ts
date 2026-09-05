import { Request, Response } from 'express';
import { JobPositionService } from './service';
import {
  createJobPositionSchema,
  updateJobPositionSchema,
  jobPositionFilterSchema,
} from './validation';
import { successResponse, errorResponse } from '../../utils/response';

export class JobPositionController {
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const parsedFilters = jobPositionFilterSchema.safeParse(req.query);
      if (!parsedFilters.success) {
        errorResponse(res, 'VALIDATION_ERROR', 'Invalid query parameters', 400, parsedFilters.error.format());
        return;
      }

      const result = await JobPositionService.listPositions(parsedFilters.data);
      successResponse(res, result.items, 200, result.meta);
    } catch (error: any) {
      errorResponse(res, 'INTERNAL_SERVER_ERROR', error.message || 'Failed to list job positions', 500);
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const idParam = req.params.id as string;
      let posId: bigint;
      try {
        posId = BigInt(idParam);
      } catch {
        errorResponse(res, 'INVALID_ID', 'Invalid job position ID format', 400);
        return;
      }

      const position = await JobPositionService.getPositionById(posId);
      if (!position) {
        errorResponse(res, 'NOT_FOUND', 'Job position not found', 404);
        return;
      }

      successResponse(res, position);
    } catch (error: any) {
      errorResponse(res, 'INTERNAL_SERVER_ERROR', error.message || 'Failed to get job position', 500);
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const parsed = createJobPositionSchema.safeParse(req.body);
      if (!parsed.success) {
        errorResponse(res, 'VALIDATION_ERROR', 'Validation failed', 400, parsed.error.format());
        return;
      }

      const position = await JobPositionService.createPosition(parsed.data);
      successResponse(res, position, 201);
    } catch (error: any) {
      if (error.code === 'DUPLICATE_RESOURCE') {
        errorResponse(res, 'DUPLICATE_RESOURCE', error.message, 409);
        return;
      }
      errorResponse(res, 'INTERNAL_SERVER_ERROR', error.message || 'Failed to create job position', 500);
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const idParam = req.params.id as string;
      let posId: bigint;
      try {
        posId = BigInt(idParam);
      } catch {
        errorResponse(res, 'INVALID_ID', 'Invalid job position ID format', 400);
        return;
      }

      const parsed = updateJobPositionSchema.safeParse(req.body);
      if (!parsed.success) {
        errorResponse(res, 'VALIDATION_ERROR', 'Validation failed', 400, parsed.error.format());
        return;
      }

      const position = await JobPositionService.updatePosition(posId, parsed.data);
      successResponse(res, position, 200);
    } catch (error: any) {
      if (error.code === 'NOT_FOUND') {
        errorResponse(res, 'NOT_FOUND', error.message, 404);
        return;
      }
      if (error.code === 'DUPLICATE_RESOURCE') {
        errorResponse(res, 'DUPLICATE_RESOURCE', error.message, 409);
        return;
      }
      errorResponse(res, 'INTERNAL_SERVER_ERROR', error.message || 'Failed to update job position', 500);
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const idParam = req.params.id as string;
      let posId: bigint;
      try {
        posId = BigInt(idParam);
      } catch {
        errorResponse(res, 'INVALID_ID', 'Invalid job position ID format', 400);
        return;
      }

      const result = await JobPositionService.deletePosition(posId);
      successResponse(res, result, 200);
    } catch (error: any) {
      if (error.code === 'NOT_FOUND') {
        errorResponse(res, 'NOT_FOUND', error.message, 404);
        return;
      }
      errorResponse(res, 'INTERNAL_SERVER_ERROR', error.message || 'Failed to delete job position', 500);
    }
  }
}
