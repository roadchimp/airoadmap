'use client'

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/ui/logo';
import { useAuth } from '@/hooks/UseAuth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { createClient } from "@/../../utils/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';
  
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Save email to localStorage for potential use in confirmation page
      localStorage.setItem('signupEmail', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // Check if the error is due to email not being confirmed
        if (error.message.includes('Email not confirmed')) {
          router.push('/signup/confirm-email-prompt');
          return;
        }
        
        setError(error.message);
      } else if (data?.user) {
        // Successful login - refresh router then redirect to dashboard
        router.refresh();
        router.push(returnUrl);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Login</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {error && (
              <div className="text-sm text-red-600 p-2 bg-red-50 rounded">
                {error}
              </div>
            )}
            
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center space-x-4">
          <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
            Forgot Password?
          </Link>
          <Link href="/signup" className="text-sm text-blue-600 hover:underline">
            Create Account
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Login</CardTitle>
            <CardDescription className="text-center">
              Loading...
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <div className="animate-pulse">Loading login form...</div>
          </CardContent>
        </Card>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}