'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900 text-secondary-900 dark:text-secondary-100 p-4">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-6xl font-bold text-primary-600 dark:text-primary-400">404</h1>
        <h2 className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">
          Page Not Found
        </h2>
        <p className="text-secondary-600 dark:text-secondary-400 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.back()}
            className="btn-secondary btn-md"
          >
            Go Back
          </button>
          <Link
            href="/dashboard"
            className="btn-primary btn-md"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

