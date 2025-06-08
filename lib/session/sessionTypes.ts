import {
  InsertOrganization,
  JobRole,
  Department,
} from '@shared/schema';

export type { Department, JobRole };

export * from './errorTypes'; // Re-export error types and interfaces

// New 8-step enum
export enum WizardStep {
  ORGANIZATION_INFO = 0,
  ROLE_SELECTION = 1,
  AREAS_FOR_IMPROVEMENT = 2,
  WORK_VOLUME_COMPLEXITY = 3,
  DATA_SYSTEMS = 4,
  READINESS_EXPECTATIONS = 5,
  ROI_TARGETS = 6,
  REVIEW_SUBMIT = 7,
}

// Data structure for each wizard step
export type OrganizationBasics = Pick<
  InsertOrganization,
  'name' | 'industry' | 'size' | 'description'
>;

export interface RoleSelection {
  selectedRoles: JobRole[];
}

export interface AreasForImprovement {
  selectedAreas?: string[];
}

export interface WorkVolumeData {
  taskVolume?: number;
  taskComplexity?: number;
}

export interface DataSystemsData {
  dataSources?: string[];
  softwareSystems?: string[];
}

export interface ReadinessData {
  changeReadiness?: number;
  aiExpectations?: number;
}

export interface RoiTargetsData {
  costSavings?: number;
  revenueGrowth?: number;
}

export interface ReviewSubmitData {
  // This step might not have data of its own, but we define it for consistency
  [key: string]: any;
}

export interface WizardStepData {
  basics: OrganizationBasics;
  roleSelection: RoleSelection;
  areasForImprovement: AreasForImprovement;
  workVolume: WorkVolumeData;
  dataSystems: DataSystemsData;
  readiness: ReadinessData;
  roiTargets: RoiTargetsData;
  reviewSubmit: ReviewSubmitData;
}

export interface StepState {
  id: string; // Corresponds to key in wizardStepMap
  name: string;
  isCompleted: boolean;
  isValid: boolean;
  data: WizardStepData;
  errors: Record<string, string[]>;
}

export interface AssessmentSession {
  id: string; // Assessment ID
  currentStepIndex: number;
  steps: StepState[];
  isAutoSaving: boolean;
  lastSaved: number | null;
  expiresAt: string;
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
  | {
      type: 'SET_STEP_DATA';
      payload: {
        stepIndex: number;
        data: Partial<WizardStepData>;
        isValid?: boolean;
        isCompleted?: boolean;
      };
    }
  | { type: 'SET_STEP_ERRORS'; payload: { stepIndex: number; errors: Record<string, string[]> } }
  | { type: 'SET_AUTO_SAVING'; payload: boolean }
  | { type: 'SESSION_SAVED'; payload: { timestamp: number } }
  | { type: 'RESET_SESSION' };

// A placeholder for StorageManager to avoid breaking other parts of the app
export interface StorageManager {}

// Middleware types
export interface MiddlewareContext {
  getState: () => AssessmentSession;
  dispatch: React.Dispatch<SessionAction>;
  storage: StorageManager;
}

export type Middleware = (context: MiddlewareContext) => (next: React.Dispatch<SessionAction>) => (action: SessionAction) => void;