// steps/review-step.tsx
import { useSession } from '@/lib/session/SessionContext';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Department, JobRole } from '@/lib/session/sessionTypes';
import { submitAssessment } from '@/lib/session/SessonActions';

export const ReviewStep = () => {
    const { session, updateStepData, departments, jobRoles } = useSession();
    const stepData = session.steps.find(s => s.id === 'assessment-config')?.data || {};
    const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try { 
      // Implement your submission logic here
      await submitAssessment(session.steps);
      console.log("Submitting assessment...", stepData);
      updateStepData('assessment-config', { submittedAt: new Date().toISOString() });
    } catch (error) {
      console.error('Submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded">
        <h3 className="font-medium mb-2">Selected Department</h3>
        <p>{departments.find((d: Department) => d.id === session.selectedDepartment?.id)?.name}</p>
      </div>

      <div className="p-4 border rounded">
        <h3 className="font-medium mb-2">Selected Role</h3>
        <p>{jobRoles.find((r: JobRole) => r.id === session.selectedJobRole?.id)?.title}</p>
      </div>

      <div className="p-4 border rounded">
        <h3 className="font-medium mb-2">Assessment Configuration</h3>
        <p>Duration: {stepData.duration} minutes</p>
        <p>Question Types: {stepData.questionTypes?.join(', ')}</p>
      </div>

      <Button 
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Submitting...' : 'Create Assessment'}
      </Button>
    </div>
  );
};

export default ReviewStep;
