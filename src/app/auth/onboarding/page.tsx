'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { ToastContainer, useToast } from '@/components/Toast';
import { User, Building2, MapPin, Briefcase, FileText } from 'lucide-react';

export default function OnboardingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionTokenFromUrl = searchParams.get('token') || '';
  
  // Get session token from URL or use access_token from localStorage (for password login users)
  const getSessionToken = () => {
    if (sessionTokenFromUrl) {
      return sessionTokenFromUrl;
    }
    // For password login users, use access_token from localStorage
    if (typeof window !== 'undefined') {
      const accessToken = localStorage.getItem('access_token');
      return accessToken || '';
    }
    return '';
  };
  
  const [formData, setFormData] = useState({
    full_name: '',
    role: 'client' as 'client' | 'lawyer' | 'enterprise_manager',
    phone: '',
    location: '',
    firm_name: '',
    tin_number: '',
    specialization: ''
  });
  const [loading, setLoading] = useState(false);
  const { toasts, error: showError, success, removeToast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name.trim()) {
      showError('Full name is required');
      return;
    }

    const sessionToken = getSessionToken();
    if (!sessionToken) {
      showError('Invalid session. Please start over.');
      router.push('/auth');
      return;
    }

    // Validate law firm fields
    if (formData.role === 'enterprise_manager' && !formData.tin_number) {
      showError('TIN number is required for law firms/enterprises');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        session_token: sessionToken,
        full_name: formData.full_name,
        role: formData.role,
        location: formData.location || undefined,
        specialization: formData.specialization || undefined
      };

      if (formData.phone) {
        payload.phone = formData.phone;
      }

      if (formData.role === 'enterprise_manager') {
        payload.firm_name = formData.firm_name || undefined;
        payload.tin_number = formData.tin_number;
      }

      const response = await api.post('/api/auth/onboarding', payload);

      if (response.data.success && response.data.access_token) {
        // Store the access token
        localStorage.setItem('access_token', response.data.access_token);
        success('Onboarding completed successfully');
        
        // Redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard');
        }, 500);
      }
    } catch (err: any) {
      let errorMessage = 'Failed to complete onboarding';
      
      if (err.response?.data) {
        const data = err.response.data;
        
        // Handle Pydantic validation errors (array of error objects)
        if (data.detail) {
          if (Array.isArray(data.detail)) {
            // Extract field names and messages from validation errors
            errorMessage = data.detail.map((error: any) => {
              const field = error.loc && error.loc.length > 1 
                ? error.loc.slice(1).join('.') 
                : error.loc?.[0] || 'field';
              return `${field}: ${error.msg}`;
            }).join('; ');
          } else if (typeof data.detail === 'string') {
            errorMessage = data.detail;
          } else {
            errorMessage = 'Validation error occurred';
          }
        } else if (data.message) {
          errorMessage = data.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      console.error('Onboarding error:', err.response?.data || err);
      showError(errorMessage);
      setLoading(false);
    }
  };

  const isLawFirm = formData.role === 'enterprise_manager';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Complete Your Profile
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Tell us a bit about yourself
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <User className="inline h-4 w-4 mr-1" />
                Full Name *
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={loading}
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Briefcase className="inline h-4 w-4 mr-1" />
                I am a *
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={loading}
              >
                <option value="client">Client</option>
                <option value="lawyer">Lawyer</option>
                <option value="enterprise_manager">Law Firm / Enterprise</option>
              </select>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <User className="inline h-4 w-4 mr-1" />
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+255 123 456 789"
                className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="City, Country"
                className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            {formData.role === 'lawyer' && (
              <div>
                <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Briefcase className="inline h-4 w-4 mr-1" />
                  Specialization
                </label>
                <textarea
                  id="specialization"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  placeholder="e.g., Corporate Law, Criminal Law, Family Law"
                  rows={3}
                  className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
            )}

            {isLawFirm && (
              <>
                <div>
                  <label htmlFor="firm_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Building2 className="inline h-4 w-4 mr-1" />
                    Firm Name
                  </label>
                  <input
                    type="text"
                    id="firm_name"
                    name="firm_name"
                    value={formData.firm_name}
                    onChange={handleChange}
                    placeholder="Enter your law firm name"
                    className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="tin_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <FileText className="inline h-4 w-4 mr-1" />
                    TIN Number *
                  </label>
                  <input
                    type="text"
                    id="tin_number"
                    name="tin_number"
                    value={formData.tin_number}
                    onChange={handleChange}
                    placeholder="Enter your TIN (Taxpayer Identification Number)"
                    className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={isLawFirm}
                    disabled={loading}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    TIN number is required for law firms and enterprises
                  </p>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading || !formData.full_name.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Completing...</span>
                </div>
              ) : (
                'Complete Setup'
              )}
            </button>
          </form>
        </div>
      </div>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
