const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  token?: string;
}

// Utilisée par les pages existantes (bookings, properties, etc.)
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
    if (res.status === 401) {
      localStorage.removeItem('afristay_token');
      localStorage.removeItem('afristay_refresh_token');
      localStorage.removeItem('afristay_user');
      if (typeof window !== 'undefined') window.location.href = '/login';
      return data as T;
    }
    throw new Error(data.message || 'Une erreur est survenue');
  }

  return data;
}

// Utilisée par les pages admin — avec refresh automatique
let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;

async function getAccessToken(): Promise<string | null> {
  let token = localStorage.getItem('afristay_token');
  
  if (!token) {
    // Essayer de refresher
    token = await tryRefresh();
  }
  
  return token;
}

async function tryRefresh(): Promise<string | null> {
  const refreshToken = localStorage.getItem('afristay_refresh_token');
  if (!refreshToken) return null;

  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        // Refresh échoué = déconnexion
        clearAuth();
        return null;
      }

      const data = await res.json();
      localStorage.setItem('afristay_token', data.accessToken);
      localStorage.setItem('afristay_refresh_token', data.refreshToken);
      return data.accessToken;
    } catch {
      clearAuth();
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function clearAuth() {
  localStorage.removeItem('afristay_token');
  localStorage.removeItem('afristay_refresh_token');
  localStorage.removeItem('afristay_user');
  window.location.href = '/login';
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<any> {
  const token = await getAccessToken();
  if (!token) {
    clearAuth();
    throw new Error('Non autorisé');
  }

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
    Authorization: `Bearer ${token}`,
  };

  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  let res = await fetch(`${API_URL}${url}`, { ...options, headers });

  // Si 401, essayer le refresh UNE fois
  if (res.status === 401) {
    const newToken = await tryRefresh();
    if (!newToken) {
      clearAuth();
      throw new Error('Non autorisé');
    }

    // Rejouer la requête avec le nouveau token
    headers['Authorization'] = `Bearer ${newToken}`;
    res = await fetch(`${API_URL}${url}`, { ...options, headers });
  }

  if (!res.ok) {
    throw new Error(`Erreur ${res.status}`);
  }

  return res.json();
}

// Pour la déconnexion
export function logout() {
  const token = localStorage.getItem('afristay_token');
  const refreshToken = localStorage.getItem('afristay_refresh_token');

  if (token && refreshToken) {
    // Appel fire-and-forget, on vide le localStorage immédiatement
    fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => {});
  }

  clearAuth();
}