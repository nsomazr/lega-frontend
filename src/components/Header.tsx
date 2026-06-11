'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Menu, X, PanelLeft, LogOut, Settings, Wifi, WifiOff } from 'lucide-react';
import { useOfflineMode } from '@/lib/OfflineModeContext';

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
  onToggleMobileSidebar?: () => void;
  mobileSidebarOpen?: boolean;
}

export default function Header({ user, onToggleSidebar, onToggleMobileSidebar, mobileSidebarOpen = false }: HeaderProps) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const router = useRouter();
  const { isOnline, setOnlineMode } = useOfflineMode();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    router.push('/auth');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-secondary-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-secondary-700 dark:bg-secondary-800/95 dark:supports-[backdrop-filter]:bg-secondary-800/60">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Mobile menu button and Desktop sidebar toggle */}
          <div className="flex items-center space-x-2">
            {/* Mobile sidebar menu button */}
            <div className="md:hidden">
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={(e) => {
                  onToggleMobileSidebar?.();
                  e.currentTarget.blur();
                }}
                aria-label="Toggle mobile sidebar"
              >
                {mobileSidebarOpen ? (
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

          {/* Right side */}
          <div className="flex items-center space-x-2">
            {/* Offline / Online mode switch - platform is offline first */}
            <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-secondary-100 dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700">
              <span className={`text-xs font-medium hidden sm:inline ${isOnline ? 'text-primary-600 dark:text-primary-400' : 'text-secondary-600 dark:text-secondary-400'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={isOnline}
                aria-label={isOnline ? 'Switch to offline mode' : 'Switch to online mode'}
                onClick={() => setOnlineMode(!isOnline)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  isOnline ? 'bg-primary-500' : 'bg-secondary-400 dark:bg-secondary-600'
                }`}
              >
                <span className="sr-only">{isOnline ? 'Online' : 'Offline'}</span>
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                    isOnline ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={isOnline ? 'text-primary-500 dark:text-primary-400' : 'text-secondary-500 dark:text-secondary-400'} title={isOnline ? 'TanzLii, web search and other online services are available' : 'Using local data only. Switch to Online for TanzLii and web search.'}>
                {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              </span>
            </div>

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
                  <p className="text-xs text-muted-foreground">{user.role === 'enterprise_manager' ? 'Enterprise Manager' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
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
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                          {user.role === 'enterprise_manager' ? 'Enterprise Manager' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
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
    </header>
  );
}
