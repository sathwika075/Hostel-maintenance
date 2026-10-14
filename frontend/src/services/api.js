const API_BASE_URL = 'https://hostel-complaint-maintenance-system.onrender.com/api';

function getAuthHeaders() {
  const token = localStorage.getItem('hostelcare_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    ...getAuthHeaders(),
    ...options.headers
  };

  // Don't set Content-Type header if sending FormData (Multer expects browser boundary)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API Request failed');
    }

    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err.message);
    throw err;
  }
}

export const api = {
  // Auth
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  getProfile: () => request('/auth/me'),
  getAccounts: () => request('/auth/accounts'),
  changePassword: (oldPassword, newPassword) =>
    request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword })
    }),

  // Users (Admin)
  createStudent: (data) =>
    request('/users/student', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  createStaff: (data) =>
    request('/users/staff', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getStudents: () => request('/users/students'),
  getStaff: () => request('/users/staff'),

  // Complaints
  getComplaints: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/complaints${query ? `?${query}` : ''}`);
  },
  getComplaintDetail: (id) => request(`/complaints/${id}`),
  raiseComplaint: (formData) =>
    request('/complaints', {
      method: 'POST',
      body: formData
    }),
  getRecommendedStaff: (complaintId) => request(`/complaints/${complaintId}/recommend-staff`),
  assignStaff: (complaintId, staffId, remarks) =>
    request(`/complaints/${complaintId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ staffId, remarks })
    }),
  updateAdmin: (complaintId, category, priority) =>
    request(`/complaints/${complaintId}/update-admin`, {
      method: 'POST',
      body: JSON.stringify({ category, priority })
    }),
  acceptTask: (complaintId) =>
    request(`/complaints/${complaintId}/accept`, {
      method: 'POST'
    }),
  startWork: (complaintId, formData) =>
    request(`/complaints/${complaintId}/start-work`, {
      method: 'POST',
      body: formData
    }),
  markResolved: (complaintId, formData) =>
    request(`/complaints/${complaintId}/mark-resolved`, {
      method: 'POST',
      body: formData
    }),
  verifyClose: (complaintId) =>
    request(`/complaints/${complaintId}/verify-close`, {
      method: 'POST'
    }),
  requestFollowup: (complaintId, formData) =>
    request(`/complaints/${complaintId}/follow-up`, {
      method: 'POST',
      body: formData
    }),
  resolveFollowup: (complaintId, followupId, remarks) =>
    request(`/complaints/${complaintId}/resolve-followup`, {
      method: 'POST',
      body: JSON.stringify({ followupId, remarks })
    }),
  submitFeedback: (complaintId, rating, comment) =>
    request(`/complaints/${complaintId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment })
    }),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationsRead: (notificationId, markAll = false) =>
    request('/notifications/mark-read', {
      method: 'POST',
      body: JSON.stringify({ notificationId, markAll })
    }),

  // Analytics & Reports
  getAnalyticsDashboard: () => request('/analytics/dashboard'),
  getReportSummary: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/reports/summary${query ? `?${query}` : ''}`);
  },

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (slaSettings) =>
    request('/settings', {
      method: 'POST',
      body: JSON.stringify(slaSettings)
    })
};
