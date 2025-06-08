import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { AssessmentSession, SessionAction, StorageConfig, Department, JobRole } from './sessionTypes';
import { sessionReducer, createInitialSession } from './sessionReducer';
import SessionStorageManager from './SessionStorageManager';
import { createAutoSaveMiddleware } from '@/app/api/middleware/AutoSavemiddleware';
import { createValidationMiddleware } from '@/app/api/middleware/SessionValMiddleware';

interface SessionContextType {
  session: AssessmentSession;
  dispatch: React.Dispatch<SessionAction>;
  
  // Convenience methods
  goToStep: (stepIndex: number) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  updateStepData: (stepId: string, data: Record<string, any>) => void;
  selectDepartment: (department: Department) => void;
  selectJobRole: (jobRole: JobRole) => void;
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
  config = {} 
}) => {
  const finalConfig = { ...defaultConfig, ...config };
  const storageManager = useRef(new SessionStorageManager(finalConfig));
  
  const [session, setSession] = useReducer(sessionReducer, createInitialSession());
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
        
        // Try to restore session from sessionStorage
        const savedSession = await storageManager.current.load<AssessmentSession>('current_session', 'session');
        
        if (savedSession && new Date(savedSession.expiresAt) > new Date()) {
          dispatch({ type: 'INITIALIZE_SESSION', payload: savedSession });
        } else {
          // Clear expired session
          await storageManager.current.remove('current_session', 'session');
          dispatch({ type: 'INITIALIZE_SESSION', payload: {} });
        }

        // Load cached departments and roles
        await refreshCache();
        
      } catch (error) {
        setError(`Failed to initialize session: ${error}`);
        dispatch({ type: 'INITIALIZE_SESSION', payload: {} });
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
  }, []);

  // Cache management
  const refreshCache = useCallback(async () => {
    try {
      // Try to load from localStorage first
      const cachedData = await storageManager.current.load<{
        departments: Department[];
        jobRoles: JobRole[];
        timestamp: number;
      }>('roles_departments', 'local');

      const cacheAge = cachedData ? Date.now() - cachedData.timestamp : Infinity;
      const cacheMaxAge = 60 * 60 * 1000; // 1 hour

      if (cachedData && cacheAge < cacheMaxAge) {
        setDepartments(cachedData.departments);
        setJobRoles(cachedData.jobRoles);
        return;
      }

      // Fetch fresh data from API
      const response = await fetch('/api/roles-departments');
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const apiData = await response.json();
      
      setDepartments(apiData.hierarchical);
      setJobRoles(apiData.roles);

      // Cache the data
      await storageManager.current.save(
        'roles_departments',
        {
          departments: apiData.hierarchical,
          jobRoles: apiData.roles,
          timestamp: Date.now()
        },
        'local'
      );

    } catch (error) {
      setError(`Failed to refresh cache: ${error}`);
      
      // Fall back to any existing cached data
      const cachedData = await storageManager.current.load<{
        departments: Department[];
        jobRoles: JobRole[];
      }>('roles_departments', 'local');
      
      if (cachedData) {
        setDepartments(cachedData.departments);
        setJobRoles(cachedData.jobRoles);
      }
    }
  }, []);

  // Convenience methods
  const goToStep = useCallback((stepIndex: number) => {
    dispatch({ type: 'SET_CURRENT_STEP', payload: stepIndex });
  }, [dispatch]);

  const goToNextStep = useCallback(() => {
    dispatch({ type: 'SET_CURRENT_STEP', payload: session.currentStep + 1 });
  }, [dispatch, session.currentStep]);

  const goToPreviousStep = useCallback(() => {
    dispatch({ type: 'SET_CURRENT_STEP', payload: session.currentStep - 1 });
  }, [dispatch, session.currentStep]);

  const updateStepData = useCallback((stepId: string, data: Record<string, any>) => {
    dispatch({ type: 'UPDATE_STEP_DATA', payload: { stepId, data } });
  }, [dispatch]);

  const selectDepartment = useCallback((department: Department) => {
    dispatch({ type: 'SELECT_DEPARTMENT', payload: department });
  }, [dispatch]);

  const selectJobRole = useCallback((jobRole: JobRole) => {
    dispatch({ type: 'SELECT_JOB_ROLE', payload: jobRole });
  }, [dispatch]);

  const resetSession = useCallback(async () => {
    await storageManager.current.clear('session');
    dispatch({ type: 'RESET_SESSION' });
  }, [dispatch]);

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
    updateStepData,
    selectDepartment,
    selectJobRole,
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
