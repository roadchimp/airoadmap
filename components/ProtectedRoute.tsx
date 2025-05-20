'use client'

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/UseAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only redirect after checking auth status (not while loading)
    if (!isLoading && !isAuthenticated) {
      // Redirect to login with returnUrl to come back after login
      router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-red-600 border-r-gray-200 border-b-gray-200 border-l-gray-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children until auth is confirmed
  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  // User is authenticated, render the children
  return <>{children}</>;
};

export default ProtectedRoute;

// Usage in Next.js:
// In app/(app)/layout.tsx:
/*
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="app-layout">
        <Sidebar />
        <main>{children}</main>
      </div>
    </ProtectedRoute>
  );
}
*/
