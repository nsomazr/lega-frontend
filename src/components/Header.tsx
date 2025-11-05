'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Bell, Search, Menu, X, PanelLeft, User, LogOut, Settings, LayoutDashboard, FolderOpen, FileText, MessageSquare, FileType, Users, Activity } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface User {
  id: number;
  email: string;
  username: string | null;
  full_name: string | null;
  role: string;
  is_active: boolean;
}

interface HeaderProps {
  user: User;
  onToggleSidebar?: () => void;
}

export default function Header({ user, onToggleSidebar }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Navigation items based on user role
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Cases', href: '/cases', icon: FolderOpen },
    { name: 'Documents', href: '/documents', icon: FileText },
    { name: 'Chat', href: '/chat', icon: MessageSquare },
    { name: 'Templates', href: '/templates', icon: FileType },
  ];

  const clientNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Cases', href: '/cases', icon: FolderOpen },
    { name: 'Chat', href: '/chat', icon: MessageSquare },
    { name: 'Lawyers Portal', href: '/clients/lawyers', icon: Users },
  ];

  const lawyerNavigation = [
    { name: 'Portfolio', href: '/lawyers/portfolio', icon: Users },
    { name: 'Staff', href: '/lawyers/staff', icon: Users },
  ];

  const adminNavigation = [
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Activity', href: '/admin/activity', icon: Activity },
  ];

  let allNavigation = navigation;
  if (user.role === 'admin') {
    allNavigation = [...navigation, ...adminNavigation];
  } else if (user.role === 'lawyer') {
    allNavigation = [...navigation, ...lawyerNavigation];
  } else if (user.role === 'client') {
    allNavigation = clientNavigation;
  }

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (mobileMenuOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (!target.closest('.mobile-menu-container')) {
          setMobileMenuOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-secondary-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-secondary-700 dark:bg-secondary-800/95 dark:supports-[backdrop-filter]:bg-secondary-800/60">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Mobile menu button and Desktop sidebar toggle */}
          <div className="flex items-center space-x-2">
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={(e) => {
                  setMobileMenuOpen(!mobileMenuOpen);
                  e.currentTarget.blur();
                }}
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
            
            {/* Desktop sidebar toggle */}
            <div className="hidden md:block">
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={(e) => {
                  onToggleSidebar?.();
                  e.currentTarget.blur();
                }}
                aria-label="Toggle sidebar"
              >
                <PanelLeft className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 flex items-center justify-center px-2 lg:ml-6 lg:justify-end">
            <div className="max-w-lg w-full lg:max-w-xs">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className={`h-4 w-4 transition-colors ${
                    searchFocused ? 'text-primary-500' : 'text-muted-foreground'
                  }`} />
                </div>
                <input
                  className={`input pl-10 pr-4 transition-all duration-200 ${
                    searchFocused ? 'ring-2 ring-primary-500 border-primary-500' : ''
                  }`}
                  placeholder="Search cases, documents..."
                  type="search"
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  aria-label="Search"
                />
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications */}
            <button
              type="button"
              className="btn-ghost btn-sm relative"
              aria-label="View notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-error-500 rounded-full animate-pulse-soft"></span>
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                type="button"
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent transition-colors duration-200"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                aria-label="User menu"
              >
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-foreground">{user.full_name || user.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-sm">
                  <span className="text-sm font-semibold text-white">
                    {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              </button>

              {/* Profile Menu Dropdown */}
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-xl shadow-large z-50 animate-fade-in-down">
                  <div className="p-4 border-b border-secondary-200 dark:border-secondary-700">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                        <span className="text-sm font-semibold text-white">
                          {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">{user.full_name || user.email}</p>
                        <p className="text-xs text-secondary-600 dark:text-secondary-400">{user.email}</p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 capitalize">
                          {user.role}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <button
                      className="w-full flex items-center px-3 py-2 text-sm text-secondary-900 dark:text-secondary-100 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg transition-colors duration-200"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        router.push('/settings');
                      }}
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      Settings
                    </button>
                    <button
                      className="w-full flex items-center px-3 py-2 text-sm text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg transition-colors duration-200"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        handleLogout();
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Mobile Menu Drawer */}
          <div className="mobile-menu-container fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-secondary-800 border-r border-secondary-200 dark:border-secondary-700 transform transition-transform duration-300 ease-in-out md:hidden">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-secondary-200 dark:border-secondary-700">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-lg">
                    <span className="text-xl font-bold text-white">L</span>
                  </div>
                  <span className="text-xl font-bold gradient-text">Lega</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto px-3 py-4">
                <div className="space-y-1">
                  {allNavigation.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                          isActive
                            ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                            : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100 hover:bg-secondary-100 dark:hover:bg-secondary-700'
                        }`}
                      >
                        <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </nav>

              {/* Footer */}
              <div className="border-t border-secondary-200 dark:border-secondary-700 p-4 space-y-2">
                <Link
                  href="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                    pathname === '/settings'
                      ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                      : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100 hover:bg-secondary-100 dark:hover:bg-secondary-700'
                  }`}
                >
                  <Settings className="h-5 w-5 mr-3 flex-shrink-0" />
                  <span>Settings</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-xl transition-colors duration-200"
                >
                  <LogOut className="h-5 w-5 mr-3 flex-shrink-0" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
