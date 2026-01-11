'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ToastContainer, useToast } from '@/components/Toast';
import api from '@/lib/api';
import { User, Save, AlertCircle, X } from 'lucide-react';

interface UserProfile {
  id: number;
  email: string;
  username: string | null;
  full_name: string | null;
  phone: string | null;
  role: string;
}

interface ProfileCompletionModalProps {
  user: UserProfile;
  onComplete: () => void;
  onClose?: () => void;
}

export default function ProfileCompletionModal({ user, onComplete, onClose }: ProfileCompletionModalProps) {
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  
  const { toasts, success, error: showError, removeToast } = useToast();
  
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    phone: '',
  });

  useEffect(() => {
    // Pre-fill form with existing data
    setForm({
      full_name: user.full_name || '',
      username: user.username || user.email.split('@')[0] || '',
      phone: user.phone || '',
    });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.full_name || !form.username) {
      showError('Please fill in all required fields (Full Name and Username)');
      return;
    }
    
    setSaving(true);
    try {
      const response = await api.put('/api/auth/me', {
        full_name: form.full_name,
        username: form.username,
        phone: form.phone || undefined,
      });
      
      success('Profile completed successfully!');
      
      // Call onComplete callback to refresh user data
      onComplete();
      
      // Close modal after a short delay
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 500);
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to update profile');
      setSaving(false);
    }
  };

  const isProfileComplete = () => {
    // Phone is optional in the new onboarding flow
    return form.full_name.trim() !== '' && 
           form.username.trim() !== '';
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-accent-600">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Complete Your Profile
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Please provide the following information to continue
                </p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-6 p-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-warning-600 dark:text-warning-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-warning-800 dark:text-warning-200">
                    Profile completion required
                  </p>
                  <p className="text-xs text-warning-700 dark:text-warning-300 mt-1">
                    You need to complete your profile before accessing all features.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="full_name"
                  className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="John Doe"
                  required
                  disabled={saving}
                />
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="username"
                  className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value.replace(/\s+/g, '').toLowerCase() })}
                  placeholder="johndoe"
                  required
                  pattern="[a-z0-9_]+"
                  title="Username can only contain lowercase letters, numbers, and underscores"
                  disabled={saving}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {user?.username ? `Current username: ${user.username}` : 'Username will be auto-generated from your email if left empty'}
                </p>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+255712345678"
                  disabled={saving}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Include country code (e.g., +255 for Tanzania)
                </p>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
                  disabled={saving || !isProfileComplete()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Complete Profile</span>
                    </>
                  )}
                </button>
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={saving}
                    className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
