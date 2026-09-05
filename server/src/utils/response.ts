import { Response } from 'express';

/**
 * Recursively serializes BigInt, Decimal, and Date fields to string/number/ISO string for JSON compatibility.
 */
export function serializeData<T = any>(data: any): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'bigint') {
    return data.toString() as any;
  }

  if (typeof data === 'object') {
    // Handle Prisma Decimal
    if ('toNumber' in data && typeof (data as any).toNumber === 'function') {
      return (data as any).toNumber();
    }
    if ('s' in data && 'e' in data && 'd' in data) {
      return Number(data.toString()) as any;
    }

    // Check if it's a Date
    if (data instanceof Date) {
      return data.toISOString() as any;
    }

    if (Array.isArray(data)) {
      return data.map((item) => serializeData(item)) as any;
    }

    const transformed: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      transformed[key] = serializeData(value);
    }
    return transformed as T;
  }

  return data;
}

export function successResponse(
  res: Response,
  data: any,
  statusCode = 200,
  meta?: { page: number; limit: number; total: number; totalPages?: number }
) {
  const serialized = serializeData(data);
  if (meta) {
    return res.status(statusCode).json({
      success: true,
      data: serialized,
      meta: {
        page: meta.page,
        limit: meta.limit,
        total: meta.total,
        totalPages: meta.totalPages ?? Math.ceil(meta.total / (meta.limit || 1)),
      },
    });
  }

  return res.status(statusCode).json({
    success: true,
    data: serialized,
  });
}

export function errorResponse(
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
  details?: any
) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  });
}

export function sendSuccess(res: Response, data: any, status = 200) {
  return res.status(status).json({
    success: true,
    data: serializeData(data),
  });
}

export function sendPaginated(
  res: Response,
  data: any[],
  meta: { page: number; limit: number; total: number; totalPages: number },
  status = 200
) {
  return res.status(status).json({
    success: true,
    data: serializeData(data),
    meta,
  });
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  status = 400,
  details?: any
) {
  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  });
}
