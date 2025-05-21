import { eq, inArray } from "drizzle-orm";
import { 
  User, InsertUser, 
  Organization, InsertOrganization,
  Department, InsertDepartment,
  JobRole as BaseJobRole,
  InsertJobRole, JobRoleWithDepartment,
  AICapability as BaseAICapability, // Renamed to avoid conflict with enriched type
  InsertAICapability,
  Assessment, InsertAssessment,
  Report as DBReport, InsertReport as DBInsertReport, // Aliased imports
  WizardStepData,
  HeatmapData,
  AISuggestion,
  PerformanceImpact,
  PrioritizedItem,
  JobDescription, InsertJobDescription,
  JobScraperConfig, InsertJobScraperConfig,
  ProcessedJobContent,
  AiTool as BaseAiTool, // Existing AiTool from schema
  AssessmentScoreData,
  InsertAiTool,
  AssessmentResponse,
  InsertAssessmentResponse,
  PerformanceMetrics, InsertPerformanceMetrics, SelectPerformanceMetrics,
  JobRolePerformanceMetrics as JobRolePerformanceMetricsType, InsertJobRolePerformanceMetrics, SelectJobRolePerformanceMetrics,
  MetricRules, InsertMetricRule, SelectMetricRule,
  ReportWithAssessmentDetails as DBReportWithAssessmentDetails, // Alias this too if it uses Report
  insertPerformanceMetricSchema,
  insertMetricRuleSchema,
  insertJobRolePerformanceMetricSchema,
  users,
  organizations,
  departments,
  jobRoles as jobRolesTable,
  aiCapabilitiesTable,
  assessments,
  reports, // This is the table, fine to keep as `reports`
  assessmentResponses,
  performanceMetrics as performanceMetricsTable,
  jobRolePerformanceMetrics as jobRolePerformanceMetricsTable,
  metricRules as metricRulesTable,
  jobDescriptions,
  jobScraperConfigs,
  aiTools as aiToolsTable, // Renamed to avoid conflict with AiTool type
  organizationScoreWeights,
  type OrganizationScoreWeights,
  type InsertOrganizationScoreWeights,
  insertOrganizationScoreWeightsSchema,
  userProfiles,
  type UserProfile,
  type InsertUserProfile,
  CapabilityToolMapping as CapabilityToolMappingType,
  CapabilityJobRole as CapabilityJobRoleType,
  CapabilityRoleImpact as CapabilityRoleImpactType,
  capabilityJobRoles as capabilityJobRolesTable,
  capabilityToolMapping as capabilityToolMappingTable,
  capabilityRoleImpacts as capabilityRoleImpactsTable,
  AssessmentAICapability,
  InsertAssessmentAICapability
} from "../shared/schema";

export { type BaseAiTool as AiTool }; // Re-export BaseAiTool as AiTool

import { PgStorage } from './pg-storage.ts';
import { z } from 'zod';
import { calculatePrioritization } from './lib/prioritizationEngine';

/**
 * Represents a report along with its associated assessment details.
 * This is often used when displaying a report contextually.
 */
export interface ReportWithAssessmentDetails extends DBReport {
  assessmentTitle?: string;
  industry?: string;
  industryMaturity?: string;
  companyStage?: string;
  strategicFocus?: string[] | string | null | undefined;
  organizationName?: string;
  assessmentId: number;
  assessment?: Assessment;
}

/**
 * Represents a report with additional data often needed for detailed views,
 * including metrics, rules, selected roles from the assessment, and the assessment itself.
 */
export interface ReportWithMetricsAndRules extends ReportWithAssessmentDetails {
  selectedRoles?: BaseJobRole[];
  performanceMetrics?: PerformanceMetrics[];
  metricRules?: MetricRules[];
}

// Define the enriched AICapability type with assessment-specific fields
export type FullAICapability = BaseAICapability & {
  // Global capability enrichments
  applicableRoles?: BaseJobRole[]; // Array of JobRole objects or their IDs/names
  roleImpact?: Record<string, number>; // roleId as string to impactScore
  recommendedTools?: BaseAiTool[];
  
  // Assessment-specific fields from assessment_ai_capabilities table
  assessmentId?: number;
  valueScore?: number | null; 
  feasibilityScore?: number | null;
  impactScore?: number | null;
  easeScore?: number | null;
  priority?: string | null;
  rank?: number | null;
  implementationEffort?: string | null;
  businessValue?: string | null;
  assessmentNotes?: string | null;
};

