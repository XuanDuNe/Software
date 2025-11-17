

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
      // Bỏ qua lỗi parse, coi như đây là text
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
    // Nếu là JSON, trả về data (có thể là object, array, hoặc null nếu body rỗng/text="null")
    return data;
  }

  return text ?? null;
}

export const api = {
// ... (Nội dung giữ nguyên)
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
  getStudentProfileById: (userId) => request(`/user/student/profile/${userId}`),

  // Student/application flows
  listMyApplications: (userId) => request(`/application/student/${userId}`),
  submitApplication: (data) => request('/application/', {
    method: 'POST',
    body: JSON.stringify(data)
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

  // Conversations & messaging
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

  // Notifications service
  listNotifications: (userId) => request(`/notification/notifications/${userId}`),
  markNotificationRead: (notifId) => request(`/notification/notifications/${notifId}/read`, { method: 'POST' }),
  
  // NEW: Mark messages as read (SỬ DỤNG PATH PARAMETER)
  markConversationAsRead: (conversationId, userId) => request(`/notification/conversations/${conversationId}/read/${userId}`, {
    method: 'POST'
  }),
  // NEW: Check unread count (Chỉ để tham khảo)
  getUnreadCount: (conversationId, userId) => request(`/notification/conversations/${conversationId}/unread_count/${userId}`),
  
  // Storage service
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/storage/files/upload', {
      method: 'POST',
      body: formData
    });
  },
  getFileUrl: (fileId) => `${BASE_URL}/storage/files/${fileId}`,

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