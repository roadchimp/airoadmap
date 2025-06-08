// middleware/validation-middleware.ts
import { Middleware, SessionAction } from '../sessionTypes';

export const createValidationMiddleware = (): Middleware => {
  return (context) => (next) => (action: SessionAction) => {
    switch (action.type) {
      case 'SET_STEP_DATA': {
        const { stepIndex, data } = action.payload;
        const currentState = context.getState();
        const step = currentState.steps[stepIndex];
        
        if (step) {
          const errors = validateStepData(step.id, data);
          
          // First update the data
          next(action);
          
          // Then set any validation errors
          if (Object.keys(errors).length > 0) {
            context.dispatch({
              type: 'SET_STEP_ERRORS',
              payload: { stepIndex, errors }
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
        const currentStep = currentState.steps[currentState.currentStepIndex];
        
        // Validate current step before allowing navigation
        if (currentStep && !currentStep.isValid && newStepIndex > currentState.currentStepIndex) {
          const errors = validateStepData(currentStep.id, currentStep.data);
          
          if (Object.keys(errors).length > 0) {
            context.dispatch({
              type: 'SET_STEP_ERRORS',
              payload: { stepIndex: currentState.currentStepIndex, errors }
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
    case 'organization-info':
      if (data.basics) {
        if (!data.basics.name?.trim()) {
          errors.name = ['Organization name is required'];
        }
        if (!data.basics.industry) {
          errors.industry = ['Industry is required'];
        }
        if (!data.basics.size) {
          errors.size = ['Organization size is required'];
        }
      }
      break;

    case 'role-selection':
      if (data.roleSelection && (!data.roleSelection.selectedRoles || data.roleSelection.selectedRoles.length === 0)) {
        errors.selectedRoles = ['Please select at least one role'];
      }
      break;

    case 'areas-for-improvement':
      // Optional validation - these fields are not strictly required
      break;

    case 'work-volume-complexity':
      // Optional validation - these fields are not strictly required
      break;

    case 'data-systems':
      // Optional validation - these fields are not strictly required
      break;

    case 'readiness-expectations':
      // Optional validation - these fields are not strictly required
      break;

    case 'roi-targets':
      // Optional validation - these fields are not strictly required
      break;

    case 'review-submit':
      // No specific validation needed for review step
      break;
  }

  return errors;
}
