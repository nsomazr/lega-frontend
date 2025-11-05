'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { ToastContainer, useToast } from '@/components/Toast';
import api from '@/lib/api';
import { Users, FolderOpen, FileText, TrendingUp, Phone, MessageSquare, Mail } from 'lucide-react';
import Link from 'next/link';
import { isLawyerOrAdmin } from '@/lib/roleCheck';

interface Client {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
}

interface Portfolio {
  lawyer: {
    id: number;
    full_name: string;
    email: string;
  };
  clients: Client[];
  total_clients: number;
  total_cases: number;
  active_cases: number;
  closed_cases: number;
}

export default function LawyerPortfolioPage() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const { toasts, error: showError, removeToast } = useToast();

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchPortfolio();
    }
  }, [currentUser]);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/api/auth/me');
      setCurrentUser(response.data);
      if (!isLawyerOrAdmin(response.data.role)) {
        window.location.href = '/dashboard';
      }
    } catch (error) {
      showError('Failed to fetch user information');
    }
  };

  const fetchPortfolio = async () => {
    if (!currentUser) return;
    
    try {
      const lawyerId = currentUser.id;
      const response = await api.get(`/api/lawyers/${lawyerId}/portfolio`);
      setPortfolio(response.data);
    } catch (error: any) {
      showError('Failed to fetch portfolio');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleEmail = (email: string) => {
    window.location.href = `mailto:${email}`;
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

  if (!portfolio) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-secondary-600 dark:text-secondary-400">No portfolio data available</p>
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
          <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900 dark:text-secondary-100">My Portfolio</h1>
          <p className="text-sm sm:text-base text-secondary-600 dark:text-secondary-400 mt-1">
            Manage your clients and cases
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Total Clients</p>
                <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mt-1">
                  {portfolio.total_clients}
                </p>
              </div>
              <Users className="h-8 w-8 text-primary-500" />
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Total Cases</p>
                <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mt-1">
                  {portfolio.total_cases}
                </p>
              </div>
              <FolderOpen className="h-8 w-8 text-primary-500" />
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Active Cases</p>
                <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">
                  {portfolio.active_cases}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-success-500" />
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Closed Cases</p>
                <p className="text-2xl font-bold text-secondary-600 dark:text-secondary-400 mt-1">
                  {portfolio.closed_cases}
                </p>
              </div>
              <FileText className="h-8 w-8 text-secondary-500" />
            </div>
          </div>
        </div>

        {/* Clients List */}
        <div className="card">
          <div className="p-4 sm:p-6 border-b border-secondary-200 dark:border-secondary-700">
            <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">My Clients</h2>
          </div>
          <div className="p-4 sm:p-6">
            {portfolio.clients.length === 0 ? (
              <div className="text-center py-12 text-secondary-600 dark:text-secondary-400">
                No clients assigned yet
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {portfolio.clients.map((client) => (
                  <div key={client.id} className="card p-4 hover-lift">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-secondary-900 dark:text-secondary-100">
                          {client.full_name}
                        </h3>
                        <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                          {client.email}
                        </p>
                      </div>
                    </div>
                    {client.phone && (
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => handleWhatsApp(client.phone!)}
                          className="btn-ghost btn-sm flex items-center"
                          title="WhatsApp"
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          WhatsApp
                        </button>
                        <button
                          onClick={() => handleCall(client.phone!)}
                          className="btn-ghost btn-sm flex items-center"
                          title="Call"
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          Call
                        </button>
                        <button
                          onClick={() => handleEmail(client.email)}
                          className="btn-ghost btn-sm flex items-center"
                          title="Email"
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          Email
                        </button>
                      </div>
                    )}
                    <div className="mt-3">
                      <Link
                        href={`/cases?client=${client.id}`}
                        className="btn-secondary btn-sm w-full"
                      >
                        View Cases
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

