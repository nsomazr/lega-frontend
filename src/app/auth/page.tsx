'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { ToastContainer, useToast } from '@/components/Toast';
import { Mail, Phone, ArrowRight, Lock } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { resetSessionState } from '@/lib/sessionManager';

export default function AuthPage() {
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'code' | 'password' | null>(null);
  const router = useRouter();
  const { toasts, error: showError, success, removeToast } = useToast();
  const messageShownRef = useRef(false);

  useEffect(() => {
    // Reset session state when auth page loads
    resetSessionState();
    
    // Check if user is already logged in
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        router.push('/dashboard');
        return;
      }
      
      // Check for redirect message from other pages
      const message = searchParams.get('message');
      if (message && !messageShownRef.current) {
        messageShownRef.current = true;
        setTimeout(() => {
          showError(message);
        }, 300);
      }
    }
  }, [router, searchParams, showError]);

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/api/auth/request-otp', {
        identifier: identifier.trim()
      });

      if (response.data.success) {
        success(response.data.message || 'Verification code sent successfully');
        // Redirect to OTP verification page with identifier
        setTimeout(() => {
          router.push(`/auth/verify-otp?identifier=${encodeURIComponent(identifier.trim())}`);
        }, 500);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to send verification code';
      showError(errorMessage);
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const body = new URLSearchParams();
      body.append('username', identifier.trim());
      body.append('password', password);

      const response = await api.post('/api/auth/login', body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const { access_token } = response.data;
      localStorage.setItem('access_token', access_token);
      
      // Fetch user profile to check if onboarding is needed
      try {
        const userResponse = await api.get('/api/auth/me');
        const user = userResponse.data;
        
        // Check if profile is incomplete (missing full_name or username)
        // Also check if user has placeholder name indicating new user
        const isProfileIncomplete = !user.full_name || !user.username;
        const hasPlaceholderName = user.full_name && (user.full_name.startsWith('User ') || user.full_name.includes('@temp.melt'));
        
        if (isProfileIncomplete || hasPlaceholderName) {
          // Redirect to onboarding for incomplete profiles
          success('Welcome! Please complete your profile.');
          setTimeout(() => {
            router.push('/auth/onboarding');
          }, 1000);
        } else {
          // Profile is complete, go to dashboard
          success('Welcome back! Redirecting...');
          setTimeout(() => {
            router.push('/dashboard');
          }, 1000);
        }
      } catch (userErr: any) {
        // If we can't fetch user, still redirect to dashboard (DashboardLayout will handle profile check)
        console.error('Error fetching user profile:', userErr);
        success('Welcome back! Redirecting...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message;
      
      // Check if user doesn't exist - redirect to account creation flow
      if (err.response?.status === 401 && detail === 'USER_NOT_FOUND') {
        // User doesn't exist - automatically request OTP and redirect to verification
        setLoading(true);
        // First request OTP for this identifier
        api.post('/api/auth/request-otp', {
          identifier: identifier.trim()
        }).then((response) => {
          if (response.data.success) {
            success('Account not found. Verification code sent. Redirecting...');
            setTimeout(() => {
              router.push(`/auth/verify-otp?identifier=${encodeURIComponent(identifier.trim())}`);
            }, 1000);
          }
        }).catch((otpErr: any) => {
          const otpErrorMsg = otpErr.response?.data?.detail || 'Failed to send verification code';
          showError(`Account not found. ${otpErrorMsg}`);
          setLoading(false);
        });
        return;
      }
      
      let errorMessage = 'Unable to sign in right now. Please check your connection and try again.';
      
      if (err.response?.status === 401) {
        if (detail === 'WRONG_PASSWORD') {
          errorMessage = 'Incorrect password. Please check your password and try again.';
        } else {
          errorMessage = 'Incorrect email/username/phone or password. Please check your credentials and try again.';
        }
      } else if (err.response?.status === 400 && detail?.includes('Inactive')) {
        errorMessage = 'Your account has been deactivated. Please contact an administrator.';
      } else if (detail && detail !== 'USER_NOT_FOUND' && detail !== 'WRONG_PASSWORD') {
        errorMessage = detail;
      }
      
      showError(errorMessage);
      setPassword('');
      setLoading(false);
    }
  };

  const isEmail = identifier.includes('@');

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background to-accent-50 dark:from-primary-950 dark:via-background dark:to-accent-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-secondary-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to MeLT
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Enter your phone number or email to continue
            </p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (authMode === 'password') {
              handlePasswordSubmit(e);
            } else if (authMode === 'code') {
              handleOTPSubmit(e);
            }
          }} className="space-y-6">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {isEmail ? (
                    <Mail className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Phone className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <input
                  type="text"
                  id="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="+255 755 971 2917 or name@melt.com"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-secondary-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            {authMode === 'password' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-secondary-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required={authMode === 'password'}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            {authMode === null && (
              <>
                <button
                  type="button"
                  onClick={() => setAuthMode('code')}
                  disabled={loading || !identifier.trim()}
                  className="w-full flex items-center justify-center gap-2 btn-primary btn-lg group"
                >
                  <span>Continue with code</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  type="button"
                  onClick={() => setAuthMode('password')}
                  disabled={loading || !identifier.trim()}
                  className="w-full flex items-center justify-center gap-2 btn-outline btn-lg group"
                >
                  <Lock className="h-5 w-5" />
                  <span>Continue with password</span>
                </button>
              </>
            )}

            {authMode === 'code' && (
              <>
                <button
                  type="submit"
                  disabled={loading || !identifier.trim()}
                  className="w-full flex items-center justify-center gap-2 btn-primary btn-lg group"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Sending code...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue with code</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(null);
                    setPassword('');
                  }}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 btn-ghost btn-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  <span>← Choose a different method</span>
                </button>
              </>
            )}

            {authMode === 'password' && (
              <>
                <button
                  type="submit"
                  disabled={loading || !identifier.trim() || !password}
                  className="w-full flex items-center justify-center gap-2 btn-primary btn-lg group"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign in</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(null);
                    setPassword('');
                  }}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 btn-ghost btn-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  <span>← Choose a different method</span>
                </button>
              </>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
