/**
 * Centralized API Service Wrapper
 * 
 * Provides standard HTTP request methods, error normalization, header injection,
 * and base configuration for connecting to the PeoplePay360 backend API.
 */

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Default development token for local demo (Admin User ID 11)
export const DEFAULT_DEV_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjExIiwiZW1haWwiOiJhZG1pbkBwZW9wbGVwYXkzNjAuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzg4NjU5MzM2LCJleHAiOjE3OTEyNTEzMzZ9.44DxQiq5SerdI3gv05Lpdk1tqZDqMan2Ygin87x8_0I';

export class APIError extends Error {
  code: string;
  statusCode: number;
  details?: any;

  constructor(message: string, code = 'API_ERROR', statusCode = 500, details?: any) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

function getAuthToken(): string {
  return localStorage.getItem('token') || localStorage.getItem('auth_token') || DEFAULT_DEV_TOKEN;
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${getAuthToken()}`,
    ...(options.headers || {}),
  };

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'omit',
  };

  try {
    const response = await fetch(url, config);
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = result?.error?.message || result?.message || `Request failed with status ${response.status}`;
      const errorCode = result?.error?.code || 'HTTP_ERROR';
      throw new APIError(errorMessage, errorCode, response.status, result?.error?.details);
    }

    return result as T;
  } catch (error: any) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(error.message || 'Network connection failed', 'NETWORK_ERROR', 0);
  }
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};
