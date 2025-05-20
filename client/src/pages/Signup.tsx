'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/ui/logo';
import { useAuth } from '@/hooks/UseAuth';

const Signup: React.FC = () => {
  const router = useRouter();
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Form validation
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!organizationName.trim()) {
      setError('Organization name is required.');
      return;
    }

    setIsLoading(true);

    try {
      // Store email in localStorage for the confirmation page
      localStorage.setItem('signupEmail', email);
      
      const result = await signup(email, password, organizationName);
      
      if (result.success) {
        // On successful signup, redirect to email confirmation page
        router.push('/signup/confirm-email-prompt');
      } else {
        setError(result.error || 'Signup failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

   return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Logo className="h-12 mx-auto" />
            <h1 className="text-2xl font-bold mt-2 text-red-600">AI Roadmap</h1>
          </Link>
          <h2 className="text-2xl font-bold mt-6 mb-2">Create your account</h2>
          <p className="text-gray-600">
            Or{' '}
            <Link href="/login" className="text-red-600 hover:text-red-700">
              sign in to your existing account
            </Link>
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-sm border">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" required disabled={isLoading} />
            </div>
            
            {/* Organization Name Input */}
            <div>
              <label htmlFor="organization" className="block text-sm font-medium text-gray-700">Organization Name</label>
              <Input 
                id="organization" 
                type="text" 
                value={organizationName} 
                onChange={(e) => setOrganizationName(e.target.value)} 
                className="mt-1" 
                required 
                disabled={isLoading} 
              />
            </div>
            
            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" required disabled={isLoading} />
              <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters long</p>
            </div>
            
            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1" required disabled={isLoading} />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;

