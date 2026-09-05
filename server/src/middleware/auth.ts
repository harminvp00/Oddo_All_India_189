import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { sendError } from '../utils/response';
import prisma from '../config/database';

export interface AuthenticatedUser {
  id: string;
  userId: string;
  email: string;
  role: string;
  employeeId?: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
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
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      sendError(res, 'UNAUTHORIZED', 'Authentication token is required', 401);
      return;
    }

    const decoded = verifyToken(token);
    const userIdStr = decoded.userId || (decoded as any).id;

    if (!userIdStr) {
      sendError(res, 'UNAUTHORIZED', 'Invalid token payload', 401);
      return;
    }

    // Check if user still exists and is ACTIVE
    const user = await prisma.users.findUnique({
      where: { id: BigInt(userIdStr) },
      include: { employees: true },
    });

    if (!user || user.status === 'DISABLED') {
      sendError(
        res,
        user ? 'ACCOUNT_DISABLED' : 'UNAUTHORIZED',
        user ? 'User account is disabled' : 'User not found',
        user ? 403 : 401
      );
      return;
    }

    req.user = {
      id: user.id.toString(),
      userId: user.id.toString(),
      email: user.email,
      role: user.role,
      employeeId: user.employees?.id ? user.employees.id.toString() : null,
    };

    next();
  } catch (error) {
    sendError(res, 'UNAUTHORIZED', 'Invalid or expired authentication token', 401);
  }
};

export const authenticateToken = authenticate;

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(res, 'FORBIDDEN', 'Authenticated user lacks permission for this action', 403);
      return;
    }

    next();
  };
}
