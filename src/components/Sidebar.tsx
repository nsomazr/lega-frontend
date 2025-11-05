'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  MessageSquare,
  FileType,
  Settings,
  Users,
  Scale,
  ChevronRight,
  Activity,
} from 'lucide-react';

interface User {
  id: number;
  email: string;
  username: string | null;
  full_name: string | null;
  phone?: string | null;
  role: string;
  is_active: boolean;
}

interface SidebarProps {
  user: User;
  collapsed?: boolean;
}

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: LayoutDashboard,
    description: 'Overview and analytics'
  },
  { 
    name: 'Cases', 
    href: '/cases', 
    icon: FolderOpen,
    description: 'Manage legal cases'
  },
  { 
    name: 'Documents', 
    href: '/documents', 
    icon: FileText,
    description: 'Document management'
  },
  { 
    name: 'Chat', 
    href: '/chat', 
    icon: MessageSquare,
    description: 'Legal assistant'
  },
  { 
    name: 'Templates', 
    href: '/templates', 
    icon: FileType,
    description: 'Document templates'
  },
];

// Client-specific navigation (limited access)
const clientNavigation = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: LayoutDashboard,
    description: 'My cases overview'
  },
  { 
    name: 'My Cases', 
    href: '/cases', 
    icon: FolderOpen,
    description: 'View my cases'
  },
  { 
    name: 'Chat', 
    href: '/chat', 
    icon: MessageSquare,
    description: 'Legal assistant'
  },
  { 
    name: 'Lawyers Portal', 
    href: '/clients/lawyers', 
    icon: Users,
    description: 'Find and connect with lawyers'
  },
];

const lawyerNavigation = [
  { 
    name: 'Portfolio', 
    href: '/lawyers/portfolio', 
    icon: Users,
    description: 'Manage clients and cases'
  },
  { 
    name: 'Staff', 
    href: '/lawyers/staff', 
    icon: Users,
    description: 'Manage staff members'
  },
];

const adminNavigation = [
  { 
    name: 'Users', 
    href: '/admin/users', 
    icon: Users,
    description: 'User management'
  },
  { 
    name: 'Activity', 
    href: '/admin/activity', 
    icon: Activity,
    description: 'Activity logs'
  },
];

// Get user's first letter from full_name, username, or email
function getUserInitial(user: User): string {
  if (user.full_name) {
    return user.full_name.charAt(0).toUpperCase();
  }
  if (user.username) {
    return user.username.charAt(0).toUpperCase();
  }
  if (user.email) {
    return user.email.charAt(0).toUpperCase();
  }
  return 'Z';
}

