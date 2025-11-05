'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { ToastContainer, useToast } from '@/components/Toast';
import api from '@/lib/api';
import { Search, Filter, Calendar, Activity as ActivityIcon } from 'lucide-react';
import { isAdmin } from '@/lib/roleCheck';

interface ActivityLog {
  id: number;
  user_id: number;
  user_email: string;
  activity_type: string;
  activity_details: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activityTypeFilter, setActivityTypeFilter] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const { toasts, error: showError, removeToast } = useToast();

  useEffect(() => {
    fetchCurrentUser();
    fetchLogs();
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

  const fetchLogs = async () => {
    try {
      const params: any = {};
      if (activityTypeFilter) params.activity_type = activityTypeFilter;
      
      const response = await api.get('/api/admin/activity-logs', { params });
      setLogs(response.data || []);
    } catch (error: any) {
      console.error('Error fetching activity logs:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to fetch activity logs';
      showError(errorMessage);
      setLogs([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [activityTypeFilter]);

  const getActivityTypeColor = (type: string) => {
    if (type === 'login') return 'bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400';
    if (type === 'document_upload') return 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400';
    if (type === 'chat_message') return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
    if (type === 'case_create') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    return 'bg-secondary-100 text-secondary-800';
  };

  const filteredLogs = logs.filter(log => 
    !searchTerm || 
    log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.activity_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900 dark:text-secondary-100">Activity Logs</h1>
          <p className="text-sm sm:text-base text-secondary-600 dark:text-secondary-400 mt-1">
            Monitor platform activities and user actions
          </p>
        </div>

        {/* Filters */}
        <div className="card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                <input
                  type="text"
                  placeholder="Search by user or activity type..."
                  className="input pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <select
                className="input"
                value={activityTypeFilter}
                onChange={(e) => setActivityTypeFilter(e.target.value)}
              >
                <option value="">All Activities</option>
                <option value="login">Login</option>
                <option value="document_upload">Document Upload</option>
                <option value="chat_message">Chat Message</option>
                <option value="case_create">Case Created</option>
                <option value="user_create">User Created</option>
                <option value="user_update">User Updated</option>
                <option value="user_delete">User Deleted</option>
              </select>
            </div>
          </div>
        </div>

        {/* Activity Logs */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-100 dark:bg-secondary-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-secondary-900 dark:text-secondary-100">User</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-secondary-900 dark:text-secondary-100">Activity</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-secondary-900 dark:text-secondary-100">IP Address</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-secondary-900 dark:text-secondary-100">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800/50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                        {log.user_email}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActivityTypeColor(log.activity_type)}`}>
                        {log.activity_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-secondary-600 dark:text-secondary-400">
                      {log.ip_address || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-secondary-600 dark:text-secondary-400">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredLogs.length === 0 && (
              <div className="text-center py-12 text-secondary-600 dark:text-secondary-400">
                No activity logs found
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

