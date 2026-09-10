import axios from 'axios';

// ─────────────────────────────────────────────────────────────────────────────
// BASE URL — lee NEXT_PUBLIC_API_URL del entorno (definida en .env.local)
// ─────────────────────────────────────────────────────────────────────────────
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// ─────────────────────────────────────────────────────────────────────────────
// 1. CLIENTE AXIOS — Para usar en Client Components ('use client')
//    Adjunta automáticamente el JWT desde localStorage en cada petición.
// ─────────────────────────────────────────────────────────────────────────────
export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: adjunta el token JWT a cada petición saliente (solo en el cliente)
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. HELPER apiFetch — Para usar en Server Components (RSC) y cualquier
//    contexto que prefiera fetch nativo de Next.js (con soporte de cache,
//    revalidación ISR, etc.).
//
//    Uso:
//      // Server Component (sin cache):
//      const data = await apiFetch('/tickets', {}, { cache: 'no-store' });
//
//      // Server Component (con revalidación cada 60s):
//      const data = await apiFetch('/tickets', {}, { next: { revalidate: 60 } });
//
//      // Con token en el servidor (pasado explícitamente):
//      const data = await apiFetch('/users', { token: serverToken });
// ─────────────────────────────────────────────────────────────────────────────
interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string;
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  { method = 'GET', body, token }: ApiFetchOptions = {},
  nextOptions?: RequestInit
): Promise<T> {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Adjuntar token si fue pasado explícitamente (Server Components)
  // o intentar leerlo desde localStorage (Client Components)
  const resolvedToken =
    token ??
    (typeof window !== 'undefined' ? (localStorage.getItem('token') ?? undefined) : undefined);

  if (resolvedToken) {
    headers['Authorization'] = `Bearer ${resolvedToken}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    ...nextOptions,
  });

  if (!response.ok) {
    let errorMessage = `Error ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData?.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // La respuesta no es JSON, usar el mensaje HTTP por defecto
    }
    throw new Error(errorMessage);
  }

  // 204 No Content u otras respuestas sin cuerpo
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
