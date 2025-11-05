'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { ToastContainer, useToast } from '@/components/Toast';
import api from '@/lib/api';
import { LawyerRecommendation } from '@/components/LawyerRecommendation';
import { Search, MapPin, Briefcase, Phone, MessageSquare, Mail, Star } from 'lucide-react';
import { isClient } from '@/lib/roleCheck';

interface Lawyer {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  specialization?: string;
  whatsapp_number?: string;
}

export default function ClientLawyersPage() {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const { toasts, error: showError, removeToast } = useToast();

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchLawyers();
    }
  }, [currentUser, locationFilter, specializationFilter]);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/api/auth/me');
      setCurrentUser(response.data);
      if (!isClient(response.data?.role)) {
        window.location.href = '/dashboard';
      }
      // Set location filter from user's location
      if (response.data?.location) {
        setLocationFilter(response.data.location);
      }
    } catch (error) {
      showError('Failed to fetch user information');
    }
  };

  const fetchLawyers = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const params: any = {};
      if (locationFilter) params.location = locationFilter;
      if (specializationFilter) params.specialization = specializationFilter;
      
      const response = await api.get('/api/lawyers/recommend', { params });
      setLawyers(response.data || []);
    } catch (error: any) {
      showError('Failed to fetch lawyers');
      setLawyers([]);
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

  const filteredLawyers = lawyers.filter(lawyer => {
    const matchesSearch = !searchTerm || 
      lawyer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lawyer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lawyer.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

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
          <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900 dark:text-secondary-100">
            Lawyers Portal
          </h1>
          <p className="text-sm sm:text-base text-secondary-600 dark:text-secondary-400 mt-1">
            Find and connect with qualified lawyers near you
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
                  placeholder="Search by name, email, or specialization..."
                  className="input pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <input
                type="text"
                placeholder="Location"
                className="input"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <input
                type="text"
                placeholder="Specialization"
                className="input"
                value={specializationFilter}
                onChange={(e) => setSpecializationFilter(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Lawyer Recommendations Component */}
        {currentUser && (
          <LawyerRecommendation 
            location={locationFilter || currentUser.location}
            specialization={specializationFilter}
          />
        )}

        {/* Lawyers List */}
        <div className="card">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
              Available Lawyers ({filteredLawyers.length})
            </h2>
            
            {filteredLawyers.length === 0 ? (
              <div className="text-center py-12 text-secondary-600 dark:text-secondary-400">
                <Briefcase className="h-12 w-12 mx-auto mb-4 text-secondary-400" />
                <p>No lawyers found matching your criteria.</p>
                <p className="text-sm mt-2">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLawyers.map((lawyer) => (
                  <div
                    key={lawyer.id}
                    className="border border-secondary-200 dark:border-secondary-700 rounded-lg p-6 hover-lift hover-glow transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
                          {lawyer.full_name}
                        </h3>
                        <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-3">
                          {lawyer.email}
                        </p>
                        {lawyer.location && (
                          <div className="flex items-center text-sm text-secondary-600 dark:text-secondary-400 mb-2">
                            <MapPin className="h-4 w-4 mr-1" />
                            {lawyer.location}
                          </div>
                        )}
                        {lawyer.specialization && (
                          <div className="flex items-center text-sm text-secondary-600 dark:text-secondary-400">
                            <Star className="h-4 w-4 mr-1" />
                            {lawyer.specialization}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                      {lawyer.whatsapp_number && (
                        <button
                          onClick={() => handleWhatsApp(lawyer.whatsapp_number!)}
                          className="btn-secondary btn-sm flex items-center flex-1 min-w-[100px]"
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          WhatsApp
                        </button>
                      )}
                      {lawyer.phone && (
                        <button
                          onClick={() => handleCall(lawyer.phone!)}
                          className="btn-secondary btn-sm flex items-center flex-1 min-w-[100px]"
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          Call
                        </button>
                      )}
                      <button
                        onClick={() => handleEmail(lawyer.email)}
                        className="btn-secondary btn-sm flex items-center flex-1 min-w-[100px]"
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        Email
                      </button>
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

