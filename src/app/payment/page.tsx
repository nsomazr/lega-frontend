'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { ToastContainer, useToast } from '@/components/Toast';
import api from '@/lib/api';
import { 
  CreditCard, 
  Lock, 
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
}

const plans: Record<string, Plan> = {
  free: { id: 'free', name: 'Free', price: 0, period: 'forever' },
  professional: { id: 'professional', name: 'Professional', price: 50000, period: 'month' },
  enterprise: { id: 'enterprise', name: 'Enterprise', price: 100000, period: 'month' },
};

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toasts, success, error: showError, removeToast } = useToast();
  
  const planId = searchParams.get('plan') || 'professional';
  const action = searchParams.get('action');
  const selectedPlan = plans[planId] || plans.professional;
  
  const [loading, setLoading] = useState(false);
  const [paymentType, setPaymentType] = useState<'card' | 'mpesa' | 'tigopesa' | 'airtelmoney' | 'bank'>('card');
  const [paymentMethod, setPaymentMethod] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    phoneNumber: '', // For mobile money
    accountNumber: '', // For bank transfer
    bankName: '', // For bank transfer
  });
  const [billingAddress, setBillingAddress] = useState({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Tanzania',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate based on payment type
      if (paymentType === 'card' && (!paymentMethod.cardNumber || !paymentMethod.expiryDate || !paymentMethod.cvv)) {
        showError('Please fill in all card details');
        setLoading(false);
        return;
      }
      if ((paymentType === 'mpesa' || paymentType === 'tigopesa' || paymentType === 'airtelmoney') && !paymentMethod.phoneNumber) {
        showError('Please enter your phone number');
        setLoading(false);
        return;
      }
      if (paymentType === 'bank' && (!paymentMethod.bankName || !paymentMethod.accountNumber)) {
        showError('Please fill in bank details');
        setLoading(false);
        return;
      }

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (action === 'add-method') {
        success('Payment method added successfully');
      } else {
        if (paymentType === 'mpesa' || paymentType === 'tigopesa' || paymentType === 'airtelmoney') {
          success('Payment request sent. Please complete the transaction on your mobile device.');
        } else if (paymentType === 'bank') {
          success('Bank transfer instructions sent. Please complete the transfer.');
        } else {
          success('Payment processed successfully! Your subscription is now active.');
        }
      }
      
      // Redirect after success
      setTimeout(() => {
        router.push(action === 'add-method' ? '/billing' : '/dashboard');
      }, 1500);
    } catch (error) {
      showError('Payment processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
        {/* Header */}
        <div>
          <button
            onClick={() => router.back()}
            className="btn-ghost btn-sm flex items-center gap-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">
            {action === 'add-method' ? 'Add Payment Method' : 'Complete Payment'}
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">
            {action === 'add-method' 
              ? 'Add a new payment method to your account'
              : `You're subscribing to the ${selectedPlan.name} plan for ${selectedPlan.price === 0 ? 'Free' : selectedPlan.price.toLocaleString('en-US')} ${selectedPlan.price > 0 ? 'TZS' : ''}/${selectedPlan.period}`
            }
          </p>
        </div>

        {/* Order Summary (only for plan selection) */}
        {action !== 'add-method' && (
          <div className="card hover-lift">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-6 px-2">
                Order Summary
              </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-secondary-600 dark:text-secondary-400">Plan</span>
                <span className="font-medium text-secondary-900 dark:text-secondary-100">
                  {selectedPlan.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-secondary-600 dark:text-secondary-400">Billing cycle</span>
                <span className="font-medium text-secondary-900 dark:text-secondary-100">
                  {selectedPlan.period === 'month' ? 'Monthly' : 'One-time'}
                </span>
              </div>
              <div className="h-px bg-secondary-200 dark:bg-secondary-700 my-2"></div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                  Total
                </span>
                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {selectedPlan.price === 0 ? 'Free' : selectedPlan.price.toLocaleString('en-US')} {selectedPlan.price > 0 ? 'TZS' : ''}/{selectedPlan.period}
                </span>
              </div>
            </div>
            </div>
          </div>
        )}

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Method Selection */}
          <div className="card hover-lift">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="h-6 w-6 text-primary-500" />
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 px-2">
                  Payment Method
                </h3>
              </div>

            {/* Payment Type Selection */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-6">
              <button
                type="button"
                onClick={() => setPaymentType('card')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentType === 'card'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-secondary-200 dark:border-secondary-700 hover:border-primary-300'
                }`}
              >
                <CreditCard className="h-6 w-6 mx-auto mb-2 text-primary-500" />
                <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">Card</p>
              </button>
              <button
                type="button"
                onClick={() => setPaymentType('mpesa')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentType === 'mpesa'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-secondary-200 dark:border-secondary-700 hover:border-primary-300'
                }`}
              >
                <div className="h-6 w-6 mx-auto mb-2 bg-green-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">M</span>
                </div>
                <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">M-Pesa</p>
              </button>
              <button
                type="button"
                onClick={() => setPaymentType('tigopesa')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentType === 'tigopesa'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-secondary-200 dark:border-secondary-700 hover:border-primary-300'
                }`}
              >
                <div className="h-6 w-6 mx-auto mb-2 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">T</span>
                </div>
                <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">Tigo Pesa</p>
              </button>
              <button
                type="button"
                onClick={() => setPaymentType('airtelmoney')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentType === 'airtelmoney'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-secondary-200 dark:border-secondary-700 hover:border-primary-300'
                }`}
              >
                <div className="h-6 w-6 mx-auto mb-2 bg-red-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">A</span>
                </div>
                <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">Airtel Money</p>
              </button>
              <button
                type="button"
                onClick={() => setPaymentType('bank')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentType === 'bank'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-secondary-200 dark:border-secondary-700 hover:border-primary-300'
                }`}
              >
                <CreditCard className="h-6 w-6 mx-auto mb-2 text-primary-500" />
                <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">Bank Transfer</p>
              </button>
            </div>

            {/* Payment Details Based on Type */}
            <div className="space-y-5">
              {paymentType === 'card' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required={paymentType === 'card'}
                        maxLength={19}
                        placeholder="1234 5678 9012 3456"
                        className="input pl-12"
                        value={paymentMethod.cardNumber}
                        onChange={(e) =>
                          setPaymentMethod({
                            ...paymentMethod,
                            cardNumber: formatCardNumber(e.target.value),
                          })
                        }
                      />
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        required={paymentType === 'card'}
                        maxLength={5}
                        placeholder="MM/YY"
                        className="input"
                        value={paymentMethod.expiryDate}
                        onChange={(e) =>
                          setPaymentMethod({
                            ...paymentMethod,
                            expiryDate: formatExpiry(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        required={paymentType === 'card'}
                        maxLength={4}
                        placeholder="123"
                        className="input"
                        value={paymentMethod.cvv}
                        onChange={(e) =>
                          setPaymentMethod({
                            ...paymentMethod,
                            cvv: e.target.value.replace(/\D/g, ''),
                          })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      required={paymentType === 'card'}
                      placeholder="John Doe"
                      className="input"
                      value={paymentMethod.cardholderName}
                      onChange={(e) =>
                        setPaymentMethod({
                          ...paymentMethod,
                          cardholderName: e.target.value,
                        })
                      }
                    />
                  </div>
                </>
              )}

              {(paymentType === 'mpesa' || paymentType === 'tigopesa' || paymentType === 'airtelmoney') && (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+255 712 345 678"
                    className="input"
                    value={paymentMethod.phoneNumber}
                    onChange={(e) =>
                      setPaymentMethod({
                        ...paymentMethod,
                        phoneNumber: e.target.value,
                      })
                    }
                  />
                  <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                    Enter your {paymentType === 'mpesa' ? 'M-Pesa' : paymentType === 'tigopesa' ? 'Tigo Pesa' : 'Airtel Money'} registered phone number
                  </p>
                </div>
              )}

              {paymentType === 'bank' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Bank Name
                    </label>
                    <select
                      required
                      className="input"
                      value={paymentMethod.bankName}
                      onChange={(e) =>
                        setPaymentMethod({
                          ...paymentMethod,
                          bankName: e.target.value,
                        })
                      }
                    >
                      <option value="">Select Bank</option>
                      <option value="CRDB Bank">CRDB Bank</option>
                      <option value="NMB Bank">NMB Bank</option>
                      <option value="Standard Chartered">Standard Chartered</option>
                      <option value="Barclays Bank">Barclays Bank</option>
                      <option value="Exim Bank">Exim Bank</option>
                      <option value="Bank of Africa">Bank of Africa</option>
                      <option value="Equity Bank">Equity Bank</option>
                      <option value="Azania Bank">Azania Bank</option>
                      <option value="Diamond Trust Bank">Diamond Trust Bank</option>
                      <option value="I&M Bank">I&M Bank</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Account Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter account number"
                      className="input"
                      value={paymentMethod.accountNumber}
                      onChange={(e) =>
                        setPaymentMethod({
                          ...paymentMethod,
                          accountNumber: e.target.value,
                        })
                      }
                    />
                  </div>
                </>
              )}
            </div>
            </div>
          </div>

          {/* Billing Address */}
          <div className="card hover-lift">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-6 px-2">
                Billing Address
              </h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Street Address
                </label>
                <input
                  type="text"
                  required
                  placeholder="123 Main Street"
                  className="input"
                  value={billingAddress.address}
                  onChange={(e) =>
                    setBillingAddress({ ...billingAddress, address: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Dar es Salaam"
                      className="input"
                      value={billingAddress.city}
                      onChange={(e) =>
                        setBillingAddress({ ...billingAddress, city: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Region
                    </label>
                    <select
                      required
                      className="input"
                      value={billingAddress.state}
                      onChange={(e) =>
                        setBillingAddress({ ...billingAddress, state: e.target.value })
                      }
                    >
                      <option value="">Select Region</option>
                      <option value="Dar es Salaam">Dar es Salaam</option>
                      <option value="Arusha">Arusha</option>
                      <option value="Dodoma">Dodoma</option>
                      <option value="Mwanza">Mwanza</option>
                      <option value="Tanga">Tanga</option>
                      <option value="Morogoro">Morogoro</option>
                      <option value="Mbeya">Mbeya</option>
                      <option value="Zanzibar">Zanzibar</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="11101"
                      className="input"
                      value={billingAddress.zipCode}
                      onChange={(e) =>
                        setBillingAddress({ ...billingAddress, zipCode: e.target.value })
                      }
                    />
                  </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Country
                  </label>
                  <select
                    required
                    className="input"
                    value={billingAddress.country}
                    onChange={(e) =>
                      setBillingAddress({ ...billingAddress, country: e.target.value })
                    }
                  >
                    <option>Tanzania</option>
                    <option>Kenya</option>
                    <option>Uganda</option>
                    <option>Rwanda</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-3 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
            <Lock className="h-5 w-5 text-primary-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-secondary-700 dark:text-secondary-300">
              <p className="font-medium mb-1">Secure Payment</p>
              <p>Your payment information is encrypted and secure. We never store your full card details.</p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary btn-md"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary btn-md flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  {action === 'add-method' ? 'Add Payment Method' : `Pay ${selectedPlan.price === 0 ? 'Free' : selectedPlan.price.toLocaleString('en-US') + ' TZS'}`}
                  <Lock className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </DashboardLayout>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-primary-200 rounded-full animate-spin"></div>
              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-primary-500 rounded-full animate-spin"></div>
            </div>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">Loading payment...</p>
          </div>
        </div>
      </DashboardLayout>
    }>
      <PaymentContent />
    </Suspense>
  );
}
