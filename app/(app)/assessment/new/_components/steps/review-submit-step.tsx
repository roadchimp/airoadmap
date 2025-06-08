'use client';

import React, { useState } from 'react';
import { useSession } from '../../../../../../lib/session/SessionContext';
import  QuestionCard  from '../QuestionCard';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const ReviewSubmitStep = () => {
  const { session } = useSession();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(session),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit assessment');
      }

      const result = await response.json();
      setSuccess(true);
      toast({
        title: "Success!",
        description: `Assessment submitted successfully. (ID: ${result.assessmentId})`,
      });
      
      // Optionally, you could redirect the user here:
      // window.location.href = `/assessment/${result.assessmentId}/results`;

    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <QuestionCard title="Submission Complete">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-green-600">Thank You!</h2>
          <p className="mt-2 text-gray-700">Your assessment has been submitted successfully.</p>
          <p className="mt-4">You can now view your results or close this window.</p>
        </div>
      </QuestionCard>
    );
  }

  return (
    <QuestionCard
      title="Review & Submit"
      description="Review your entries below before submitting the assessment."
    >
      <div className="space-y-6">
        {session.steps.map((step, index) => (
          <div key={index}>
            <h3 className="text-lg font-semibold">{step.name}</h3>
            <pre className="mt-2 p-4 bg-gray-100 rounded-md text-sm overflow-x-auto">
              {JSON.stringify(step.data, null, 2)}
            </pre>
          </div>
        ))}
        {error && <p className="text-red-500 font-semibold">{error}</p>}
        <div className="flex justify-end mt-8">
          <Button onClick={handleSubmit} size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Assessment'
            )}
          </Button>
        </div>
      </div>
    </QuestionCard>
  );
};

export default ReviewSubmitStep; 