'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { X } from 'lucide-react';
import { isSessionExpiredShown, markSessionExpired, isRedirectInProgress, setRedirectInProgress, resetSessionState } from '@/lib/sessionManager';
import ProfileCompletionModal from '@/components/ProfileCompletionModal';

interface User {
  id: number;
  email: string;
  username: string | null;
  full_name: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebarCollapsed') === 'true';
    }
    return false;
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('access_token');
    if (!token) {
        router.push('/auth');
      return;
    }

    // Set a maximum timeout to prevent infinite loading (6 seconds)
    const timeoutId = setTimeout(() => {
      console.error('Authentication timeout - redirecting to login');
      setLoading(false);
      setUser(null);
      localStorage.removeItem('access_token');
    }, 6000);

    const fetchUser = async () => {
      try {
        const response = await api.get('/api/auth/me');
        clearTimeout(timeoutId);
        setUser(response.data);
        setLoading(false);
      } catch (error: any) {
        clearTimeout(timeoutId);
        console.error('Error fetching user:', error);
        setLoading(false);
        setUser(null);
        // Remove token on any error
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('access_token');
          // Only redirect if we're not already on login page and session expiration not already handled
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth')) {
            if (!isSessionExpiredShown() && !isRedirectInProgress()) {
              markSessionExpired();
              setRedirectInProgress(true);
              router.push('/auth?message=Session expired. Please sign in again.');
            }
          }
        }
      }
    };

    fetchUser();

    // Cleanup timeout on unmount
    return () => clearTimeout(timeoutId);
  }, [router]);

  // Check if profile is complete and show modal if needed
  useEffect(() => {
    if (!loading && user && typeof window !== 'undefined') {
      // Check if profile is incomplete (missing full_name or username)
      // Phone is optional in the new onboarding flow, so we don't require it
      const isProfileIncomplete = !user.full_name || !user.username;
      
      // Get current pathname
      const currentPath = window.location.pathname;
      
      // Don't show modal if already on onboarding or profile completion pages
      if (isProfileIncomplete && !currentPath.includes('/auth/onboarding') && currentPath !== '/profile/complete') {
        // Check if user has a placeholder name (indicating they're in onboarding flow)
        const hasPlaceholderName = user.full_name && (user.full_name.startsWith('User ') || user.full_name.includes('@'));
        if (hasPlaceholderName) {
          // Redirect to onboarding for new users
          router.push('/auth/onboarding');
        } else {
          // Show modal for existing users with incomplete profiles
          setShowProfileModal(true);
        }
      } else {
        // Hide modal if profile is complete or on onboarding pages
        setShowProfileModal(false);
      }
    }
  }, [loading, user, router]);

  // Refresh user data after profile completion
  const refreshUser = async () => {
    try {
      const response = await api.get('/api/auth/me');
      setUser(response.data);
      setShowProfileModal(false);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  // Redirect to login if no user after loading completes
  // This MUST be called before any conditional returns (React hooks rule)
  useEffect(() => {
    if (!loading && !user) {
        router.push('/auth');
    }
  }, [loading, user, router]);

  // Check if profile is incomplete (for redirect logic)
  // Phone is optional in the new onboarding flow, so we don't require it
  const isProfileIncomplete = user && (!user.full_name || !user.username);
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

  // Early returns after all hooks
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary-200 rounded-full animate-spin"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-primary-500 rounded-full animate-spin"></div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">Loading Lega</h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">Setting up your workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">Redirecting to login...</h3>
          </div>
        </div>
      </div>
    );
  }

  // Don't render layout if profile is incomplete and user is being redirected to onboarding
  const isRedirectingToOnboarding = user && !user.full_name && currentPath.includes('/auth/onboarding');
  if (isRedirectingToOnboarding) {
    return null; // Will be redirected by useEffect
  }

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', newState.toString());
  };

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900">
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      
      <div className="flex">
        {/* Sidebar - visible on mobile when toggled, always visible on desktop */}
        <div className={`fixed md:relative inset-y-0 left-0 z-50 md:z-auto transform transition-transform duration-300 ease-in-out ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>
          <Sidebar user={user} collapsed={sidebarCollapsed} />
        </div>
        
        <div className="flex-1 flex flex-col min-w-0">
          <Header 
            user={user} 
            onToggleSidebar={toggleSidebar}
            onToggleMobileSidebar={toggleMobileSidebar}
            mobileSidebarOpen={mobileSidebarOpen}
          />
          <main className="flex-1 p-4 sm:p-6 animate-fade-in">
            <div className="max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
      
      {/* Profile Completion Modal */}
      {showProfileModal && user && (
        <ProfileCompletionModal
          user={user}
          onComplete={refreshUser}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
}
