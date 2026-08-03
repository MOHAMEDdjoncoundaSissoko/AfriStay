const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  token?: string;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, token } = options;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Une erreur est survenue');
  }

  return data;
}

export async function apiFetch(url: string, options: RequestInit = {}) {
  // Chercher le token : d'abord dans afristay_user, puis dans afristay_token
  let token: string | null = null;

  const rawUser = localStorage.getItem('afristay_user');
  if (rawUser) {
    try {
      const user = JSON.parse(rawUser);
      token = user.accessToken || user.token || null;
    } catch {}
  }

  if (!token) {
    token = localStorage.getItem('afristay_token');
  }

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('afristay_user');
      localStorage.removeItem('afristay_token');
      window.location.href = '/login';
      throw new Error('Non autorisé');
    }
    throw new Error(`Erreur ${res.status}`);
  }

  const data = await res.json();
  return data;
}