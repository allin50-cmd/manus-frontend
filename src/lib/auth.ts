// Auth utilities for client-side session management

export interface User {
  id: string;
  name: string;
  email: string;
  firmId: string;
  firmName: string;
}

export function getAuthToken(): string | null {
  return localStorage.getItem('fg_token');
}

export function getUser(): User | null {
  const userStr = localStorage.getItem('fg_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function setAuth(token: string, user: User): void {
  localStorage.setItem('fg_token', token);
  localStorage.setItem('fg_user', JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem('fg_token');
  localStorage.removeItem('fg_user');
}

export function isAuthenticated(): boolean {
  return !!getAuthToken() && !!getUser();
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}
