'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900 text-secondary-900 dark:text-secondary-100 p-4">
      <div className="text-center space-y-4 p-8">
        <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
          Something went wrong!
        </h2>
        <p className="text-secondary-600 dark:text-secondary-400">
          {error.message || 'An unexpected error occurred'}
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="btn-primary btn-md"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="btn-secondary btn-md"
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}

