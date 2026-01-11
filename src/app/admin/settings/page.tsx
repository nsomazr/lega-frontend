'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { ToastContainer, useToast } from '@/components/Toast';
import api from '@/lib/api';
import { Settings as SettingsIcon, Save, Loader } from 'lucide-react';
import { isAdmin } from '@/lib/roleCheck';

export default function AdminSettingsPage() {
  const [currentModel, setCurrentModel] = useState('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const { toasts, success, error: showError, removeToast } = useToast();

  useEffect(() => {
    fetchCurrentUser();
    fetchDefaultModel();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/api/auth/me');
      setCurrentUser(response.data);
      if (!isAdmin(response.data.role)) {
        window.location.href = '/dashboard';
      }
    } catch (error) {
      showError('Failed to fetch user information');
    }
  };

  const fetchDefaultModel = async () => {
    try {
      const response = await api.get('/api/admin/default-model');
      setCurrentModel(response.data.model || '');
      setAvailableModels(response.data.available_models || []);
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to fetch default model');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentModel.trim()) {
      showError('Please select a model');
      return;
    }

    setSaving(true);
    try {
      await api.put('/api/admin/default-model', {
        model: currentModel
      });
      success('Default model updated successfully. This change applies to all users.');
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to update default model');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900 dark:text-secondary-100">System Settings</h1>
          <p className="text-sm sm:text-base text-secondary-600 dark:text-secondary-400 mt-1">
            Manage system-wide settings that apply to all users
          </p>
        </div>

        {/* Default Model Settings */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
              <SettingsIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">Default AI Model</h2>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                The default model used by all users in chat
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdateModel} className="space-y-4">
            <div className="form-group">
              <label className="label-required">Default Model</label>
              {availableModels.length > 0 ? (
                <select
                  className="input"
                  value={currentModel}
                  onChange={(e) => setCurrentModel(e.target.value)}
                  required
                >
                  <option value="">-- Select Model --</option>
                  {availableModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    className="input"
                    value={currentModel}
                    onChange={(e) => setCurrentModel(e.target.value)}
                    placeholder="Enter model name (e.g., qwen3:0.6b)"
                    required
                  />
                  <p className="text-xs text-secondary-500 dark:text-secondary-400">
                    Enter the model name from your Ollama installation
                  </p>
                </div>
              )}
            </div>

            <div className="bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 rounded-lg p-4">
              <p className="text-sm text-info-800 dark:text-info-300">
                <strong>Note:</strong> Changes to the default model apply to all users immediately. 
                The change persists until the server is restarted (then it reverts to the configured default).
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving || !currentModel.trim()}
                className="btn-primary btn-md flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Update Default Model
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
