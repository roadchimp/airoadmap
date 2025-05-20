// `src/app/profile/page.tsx` (Profile Page - Server Component Example)

'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/UseAuth';

interface Report {
  id: string;
  title: string;
  created_at: string;
}

const Profile: React.FC = () => {
  const router = useRouter();
  const { user, logout, organizationId, isAuthenticated, isLoading } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect to login if not authenticated and not loading
    if (!isAuthenticated && !isLoading) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const fetchReports = async () => {
      if (!isAuthenticated || !organizationId) return;
      
      setIsLoadingReports(true);
      setError(null);
      
      try {
        const response = await fetch('/api/reports');
        
        if (!response.ok) {
          throw new Error('Failed to fetch reports');
        }
        
        const data = await response.json();
        setReports(data);
      } catch (err) {
        console.error('Error fetching reports:', err);
        setError('Failed to load reports. Please try again later.');
      } finally {
        setIsLoadingReports(false);
      }
    };
    
    fetchReports();
  }, [isAuthenticated, organizationId]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Profile</h1>
        <Button onClick={handleLogout} variant="outline" size="sm">
          Log Out
        </Button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-500">Email</label>
          <p className="text-lg text-gray-900">{user.email}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500">User ID</label>
          <p className="text-sm text-gray-700">{user.id}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500">Organization ID</label>
          <p className="text-sm text-gray-700">{organizationId || 'N/A'}</p>
        </div>
      </div>

      {/* Section for User's Reports */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Your Organization's Reports</h2>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          {error && <p className="text-red-500">{error}</p>}
          {isLoadingReports && <p className="text-gray-600">Loading reports...</p>}
          
          {!isLoadingReports && !error && reports.length === 0 && (
            <p className="text-gray-600">No reports found for your organization.</p>
          )}
          
          {!isLoadingReports && !error && reports.length > 0 && (
            <ul className="space-y-2">
              {reports.map((report) => (
                <li key={report.id} className="border-b py-2 last:border-b-0">
                  <Link href={`/reports/${report.id}`} className="text-red-600 hover:underline">
                    {report.title || `Report ${report.id}`}
                  </Link>
                  <p className="text-sm text-gray-500">
                    Created on: {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
