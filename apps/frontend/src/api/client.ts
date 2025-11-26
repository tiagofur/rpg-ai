import { secureStorage } from '../services/secureStorage';

const API_BASE_URL = process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3333';

// ============================================================================
// Types
// ============================================================================

export class ApiRequestError extends Error {
  code: string | undefined;
  statusCode: number | undefined;

  constructor(message: string, statusCode?: number, code?: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

// ============================================================================
// Request Handler
// ============================================================================

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<{ data: T }> {
  const { skipAuth = false, headers: customHeaders, ...restOptions } = options;

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  // Add auth token if available and not skipped
  if (!skipAuth) {
    const token = await secureStorage.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...restOptions,
    headers,
  });

  // Handle non-OK responses
  if (!response.ok) {
    let errorMessage = 'Error en la solicitud';
    let errorCode: string | undefined;

    try {
      const errorBody = await response.json();
      errorMessage = errorBody?.error?.message || errorBody?.message || errorMessage;
      errorCode = errorBody?.error?.code || errorBody?.code;
    } catch {
      // If we can't parse the error body, use default message
    }

    // Handle specific status codes
    if (response.status === 401) {
      errorMessage = 'Sesión expirada. Por favor, inicia sesión de nuevo.';
    }

    throw new ApiRequestError(errorMessage, response.status, errorCode);
  }

  const data = await response.json();
  return { data };
}

// ============================================================================
// Client Methods
// ============================================================================

export const client = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { method: 'GET', ...options }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : null,
      ...options,
    }),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : null,
      ...options,
    }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : null,
      ...options,
    }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { method: 'DELETE', ...options }),
};

// ============================================================================
// Helper Functions
// ============================================================================

export async function postJson<TInput, TOutput>(
  path: string,
  body: TInput
): Promise<TOutput> {
  const { data } = await client.post<TOutput>(path, body);
  return data;
}

export function getApiUrl(): string {
  return API_BASE_URL;
}
