'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { ToastContainer, useToast } from '@/components/Toast';
import api from '@/lib/api';
import { FolderOpen, FileText, Calendar, Users, Bell, Download, Eye, MessageSquare, Phone, Mail } from 'lucide-react';
import Link from 'next/link';
import { isClient } from '@/lib/roleCheck';

interface Case {
  id: number;
  case_number: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Lawyer {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  whatsapp_number?: string;
}

export default function ClientCasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [lawyer, setLawyer] = useState<Lawyer | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const { toasts, error: showError, removeToast } = useToast();

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchLawyer();
      fetchCases();
    }
  }, [currentUser]);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/api/auth/me');
      setCurrentUser(response.data);
      if (!isClient(response.data?.role)) {
        window.location.href = '/dashboard';
      }
    } catch (error) {
      showError('Failed to fetch user information');
    }
  };

  const fetchLawyer = async () => {
    if (!currentUser || !currentUser.id) return;
    
    try {
      const clientId = parseInt(String(currentUser.id), 10);
      if (isNaN(clientId)) {
        console.error('Invalid client ID');
        return;
      }
      const response = await api.get(`/api/clients/${clientId}/lawyer`);
      if (response.data) {
        setLawyer(response.data);
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error fetching lawyer:', error);
      }
    }
  };

  const fetchCases = async () => {
    if (!currentUser) return;
    
    try {
      const response = await api.get('/api/cases');
      // Filter cases where client matches current user
      const clientCases = response.data.filter((c: Case) => 
        c.case_number.toLowerCase().includes(currentUser.email.toLowerCase()) ||
        c.description?.toLowerCase().includes(currentUser.email.toLowerCase())
      );
      setCases(clientCases);
    } catch (error: any) {
      showError('Failed to fetch cases');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = (whatsapp: string) => {
    const cleanPhone = whatsapp.replace(/\D/g, '');
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

  return (
    <DashboardLayout>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900 dark:text-secondary-100">My Cases</h1>
          <p className="text-sm sm:text-base text-secondary-600 dark:text-secondary-400 mt-1">
            View your case updates and progress
          </p>
        </div>

        {/* Lawyer Information Card */}
        {lawyer && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Users className="h-6 w-6 text-primary-500 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                    Your Lawyer
                  </h3>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    {lawyer.full_name} - {lawyer.email}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {lawyer.whatsapp_number && (
                <button
                  onClick={() => handleWhatsApp(lawyer.whatsapp_number!)}
                  className="btn-secondary btn-sm flex items-center"
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  WhatsApp
                </button>
              )}
              {lawyer.phone && (
                <button
                  onClick={() => handleCall(lawyer.phone!)}
                  className="btn-secondary btn-sm flex items-center"
                >
                  <Phone className="h-4 w-4 mr-1" />
                  Call
                </button>
              )}
              <button
                onClick={() => handleEmail(lawyer.email)}
                className="btn-secondary btn-sm flex items-center"
              >
                <Mail className="h-4 w-4 mr-1" />
                Email
              </button>
            </div>
          </div>
        )}

        {/* Cases List */}
        <div className="card">
          <div className="p-4 sm:p-6 border-b border-secondary-200 dark:border-secondary-700">
            <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">Case Updates</h2>
          </div>
          <div className="p-4 sm:p-6">
            {cases.length === 0 ? (
              <div className="text-center py-12 text-secondary-600 dark:text-secondary-400">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 text-secondary-400" />
                <p>No cases assigned yet</p>
                {!lawyer && (
                  <p className="text-sm mt-2">Contact a lawyer to get started</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {cases.map((caseItem) => (
                  <Link
                    key={caseItem.id}
                    href={`/cases/${caseItem.id}`}
                    className="block card p-6 hover-lift"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                            {caseItem.title}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            caseItem.status === 'open' 
                              ? 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400'
                              : caseItem.status === 'closed'
                              ? 'bg-secondary-100 text-secondary-800'
                              : 'bg-warning-100 text-warning-800'
                          }`}>
                            {caseItem.status}
                          </span>
                        </div>
                        <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-2">
                          {caseItem.case_number}
                        </p>
                        {caseItem.description && (
                          <p className="text-sm text-secondary-600 dark:text-secondary-400 line-clamp-2">
                            {caseItem.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-xs text-secondary-500 dark:text-secondary-400">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Updated {new Date(caseItem.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="h-5 w-5 text-secondary-400" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

