import axios from 'axios';
import { markSessionExpired, isSessionExpiredShown, isRedirectInProgress, setRedirectInProgress } from './sessionManager';

// Call backend directly so Authorization header is never stripped (Next.js rewrite can drop it)
const API_BASE_URL =
  typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
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
  
  // Extend timeout for endpoints that may take longer (request-otp gets 25s so we don't hang if backend/SMTP is slow)
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
  // OTP request: backend returns immediately (store+send in background); allow 25s for slow networks
  if (config.url?.includes('/api/auth/request-otp')) {
    config.timeout = 25000; // 25s – response is instant; extra margin for slow backend/network
  }
  
  return config;
});

// Login/signup endpoints: never redirect with "session expired" so the page can show the real error
const LOGIN_FLOW_PATHS = [
  '/api/auth/login',
  '/api/auth/request-otp',
  '/api/auth/verify-otp',
  '/api/auth/continue-without-password',
  '/api/auth/set-password',
];

// Caller handles redirect (e.g. DashboardLayout retries /api/auth/me once before redirecting)
const AUTH_ME_PATH = '/api/auth/me';

// Handle auth errors - don't auto-redirect on login page to prevent refresh loops
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (typeof window === 'undefined') return Promise.reject(error);

    const status = error.response?.status;
    const detail = (error.response?.data?.detail ?? '').toString();
    const requestUrl = error.config?.url ?? '';
    const retryCount = error.config?.__retryCount ?? 0;
    // 401 = invalid/expired token; 403 with "Not authenticated" = missing token (FastAPI HTTPBearer default)
    const isAuthFailure = status === 401 || (status === 403 && /not authenticated/i.test(detail));
    const isLoginFlowRequest = LOGIN_FLOW_PATHS.some((p) => requestUrl.includes(p));
    const isAuthMeRequest = requestUrl.includes(AUTH_ME_PATH);

    // Retry once on 401 (transient backend/cold-start) before treating as session expired
    if (isAuthFailure && !isLoginFlowRequest && retryCount < 1) {
      await new Promise((r) => setTimeout(r, 400));
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const retryConfig = { ...error.config, __retryCount: retryCount + 1 };
          retryConfig.headers = { ...retryConfig.headers, Authorization: `Bearer ${token}` };
          return await api.request(retryConfig);
        } catch {
          // Retry failed - fall through to redirect logic below
        }
      }
    }

    if (isAuthFailure && !isLoginFlowRequest && !isAuthMeRequest) {
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath.includes('/auth') || currentPath.includes('/login') || currentPath.includes('/register');

      if (!isAuthPage) {
        localStorage.removeItem('access_token');
        if (!isSessionExpiredShown()) {
          markSessionExpired();
          setRedirectInProgress(true);
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
