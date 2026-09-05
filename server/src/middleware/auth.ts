import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import prisma from '../config/database';

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
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication token is missing',
        },
      });
      return;
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: string;
      email: string;
      role: AuthenticatedUser['role'];
      employeeId?: string | null;
    };

    // Check if user still exists and is ACTIVE
    const user = await prisma.users.findUnique({
      where: { id: BigInt(decoded.id) },
      include: { employees: true },
    });

    if (!user || user.status === 'DISABLED') {
      res.status(403).json({
        success: false,
        error: {
          code: user ? 'ACCOUNT_DISABLED' : 'UNAUTHORIZED',
          message: user ? 'User account is disabled' : 'User not found',
        },
      });
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
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired authentication token',
      },
    });
  }
};

export const requireRole = (allowedRoles: AuthenticatedUser['role'][]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to perform this action',
        },
      });
      return;
    }

    next();
  };
};
