'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { ToastContainer, useToast } from '@/components/Toast';
import api from '@/lib/api';
import { FolderOpen, FileText, Calendar, Users, TrendingUp, BarChart } from 'lucide-react';
import Link from 'next/link';
import { isStaff } from '@/lib/roleCheck';

export default function StaffDashboardPage() {
  const [stats, setStats] = useState({
    totalCases: 0,
    activeCases: 0,
    totalDocuments: 0,
    recentDocuments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const { toasts, error: showError, removeToast } = useToast();

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchStats();
    }
  }, [currentUser]);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/api/auth/me');
      setCurrentUser(response.data);
      if (!isStaff(response.data?.role)) {
        window.location.href = '/dashboard';
      }
    } catch (error) {
      showError('Failed to fetch user information');
    }
  };

  const fetchStats = async () => {
    try {
      const [casesRes, docsRes] = await Promise.all([
        api.get('/api/cases'),
        api.get('/api/documents')
      ]);
      
      const cases = casesRes.data || [];
      const documents = docsRes.data || [];
      
      setStats({
        totalCases: cases.length,
        activeCases: cases.filter((c: any) => c.status === 'open').length,
        totalDocuments: documents.length,
        recentDocuments: documents.filter((d: any) => {
          const docDate = new Date(d.created_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return docDate > weekAgo;
        }).length,
      });
    } catch (error: any) {
      showError('Failed to fetch statistics');
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900 dark:text-secondary-100">Staff Dashboard</h1>
          <p className="text-sm sm:text-base text-secondary-600 dark:text-secondary-400 mt-1">
            Welcome back, {currentUser?.full_name || 'Staff Member'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/cases" className="card p-6 hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Total Cases</p>
                <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mt-1">
                  {stats.totalCases}
                </p>
              </div>
              <FolderOpen className="h-8 w-8 text-primary-500" />
            </div>
          </Link>
          
          <Link href="/cases" className="card p-6 hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Active Cases</p>
                <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">
                  {stats.activeCases}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-success-500" />
            </div>
          </Link>
          
          <Link href="/documents" className="card p-6 hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Total Documents</p>
                <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mt-1">
                  {stats.totalDocuments}
                </p>
              </div>
              <FileText className="h-8 w-8 text-primary-500" />
            </div>
          </Link>
          
          <Link href="/documents" className="card p-6 hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Recent Documents</p>
                <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mt-1">
                  {stats.recentDocuments}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-accent-500" />
            </div>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/cases"
              className="btn-secondary btn-md flex items-center justify-center hover-lift"
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              View Cases
            </Link>
            <Link
              href="/documents"
              className="btn-secondary btn-md flex items-center justify-center hover-lift"
            >
              <FileText className="h-4 w-4 mr-2" />
              Manage Documents
            </Link>
            <Link
              href="/chat"
              className="btn-secondary btn-md flex items-center justify-center hover-lift"
            >
              <BarChart className="h-4 w-4 mr-2" />
              Legal Assistant
            </Link>
            <Link
              href="/templates"
              className="btn-secondary btn-md flex items-center justify-center hover-lift"
            >
              <FileText className="h-4 w-4 mr-2" />
              Templates
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

