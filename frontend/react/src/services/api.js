import { getToken, clearAuth } from '../utils/auth.js';

const BASE_URL = import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:8000';

async function request(path, options = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (res.status === 401) {
    clearAuth();
    throw new Error('Unauthorized');
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message = data?.detail || res.statusText || 'Request failed';
    throw new Error(message);
  }
  return data;
}

export const api = {
  login: (payload) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  verifyToken: (token) => request('/auth/verify-token', {
    method: 'POST',
    body: JSON.stringify({ token })
  }),
  // Student/application flows
  listMyApplications: (userId) => request(`/application/student/${userId}`),
  submitApplication: (data) => request('/application/', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  // Opportunities (from provider service)
  listOpportunities: () => request('/opportunity/'),
  getOpportunity: (id) => request(`/opportunity/${id}`),
  // Provider example
  getProviderInfo: () => request('/provider/info')
};

export { BASE_URL };


