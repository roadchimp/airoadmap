import { AssessmentSession, SessionAction, StepState } from './sessionTypes';
import { v4 as uuidv4 } from 'uuid';

export function createInitialSession(
  partialSession: Partial<AssessmentSession> = {}
): AssessmentSession {
  const now = Date.now();
  const expires = new Date(now + 24 * 60 * 60 * 1000).toISOString();

  return {
    id: partialSession.id || uuidv4(),
    currentStepIndex: partialSession.currentStepIndex || 0,
    steps: partialSession.steps || [],
    isAutoSaving: false,
    lastSaved: null,
    expiresAt: partialSession.expiresAt || expires,
    ...partialSession,
  };
}

export function sessionReducer(
  state: AssessmentSession,
  action: SessionAction
): AssessmentSession {
  switch (action.type) {
    case 'INITIALIZE_SESSION':
      return createInitialSession(action.payload);

    case 'SET_CURRENT_STEP':
      if (
        action.payload >= 0 &&
        action.payload < (state.steps?.length || 0)
      ) {
        return { ...state, currentStepIndex: action.payload };
      }
      return state;

    case 'SET_STEP_DATA':
      return {
        ...state,
        steps: state.steps.map((step, index) =>
          index === action.payload.stepIndex
            ? {
                ...step,
                data: {
                  ...step.data,
                  ...action.payload.data,
                },
                isValid: action.payload.isValid ?? step.isValid,
                isCompleted: action.payload.isCompleted ?? step.isCompleted,
              }
            : step
        ),
        lastSaved: Date.now(),
      };
    
    case 'SET_STEP_ERRORS': {
      const { stepIndex, errors } = action.payload;
      return {
        ...state,
        steps: state.steps.map((step, index) =>
          index === stepIndex ? { ...step, errors, isValid: false } : step
        ),
      };
    }

    case 'SET_AUTO_SAVING':
      return { ...state, isAutoSaving: action.payload };

    case 'SESSION_SAVED':
      return {
        ...state,
        lastSaved: action.payload.timestamp,
        isAutoSaving: false,
      };

    case 'RESET_SESSION':
      return createInitialSession({ id: state.id }); // Keep the ID

    default:
      return state;
  }
} 