import axios from 'axios';
import { markSessionExpired, isSessionExpiredShown, isRedirectInProgress, setRedirectInProgress } from './sessionManager';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds default timeout - increased for slower servers
});

// Add auth token to requests and extend timeout for chat/AI endpoints
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  
  // Validate and fix path parameters that should be integers
  if (config.url) {
    // Fix lawyer_id in path - matches /api/lawyers/{id} but not /api/lawyers/all, /api/lawyers/recommend, /api/lawyers/staff
    const lawyerIdMatch = config.url.match(/\/api\/lawyers\/([^\/]+)/);
    if (lawyerIdMatch && lawyerIdMatch[1]) {
      const lawyerId = lawyerIdMatch[1];
      // Skip if it's a known endpoint that doesn't need ID
      if (lawyerId !== 'all' && lawyerId !== 'recommend' && lawyerId !== 'staff' && !lawyerId.startsWith('staff/')) {
        // Check for invalid values
        if (lawyerId === 'undefined' || lawyerId === 'null' || lawyerId === '' || lawyerId.trim() === '') {
          console.error('BLOCKING invalid lawyer_id in URL:', lawyerId, 'from URL:', config.url);
          // Create a rejected promise to prevent the request
          const error = new Error(`Invalid lawyer_id: ${lawyerId}`);
          (error as any).config = config;
          (error as any).isAxiosError = true;
          throw error;
        }
        const parsedId = parseInt(String(lawyerId), 10);
        if (isNaN(parsedId) || parsedId <= 0) {
          console.error('BLOCKING invalid lawyer_id in URL:', lawyerId, 'from URL:', config.url);
          // Create a rejected promise to prevent the request
          const error = new Error(`Invalid lawyer_id: ${lawyerId}`);
          (error as any).config = config;
          (error as any).isAxiosError = true;
          throw error;
        }
        // Replace with properly parsed integer (ensures it's a number, not string)
        if (String(parsedId) !== lawyerId) {
          config.url = config.url.replace(`/lawyers/${lawyerId}`, `/lawyers/${parsedId}`);
        }
      }
    }
    
    // Fix staff_id in path
    const staffIdMatch = config.url.match(/\/api\/lawyers\/staff\/(\d+)/);
    if (staffIdMatch && staffIdMatch[1]) {
      const staffId = parseInt(String(staffIdMatch[1]), 10);
      if (!isNaN(staffId) && staffId > 0) {
        config.url = config.url.replace(`/staff/${staffIdMatch[1]}`, `/staff/${staffId}`);
      }
    }
    
    // Fix client_id in path
    const clientIdMatch = config.url.match(/\/api\/clients\/(\d+)/);
    if (clientIdMatch && clientIdMatch[1]) {
      const clientId = parseInt(String(clientIdMatch[1]), 10);
      if (!isNaN(clientId) && clientId > 0) {
        config.url = config.url.replace(`/clients/${clientIdMatch[1]}`, `/clients/${clientId}`);
      }
    }
  }
  
  // Extend timeout for endpoints that may take longer due to slow servers or complex queries
  const slowEndpoints = [
    '/api/chat/query-documents',
    '/api/chat/sessions',
    '/api/chat/sessions/',
    '/api/chat/support', // Support assistant endpoint
    '/api/lawyers/', // Portfolio and client endpoints
    '/api/clients/', // Client listing endpoints
    '/api/admin/users', // Admin user queries
  ];
  
  const isSlowEndpoint = slowEndpoints.some(endpoint => 
    config.url?.includes(endpoint)
  );
  
  // If it's a slow endpoint, override timeout to 120 seconds (2 minutes)
  // This ensures slow server requests have enough time
  if (isSlowEndpoint) {
    config.timeout = 120000; // 2 minutes for slow requests
  }
  
  return config;
});

// Handle auth errors - don't auto-redirect on login page to prevent refresh loops
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      // Only remove token and redirect if NOT on auth/login/register pages
      // This prevents page refresh on login failures
      // Also check if this is a login request - don't redirect on login failures
      const isLoginRequest = error.config?.url?.includes('/api/auth/login');
      const isAuthPage = currentPath.includes('/auth') || currentPath.includes('/login') || currentPath.includes('/register');
      
      if (!isAuthPage && !isLoginRequest) {
        localStorage.removeItem('access_token');
        // Mark session as expired to prevent duplicate messages
        if (!isSessionExpiredShown()) {
          markSessionExpired();
          setRedirectInProgress(true);
          // Redirect with session expired message
          window.location.href = '/auth?message=Session expired. Please sign in again.';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Support assistant (public) chat
export async function supportAssistantChat(payload: {
  message: string;
  audience?: 'clients' | 'lawyers' | 'enterprise' | null;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}): Promise<string> {
  const { data } = await api.post('/api/chat/support', payload);
  return data?.response ?? '';
}
