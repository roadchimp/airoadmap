'use client'

import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';

// Note: Resend functionality would require a server action or API route
// calling Supabase Admin SDK's resend method.

const ConfirmEmailPrompt: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-sm border">
        <Logo className="h-12 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Check Your Email</h1>
        <p className="text-gray-700 mb-6">
          We've sent a verification link to your email address.
          Please click the link in the email to activate your account.
        </p>
        <p className="text-gray-600 text-sm mb-4">
          Didn't receive the email? Check your spam folder.
          {/* Add resend button here if implementing resend logic */}
        </p>
        <Link href="/login">
          <Button variant="link" className="text-red-600">
            Back to Login
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ConfirmEmailPrompt;
