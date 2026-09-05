import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { sendError, sendSuccess } from '../../utils/response';
import { loginSchema, googleAuthSchema } from './validation';
import { loginUser, authenticateGoogleUser, getCurrentUserProfile, AppError } from './service';

function formatZodErrors(error: any) {
  const issues = error.issues || error.errors || [];
  return issues.map((e: any) => ({ field: e.path.join('.'), issue: e.message }));
}

export async function handleLogin(req: AuthenticatedRequest, res: Response) {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(
        res,
        'VALIDATION_ERROR',
        'Validation failed',
        400,
        formatZodErrors(parseResult.error)
      );
    }

    const { email, password } = parseResult.data;
    const result = await loginUser(email, password);
    return sendSuccess(res, result, 200);
  } catch (error: any) {
    if (error instanceof AppError) {
      return sendError(res, error.code, error.message, error.status, error.details);
    }
    return sendError(res, 'INTERNAL_SERVER_ERROR', (error as Error).message, 500);
  }
}

export async function handleGoogleAuth(req: AuthenticatedRequest, res: Response) {
  try {
    const parseResult = googleAuthSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(
        res,
        'VALIDATION_ERROR',
        'Validation failed',
        400,
        formatZodErrors(parseResult.error)
      );
    }

    const { idToken } = parseResult.data;
    const result = await authenticateGoogleUser(idToken);
    return sendSuccess(res, result, 200);
  } catch (error: any) {
    if (error instanceof AppError) {
      return sendError(res, error.code, error.message, error.status, error.details);
    }
    return sendError(res, 'INTERNAL_SERVER_ERROR', (error as Error).message, 500);
  }
}

export async function handleMe(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!req.user || !userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
    }

    const profile = await getCurrentUserProfile(userId);
    return sendSuccess(res, profile, 200);
  } catch (error: any) {
    if (error instanceof AppError) {
      return sendError(res, error.code, error.message, error.status, error.details);
    }
    return sendError(res, 'INTERNAL_SERVER_ERROR', (error as Error).message, 500);
  }
}
