'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { ToastContainer, useToast } from '@/components/Toast';
import api from '@/lib/api';
import { 
  CreditCard, 
  Calendar, 
  Download, 
  FileText, 
  Plus,
  ArrowRight,
  Receipt,
  History
} from 'lucide-react';

interface BillingInfo {
  plan: string;
  nextBillingDate: string;
  amount: number;
  status: string;
  currency?: string;
}

interface PaymentMethod {
  id: string;
  type: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: string;
  plan: string;
  currency?: string;
}

export default function BillingPage() {
  const router = useRouter();
  const { toasts, success, error: showError, removeToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      // In a real app, these would be API calls
      // For now, using mock data
      setBillingInfo({
        plan: 'Professional',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 50000,
        status: 'active',
        currency: 'TZS',
      });

      setPaymentMethods([
        {
          id: '1',
          type: 'mpesa',
          last4: '6789',
          expiryMonth: 0,
          expiryYear: 0,
          isDefault: true,
        },
        {
          id: '2',
          type: 'card',
          last4: '4242',
          expiryMonth: 12,
          expiryYear: 2025,
          isDefault: false,
        },
      ]);

      setInvoices([
        {
          id: 'INV-001',
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 50000,
          status: 'paid',
          plan: 'Professional',
          currency: 'TZS',
        },
        {
          id: 'INV-002',
          date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 50000,
          status: 'paid',
          plan: 'Professional',
          currency: 'TZS',
        },
      ]);
    } catch (error) {
      showError('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = () => {
    router.push('/payment?action=add-method');
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    // In a real app, this would download the invoice PDF
    success(`Downloading invoice ${invoiceId}...`);
  };

  const handleChangePlan = () => {
    router.push('/plans');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-primary-200 rounded-full animate-spin"></div>
              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-primary-500 rounded-full animate-spin"></div>
            </div>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">Loading billing information...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900 dark:text-secondary-100">Billing</h1>
            <p className="text-sm sm:text-base text-secondary-600 dark:text-secondary-400 mt-1">
              Manage your subscription and payment methods
            </p>
          </div>
          <button
            onClick={handleChangePlan}
            className="btn-secondary btn-md flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            Change Plan
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Current Plan */}
        {billingInfo && (
          <div className="card hover-lift">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2 px-2">
                    Current Plan
                  </h3>
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {billingInfo.plan}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">
                  Next billing date
                </p>
                <p className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                  {new Date(billingInfo.nextBillingDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-secondary-200 dark:border-secondary-700">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Monthly charge</p>
                <p className="text-xl font-bold text-secondary-900 dark:text-secondary-100">
                  {billingInfo.amount.toLocaleString('en-US')} TZS/month
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                billingInfo.status === 'active'
                  ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
                  : 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400'
              }`}>
                {billingInfo.status.charAt(0).toUpperCase() + billingInfo.status.slice(1)}
              </span>
            </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Methods */}
          <div className="card hover-lift">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 px-2">
                  Payment Methods
                </h3>
              <button
                onClick={handleAddPaymentMethod}
                className="btn-secondary btn-sm flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Method
              </button>
            </div>
            <div className="space-y-4">
              {paymentMethods.length > 0 ? (
                paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center justify-between p-4 border border-secondary-200 dark:border-secondary-700 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      {method.type === 'mpesa' ? (
                        <div className="h-8 w-8 bg-green-600 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">M</span>
                        </div>
                      ) : method.type === 'tigopesa' ? (
                        <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">T</span>
                        </div>
                      ) : method.type === 'airtelmoney' ? (
                        <div className="h-8 w-8 bg-red-600 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">A</span>
                        </div>
                      ) : method.type === 'bank' ? (
                        <CreditCard className="h-8 w-8 text-primary-500" />
                      ) : (
                        <CreditCard className="h-8 w-8 text-primary-500" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-secondary-900 dark:text-secondary-100">
                            {method.type === 'mpesa' ? 'M-Pesa' : 
                             method.type === 'tigopesa' ? 'Tigo Pesa' :
                             method.type === 'airtelmoney' ? 'Airtel Money' :
                             method.type === 'bank' ? 'Bank Transfer' :
                             method.type.charAt(0).toUpperCase() + method.type.slice(1)} {method.last4 && `•••• ${method.last4}`}
                          </p>
                          {method.isDefault && (
                            <span className="px-2 py-0.5 text-xs bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 rounded">
                              Default
                            </span>
                          )}
                        </div>
                        {method.expiryMonth > 0 && method.expiryYear > 0 ? (
                          <p className="text-sm text-secondary-600 dark:text-secondary-400">
                            Expires {method.expiryMonth}/{method.expiryYear}
                          </p>
                        ) : method.type === 'mpesa' || method.type === 'tigopesa' || method.type === 'airtelmoney' ? (
                          <p className="text-sm text-secondary-600 dark:text-secondary-400">
                            Mobile Money
                          </p>
                        ) : (
                          <p className="text-sm text-secondary-600 dark:text-secondary-400">
                            Payment Method
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-secondary-600 dark:text-secondary-400">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No payment methods added</p>
                </div>
              )}
            </div>
            </div>
          </div>

          {/* Billing History */}
          <div className="card hover-lift">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 px-2">
                  Billing History
                </h3>
              <History className="h-5 w-5 text-secondary-400" />
            </div>
            <div className="space-y-4">
              {invoices.length > 0 ? (
                invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 border border-secondary-200 dark:border-secondary-700 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <Receipt className="h-8 w-8 text-primary-500" />
                      <div>
                        <p className="font-medium text-secondary-900 dark:text-secondary-100">
                          {invoice.id}
                        </p>
                        <p className="text-sm text-secondary-600 dark:text-secondary-400">
                          {new Date(invoice.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-secondary-900 dark:text-secondary-100">
                          {invoice.amount.toLocaleString('en-US')} TZS
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          invoice.status === 'paid'
                            ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
                            : 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400'
                        }`}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDownloadInvoice(invoice.id)}
                        className="btn-ghost btn-sm p-2"
                        title="Download invoice"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-secondary-600 dark:text-secondary-400">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No billing history</p>
                </div>
              )}
            </div>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </DashboardLayout>
  );
}
