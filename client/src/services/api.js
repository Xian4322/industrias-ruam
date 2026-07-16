const BASE_URL = 'https://industrias-ruam.onrender.com/api/v1';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('ruam_token');
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, config);

  if (res.status === 401) {
    localStorage.removeItem('ruam_token');
    localStorage.removeItem('ruam_user');
    window.location.href = '/';
    throw new Error('Sesión expirada');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Error del servidor');
  return data;
}

// Auth
export const authAPI = {
  login: (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
};

// Orders
export const ordersAPI = {
  getAll: () => request('/orders'),
  create: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
  getOne: (id) => request(`/orders/${id}`),
  update: (id, data) => request(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getMaterials: (id) => request(`/orders/${id}/materials`),
};

// Kanban
export const kanbanAPI = {
  getBoard: () => request('/kanban'),
  advance: (id) => request(`/kanban/${id}/advance`, { method: 'POST' }),
  retreat: (id) => request(`/kanban/${id}/retreat`, { method: 'POST' }),
};

// Quality
export const qualityAPI = {
  submitChecklist: (data) => request('/quality/checklist', { method: 'POST', body: JSON.stringify(data) }),
  getChecklist: (orderId) => request(`/quality/checklist/${orderId}`),
  submitPackaging: (data) => request('/quality/packaging', { method: 'POST', body: JSON.stringify(data) }),
  getPackaging: (orderId) => request(`/quality/packaging/${orderId}`),
  getMaintenanceLogs: () => request('/quality/maintenance'),
  createMaintenance: (data) => request('/quality/maintenance', { method: 'POST', body: JSON.stringify(data) }),
  closeMaintenance: (id) => request(`/quality/maintenance/${id}/close`, { method: 'PUT' }),
};

// EVM
export const evmAPI = {
  getByOrder: (orderId) => request(`/evm/${orderId}`),
  calculate: (orderId) => request(`/evm/calculate/${orderId}`, { method: 'POST' }),
  getAll: () => request('/evm'),
};

// Changes
export const changesAPI = {
  getAll: () => request('/changes'),
  create: (data) => request('/changes', { method: 'POST', body: JSON.stringify(data) }),
  approve: (id) => request(`/changes/${id}/approve`, { method: 'PUT' }),
  reject: (id) => request(`/changes/${id}/reject`, { method: 'PUT' }),
};

// Dashboard
export const dashboardAPI = {
  getMetrics: () => request('/dashboard-metrics'),
};
