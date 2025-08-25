import axios from 'axios';

// Configure axios defaults
// In development, use same-origin ('') so Vite proxy handles API calls and avoids CORS.
const API_BASE_URL = import.meta.env.PROD ? 'https://constructrs.onrender.com' : '';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    // Try both token keys that might be used
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const errMsg = error.response?.data?.error;
    if (status === 401 || (status === 403 && errMsg === 'Invalid or expired token')) {
      // Clear stored auth artifacts and force re-login
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      delete axios.defaults.headers.common['Authorization'];
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
