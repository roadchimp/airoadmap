'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ConfirmUserPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleConfirmUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/confirm-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to confirm user');
      } else {
        setMessage(data.message || 'User confirmed successfully');
        setEmail('');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Development Tool</CardTitle>
          <CardDescription className="text-center">
            Manually confirm a user account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleConfirmUser} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            {error && (
              <div className="text-sm text-red-600 p-2 bg-red-50 rounded">
                {error}
              </div>
            )}
            
            {message && (
              <div className="text-sm text-green-600 p-2 bg-green-50 rounded">
                {message}
              </div>
            )}
            
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Confirm User'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-xs text-gray-500 text-center">
          This tool is for development purposes only and should not be accessible in production.
        </CardFooter>
      </Card>
    </div>
  );
} 