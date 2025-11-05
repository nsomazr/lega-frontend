'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { ToastContainer, useToast } from '@/components/Toast';
import api from '@/lib/api';
import { 
  Check, 
  Zap, 
  ArrowRight,
  Crown,
  Users,
  FileText,
  MessageSquare,
  BarChart3,
  Shield,
  Lock,
  Globe
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  currency: string;
  features: string[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    currency: 'TZS',
    features: [
      'Up to 10 cases',
      'Up to 50 documents',
      'Basic chat assistant',
      'Standard templates',
      'Email support',
      '5GB storage',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 50000,
    period: 'month',
    currency: 'TZS',
    popular: true,
    features: [
      'Unlimited cases',
      'Unlimited documents',
      'Advanced chat assistant',
      'All templates',
      'Priority support',
      '100GB storage',
      'Advanced analytics',
      'Team collaboration',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 100000,
    period: 'month',
    currency: 'TZS',
    features: [
      'Everything in Professional',
      'Unlimited storage',
      'Dedicated account manager',
      'Custom integrations',
      'White-label options',
      'Advanced security',
      'API access',
      'SLA guarantee',
    ],
  },
];

export default function PlansPage() {
  const router = useRouter();
  const { toasts, success, error: showError, removeToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentPlan();
  }, []);

  const fetchCurrentPlan = async () => {
    try {
      // TODO: Fetch current plan from API
      // const response = await api.get('/api/billing/current-plan');
      // setCurrentPlan(response.data.plan);
    } catch (error) {
      console.error('Error fetching current plan:', error);
    }
  };

  const handleSelectPlan = (planId: string) => {
    router.push(`/payment?plan=${planId}`);
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free':
        return <FileText className="h-6 w-6" />;
      case 'professional':
        return <Zap className="h-6 w-6" />;
      case 'enterprise':
        return <Crown className="h-6 w-6" />;
      default:
        return <FileText className="h-6 w-6" />;
    }
  };

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return 'Free';
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <DashboardLayout>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
            Choose Your Plan
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            Select the perfect plan for your legal practice needs
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative card hover-lift p-6 ${
                plan.popular
                  ? 'ring-2 ring-primary-500 dark:ring-primary-400 shadow-lg'
                  : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="px-4 py-1 bg-primary-600 text-white text-xs font-semibold rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <div className={`inline-flex p-4 rounded-xl mb-4 ${
                  plan.id === 'free' ? 'bg-secondary-100 dark:bg-secondary-800' :
                  plan.id === 'professional' ? 'bg-primary-100 dark:bg-primary-900/30' :
                  'bg-warning-100 dark:bg-warning-900/30'
                }`}>
                  <div className={`${
                    plan.id === 'free' ? 'text-secondary-600 dark:text-secondary-400' :
                    plan.id === 'professional' ? 'text-primary-600 dark:text-primary-400' :
                    'text-warning-600 dark:text-warning-400'
                  }`}>
                    {getPlanIcon(plan.id)}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">
                    {formatPrice(plan.price, plan.currency)}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-sm text-secondary-600 dark:text-secondary-400 ml-1">
                      /{plan.period}
                    </span>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-success-600 dark:text-success-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-secondary-700 dark:text-secondary-300">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={loading || currentPlan === plan.id}
                className={`w-full btn-md flex items-center justify-center gap-2 ${
                  plan.popular
                    ? 'btn-primary'
                    : 'btn-secondary'
                } ${
                  currentPlan === plan.id ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {currentPlan === plan.id ? (
                  <>
                    <Check className="h-4 w-4" />
                    Current Plan
                  </>
                ) : (
                  <>
                    {plan.id === 'free' ? 'Get Started' : 'Select Plan'}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center text-sm text-secondary-600 dark:text-secondary-400">
          <p>All plans include our core features. Upgrade anytime to unlock more capabilities.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

