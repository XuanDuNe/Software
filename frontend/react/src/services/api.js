// src/services/api.js

import { getToken, clearAuth } from '../utils/auth.js';

const BASE_URL = import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:8000';

async function request(path, options = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  const isFormData = options.body instanceof FormData;

  if (!isFormData) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearAuth();
    throw new Error('Unauthorized');
  }

  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  let data = null;
  if (text && contentType.includes('application/json')) {
    try {
      data = JSON.parse(text);
    } catch (_) {
      // ignore parse error, we'll fall back to raw text
    }
  }

  if (!response.ok) {
    let message = (data && (data.detail || data.message)) || text || response.statusText || 'Request failed';
    if (typeof message === 'object') {
      try {
        message = JSON.stringify(message);
      } catch (_) {
        message = 'Request failed';
      }
    }
    throw new Error(message);
  }

  return data ?? text ?? null;
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

  // Student profile
  getStudentProfile: () => request('/user/student/profile'),
  updateStudentProfile: (payload) => request('/user/student/profile', {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),

  // Student/application flows
  listMyApplications: (userId) => request(`/application/student/${userId}`),
  submitApplication: (data) => request('/application/', {
    method: 'POST',
    body: data
  }),

  // Opportunities (from provider service)
  listOpportunities: () => request('/opportunity/'),
  getOpportunity: (id) => request(`/opportunity/${id}`),
  createOpportunity: (payload) => request('/opportunity/', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  updateOpportunity: (id, payload) => request(`/opportunity/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),
  deleteOpportunity: (id) => request(`/opportunity/${id}`, {
    method: 'DELETE'
  }),
  upsertCriteria: (id, payload) => request(`/opportunity/${id}/criteria`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  // Provider applications
  getProviderInfo: () => request('/provider/info'),
  listProviderApplications: (providerUserId) => request(`/provider_app/provider/${providerUserId}`),
  listProviderApplicationsEnriched: (providerUserId) => request(`/provider_app/provider/${providerUserId}/enriched`),
  updateApplicationStatus: (appId, status) => request(`/provider_app/${appId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),

  // Notifications service
  listNotifications: (userId) => request(`/notification/notifications/${userId}`),
  markNotificationRead: (notifId) => request(`/notification/notifications/${notifId}/read`, { method: 'POST' }),

  // Matching service
  matchOpportunities: (studentUserId, studentProfile) => request('/matching/match', {
    method: 'POST',
    body: JSON.stringify({
      student_user_id: studentUserId,
      student_profile: studentProfile
    })
  }),
  matchSimple: (studentUserId, params) => {
    const queryParams = new URLSearchParams({
      student_user_id: studentUserId,
      ...(params.gpa && { gpa: params.gpa }),
      ...(params.skills && { skills: params.skills }),
      ...(params.goals && { goals: params.goals }),
      ...(params.strengths && { strengths: params.strengths }),
      ...(params.interests && { interests: params.interests })
    });
    return request(`/matching/match/simple?${queryParams.toString()}`, {
      method: 'GET'
    });
  }
};

export { BASE_URL };