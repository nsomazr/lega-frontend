'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const themes = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ] as const;

  return (
    <div className="flex items-center space-x-1 bg-secondary-100 dark:bg-secondary-800 rounded-lg p-1">
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value as any)}
          className={
            mounted
              ? `relative flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200 ${
                  theme === value
                    ? 'bg-white dark:bg-secondary-700 shadow-sm text-primary-600 dark:text-primary-400'
                    : 'text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200'
                }`
              : 'relative flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200 text-secondary-500'
          }
          title={`Switch to ${label} theme`}
          aria-label={`Switch to ${label} theme`}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}

