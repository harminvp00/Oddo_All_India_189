import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import prisma from '../config/database';
import { sendError } from '../utils/response';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'EMPLOYEE' | 'HR_MANAGER' | 'HR_PAYROLL_USER' | 'HR_PAYROLL_MANAGER' | 'ADMIN';
  employeeId?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : req.cookies?.token;

    if (!token) {
      sendError(res, 'UNAUTHORIZED', 'Authentication token is required', 401);
      return;
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id?: string;
      userId?: string;
      email: string;
      role: AuthenticatedUser['role'];
      employeeId?: string | null;
    };

    const targetUserId = decoded.id || decoded.userId;

    if (!targetUserId) {
      sendError(res, 'UNAUTHORIZED', 'Invalid token payload', 401);
      return;
    }

    // Live DB Check: Check if user exists and is ACTIVE
    const user = await prisma.users.findUnique({
      where: { id: BigInt(targetUserId) },
      include: { employees: true },
    });

    if (!user) {
      sendError(res, 'UNAUTHORIZED', 'User not found', 401);
      return;
    }

    if (user.status === 'DISABLED') {
      sendError(res, 'ACCOUNT_DISABLED', 'User account is disabled. Please contact system administrator.', 403);
      return;
    }

    req.user = {
      id: user.id.toString(),
      email: user.email,
      role: user.role as AuthenticatedUser['role'],
      employeeId: user.employees?.id ? user.employees.id.toString() : null,
    };

    next();
  } catch (error) {
    sendError(res, 'UNAUTHORIZED', 'Invalid or expired authentication token', 401);
  }
};

// Backwards-compatible alias for both teammates and your existing code
export const authenticateToken = authenticate;

export const requireRole = (allowedRoles: AuthenticatedUser['role'][]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(res, 'FORBIDDEN', 'You do not have permission to perform this action', 403);
      return;
    }

    next();
  };
};
