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
> & {
  // Additional organization info fields
  reportName?: string;
  industryMaturity?: 'Mature' | 'Immature';
  companyStage?: 'Startup' | 'Early Growth' | 'Scaling' | 'Mature';
  strategicFocus?: string[];
  keyBusinessGoals?: string;
  keyStakeholders?: string[];
};

export interface RoleSelection {
  selectedRoles: JobRole[];
}

export interface AreasForImprovement {
  selectedAreas?: string[];
  roleSpecificPainPoints?: Record<string, {
    description?: string;
    severity?: number;
    frequency?: number;
    impact?: number;
  }>;
  generalPainPoints?: string;
}

export interface WorkVolumeData {
  taskVolume?: number;
  taskComplexity?: number;
  roleWorkVolume?: Record<string, {
    volume?: string;
    complexity?: string;
    repetitiveness?: number;
    dataDescription?: string;
    notes?: string;
  }>;
}

export interface DataSystemsData {
  // Current systems and infrastructure
  currentSystems?: string;
  integrationChallenges?: string;
  securityRequirements?: string;
  
  // Assessment ratings
  dataAccessibility?: 'Easy (Well-documented, readily available)' | 'Moderate (Requires some effort/cleanup)' | 'Difficult (Siloed, requires significant effort)';
  dataQuality?: 'Good (Accurate, complete, consistent)' | 'Fair (Some inconsistencies or gaps)' | 'Poor (Inaccurate, incomplete, unreliable)';
  systemsIntegration?: 'Easy (APIs available, modern systems)' | 'Moderate (Some custom work needed)' | 'Difficult (Legacy systems, lack of APIs)';
  
  // Additional information
  relevantTools?: string;
  notes?: string;
}

export interface ReadinessData {
  // Timeline and budget expectations
  timelineExpectation?: string;
  budgetRange?: string;
  riskTolerance?: string;
  successMetrics?: Array<{ name: string }>;
  
  // Organizational readiness assessment
  organizationalReadiness?: 'High (Proactive, adaptable culture)' | 'Medium (Some resistance, needs clear communication)' | 'Low (Resistant to change, requires significant effort)';
  stakeholderAlignment?: 'High (Clear consensus, shared vision)' | 'Medium (General agreement, some differing priorities)' | 'Low (Significant disagreement or lack of clarity)';
  anticipatedTrainingNeeds?: string;
  expectedAdoptionChallenges?: string;
  keySuccessMetrics?: string;
}

export interface RoiTargetsData {
  // ROI expectations
  expectedROI?: string;
  timeToValue?: string;
  
  // Primary goals and metrics
  primaryGoals?: string[];
  keyMetrics?: Array<{ name: string }>;
  
  // AI adoption score inputs
  adoptionRateForecast?: number;
  timeSavings?: number;
  affectedUsers?: number;
  costEfficiencyGains?: number;
  performanceImprovement?: number;
  toolSprawlReduction?: 1 | 2 | 3 | 4 | 5;
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