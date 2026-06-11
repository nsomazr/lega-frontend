'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { ToastContainer, useToast } from '@/components/Toast';
import { ArrowLeft, Clock } from 'lucide-react';
import Link from 'next/link';
import AuthPageFallback from '@/components/AuthPageFallback';

function VerifyOTPPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const identifier = searchParams.get('identifier') || '';
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { toasts, error: showError, success, removeToast } = useToast();

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }

    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newCode = [...code];
    newCode[index] = value.replace(/[^0-9]/g, ''); // Only numbers
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    const newCode = [...code];
    pastedData.split('').forEach((digit, index) => {
      if (index < 6) {
        newCode[index] = digit;
      }
    });
    setCode(newCode);
    // Focus the next empty input or the last one
    const nextEmptyIndex = newCode.findIndex((val) => !val);
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();
  };

  const handleVerify = async () => {
    const codeString = code.join('');
    if (codeString.length !== 6) {
      showError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/verify-otp', {
        identifier: identifier,
        code: codeString
      });

      if (response.data.success && response.data.session_token) {
        success('Code verified successfully');
        const sessionToken = response.data.session_token;
        // Continue without password (user chose code-only login)
        try {
          const continueRes = await api.post('/api/auth/continue-without-password', {
            session_token: sessionToken
          });
          if (continueRes.data.success) {
            if (continueRes.data.is_new_user) {
              setTimeout(() => {
                router.push(`/auth/onboarding?token=${encodeURIComponent(sessionToken)}`);
              }, 500);
            } else {
              if (continueRes.data.access_token) {
                localStorage.setItem('access_token', continueRes.data.access_token);
                success('Signed in successfully');
                await new Promise((r) => setTimeout(r, 300));
                window.location.href = '/dashboard';
              } else {
                success('Signed in successfully');
                setTimeout(() => router.push('/dashboard'), 500);
              }
            }
          } else {
            showError(continueRes.data.message || 'Something went wrong');
            setLoading(false);
          }
        } catch (continueErr: any) {
          const msg = continueErr.response?.data?.detail || continueErr.message || 'Failed to continue';
          showError(msg);
          setLoading(false);
        }
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Invalid verification code';
      showError(errorMessage);
      // Clear code on error
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/auth/request-otp', {
        identifier: identifier
      });
      if (response.data.success) {
        success('Verification code resent successfully');
        setTimeLeft(300); // Reset timer
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to resend code';
      showError(errorMessage);
    }
    setLoading(false);
  };

  const allFilled = code.every((digit) => digit !== '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background to-accent-50 dark:from-primary-950 dark:via-secondary-900 dark:to-accent-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-secondary-800 rounded-2xl shadow-xl p-8">
          <Link href="/auth" className="inline-flex items-center text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100 mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
              Verify Your Code
            </h1>
            <p className="text-secondary-600 dark:text-secondary-400 mb-2">
              Enter the 6-digit code sent to
            </p>
            <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
              {identifier}
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex justify-center gap-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={loading}
                />
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-secondary-600 dark:text-secondary-400">
              <Clock className="h-4 w-4" />
              <span>Code expires in {formatTime(timeLeft)}</span>
            </div>

            <button
              onClick={handleVerify}
              disabled={loading || !allFilled || timeLeft === 0}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-secondary-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Verifying...</span>
                </div>
              ) : (
                'Verify Code'
              )}
            </button>

            <div className="text-center">
              <button
                onClick={handleResend}
                disabled={loading || timeLeft > 240}
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 disabled:text-secondary-400 disabled:cursor-not-allowed text-sm font-medium"
              >
                Resend Code
              </button>
            </div>
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default function VerifyOTPPageWrapper() {
  return (
    <Suspense fallback={<AuthPageFallback />}>
      <VerifyOTPPage />
    </Suspense>
  );
}
