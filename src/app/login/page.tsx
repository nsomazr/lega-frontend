'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { ToastContainer, useToast } from '@/components/Toast';
import { Eye, EyeOff, Mail, Lock, Scale, ArrowRight, Sparkles, Home } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import WelcomeGuide from '@/components/WelcomeGuide';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { toasts, error: showError, success, removeToast } = useToast();

  useEffect(() => {
    // Check if user is already logged in (only on client side)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        router.push('/dashboard');
      }
      
      // Check for redirect message from other pages
      const urlParams = new URLSearchParams(window.location.search);
      const message = urlParams.get('message');
      if (message) {
        setTimeout(() => {
          showError(message);
        }, 300);
      }
    }
  }, [router, showError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Prevent form default submission which causes page refresh
    setLoading(true);
    setError('');

    try {
      const body = new URLSearchParams();
      body.append('username', email.trim());
      body.append('password', password);

      const response = await api.post('/api/auth/login', body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const { access_token } = response.data;
      localStorage.setItem('access_token', access_token);
      
      // Show success message and wait before redirecting
      success('Welcome back! Redirecting...');
      
      // Small delay to show success message before redirect (smooth transition)
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message;
      let errorMessage = 'Unable to sign in right now. Please check your connection and try again.';
      
      if (err.response?.status === 401) {
        errorMessage = 'Incorrect email/username or password. Please check your credentials and try again.';
      } else if (err.response?.status === 400 && detail?.includes('Inactive')) {
        errorMessage = 'Your account has been deactivated. Please contact an administrator.';
      } else if (detail) {
        errorMessage = detail;
      }
      
      setError(errorMessage);
      showError(errorMessage);
      setPassword('');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background to-accent-50 dark:from-primary-950 dark:via-background dark:to-accent-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Support assistant - visible on login page */}
      <WelcomeGuide storageKey="lega_has_seen_welcome_v2" />
      <ToastContainer toasts={toasts} onClose={removeToast} />
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-primary-200/30 dark:bg-primary-800/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-accent-200/30 dark:bg-accent-800/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-primary-300/20 dark:bg-primary-700/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float animation-delay-4000"></div>
      </div>

      <div className="relative max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-xl transform hover:scale-105 transition-transform duration-200">
                <Scale className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-success-500 rounded-full flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-2">
            Welcome to Lega
          </h1>
          <p className="text-lg text-secondary-600 dark:text-secondary-400">
            Sign in to your legal practice account
          </p>
        </div>
        
        {/* Login Form */}
        <div className="glass rounded-3xl shadow-large border border-secondary-200/50 dark:border-secondary-700/50 p-8">
          <form 
            className="space-y-6" 
            onSubmit={handleSubmit}
            onKeyDown={(e) => {
              // Prevent form submission on Enter if there's an error
              if (e.key === 'Enter' && error) {
                e.preventDefault();
              }
            }}
          >
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="label block mb-2">
                  Email or Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-secondary-500 dark:text-secondary-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="text"
                    autoComplete="email"
                    required
                    className="input pl-10 pr-3 py-3"
                    placeholder="Enter your email or username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="label block mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-secondary-500 dark:text-secondary-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="input pl-10 pr-12 py-3"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-200 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-200 transition-colors" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Remember me and Forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 dark:border-secondary-600 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-secondary-600 dark:text-secondary-400">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200">
                  Forgot your password?
                </a>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-lg border border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/20 animate-fade-in-down">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-error-500 dark:text-error-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-error-800 dark:text-error-200">{error}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setError('')}
                    className="ml-3 flex-shrink-0 text-error-400 hover:text-error-600 dark:hover:text-error-300 transition-colors"
                    aria-label="Dismiss error"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary btn-lg w-full group"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    Sign in
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </button>
            </div>
          </form>

          {/* Sign up link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              Don't have an account?{' '}
              <Link href="/register" className="font-semibold text-primary-600 hover:text-primary-500 transition-colors duration-200">
                Create one now
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Theme Toggle */}
        <div className="flex justify-center">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}