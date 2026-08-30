import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const api = axios.create({ baseURL: `${API_BASE}/api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('docspace_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalizes axios errors into a plain message string the UI can display.
export function errorMessage(err) {
  return err?.response?.data?.error || err?.message || 'Something went wrong. Please try again.';
}

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

export const documentsApi = {
  list: () => api.get('/documents'),
  create: (title) => api.post('/documents', { title }),
  get: (id) => api.get(`/documents/${id}`),
  update: (id, updates) => api.patch(`/documents/${id}`, updates),
  remove: (id) => api.delete(`/documents/${id}`),
  share: (id, email, permission) => api.post(`/documents/${id}/share`, { email, permission }),
  listShares: (id) => api.get(`/documents/${id}/shares`),
  revokeShare: (id, userId) => api.delete(`/documents/${id}/share/${userId}`),
};

export const filesApi = {
  import: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/files/import', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};
