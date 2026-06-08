import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: any) =>
    api.post('/auth/register', data),
  getMe: () =>
    api.get('/auth/me'),
  switchRole: (role: string) =>
    api.post('/auth/switch-role', { role }),
};

// Hostels API
export const hostelsAPI = {
  getAll: () => api.get('/hostels'),
  getById: (id: string) => api.get(`/hostels/${id}`),
  create: (data: any) => api.post('/hostels', data),
  update: (id: string, data: any) => api.put(`/hostels/${id}`, data),
  delete: (id: string) => api.delete(`/hostels/${id}`),
};

// Rooms API
export const roomsAPI = {
  getAll: () => api.get('/rooms'),
  getById: (id: string) => api.get(`/rooms/${id}`),
  create: (data: any) => api.post('/rooms', data),
  update: (id: string, data: any) => api.put(`/rooms/${id}`, data),
  delete: (id: string) => api.delete(`/rooms/${id}`),
};

// Beds API
export const bedsAPI = {
  getAll: () => api.get('/beds'),
  getById: (id: string) => api.get(`/beds/${id}`),
  create: (data: any) => api.post('/beds', data),
  update: (id: string, data: any) => api.put(`/beds/${id}`, data),
  delete: (id: string) => api.delete(`/beds/${id}`),
};

// Tenants API
export const tenantsAPI = {
  getAll: () => api.get('/tenants'),
  getById: (id: string) => api.get(`/tenants/${id}`),
  create: (data: any) => api.post('/tenants', data),
  update: (id: string, data: any) => api.put(`/tenants/${id}`, data),
  delete: (id: string) => api.delete(`/tenants/${id}`),
  checkout: (id: string) => api.post(`/tenants/${id}/checkout`),
};

// Payments API
export const paymentsAPI = {
  getAll: () => api.get('/payments'),
  getById: (id: string) => api.get(`/payments/${id}`),
  create: (data: any) => api.post('/payments', data),
  update: (id: string, data: any) => api.put(`/payments/${id}`, data),
  markPaid: (id: string, method: string) => api.post(`/payments/${id}/mark-paid`, { method }),
};

// Tickets API
export const ticketsAPI = {
  getAll: () => api.get('/tickets'),
  getById: (id: string) => api.get(`/tickets/${id}`),
  create: (data: any) => api.post('/tickets', data),
  update: (id: string, data: any) => api.put(`/tickets/${id}`, data),
  delete: (id: string) => api.delete(`/tickets/${id}`),
};

// Users API
export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

export default api;
