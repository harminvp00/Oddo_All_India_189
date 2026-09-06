import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { sendError, sendPaginated, sendSuccess } from '../../utils/response';
import { createUserSchema, updateUserSchema, toggleUserStatusSchema } from './validation';
import {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
} from './service';
import { AppError } from '../auth/service';

function formatZodErrors(error: any) {
  const issues = error.issues || error.errors || [];
  return issues.map((e: any) => ({ field: e.path.join('.'), issue: e.message }));
}

export async function handleListUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const search = req.query.search as string | undefined;
    const role = req.query.role as string | undefined;
    const status = req.query.status as string | undefined;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    const result = await listUsers({ search, role, status, page, limit });
    return sendPaginated(res, result.users, result.meta, 200);
  } catch (error: any) {
    if (error instanceof AppError) {
      return sendError(res, error.code, error.message, error.status, error.details);
    }
    return sendError(res, 'INTERNAL_SERVER_ERROR', (error as Error).message, 500);
  }
}

export async function handleGetUser(req: AuthenticatedRequest, res: Response) {
  try {
    const id = String(req.params.id);
    const user = await getUserById(id);
    return sendSuccess(res, user, 200);
  } catch (error: any) {
    if (error instanceof AppError) {
      return sendError(res, error.code, error.message, error.status, error.details);
    }
    return sendError(res, 'INTERNAL_SERVER_ERROR', (error as Error).message, 500);
  }
}

export async function handleCreateUser(req: AuthenticatedRequest, res: Response) {
  try {
    const parseResult = createUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(
        res,
        'VALIDATION_ERROR',
        'Validation failed',
        400,
        formatZodErrors(parseResult.error)
      );
    }

    const createdUser = await createUser({
      ...parseResult.data,
      createdById: req.user?.id || req.user?.userId,
    });
    return sendSuccess(res, createdUser, 201);
  } catch (error: any) {
    if (error instanceof AppError) {
      return sendError(res, error.code, error.message, error.status, error.details);
    }
    return sendError(res, 'INTERNAL_SERVER_ERROR', (error as Error).message, 500);
  }
}

export async function handleUpdateUser(req: AuthenticatedRequest, res: Response) {
  try {
    const id = String(req.params.id);
    const parseResult = updateUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(
        res,
        'VALIDATION_ERROR',
        'Validation failed',
        400,
        formatZodErrors(parseResult.error)
      );
    }

    const updated = await updateUser(id, parseResult.data);
    return sendSuccess(res, updated, 200);
  } catch (error: any) {
    if (error instanceof AppError) {
      return sendError(res, error.code, error.message, error.status, error.details);
    }
    return sendError(res, 'INTERNAL_SERVER_ERROR', (error as Error).message, 500);
  }
}

export async function handleToggleStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const id = String(req.params.id);
    const parseResult = toggleUserStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(
        res,
        'VALIDATION_ERROR',
        'Validation failed',
        400,
        formatZodErrors(parseResult.error)
      );
    }

    const updated = await toggleUserStatus(id, parseResult.data.status);
    return sendSuccess(res, updated, 200);
  } catch (error: any) {
    if (error instanceof AppError) {
      return sendError(res, error.code, error.message, error.status, error.details);
    }
    return sendError(res, 'INTERNAL_SERVER_ERROR', (error as Error).message, 500);
  }
}
