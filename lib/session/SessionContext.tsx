import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { AssessmentSession, SessionAction, StorageConfig, Department, JobRole, WizardStepData } from './sessionTypes';
import { sessionReducer, createInitialSession } from './sessionReducer';
import { initialSteps } from './wizardStepMap';
import SessionStorageManager from './SessionStorageManager';
import { createAutoSaveMiddleware } from './middleware/AutoSaveMiddleware';
import { createValidationMiddleware } from './middleware/SessionValMiddleware';

interface SessionContextType {
  session: AssessmentSession;
  dispatch: React.Dispatch<SessionAction>;
  
  // Convenience methods
  goToStep: (stepIndex: number) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  setStepData: (
    stepIndex: number,
    data: Partial<WizardStepData>,
    isValid?: boolean,
    departmentSelection?: Department,
    jobRoleSelection?: JobRole
  ) => void;
  resetSession: () => void;
  
  // Cache management
  departments: Department[];
  jobRoles: JobRole[];
  refreshCache: () => Promise<void>;
  
  // Status
  isLoading: boolean;
  error: string | null;
}

const SessionContext = createContext<SessionContextType | null>(null);

interface SessionProviderProps {
  children: React.ReactNode;
  config?: Partial<StorageConfig>;
  assessmentId?: string;
}

const defaultConfig: StorageConfig = {
  sessionStorageKey: 'assessment_session',
  localStorageKey: 'assessment_cache',
  encryptionEnabled: false,
  compressionEnabled: true,
  expirationHours: 24
};

export const SessionProvider: React.FC<SessionProviderProps> = ({ 
  children, 
  config = {}, 
  assessmentId,
}) => {
  const finalConfig = { ...defaultConfig, ...config };
  const storageManager = useRef(new SessionStorageManager(finalConfig));
  
  const [session, setSession] = useReducer(sessionReducer, createInitialSession({
    id: assessmentId,
    steps: initialSteps,
  }));
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [jobRoles, setJobRoles] = React.useState<JobRole[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Create middleware-enhanced dispatch
  const dispatch = useCallback((action: SessionAction) => {
    const context = {
      getState: () => session,
      dispatch: setSession,
      storage: storageManager.current
    };

    // Apply middleware in order
    const autoSaveMiddleware = createAutoSaveMiddleware();
    const validationMiddleware = createValidationMiddleware();
    
    const enhancedDispatch = autoSaveMiddleware(context)(
      validationMiddleware(context)(setSession)
    );
    
    enhancedDispatch(action);
  }, [session]);

  // Initialize session on mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        setIsLoading(true);
        
        const sessionKey = assessmentId || 'current_session';
        const savedSession = await storageManager.current.load<AssessmentSession>(sessionKey, 'session');
        
        if (savedSession && new Date(savedSession.expiresAt) > new Date()) {
          dispatch({ type: 'INITIALIZE_SESSION', payload: savedSession });
        } else {
          // Clear expired session
          await storageManager.current.remove(sessionKey, 'session');
          dispatch({
            type: 'INITIALIZE_SESSION',
            payload: { id: assessmentId, steps: initialSteps },
          });
        }

        // Load cached departments and roles
        await refreshCache();
        
      } catch (error) {
        setError(`Failed to initialize session: ${error}`);
        dispatch({
          type: 'INITIALIZE_SESSION',
          payload: { id: assessmentId, steps: initialSteps },
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
  }, [assessmentId]);

  // Cache management
  const refreshCache = useCallback(async () => {
    try {
      // Fetch fresh data from API
      const response = await fetch('/api/roles-departments');
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const apiData = await response.json();
      
      setDepartments(apiData.hierarchical || []);
      setJobRoles(apiData.roles || []);

    } catch (error) {
      setError(`Failed to refresh cache: ${error}`);
    }
  }, []);

  // Convenience methods
  const goToStep = useCallback((stepIndex: number) => {
    dispatch({ type: 'SET_CURRENT_STEP', payload: stepIndex });
  }, [dispatch]);

  const goToNextStep = useCallback(() => {
    if (session.currentStepIndex < session.steps.length - 1) {
      dispatch({ type: 'SET_CURRENT_STEP', payload: session.currentStepIndex + 1 });
    }
  }, [dispatch, session.currentStepIndex, session.steps.length]);

  const goToPreviousStep = useCallback(() => {
    if (session.currentStepIndex > 0) {
      dispatch({ type: 'SET_CURRENT_STEP', payload: session.currentStepIndex - 1 });
    }
  }, [dispatch, session.currentStepIndex]);

  const setStepData = useCallback(
    (stepIndex: number, data: Partial<WizardStepData>, isValid?: boolean) => {
      dispatch({
        type: 'SET_STEP_DATA',
        payload: { stepIndex, data, isValid },
      });
    },
    [dispatch]
  );

  const resetSession = useCallback(async () => {
    const sessionKey = assessmentId || 'current_session';
    await storageManager.current.clear('session');
    dispatch({ type: 'RESET_SESSION' });
  }, [dispatch, assessmentId]);

  // Set up error handling
  useEffect(() => {
    storageManager.current.addErrorHandler((error) => {
      setError(error.message);
    });
  }, []);

  const contextValue: SessionContextType = {
    session,
    dispatch,
    goToStep,
    goToNextStep,
    goToPreviousStep,
    setStepData,
    resetSession,
    departments,
    jobRoles,
    refreshCache,
    isLoading,
    error
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
};

// Custom hook to use the session context
export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export { SessionContext };