// Upgrade Button Component
function UpgradeButton({ user, collapsed }: { user: User; collapsed: boolean }) {
  const userInitial = getUserInitial(user);

  return (
    <Link
      href="/plans"
      className={cn(
        'w-full group flex items-center rounded-xl transition-all duration-200 relative overflow-hidden',
        'bg-gradient-to-br from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600',
        'shadow-md hover:shadow-lg shadow-blue-500/20 dark:shadow-purple-500/20',
        'hover:shadow-blue-500/30 dark:hover:shadow-purple-500/30',
        collapsed ? 'justify-center px-3 py-2.5' : 'justify-start px-3 py-2.5'
      )}
      title={collapsed ? 'Upgrade to Pro' : 'Upgrade to Pro'}
    >
      {/* Subtle glowing effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 to-purple-400/30 opacity-50 blur-sm animate-pulse rounded-xl"></div>
      
      {/* Content */}
      <div className="relative flex items-center z-10">
        <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm">
          <span className="text-white font-bold text-lg drop-shadow-md z-10">
            {userInitial}
          </span>
        </div>
        {!collapsed && (
          <span className="ml-2 text-xs text-white/90 font-medium">
            Upgrade to Pro
          </span>
        )}
      </div>
      
      {/* Subtle hover glow effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300 pointer-events-none"></div>
    </Link>
  );
}

export default function Sidebar({ user, collapsed = false }: SidebarProps) {
  const pathname = usePathname();

  let allNavigation = navigation;
  
  if (user.role === 'admin') {
    allNavigation = [...navigation, ...adminNavigation];
  } else if (user.role === 'lawyer') {
    allNavigation = [...navigation, ...lawyerNavigation];
  } else if (user.role === 'client') {
    // Clients get limited navigation - no Templates
    allNavigation = clientNavigation;
  }

  return (
    <div className={`hidden md:flex md:flex-col transition-all duration-300 ease-in-out h-screen sticky top-0 ${
      collapsed ? 'md:w-16' : 'md:w-64'
    }`}>
      <div className="flex flex-col h-full bg-white/50 dark:bg-secondary-800/50 backdrop-blur-sm border-r border-secondary-200 dark:border-secondary-700">
        {/* Logo Section */}
        <div className="flex items-center flex-shrink-0 px-4 py-6">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-lg">
              <Scale className="h-6 w-6 text-white" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-xl font-bold gradient-text">Lega</span>
                <span className="text-xs text-secondary-600 dark:text-secondary-400">Legal Platform</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Navigation - Scrollable */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 mt-2">
          <nav className="space-y-1 pb-4">
            {allNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 relative',
                    isActive
                      ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 shadow-sm'
                      : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100 hover:bg-secondary-100 dark:hover:bg-secondary-700/50',
                    collapsed ? 'justify-center' : ''
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-r-full"></div>
                  )}
                  
                  <item.icon
                    className={cn(
                      'flex-shrink-0 h-5 w-5 transition-colors duration-200',
                      isActive 
                        ? 'text-primary-500' 
                        : 'text-secondary-600 dark:text-secondary-400 group-hover:text-secondary-900 dark:group-hover:text-secondary-100',
                      collapsed ? '' : 'mr-3'
                    )}
                  />
                  
                  {!collapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="truncate">{item.name}</span>
                        {isActive && (
                          <ChevronRight className="h-4 w-4 text-primary-500" />
                        )}
                      </div>
                      <p className="text-xs text-secondary-600 dark:text-secondary-400 truncate">
                        {item.description}
                      </p>
                    </div>
                  )}
                  
                  {/* Hover effect */}
                  {!collapsed && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-500/5 to-accent-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        
        {/* Upgrade to Pro Button - Above Settings */}
        <div className="flex-shrink-0 px-3 pt-2 pb-2 border-t border-secondary-200 dark:border-secondary-700">
          <UpgradeButton user={user} collapsed={collapsed} />
        </div>

        {/* Settings Navigation Item - Fixed at bottom */}
        <div className="flex-shrink-0 px-3 pb-4 pt-2">
          <Link
            href="/settings"
            className={cn(
              'group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 relative',
              pathname === '/settings'
                ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100 hover:bg-secondary-100 dark:hover:bg-secondary-700/50',
              collapsed ? 'justify-center' : ''
            )}
            title={collapsed ? 'Settings' : undefined}
          >
            {/* Active indicator */}
            {pathname === '/settings' && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-r-full"></div>
            )}
            
            <Settings
              className={cn(
                'flex-shrink-0 h-5 w-5 transition-colors duration-200',
                pathname === '/settings' 
                  ? 'text-primary-500' 
                  : 'text-secondary-600 dark:text-secondary-400 group-hover:text-secondary-900 dark:group-hover:text-secondary-100',
                collapsed ? '' : 'mr-3'
              )}
            />
            
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="truncate">Settings</span>
                  {pathname === '/settings' && (
                    <ChevronRight className="h-4 w-4 text-primary-500" />
                  )}
                </div>
                <p className="text-xs text-secondary-600 dark:text-secondary-400 truncate">
                  Account preferences
                </p>
              </div>
            )}
            
            {/* Hover effect */}
            {!collapsed && (
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-500/5 to-accent-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}
