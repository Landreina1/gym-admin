import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('gym_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('gym_token');
        localStorage.removeItem('gym_user');
        document.cookie = 'gym_token=; path=/; max-age=0';
        window.location.href = '/login';
        return Promise.reject(new Error('Sesión expirada'));
      }
    }
    const message = err.response?.data?.message || 'Error del servidor';
    return Promise.reject(new Error(Array.isArray(message) ? message[0] : message));
  },
);
