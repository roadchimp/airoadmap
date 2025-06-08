export * from './errorTypes'; // Re-export error types and interfaces

export interface Department {
  id: string;
  name: string;
  description?: string;
  roles: JobRole[];
  createdAt: string;
  updatedAt: string;
}

export interface JobRole {
  id: string;
  title: string;
  departmentId: string;
  department?: Department;
  level: 'junior' | 'mid' | 'senior' | 'lead' | 'executive';
  skills: string[];
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WizardStep {
  id: string;
  name: string;
  isCompleted: boolean;
  isValid: boolean;
  data: Record<string, any>;
  errors: Record<string, string[]>;
}

export interface AssessmentSession {
  id: string;
  userId?: string;
  currentStep: number;
  totalSteps: number;
  steps: WizardStep[];
  selectedDepartment?: Department;
  selectedJobRole?: JobRole;
  isAutoSaving: boolean;
  lastSaved: string | null;
  expiresAt: string;
  metadata: {
    startedAt: string;
    userAgent: string;
    sessionSource: 'new' | 'restored' | 'migrated';
  };
}

// Storage configuration types
export interface StorageConfig {
  sessionStorageKey: string;
  localStorageKey: string;
  encryptionEnabled: boolean;
  compressionEnabled: boolean;
  expirationHours: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  version: string;
}

// Action types for useReducer
export type SessionAction =
  | { type: 'INITIALIZE_SESSION'; payload: Partial<AssessmentSession> }
  | { type: 'SET_CURRENT_STEP'; payload: number }
  | { type: 'UPDATE_STEP_DATA'; payload: { stepId: string; data: Record<string, any> } }
  | { type: 'SET_STEP_ERRORS'; payload: { stepId: string; errors: Record<string, string[]> } }
  | { type: 'MARK_STEP_COMPLETED'; payload: string }
  | { type: 'SELECT_DEPARTMENT'; payload: Department }
  | { type: 'SELECT_JOB_ROLE'; payload: JobRole }
  | { type: 'SET_AUTO_SAVING'; payload: boolean }
  | { type: 'SESSION_SAVED'; payload: string }
  | { type: 'SESSION_LOAD_ERROR'; payload: string }
  | { type: 'RESET_SESSION' }
  | { type: 'EXTEND_SESSION'; payload: string };

// Middleware types
export interface MiddlewareContext {
  getState: () => AssessmentSession;
  dispatch: React.Dispatch<SessionAction>;
  storage: StorageManager;
}

export type Middleware = (context: MiddlewareContext) => (next: React.Dispatch<SessionAction>) => (action: SessionAction) => void;

// API Response types
export interface DepartmentRoleResponse {
  departments: Department[];
  roles: JobRole[];
  hierarchical: Department[];
  metadata: {
    totalDepartments: number;
    totalRoles: number;
    lastUpdated: string;
    cacheVersion: string;
  };
}