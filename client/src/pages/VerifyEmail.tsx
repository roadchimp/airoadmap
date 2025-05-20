'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { createClient } from '@/../../utils/supabase/client';

const VerifyEmail: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const supabase = createClient();

  const handleResendEmail = async () => {
    if (!email) {
      setResendStatus("Cannot resend email: Email address not found.");
      return;
    }
    setIsResending(true);
    setResendStatus(null);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        throw error;
      }
      
      setResendStatus("Verification email resent successfully!");
    } catch (err: any) {
      setResendStatus(err.message || "Failed to resend email. Please try again later.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-sm border">
        <Logo className="h-12 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Check Your Email</h1>
        <p className="text-gray-700 mb-6">
          We've sent a verification link to{' '}
          {email ? <strong className="font-medium">{email}</strong> : 'your email address'}.
          Please click the link in the email to activate your account.
        </p>
        <p className="text-gray-600 text-sm mb-4">
          Didn't receive the email? Check your spam folder or click below to resend.
        </p>

        <Button
          onClick={handleResendEmail}
          disabled={isResending || !email}
          className="w-full mb-4 bg-gray-200 text-gray-800 hover:bg-gray-300"
        >
          {isResending ? 'Resending...' : 'Resend Verification Email'}
        </Button>

        {resendStatus && (
          <p className={`text-sm ${resendStatus.includes('Failed') ? 'text-red-600' : 'text-green-600'} mb-4`}>
            {resendStatus}
          </p>
        )}

        <Link href="/login">
          <Button variant="link" className="text-red-600">
            Back to Login
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default VerifyEmail;
