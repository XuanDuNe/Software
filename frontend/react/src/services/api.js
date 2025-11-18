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
  let isJson = contentType.includes('application/json');

  if (text && isJson) {
    try {
      data = JSON.parse(text);
    } catch (_) {
      isJson = false; 
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

  if (isJson) {
    return data;
  }

  return text ?? null;
}

export const api = {
  login: (payload) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  register: (payload) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  verifyToken: (token) => request('/auth/verify-token', {
    method: 'POST',
    body: JSON.stringify({ token })
  }),

  getStudentProfile: () => request('/user/student/profile'),
  updateStudentProfile: (payload) => request('/user/student/profile', {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),
  getStudentProfileById: (userId) => request(`/user/student/profile/${userId}`),

  getProviderProfile: () => request('/user/provider/profile'),
  updateProviderProfile: (payload) => request('/user/provider/profile', {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),

  getProviderProfileById: (userId) => request(`/user/provider/profile/${userId}`),

  listMyApplications: (userId) => request(`/application/student/${userId}`),
  submitApplication: (data) => request('/application/', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  listOpportunities: (params = {}) => {
    const query = new URLSearchParams(params || {}).toString();
    const suffix = query ? `?${query}` : '';
    return request(`/opportunity/${suffix}`);
  },
  listProviderOpportunities: (providerUserId) => request(`/opportunity/provider/${providerUserId}`),
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

  updateOpportunityStatus: (id, status) => request(`/opportunity/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),

  upsertCriteria: (id, payload) => request(`/opportunity/${id}/criteria`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  getProviderInfo: () => request('/provider/info'),
  listProviderApplications: (providerUserId) => request(`/provider_app/provider/${providerUserId}`),
  listProviderApplicationsEnriched: (providerUserId) => request(`/provider_app/provider/${providerUserId}/enriched`),
  updateApplicationStatus: (appId, status) => request(`/provider_app/${appId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),
  adminListUsers: () => request('/auth/users'),
  adminUpdateUserRole: (userId, role) => request(`/auth/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role })
  }),
  adminListOpportunities: (params = {}) => {
    const query = new URLSearchParams(params || {}).toString();
    const path = query ? `/opportunity/admin?${query}` : '/opportunity/admin';
    return request(path);
  },
  adminUpdateOpportunityApproval: (opportunityId, approvalStatus) => request(`/opportunity/${opportunityId}/approval`, {
    method: 'PATCH',
    body: JSON.stringify({ approval_status: approvalStatus })
  }),

  createConversation: (participant1UserId, participant2UserId, applicationId) => request('/notification/conversations', { // THAY ĐỔI: Thêm applicationId
    method: 'POST',
    body: JSON.stringify({
      participant1_user_id: participant1UserId,
      participant2_user_id: participant2UserId,
      application_id: applicationId
    })
  }),
  listMessages: (conversationId) => request(`/notification/messages/${conversationId}`),
  sendMessage: (payload) => request('/notification/messages', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  listNotifications: (userId) => request(`/notification/notifications/${userId}`),
  markNotificationRead: (notifId) => request(`/notification/notifications/${notifId}/read`, { method: 'POST' }),
  
  markConversationAsRead: (conversationId, userId) => request(`/notification/conversations/${conversationId}/read/${userId}`, {
    method: 'POST'
  }),

  getUnreadCount: (conversationId, userId) => request(`/notification/conversations/${conversationId}/unread_count/${userId}`),

  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/storage/files/upload', {
      method: 'POST',
      body: formData
    });
  },
  getFileUrl: (fileId) => `${BASE_URL}/storage/files/${fileId}`,

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