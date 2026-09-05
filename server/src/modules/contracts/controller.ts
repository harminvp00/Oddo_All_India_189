import { Request, Response } from 'express';
import { ContractService } from './service';
import {
  createContractSchema,
  updateContractSchema,
  contractFilterSchema,
} from './validation';
import { successResponse, errorResponse } from '../../utils/response';

export class ContractController {
  static async listSalaryStructures(req: Request, res: Response): Promise<void> {
    try {
      const structures = await ContractService.listSalaryStructures();
      successResponse(res, structures, 200);
    } catch (error: any) {
      errorResponse(res, 'INTERNAL_SERVER_ERROR', error.message || 'Failed to list salary structures', 500);
    }
  }

  static async list(req: Request, res: Response): Promise<void> {
    try {
      const parsedFilters = contractFilterSchema.safeParse(req.query);
      if (!parsedFilters.success) {
        errorResponse(res, 'VALIDATION_ERROR', 'Invalid query parameters', 400, parsedFilters.error.format());
        return;
      }

      const result = await ContractService.listContracts(parsedFilters.data, req.user);
      successResponse(res, result.items, 200, result.meta);
    } catch (error: any) {
      errorResponse(res, 'INTERNAL_SERVER_ERROR', error.message || 'Failed to list contracts', 500);
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const idParam = req.params.id as string;
      let contractId: bigint;
      try {
        contractId = BigInt(idParam);
      } catch {
        errorResponse(res, 'INVALID_ID', 'Invalid contract ID format', 400);
        return;
      }

      const contract = await ContractService.getContractById(contractId, req.user);
      if (!contract) {
        errorResponse(res, 'NOT_FOUND', 'Contract not found', 404);
        return;
      }

      successResponse(res, contract);
    } catch (error: any) {
      if (error.code === 'FORBIDDEN') {
        errorResponse(res, 'FORBIDDEN', error.message, 403);
        return;
      }
      errorResponse(res, 'INTERNAL_SERVER_ERROR', error.message || 'Failed to get contract', 500);
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const parsed = createContractSchema.safeParse(req.body);
      if (!parsed.success) {
        errorResponse(res, 'VALIDATION_ERROR', 'Validation failed', 400, parsed.error.format());
        return;
      }

      const contract = await ContractService.createContract(parsed.data);
      successResponse(res, contract, 201);
    } catch (error: any) {
      if (error.code === 'CONTRACT_OVERLAP') {
        errorResponse(res, 'CONTRACT_OVERLAP', error.message, 409);
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
      errorResponse(res, 'INTERNAL_SERVER_ERROR', error.message || 'Failed to create contract', 500);
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const idParam = req.params.id as string;
      let contractId: bigint;
      try {
        contractId = BigInt(idParam);
      } catch {
        errorResponse(res, 'INVALID_ID', 'Invalid contract ID format', 400);
        return;
      }

      const parsed = updateContractSchema.safeParse(req.body);
      if (!parsed.success) {
        errorResponse(res, 'VALIDATION_ERROR', 'Validation failed', 400, parsed.error.format());
        return;
      }

      const contract = await ContractService.updateContract(contractId, parsed.data);
      successResponse(res, contract, 200);
    } catch (error: any) {
      if (error.code === 'NOT_FOUND') {
        errorResponse(res, 'NOT_FOUND', error.message, 404);
        return;
      }
      if (error.code === 'CONTRACT_OVERLAP') {
        errorResponse(res, 'CONTRACT_OVERLAP', error.message, 409);
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
      errorResponse(res, 'INTERNAL_SERVER_ERROR', error.message || 'Failed to update contract', 500);
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const idParam = req.params.id as string;
      let contractId: bigint;
      try {
        contractId = BigInt(idParam);
      } catch {
        errorResponse(res, 'INVALID_ID', 'Invalid contract ID format', 400);
        return;
      }

      const result = await ContractService.deleteContract(contractId);
      successResponse(res, result, 200);
    } catch (error: any) {
      if (error.code === 'NOT_FOUND') {
        errorResponse(res, 'NOT_FOUND', error.message, 404);
        return;
      }
      errorResponse(res, 'INTERNAL_SERVER_ERROR', error.message || 'Failed to delete contract', 500);
    }
  }
}
