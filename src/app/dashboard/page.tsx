'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { 
  FolderOpen, 
  FileText, 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  Plus,
  Activity,
  Calendar,
  BarChart3,
  Zap
} from 'lucide-react';

interface DashboardStats {
  totalCases: number;
  totalDocuments: number;
  activeCases: number;
  recentActivity: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCases: 0,
    totalDocuments: 0,
    activeCases: 0,
    recentActivity: 0,
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [navigating, setNavigating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch cases and documents to calculate stats
        const [casesResponse, documentsResponse] = await Promise.all([
          api.get('/api/cases'),
          api.get('/api/documents'),
        ]);

        const cases = casesResponse.data;
        const documents = documentsResponse.data;

        setStats({
          totalCases: cases.length,
          totalDocuments: documents.length,
          activeCases: cases.filter((case_: any) => case_.status === 'open').length,
          recentActivity: cases.filter((case_: any) => {
            const createdAt = new Date(case_.created_at);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return createdAt > weekAgo;
          }).length,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await api.get('/api/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const smoothNavigate = (href: string) => {
    setNavigating(true);
    // brief delay to render fade overlay
    setTimeout(() => router.push(href), 60);
  };

  const getStatCards = () => {
    if (user?.role === 'client') {
      return [
        {
          name: 'My Cases',
          value: stats.totalCases,
          icon: FolderOpen,
          color: 'text-primary-600',
          bgColor: 'bg-primary-100 dark:bg-primary-900/20',
          borderColor: 'border-primary-200 dark:border-primary-800',
          href: '/cases',
          trend: undefined,
          trendUp: true,
        },
        {
          name: 'Active Cases',
          value: stats.activeCases,
          icon: TrendingUp,
          color: 'text-warning-600',
          bgColor: 'bg-warning-100 dark:bg-warning-900/20',
          borderColor: 'border-warning-200 dark:border-warning-800',
          href: '/cases?filter=open',
          trend: undefined,
          trendUp: true,
        },
        {
          name: 'Recent Updates',
          value: stats.recentActivity,
          icon: Activity,
          color: 'text-accent-600',
          bgColor: 'bg-accent-100 dark:bg-accent-900/20',
          borderColor: 'border-accent-200 dark:border-accent-800',
          href: '/cases?sort=recent',
          trend: undefined,
          trendUp: true,
        },
      ];
    }
    return [
      {
        name: 'Total Cases',
        value: stats.totalCases,
        icon: FolderOpen,
        color: 'text-primary-600',
        bgColor: 'bg-primary-100 dark:bg-primary-900/20',
        borderColor: 'border-primary-200 dark:border-primary-800',
        href: '/cases',
        trend: '+12%',
        trendUp: true,
      },
      {
        name: 'Documents',
        value: stats.totalDocuments,
        icon: FileText,
        color: 'text-success-600',
        bgColor: 'bg-success-100 dark:bg-success-900/20',
        borderColor: 'border-success-200 dark:border-success-800',
        href: '/documents',
        trend: '+8%',
        trendUp: true,
      },
      {
        name: 'Active Cases',
        value: stats.activeCases,
        icon: TrendingUp,
        color: 'text-warning-600',
        bgColor: 'bg-warning-100 dark:bg-warning-900/20',
        borderColor: 'border-warning-200 dark:border-warning-800',
        href: '/cases?filter=open',
        trend: '+5%',
        trendUp: true,
      },
      {
        name: 'Recent Activity',
        value: stats.recentActivity,
        icon: Activity,
        color: 'text-accent-600',
        bgColor: 'bg-accent-100 dark:bg-accent-900/20',
        borderColor: 'border-accent-200 dark:border-accent-800',
        href: '/cases?sort=recent',
        trend: '+15%',
        trendUp: true,
      },
    ];
  };

  const statCards = getStatCards();

  const getQuickActions = () => {
    if (user?.role === 'client') {
      return [
        {
          name: 'My Cases',
          description: 'View your legal cases',
          icon: FolderOpen,
          href: '/cases',
          color: 'text-primary-600',
          bgColor: 'bg-primary-50 dark:bg-primary-900/10',
        },
        {
          name: 'Legal Assistant',
          description: 'Get legal guidance & find lawyers',
          icon: MessageSquare,
          href: '/chat',
          color: 'text-accent-600',
          bgColor: 'bg-accent-50 dark:bg-accent-900/10',
        },
      ];
    }
    return [
      {
        name: 'New Case',
        description: 'Create a new legal case',
        icon: Plus,
        href: '/cases',
        color: 'text-primary-600',
        bgColor: 'bg-primary-50 dark:bg-primary-900/10',
      },
      {
        name: 'Upload Document',
        description: 'Add documents for analysis',
        icon: FileText,
        href: '/documents',
        color: 'text-success-600',
        bgColor: 'bg-success-50 dark:bg-success-900/10',
      },
      {
        name: 'Assistant',
        description: 'Get legal guidance',
        icon: MessageSquare,
        href: '/chat',
        color: 'text-accent-600',
        bgColor: 'bg-accent-50 dark:bg-accent-900/10',
      },
      {
        name: 'Analytics',
        description: 'View practice insights',
        icon: BarChart3,
        href: '/analytics',
        color: 'text-warning-600',
        bgColor: 'bg-warning-50 dark:bg-warning-900/10',
      },
    ];
  };

  const quickActions = getQuickActions();

  const getRecentActivities = () => {
    if (user?.role === 'client') {
      return [
        {
          id: 1,
          type: 'case',
          title: 'Welcome to Lega!',
          description: 'View your cases and connect with lawyers.',
          time: 'Just now',
          icon: FolderOpen,
          color: 'text-primary-500',
        },
        {
          id: 2,
          type: 'chat',
          title: 'Legal Assistant Ready',
          description: 'Get legal guidance from our assistant.',
          time: '2 minutes ago',
          icon: MessageSquare,
          color: 'text-accent-500',
        },
        {
          id: 3,
          type: 'lawyer',
          title: 'Find a Lawyer',
          description: 'Browse our lawyer directory to connect with legal professionals.',
          time: '5 minutes ago',
          icon: Users,
          color: 'text-primary-500',
        },
      ];
    }
    return [
    {
      id: 1,
      type: 'case',
      title: 'Welcome to Lega!',
      description: 'Start by creating your first case to get organized.',
      time: 'Just now',
      icon: FolderOpen,
      color: 'text-primary-500',
    },
    {
      id: 2,
      type: 'document',
      title: 'Document Upload',
      description: 'Upload documents to get started with analysis.',
      time: '2 minutes ago',
      icon: FileText,
      color: 'text-success-500',
    },
    {
      id: 3,
      type: 'chat',
      title: 'Assistant Ready',
      description: 'Try the chat assistant for legal guidance.',
      time: '5 minutes ago',
      icon: MessageSquare,
      color: 'text-accent-500',
    },
    ];
  };

  const recentActivities = getRecentActivities();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-primary-200 rounded-full animate-spin"></div>
              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-primary-500 rounded-full animate-spin"></div>
            </div>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">Dashboard</h1>
              <p className="text-secondary-600 dark:text-secondary-400 mt-1">
                {user?.role === 'client' 
                  ? `Welcome back, ${user.full_name || user.email?.split('@')[0] || 'there'}! Here's an overview of your cases.`
                  : "Welcome back! Here's what's happening with your legal practice."
                }
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-sm text-secondary-600 dark:text-secondary-400">
                <Calendar className="h-4 w-4" />
                <span>{new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => (
            <Link
              key={stat.name}
              href={stat.href}
              className="group block"
              onClick={(e)=>{ e.preventDefault(); smoothNavigate(stat.href); }}
            >
              <div className="card hover-lift p-6 border-l-4 border-l-primary-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">{stat.name}</p>
                      <p className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">{stat.value}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    {stat.trend && (
                      <div className={`flex items-center space-x-1 text-xs font-medium ${
                        stat.trendUp ? 'text-success-600' : 'text-error-600'
                      }`}>
                        <TrendingUp className="h-3 w-3" />
                        <span>{stat.trend}</span>
                      </div>
                    )}
                    <ArrowRight className="h-4 w-4 text-secondary-600 dark:text-secondary-400 group-hover:text-primary-500 transition-colors" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">Quick Actions</h3>
                <Zap className="h-5 w-5 text-primary-500" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quickActions.map((action) => (
                  <Link
                    key={action.name}
                    href={action.href}
                    className="group block"
                    onClick={(e)=>{ e.preventDefault(); smoothNavigate(action.href); }}
                  >
                    <div className={`p-4 rounded-xl ${action.bgColor} hover:shadow-md transition-all duration-200 group-hover:scale-105`}>
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg bg-white dark:bg-secondary-800`}>
                          <action.icon className={`h-5 w-5 ${action.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-secondary-900 dark:text-secondary-100 group-hover:text-primary-600 transition-colors">
                            {action.name}
                          </h4>
                          <p className="text-xs text-secondary-600 dark:text-secondary-400 truncate">
                            {action.description}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-secondary-600 dark:text-secondary-400 group-hover:text-primary-500 transition-colors" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">Recent Activity</h3>
                <Activity className="h-5 w-5 text-primary-500" />
              </div>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700/50 transition-colors duration-200">
                    <div className={`p-2 rounded-lg bg-accent/10`}>
                      <activity.icon className={`h-4 w-4 ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-secondary-900 dark:text-secondary-100">{activity.title}</h4>
                      <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">{activity.description}</p>
                      <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                <Link
                  href="/activity"
                  className="flex items-center justify-center w-full py-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                >
                  View all activity
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Soft page transition overlay */}
      {navigating && (
        <div className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm animate-fade-in">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
