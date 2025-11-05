import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000, // 5 seconds timeout - fail faster
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle auth errors - don't auto-redirect on login page to prevent refresh loops
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      // Only remove token and redirect if NOT on login/register pages
      // This prevents page refresh on login failures
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        localStorage.removeItem('access_token');
        // Use router.push instead of window.location.href for smoother navigation
        // But we can't use router here, so just remove token and let the component handle redirect
      }
    }
    return Promise.reject(error);
  }
);

export default api;
