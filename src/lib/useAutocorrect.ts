'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to get the user's autocorrection preference
 * Checks localStorage first, then fetches from API if needed
 */
export function useAutocorrect(): boolean {
  const [enabled, setEnabled] = useState<boolean>(false);

  useEffect(() => {
    // Check localStorage first (fast)
    const stored = localStorage.getItem('enable_autocorrect');
    if (stored !== null) {
      setEnabled(stored === 'true');
    } else {
      // Fetch from API if not in localStorage
      const fetchPreference = async () => {
        try {
          const token = localStorage.getItem('access_token');
          if (!token) return;
          
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const user = await response.json();
            const autocorrectEnabled = user.enable_autocorrect ?? false;
            setEnabled(autocorrectEnabled);
            localStorage.setItem('enable_autocorrect', String(autocorrectEnabled));
          }
        } catch (error) {
          console.error('Error fetching autocorrection preference:', error);
        }
      };
      
      fetchPreference();
    }
  }, []);

  return enabled;
}
