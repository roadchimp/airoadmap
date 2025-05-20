'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/../../utils/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ConfirmEmailPrompt() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  
  const handleResendEmail = async () => {
    setIsLoading(true);
    try {
      // Get the email from local storage or prompt user
      const email = localStorage.getItem('signupEmail') || prompt('Please enter your email address:');
      
      if (!email) {
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });
      
      if (error) {
        console.error('Error resending confirmation email:', error);
        alert('Failed to resend confirmation email. Please try again.');
      } else {
        alert('Confirmation email has been resent. Please check your inbox.');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoToLogin = () => {
    router.push('/login');
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Confirm Your Email</CardTitle>
          <CardDescription className="text-center">
            We've sent a confirmation email to your inbox.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            Please check your email and click the confirmation link to activate your account.
            If you don't see the email, check your spam folder.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button 
            onClick={handleResendEmail} 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Resend Confirmation Email'}
          </Button>
          <Button 
            onClick={handleGoToLogin} 
            variant="outline" 
            className="w-full"
          >
            Back to Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 