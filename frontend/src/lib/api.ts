const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('jaggle_token');
}

function setToken(token: string): void {
  localStorage.setItem('jaggle_token', token);
}

function clearToken(): void {
  localStorage.removeItem('jaggle_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearToken();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Auth API

export interface User {
  id: number;
  email: string;
  name: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export async function login(email: string, name: string): Promise<AuthResponse> {
  const data = await request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, name }),
  });
  setToken(data.token);
  localStorage.setItem('jaggle_user', JSON.stringify(data.user));
  return data;
}

export async function getCurrentUser(): Promise<User> {
  return request<User>('/auth/me');
}

export async function logout(): Promise<void> {
  try {
    await request('/auth/logout', { method: 'POST' });
  } finally {
    clearToken();
    localStorage.removeItem('jaggle_user');
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function getCachedUser(): User | null {
  const raw = localStorage.getItem('jaggle_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Spreadsheets API

export interface Spreadsheet {
  id: number;
  title: string;
  owner_id: number;
  data?: string;
  created_at: string;
  updated_at: string;
}

export interface SpreadsheetListItem {
  id: number;
  title: string;
  owner_id: number;
  owner_name: string;
  created_at: string;
  updated_at: string;
}

export async function listSpreadsheets(): Promise<SpreadsheetListItem[]> {
  return request<SpreadsheetListItem[]>('/spreadsheets');
}

export async function createSpreadsheet(title: string): Promise<Spreadsheet> {
  return request<Spreadsheet>('/spreadsheets', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}

export async function getSpreadsheet(id: number): Promise<Spreadsheet> {
  return request<Spreadsheet>(`/spreadsheets/${id}`);
}

export async function updateSpreadsheet(
  id: number,
  data: { title?: string; data?: string }
): Promise<Spreadsheet> {
  return request<Spreadsheet>(`/spreadsheets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteSpreadsheet(id: number): Promise<void> {
  await request(`/spreadsheets/${id}`, { method: 'DELETE' });
}
