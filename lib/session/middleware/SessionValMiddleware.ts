// middleware/validation-middleware.ts
import { Middleware, SessionAction } from '../sessionTypes';

export const createValidationMiddleware = (): Middleware => {
  return (context) => (next) => (action: SessionAction) => {
    switch (action.type) {
      case 'UPDATE_STEP_DATA': {
        const { stepId, data } = action.payload;
        const currentState = context.getState();
        const step = currentState.steps.find(s => s.id === stepId);
        
        if (step) {
          const errors = validateStepData(stepId, data);
          
          // First update the data
          next(action);
          
          // Then set any validation errors
          if (Object.keys(errors).length > 0) {
            context.dispatch({
              type: 'SET_STEP_ERRORS',
              payload: { stepId, errors }
            });
          }
        } else {
          next(action);
        }
        break;
      }
      
      case 'SET_CURRENT_STEP': {
        const currentState = context.getState();
        const newStepIndex = action.payload;
        const currentStep = currentState.steps[currentState.currentStep];
        
        // Validate current step before allowing navigation
        if (currentStep && !currentStep.isValid && newStepIndex > currentState.currentStep) {
          const errors = validateStepData(currentStep.id, currentStep.data);
          
          if (Object.keys(errors).length > 0) {
            context.dispatch({
              type: 'SET_STEP_ERRORS',
              payload: { stepId: currentStep.id, errors }
            });
            return; // Don't proceed with navigation
          }
        }
        
        next(action);
        break;
      }
      
      default:
        next(action);
    }
  };
};

function validateStepData(stepId: string, data: Record<string, any>): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  switch (stepId) {
    case 'basic-info':
      if (!data.assessmentName?.trim()) {
        errors.assessmentName = ['Assessment name is required'];
      }
      if (data.assessmentName?.length > 100) {
        errors.assessmentName = ['Assessment name must be less than 100 characters'];
      }
      break;

    case 'department-selection':
      if (!data.department?.id) {
        errors.department = ['Please select a department'];
      }
      break;

    case 'role-selection':
      if (!data.jobRole?.id) {
        errors.jobRole = ['Please select a job role'];
      }
      break;

    case 'assessment-config':
      if (!data.assessmentType) {
        errors.assessmentType = ['Please select an assessment type'];
      }
      if (data.duration && (data.duration < 15 || data.duration > 180)) {
        errors.duration = ['Duration must be between 15 and 180 minutes'];
      }
      break;
  }

  return errors;
}
