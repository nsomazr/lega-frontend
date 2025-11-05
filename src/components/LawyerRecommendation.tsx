'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Phone, MessageSquare, Mail, MapPin, Briefcase, Star } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface Lawyer {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  specialization?: string;
  whatsapp_number?: string;
}

interface LawyerRecommendationProps {
  location?: string;
  specialization?: string;
  onSelect?: (lawyer: Lawyer) => void;
}

export function LawyerRecommendation({ location, specialization, onSelect }: LawyerRecommendationProps) {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(false);
  const { error: showError } = useToast();

  useEffect(() => {
    if (location || specialization) {
      fetchRecommendations();
    }
  }, [location, specialization]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (location) params.location = location;
      if (specialization) params.specialization = specialization;
      
      const response = await api.get('/api/lawyers/recommend', { params });
      setLawyers(response.data);
    } catch (error: any) {
      showError('Failed to fetch lawyer recommendations');
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
      <div className="card p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  if (lawyers.length === 0) {
    return null;
  }

  return (
    <div className="card p-6">
      <div className="flex items-center mb-4">
        <Briefcase className="h-5 w-5 text-primary-500 mr-2" />
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
          Recommended Lawyers
        </h3>
      </div>
      <div className="space-y-4">
        {lawyers.map((lawyer) => (
          <div key={lawyer.id} className="border border-secondary-200 dark:border-secondary-700 rounded-lg p-4 hover-lift">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-secondary-900 dark:text-secondary-100">
                  {lawyer.full_name}
                </h4>
                {lawyer.location && (
                  <div className="flex items-center text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    {lawyer.location}
                  </div>
                )}
                {lawyer.specialization && (
                  <div className="flex items-center text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                    <Star className="h-3 w-3 mr-1" />
                    {lawyer.specialization}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
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
              {onSelect && (
                <button
                  onClick={() => onSelect(lawyer)}
                  className="btn-primary btn-sm"
                >
                  Select
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

