import { Response } from 'express';

/**
 * Recursively serializes BigInt and Decimal fields to string/number for JSON compatibility.
 */
export function serializeData<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'bigint') {
    return data.toString() as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => serializeData(item)) as unknown as T;
  }

  if (typeof data === 'object') {
    // Check if it's a Decimal object (Prisma Decimal has toString / toNumber)
    if ('toNumber' in data && typeof (data as any).toNumber === 'function') {
      return (data as any).toNumber();
    }

    // Check if it's a Date
    if (data instanceof Date) {
      return data as unknown as T;
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
