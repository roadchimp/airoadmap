import { AssessmentSession, SessionAction, WizardStep } from './sessionTypes';
import { v4 as uuidv4 } from 'uuid';

const WIZARD_STEPS_CONFIG: Omit<WizardStep, 'data' | 'errors'>[] = [
    { id: 'basic-info', name: 'Basic Information', isCompleted: false, isValid: false },
    { id: 'department-selection', name: 'Department', isCompleted: false, isValid: false },
    { id: 'role-selection', name: 'Job Role', isCompleted: false, isValid: false },
    { id: 'assessment-config', name: 'Configuration', isCompleted: false, isValid: false },
    { id: 'review', name: 'Review & Confirm', isCompleted: false, isValid: false },
];

export function createInitialSession(initialData: Partial<AssessmentSession> = {}): AssessmentSession {
    const now = new Date();
    const steps = WIZARD_STEPS_CONFIG.map(step => ({
        ...step,
        data: initialData.steps?.find(s => s.id === step.id)?.data || {},
        errors: {},
    }));

    return {
        id: initialData.id || uuidv4(),
        userId: initialData.userId,
        currentStep: initialData.currentStep || 0,
        totalSteps: steps.length,
        steps,
        selectedDepartment: initialData.selectedDepartment,
        selectedJobRole: initialData.selectedJobRole,
        isAutoSaving: false,
        lastSaved: null,
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
            startedAt: new Date().toISOString(),
            userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
            sessionSource: initialData.id ? 'restored' : 'new',
            ...initialData.metadata,
        },
        ...initialData,
    };
}

export function sessionReducer(state: AssessmentSession, action: SessionAction): AssessmentSession {
    switch (action.type) {
        case 'INITIALIZE_SESSION':
            return createInitialSession(action.payload);

        case 'SET_CURRENT_STEP':
            if (action.payload >= 0 && action.payload < state.totalSteps) {
                return { ...state, currentStep: action.payload };
            }
            return state;

        case 'UPDATE_STEP_DATA': {
            const { stepId, data } = action.payload;
            return {
                ...state,
                steps: state.steps.map(step =>
                    step.id === stepId ? { ...step, data: { ...step.data, ...data }, errors: {} } : step
                ),
            };
        }

        case 'SET_STEP_ERRORS': {
            const { stepId, errors } = action.payload;
            return {
                ...state,
                steps: state.steps.map(step =>
                    step.id === stepId ? { ...step, errors, isValid: false } : step
                ),
            };
        }
        
        case 'MARK_STEP_COMPLETED': {
            const stepId = action.payload;
            return {
                ...state,
                steps: state.steps.map(step =>
                    step.id === stepId ? { ...step, isCompleted: true, isValid: true } : step
                ),
            };
        }

        case 'SELECT_DEPARTMENT':
            return { ...state, selectedDepartment: action.payload, selectedJobRole: undefined };

        case 'SELECT_JOB_ROLE':
            return { ...state, selectedJobRole: action.payload };

        case 'SET_AUTO_SAVING':
            return { ...state, isAutoSaving: action.payload };

        case 'SESSION_SAVED':
            return { ...state, lastSaved: action.payload, isAutoSaving: false };
            
        case 'SESSION_LOAD_ERROR':
             // In a real app, you might log this error to a service
            console.error("Session Load Error:", action.payload);
            return state; // Or return a new initial state

        case 'RESET_SESSION':
            return createInitialSession();

        case 'EXTEND_SESSION':
            return { ...state, expiresAt: action.payload };

        default:
            return state;
    }
} 