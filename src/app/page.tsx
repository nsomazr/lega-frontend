'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import WelcomeGuide from '@/components/WelcomeGuide';
import { 
  Scale, 
  FileText, 
  MessageSquare, 
  FolderOpen, 
  Shield, 
  Zap, 
  Check,
  ArrowRight,
  Users,
  BarChart,
  Lock
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    setToken(storedToken);
  }, []);

  const features = [
    {
      icon: FolderOpen,
      title: 'Track Your Cases',
      description: 'Keep all your legal cases organized in one place. Never miss important dates or deadlines.',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: FileText,
      title: 'Store Your Documents',
      description: 'Safely keep all your legal documents in one secure place. Access them anytime, anywhere.',
      color: 'from-green-500 to-green-600',
    },
    {
      icon: MessageSquare,
      title: 'Get Legal Help',
      description: 'Ask questions and get helpful answers about your legal matters. Find qualified lawyers when you need them.',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: FileText,
      title: 'Create Legal Documents',
      description: 'Generate professional legal documents easily. Contracts, agreements, and more - all made simple.',
      color: 'from-orange-500 to-orange-600',
    },
    {
      icon: BarChart,
      title: 'See Your Progress',
      description: 'Understand what\'s happening with your cases at a glance. Stay informed and in control.',
      color: 'from-pink-500 to-pink-600',
    },
    {
      icon: Shield,
      title: 'Your Data is Safe',
      description: 'We protect your information like banks protect money. Your privacy and security are our top priority.',
      color: 'from-indigo-500 to-indigo-600',
    },
  ];

  const plans = [
    {
      name: 'Free',
      price: '0',
      period: 'forever',
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
      name: 'Professional',
      price: '50,000',
      period: 'month',
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
      name: 'Enterprise',
      price: '100,000',
      period: 'month',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background to-accent-50 dark:from-primary-950 dark:via-background dark:to-accent-950">
      {/* Support assistant - visible on landing page */}
      <WelcomeGuide storageKey="lega_has_seen_welcome_v2" />
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-secondary-900/80 backdrop-blur-md border-b border-secondary-200 dark:border-secondary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-lg">
                <Scale className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">Lega</span>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              {token ? (
                <Link
                  href="/dashboard"
                  className="btn-primary btn-sm"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="btn-ghost btn-sm"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="btn-primary btn-sm"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-6">
            <Zap className="h-4 w-4 mr-2" />
            Your Legal Matters Made Simple
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-secondary-900 dark:text-secondary-100 mb-6 leading-tight">
            Manage Your Legal
            <span className="gradient-text"> Matters Easily</span>
            <br />All in One Place
          </h1>
          <p className="text-xl sm:text-2xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto mb-8">
            Whether you're a lawyer managing cases or someone needing legal help, Lega makes everything simple. 
            Organize your documents, track your cases, and get the support you need.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {!token && (
              <>
                <Link
                  href="/register"
                  className="btn-primary btn-lg group"
                >
                  Start Free Trial
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/plans"
                  className="btn-outline btn-lg"
                >
                  View Pricing
                </Link>
              </>
            )}
            {token && (
              <Link
                href="/dashboard"
                className="btn-primary btn-lg group"
              >
                Go to Dashboard
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-secondary-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-secondary-900 dark:text-secondary-100 mb-4">
              Everything You Need in One Place
            </h2>
            <p className="text-lg text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto">
              Simple tools that make managing your legal matters easy. No complicated setup, just what you need when you need it.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="card p-6 hover-lift hover-glow transition-all duration-300"
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg mb-4`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-secondary-600 dark:text-secondary-400">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-secondary-900 dark:text-secondary-100 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto">
              Choose the plan that fits your practice. All plans include a 14-day free trial.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`card p-8 relative transition-all duration-300 ${
                  plan.popular
                    ? 'ring-2 ring-primary-500 border-2 border-primary-400 dark:border-primary-600 shadow-xl scale-105'
                    : 'hover-lift'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-primary-500 to-accent-500 text-white px-4 py-1 text-xs font-semibold rounded-bl-lg">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
                  {plan.name}
                </h3>
                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-secondary-900 dark:text-secondary-100">
                      {plan.price === '0' ? 'Free' : plan.price}
                    </span>
                    {plan.price !== '0' && (
                      <span className="text-secondary-600 dark:text-secondary-400 ml-2">
                        TZS/{plan.period}
                      </span>
                    )}
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featIndex) => (
                    <li key={featIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-primary-500 flex-shrink-0 mr-3 mt-0.5" />
                      <span className="text-sm text-secondary-700 dark:text-secondary-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/plans"
                  className={`w-full btn-md flex items-center justify-center ${
                    plan.popular ? 'btn-primary' : 'btn-secondary'
                  }`}
                >
                  {plan.price === '0' ? 'Get Started' : 'Select Plan'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Trust Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-secondary-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg mb-6">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-4xl font-bold text-secondary-900 dark:text-secondary-100 mb-4">
                Your Information is Safe With Us
              </h2>
              <p className="text-lg text-secondary-600 dark:text-secondary-400 mb-6">
                We take your privacy seriously. Your documents and information are protected with the same 
                security that banks use. Only you and those you choose can access your data.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-500 flex-shrink-0 mr-3 mt-0.5" />
                  <span className="text-secondary-700 dark:text-secondary-300">
                    Your documents are locked and protected
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-500 flex-shrink-0 mr-3 mt-0.5" />
                  <span className="text-secondary-700 dark:text-secondary-300">
                    Safe login - only you can access your account
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-500 flex-shrink-0 mr-3 mt-0.5" />
                  <span className="text-secondary-700 dark:text-secondary-300">
                    We regularly check and update our security
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-500 flex-shrink-0 mr-3 mt-0.5" />
                  <span className="text-secondary-700 dark:text-secondary-300">
                    You control who sees your information
                  </span>
                </li>
              </ul>
            </div>
            <div className="card p-8">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Users className="h-8 w-8 text-primary-500" />
                  <div>
                    <h3 className="font-semibold text-secondary-900 dark:text-secondary-100">
                      Used by Many People
                    </h3>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                      Lawyers and regular people trust us with their legal matters
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Shield className="h-8 w-8 text-primary-500" />
                  <div>
                    <h3 className="font-semibold text-secondary-900 dark:text-secondary-100">
                      Follows Legal Rules
                    </h3>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                      We meet all legal requirements to keep your information safe
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Zap className="h-8 w-8 text-primary-500" />
                  <div>
                    <h3 className="font-semibold text-secondary-900 dark:text-secondary-100">
                      Always Available
                    </h3>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                      Access your information anytime, anywhere. We're always working.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="card p-12 bg-gradient-to-br from-primary-500 to-accent-500 text-white">
            <h2 className="text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl mb-8 text-white/90">
              Join Lega today and make managing your legal matters easy. It's free to start, no credit card needed.
            </p>
            {!token && (
              <Link
                href="/register"
                className="btn-secondary btn-lg inline-flex items-center group bg-white text-primary-600 hover:bg-secondary-50"
              >
                Get Started Free
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
            {token && (
              <Link
                href="/dashboard"
                className="btn-secondary btn-lg inline-flex items-center group bg-white text-primary-600 hover:bg-secondary-50"
              >
                Go to Dashboard
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-secondary-200 dark:border-secondary-700">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-lg">
                  <Scale className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold gradient-text">Lega</span>
              </div>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                Professional legal practice management platform.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
                Product
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/plans" className="text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/templates" className="text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400">
                    Templates
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
                Company
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/about" className="text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
                Legal
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/privacy" className="text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-secondary-200 dark:border-secondary-700 text-center text-sm text-secondary-600 dark:text-secondary-400">
            © {new Date().getFullYear()} Lega. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
