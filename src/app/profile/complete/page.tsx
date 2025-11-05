'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ToastContainer, useToast } from '@/components/Toast';
import api from '@/lib/api';
import { User, Save, AlertCircle } from 'lucide-react';

interface UserProfile {
  id: number;
  email: string;
  username: string | null;
  full_name: string | null;
  phone: string | null;
  role: string;
}

export default function CompleteProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  
  const { toasts, success, error: showError, removeToast } = useToast();
  
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    phone: '',
  });

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await api.get('/api/auth/me');
      setUser(response.data);
      
      // Check if profile is already complete
      if (response.data.full_name && response.data.username && response.data.phone) {
        router.push('/dashboard');
        return;
      }
      
      // Pre-fill form with existing data
      setForm({
        full_name: response.data.full_name || '',
        username: response.data.username || response.data.email.split('@')[0] || '',
        phone: response.data.phone || '',
      });
    } catch (error: any) {
      showError('Failed to fetch user information');
      // Redirect to login if not authenticated
      if (error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.full_name || !form.username || !form.phone) {
      showError('Please fill in all required fields');
      return;
    }
    
    setSaving(true);
    try {
      const response = await api.put('/api/auth/me', {
        full_name: form.full_name,
        username: form.username,
        phone: form.phone,
      });
      
      // Update local user state to reflect changes
      setUser(response.data);
      
      success('Profile completed successfully!');
      
      // Wait a bit longer and force a hard refresh of user data
      setTimeout(() => {
        // Force router to navigate and clear any cached state
        window.location.href = '/dashboard';
      }, 1000);
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to update profile');
      setSaving(false);
    }
  };

  const isProfileComplete = () => {
    return form.full_name.trim() !== '' && 
           form.username.trim() !== '' && 
           form.phone.trim() !== '';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background to-accent-50 dark:from-primary-950 dark:via-background dark:to-accent-950">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-gradient-to-r from-primary-600 to-accent-600 shadow-lg">
              <User className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-bold gradient-text">
              Complete Your Profile
            </h2>
            <p className="mt-2 text-center text-sm text-secondary-600 dark:text-secondary-400">
              Please provide the following information to continue
            </p>
          </div>

          {/* Profile Completion Form */}
          <div className="card p-6 sm:p-8">
            <div className="mb-6 p-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-warning-600 dark:text-warning-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-warning-800 dark:text-warning-200">
                    Profile completion required
                  </p>
                  <p className="text-xs text-warning-700 dark:text-warning-300 mt-1">
                    You need to complete your profile before accessing the dashboard.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label className="label-required">Full Name</label>
                <input
                  type="text"
                  className="input"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="form-group">
                <label className="label-required">Username</label>
                <input
                  type="text"
                  className="input"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value.replace(/\s+/g, '').toLowerCase() })}
                  placeholder="johndoe"
                  required
                  pattern="[a-z0-9_]+"
                  title="Username can only contain lowercase letters, numbers, and underscores"
                />
                <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                  {user?.username ? `Current username: ${user.username}` : 'Username will be auto-generated from your email if left empty'}
                </p>
              </div>

              <div className="form-group">
                <label className="label-required">Phone Number</label>
                <input
                  type="tel"
                  className="input"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+255712345678"
                  required
                />
                <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                  Include country code (e.g., +255 for Tanzania)
                </p>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving || !isProfileComplete()}
                  className="btn-primary btn-lg w-full flex items-center justify-center"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Complete Profile
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

