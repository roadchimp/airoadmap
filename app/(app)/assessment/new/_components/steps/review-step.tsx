// steps/review-step.tsx
import { useSession } from '@/lib/session/SessionContext';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Department, JobRole } from '@/lib/session/sessionTypes';
import { submitAssessment } from '@/lib/session/SessonActions';

export const ReviewStep = () => {
  const { session, setStepData, departments, jobRoles } = useSession();
  const { currentStepIndex } = session;
  
  // Get data from all steps - look through reviewSubmit sections for stored data
  const allStepsData = session.steps.map(step => step.data.reviewSubmit || {});
  
  // Find assessment config and selections from any step that has them
  const assessmentConfig = allStepsData.find(data => data.assessmentConfig)?.assessmentConfig || {};
  const selectedDepartment = allStepsData.find(data => data.selectedDepartment)?.selectedDepartment;
  const selectedRole = allStepsData.find(data => data.selectedRole)?.selectedRole;
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try { 
      // Implement your submission logic here
      await submitAssessment(session.steps as any);
      console.log("Submitting assessment...", assessmentConfig);
      
      const currentStepData = session.steps[currentStepIndex]?.data || {};
      setStepData(currentStepIndex, { 
        reviewSubmit: {
          ...currentStepData.reviewSubmit,
          submittedAt: new Date().toISOString() 
        }
      });
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
        <p>{selectedDepartment?.name || 'No department selected'}</p>
      </div>

      <div className="p-4 border rounded">
        <h3 className="font-medium mb-2">Selected Role</h3>
        <p>{selectedRole?.title || 'No role selected'}</p>
      </div>

      <div className="p-4 border rounded">
        <h3 className="font-medium mb-2">Assessment Configuration</h3>
        <p>Duration: {assessmentConfig.duration || 30} minutes</p>
        <p>Question Types: {assessmentConfig.questionTypes?.join(', ') || 'None selected'}</p>
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
