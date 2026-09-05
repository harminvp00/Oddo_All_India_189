import { Response } from 'express';

// Recursively serialize BigInt as String and Decimal as Number/String
export function serializeData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'bigint') {
    return data.toString();
  }

  if (typeof data === 'object') {
    // Handle Prisma Decimal
    if (data && typeof data === 'object' && 's' in data && 'e' in data && 'd' in data) {
      return Number(data.toString());
    }

    if (data instanceof Date) {
      return data.toISOString();
    }

    if (Array.isArray(data)) {
      return data.map(serializeData);
    }

    const serialized: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      serialized[key] = serializeData(data[key]);
    }
    return serialized;
  }

  return data;
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