// Define Tool with its mapped capabilities
export type ToolWithMappedCapabilities = BaseAiTool & {
  mappedCapabilities?: Pick<BaseAICapability, 'id' | 'name' | 'category' | 'description'>[];
};

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // User Profile methods
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  getUserProfileByAuthId(authId: string): Promise<UserProfile | undefined>;
  
  // Organization methods
  getOrganization(id: number, authId?: string): Promise<Organization | undefined>;
  listOrganizations(authId?: string): Promise<Organization[]>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  deleteOrganization(id: number): Promise<void>;
  
  // Department methods
  getDepartment(id: number): Promise<Department | undefined>;
  listDepartments(): Promise<Department[]>;
  createDepartment(dept: InsertDepartment): Promise<Department>;
  
  // JobRole methods
  getJobRole(id: number): Promise<BaseJobRole | undefined>;
  listJobRoles(): Promise<JobRoleWithDepartment[]>;
  listJobRolesByDepartment(departmentId: number): Promise<JobRoleWithDepartment[]>;
  createJobRole(role: InsertJobRole): Promise<BaseJobRole>;
  
  // AICapability methods
  getAICapability(id: number): Promise<FullAICapability | undefined>;
  listAICapabilities(options?: { assessmentId?: string; roleIds?: string[]; categoryFilter?: string[] }): Promise<FullAICapability[]>;
  createAICapability(capability: InsertAICapability): Promise<BaseAICapability>;
  
  // New AICapability methods for global capabilities and assessment-specific links
  findOrCreateGlobalAICapability(
    capabilityName: string, 
    capabilityCategory: string, 
    description?: string,
    defaults?: {
      defaultBusinessValue?: string | null;
      defaultImplementationEffort?: string | null;
      defaultEaseScore?: string | null;
      defaultValueScore?: string | null;
      defaultFeasibilityScore?: string | null;
      defaultImpactScore?: string | null;
      tags?: string[];
    }
  ): Promise<BaseAICapability>;
  
  createAssessmentAICapability(data: InsertAssessmentAICapability): Promise<AssessmentAICapability>;
  
  getAssessmentAICapabilities(assessmentId: number): Promise<FullAICapability[]>;
  
  // Assessment methods
  getAssessment(id: number): Promise<Assessment | undefined>;
  listAssessments(): Promise<Assessment[]>;
  listAssessmentsByUser(userId: number): Promise<Assessment[]>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  updateAssessmentStep(id: number, stepData: Partial<WizardStepData>): Promise<Assessment>;
  updateAssessmentStatus(id: number, status: string): Promise<Assessment>;
  updateAssessmentUserID(id: number, userId: number): Promise<Assessment>;
  deleteAssessment(id: number): Promise<void>;
  
  // Report methods
  getReport(id: number): Promise<ReportWithMetricsAndRules | undefined>;
  getReportByAssessment(assessmentId: number): Promise<ReportWithMetricsAndRules | undefined>;
  listReports(): Promise<DBReport[]>;
  createReport(report: DBInsertReport): Promise<DBReport>;
  updateReportCommentary(id: number, commentary: string): Promise<DBReport>;
  updateReport(id: number, reportUpdate: Partial<DBInsertReport>): Promise<DBReport>;
  
  // Assessment Response methods
  createAssessmentResponse(response: InsertAssessmentResponse): Promise<AssessmentResponse>;
  batchCreateAssessmentResponses(responses: InsertAssessmentResponse[]): Promise<AssessmentResponse[]>;
  getAssessmentResponsesByAssessment(assessmentId: number): Promise<AssessmentResponse[]>;
  
  // Job Description methods
  getJobDescription(id: number): Promise<JobDescription | undefined>;
  listJobDescriptions(limit?: number, offset?: number): Promise<JobDescription[]>;
  listJobDescriptionsByStatus(status: string, limit?: number, offset?: number): Promise<JobDescription[]>;
  createJobDescription(jobDescription: InsertJobDescription): Promise<JobDescription>;
  updateJobDescriptionProcessedContent(id: number, processedContent: ProcessedJobContent): Promise<JobDescription>;
  updateJobDescriptionStatus(id: number, status: string, error?: string): Promise<JobDescription>;
  
  // Job Scraper Config methods
  getJobScraperConfig(id: number): Promise<JobScraperConfig | undefined>;
  listJobScraperConfigs(): Promise<JobScraperConfig[]>;
  listActiveJobScraperConfigs(): Promise<JobScraperConfig[]>;
  createJobScraperConfig(config: InsertJobScraperConfig): Promise<JobScraperConfig>;
  updateJobScraperConfigLastRun(id: number): Promise<JobScraperConfig>;
  updateJobScraperConfigStatus(id: number, isActive: boolean): Promise<JobScraperConfig>;

  // AI Tool methods - USE snake_case type
  getAITool(id: number): Promise<BaseAiTool | undefined>;
  listAITools(search?: string, category?: string, licenseType?: string): Promise<BaseAiTool[]>;
  createAITool(tool: InsertAiTool): Promise<BaseAiTool>;
  updateAITool(id: number, toolUpdate: Partial<InsertAiTool>): Promise<BaseAiTool>;
  deleteAITool(id: number): Promise<void>;

  // New methods for tools with mapped capabilities
  getTools(options?: { assessmentId?: string; categoryFilter?: string[] }): Promise<ToolWithMappedCapabilities[]>;
  getCapabilitiesForTool(toolId: number): Promise<Pick<BaseAICapability, 'id' | 'name' | 'category' | 'description'>[]>;

  // Assessment Score methods
  upsertAssessmentScore(score: Omit<AssessmentScoreData, 'id' | 'createdAt' | 'updatedAt'>): Promise<AssessmentScoreData>;
  getAssessmentScore(wizardStepId: string): Promise<AssessmentScoreData | undefined>;

  // Performance Metric methods
  listPerformanceMetrics(): Promise<PerformanceMetrics[]>;
  getPerformanceMetric(id: number): Promise<PerformanceMetrics | undefined>;
  createPerformanceMetric(metric: z.infer<typeof insertPerformanceMetricSchema>): Promise<PerformanceMetrics>;
  updatePerformanceMetric(id: number, metric: Partial<z.infer<typeof insertPerformanceMetricSchema>>): Promise<PerformanceMetrics | undefined>;
  deletePerformanceMetric(id: number): Promise<void>;

  // Job Role Performance Metric Link methods
  linkJobRoleToMetric(linkData: z.infer<typeof insertJobRolePerformanceMetricSchema>): Promise<JobRolePerformanceMetricsType>;
  unlinkJobRoleFromMetric(jobRoleId: number, performanceMetricId: number): Promise<void>;
  getMetricsForJobRole(jobRoleId: number): Promise<(PerformanceMetrics & { linkId: number })[]>; // Include link table info if useful

  // Metric Rule methods
  listMetricRules(): Promise<MetricRules[]>;
  getMetricRule(id: number): Promise<MetricRules | undefined>;
  listMetricRulesByMetric(metricId: number): Promise<MetricRules[]>;
  insertMetricRule(rule: z.infer<typeof insertMetricRuleSchema>): Promise<MetricRules>;
  updateMetricRule(id: number, rule: Partial<z.infer<typeof insertMetricRuleSchema>>): Promise<MetricRules | undefined>;
  deleteMetricRule(id: number): Promise<void>;

  // Organization Score Weights methods (NEW)
  getOrganizationScoreWeights(organizationId: number): Promise<OrganizationScoreWeights | undefined>;
  upsertOrganizationScoreWeights(weights: InsertOrganizationScoreWeights): Promise<OrganizationScoreWeights>;

  // New methods for capability-tool mapping
  mapCapabilityToTool(capabilityId: number, toolId: number): Promise<CapabilityToolMappingType>;
  unmapCapabilityFromTool(capabilityId: number, toolId: number): Promise<void>;
  getToolsForCapability(capabilityId: number): Promise<BaseAiTool[]>;
  
  // Authentication context
  setAuthContext(authId?: string): Promise<void>;
}

// Simplified getStorage function
let storageInstance: IStorage | null = null;

export function getStorage(): IStorage {
  if (storageInstance) {
    return storageInstance;
  }
  console.log("Using PostgreSQL storage (PgStorage)");
  storageInstance = new PgStorage();
  return storageInstance;
}

// Create storage instance based on environment (Simplified)
// let storageInstance: IStorage; // This declaration will be removed, use the one at the top.

// The original try/catch for MemStorage fallback is removed.
// The getStorage() function already handles PgStorage instantiation.

// Export the selected storage implementation
export const storage: IStorage = getStorage();