import axios from 'axios';

// Create a unified Axios instance.
// Using '/api' as the baseURL leverages the Vite development proxy.
// In production, this can be swapped with your production API Gateway URL.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10-second timeout
});

// Optional: Add request interceptors (e.g., attach JWT token from localStorage)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
