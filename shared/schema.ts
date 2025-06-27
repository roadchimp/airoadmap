import { sql } from 'drizzle-orm';
import { pgTable, pgEnum, text, serial, integer, jsonb, timestamp, boolean, numeric, uniqueIndex, primaryKey, AnyPgColumn, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// Users table (for additional user data beyond Supabase Auth)
export const userProfiles = pgTable('user_profiles', {
  id: serial('id').primaryKey(),
  auth_id: text('auth_id').notNull().unique(), // Supabase auth.users.id
  organization_id: integer('organization_id').references(() => organizations.id),
  full_name: text('full_name'),
  avatar_url: text('avatar_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).pick({
  auth_id: true,
  organization_id: true,
  full_name: true,
  avatar_url: true,
});

// Company/Organization model
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  industry: text("industry").notNull(),
  size: text("size").notNull(), // Small, Medium, Large, Enterprise (API accepts both simple and detailed formats)
  description: text("description"),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

//added a field for the organization's industry
export const insertOrganizationSchema = createInsertSchema(organizations).pick({
  name: true,
  industry: true, 
  size: true,
  description: true,
});

// Department model
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const insertDepartmentSchema = createInsertSchema(departments).pick({
  name: true,
  description: true,
});

// Job Role model
export const aiPotentialEnum = pgEnum('ai_potential_enum', ['Low', 'Medium', 'High']); // Ensure enum is defined

export const jobRoles = pgTable("job_roles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  departmentId: integer("department_id").notNull().references(() => departments.id),
  description: text("description"),
  keyResponsibilities: text("key_responsibilities").array(),
  aiPotential: aiPotentialEnum("ai_potential").default("Medium"), // Use enum, default "Medium", nullable (no .notNull())
  level: text("level"),
  skills: text("skills").array(),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Let createInsertSchema infer all fields, then omit 'id'
export const insertJobRoleSchema = createInsertSchema(jobRoles, {
  // Make aiPotential optional in Zod schema as DB has a default and it's nullable
  aiPotential: z.enum(aiPotentialEnum.enumValues).optional(), 
  keyResponsibilities: z.union([
    z.string().transform(str => 
      str.split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0)
    ),
    z.array(z.string())
  ]).optional().default([]), // also ensure this is optional if it can be omitted
}).omit({ 
  id: true 
});

// Enum for AI Capability Priority
export const capabilityPriorityEnum = pgEnum('capability_priority_enum', ['High', 'Medium', 'Low']);

// Basic type for ImplementationFactors, expand as needed
export type ImplementationFactors = {
  technicalComplexity?: number;
  dataReadiness?: number;
  changeManagement?: number;
};

// AI Capability model - UPDATED to be GLOBAL
export const aiCapabilitiesTable = pgTable("ai_capabilities", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  implementation_effort: text("implementation_effort"),
  business_value: text("business_value"),
  ease_score: numeric("ease_score"),
  value_score: numeric("value_score"),
  primary_category: text("primary_category"),
  license_type: text("license_type"),
  website_url: text("website_url"),
  tags: text("tags").array(),
  default_implementation_effort: text("default_implementation_effort"),
  default_business_value: text("default_business_value"),
  default_ease_score: numeric("default_ease_score"),
  default_value_score: numeric("default_value_score"),
  default_feasibility_score: numeric("default_feasibility_score"),
  default_impact_score: numeric("default_impact_score"),
  feasibility_score: numeric("feasibility_score"),
  impact_score: numeric("impact_score"),
  priority: capabilityPriorityEnum("priority").default('Medium'),
  rank: integer("rank"),
  implementation_factors: jsonb("implementation_factors"),
  quick_implementation: boolean("quick_implementation").default(false),
  has_dependencies: boolean("has_dependencies").default(false),
  recommended_tools: jsonb("recommended_tools"),
  applicable_roles: jsonb("applicable_roles"),
  role_impact: jsonb("role_impact"),
  assessment_id: integer("assessment_id").references(() => assessments.id, { onDelete: 'cascade' }),

  // Fields for tracking duplicates - UNCOMMENTED
  is_duplicate: boolean("is_duplicate").default(false).notNull(),
  merged_into_id: integer("merged_into_id").references((): AnyPgColumn => aiCapabilitiesTable.id, { onDelete: 'set null' }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueNameCategory: uniqueIndex("ai_capabilities_name_category_idx").on(table.name, table.category)
}));

export type AICapability = InferSelectModel<typeof aiCapabilitiesTable>;
export type InsertAICapability = InferInsertModel<typeof aiCapabilitiesTable>;

// NEW Linking table for Assessment-specific AI Capability details and scores
export const assessmentAICapabilitiesTable = pgTable("assessment_ai_capabilities", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull().references(() => assessments.id, { onDelete: 'cascade' }),
  aiCapabilityId: integer("ai_capability_id").notNull().references(() => aiCapabilitiesTable.id, { onDelete: 'cascade' }),
  
  // Assessment-specific scores and details
  valueScore: numeric("value_score"), // e.g., value for this specific assessment's context
  feasibilityScore: numeric("feasibility_score"),
  impactScore: numeric("impact_score"),
  easeScore: numeric("ease_score"),
  priority: capabilityPriorityEnum("priority"),
  rank: integer("rank"), // Rank within this assessment
  implementationEffort: text("implementation_effort"), // Effort for this specific assessment
  businessValue: text("business_value"), // Value for this specific assessment
  
  // Justification or notes specific to this assessment's recommendation
  assessmentNotes: text("assessment_notes"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueAssessmentCapability: uniqueIndex("assessment_ai_capability_idx").on(table.assessmentId, table.aiCapabilityId),
}));

export type AssessmentAICapability = InferSelectModel<typeof assessmentAICapabilitiesTable>;
export type InsertAssessmentAICapability = InferInsertModel<typeof assessmentAICapabilitiesTable>;

// Add a schema with transformations to ensure numeric values
export const insertAssessmentAICapabilitySchema = createInsertSchema(assessmentAICapabilitiesTable, {
  valueScore: z.number().or(z.string().transform(val => Number(val))).optional().nullable(),
  feasibilityScore: z.number().or(z.string().transform(val => Number(val))).optional().nullable(),
  impactScore: z.number().or(z.string().transform(val => Number(val))).optional().nullable(),
  easeScore: z.number().or(z.string().transform(val => Number(val))).optional().nullable(),
  priority: z.enum(capabilityPriorityEnum.enumValues).optional().default('Medium'),
});

// New table for assessment-specific context of AI Capabilities
export const assessmentCapabilityContext = pgTable("assessment_capability_context", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull().references(() => assessments.id, { onDelete: 'cascade' }),
  aiCapabilityId: integer("ai_capability_id").notNull().references(() => aiCapabilitiesTable.id, { onDelete: 'cascade' }),
  
  // Contextual scores and details for this capability within this assessment
  valueScore: numeric("value_score").notNull(),
  feasibilityScore: numeric("feasibility_score").notNull(),
  impactScore: numeric("impact_score"), // Nullable if not always available
  priority: capabilityPriorityEnum("priority").default('Medium'),
  rank: integer("rank"), // Nullable
  
  // Contextual implementation details (if different from global defaults)
  implementationEffort: text("implementation_effort"), 
  businessValue: text("business_value"), 
  easeScore: numeric("ease_score"), // This might be feasibilityScore or a separate contextual measure
  
  // Contextual notes or justification specific to this assessment
  contextualNotes: text("contextual_notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
    uniqueContext: uniqueIndex("assessment_capability_unique_idx").on(table.assessmentId, table.aiCapabilityId)
}));

export const insertAICapabilitySchema = createInsertSchema(aiCapabilitiesTable, {
  name: z.string().min(3, "Name must be at least 3 characters"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional().nullable(),
  implementation_effort: z.string().optional().nullable(),
  business_value: z.string().optional().nullable(),
  ease_score: z.number().or(z.string().transform(val => Number(val))).optional().nullable(),
  value_score: z.number().or(z.string().transform(val => Number(val))).optional().nullable(),
  primary_category: z.string().optional().nullable(),
  license_type: z.string().optional().nullable(),
  website_url: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  default_implementation_effort: z.string().optional().nullable(),
  default_business_value: z.string().optional().nullable(),
  default_ease_score: z.number().or(z.string().transform(val => Number(val))).optional().nullable(),
  default_value_score: z.number().or(z.string().transform(val => Number(val))).optional().nullable(),
  default_feasibility_score: z.number().or(z.string().transform(val => Number(val))).optional().nullable(),
  default_impact_score: z.number().or(z.string().transform(val => Number(val))).optional().nullable(),
  feasibility_score: z.number().or(z.string().transform(val => Number(val))).optional().nullable(),
  impact_score: z.number().or(z.string().transform(val => Number(val))).optional().nullable(),
  priority: z.enum(capabilityPriorityEnum.enumValues).optional().nullable(),
  rank: z.number().int().optional().nullable(),
  implementation_factors: z.any().optional().nullable(),
  quick_implementation: z.boolean().optional(),
  has_dependencies: z.boolean().optional(),
  recommended_tools: z.any().optional().nullable(),
  applicable_roles: z.any().optional().nullable(),
  role_impact: z.any().optional().nullable(),
  assessment_id: z.number().int().optional().nullable(),
  // Add new fields for insert schema as well
  is_duplicate: z.boolean().optional(), // default is in DB
  merged_into_id: z.number().int().optional().nullable(),
}).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
});

export const insertAssessmentCapabilityContextSchema = createInsertSchema(assessmentCapabilityContext, {
  assessmentId: z.number().int(),
  aiCapabilityId: z.number().int(),
  valueScore: z.string(), // Drizzle numeric becomes string for insert
  feasibilityScore: z.string(), // Drizzle numeric becomes string for insert
  impactScore: z.string().optional().nullable(),
  rank: z.number().int().optional().nullable(),
  priority: z.enum(capabilityPriorityEnum.enumValues).optional().default('Medium'),
  implementationEffort: z.enum(["Low", "Medium", "High"]).optional().nullable(),
  businessValue: z.enum(["Low", "Medium", "High", "Very High"]).optional().nullable(),
  easeScore: z.string().optional().nullable(),
  contextualNotes: z.string().optional().nullable(),
});

// Assessment model
export const assessmentStatusEnum = pgEnum('assessment_status', ['draft', 'submitted', 'completed']);
export const industryMaturityEnum = pgEnum('industry_maturity_enum', ['Mature', 'Immature']);
export const companyStageEnum = pgEnum('company_stage_enum', ['Startup', 'Early Growth', 'Scaling', 'Mature']);

export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  userId: integer("user_id").notNull().references(() => userProfiles.id),
  status: assessmentStatusEnum("status").default("draft").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  stepData: jsonb("step_data"),

  // NEW FIELDS (FR1.x, FR3.1)
  industry: text("industry").notNull().default('Unknown'), // FR1.1.2 - selected during setup
  industryMaturity: industryMaturityEnum("industry_maturity").notNull().default('Immature'), // FR1.1.3 - selected during setup
  companyStage: companyStageEnum("company_stage").notNull().default('Startup'), // FR1.2.2 - selected during setup
  strategicFocus: text("strategic_focus").array(), // Array of strings, allows for 'Other', can be empty array if not specified
  aiAdoptionScoreInputs: jsonb("ai_adoption_score_inputs"), // Store inputs for AI Adoption Score
});

// Schema for selecting/retrieving assessments
export const selectAssessmentSchema = createSelectSchema(assessments);

// Schema for inserting new assessments (omitting db-generated fields)
export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Schema for updating assessments (making fields optional)
export const updateAssessmentSchema = insertAssessmentSchema.partial().extend({
  // updatedAt should likely be set automatically on update, not provided by client
  // stepData updates might need special handling (see note below)
});

// Report model
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull().references(() => assessments.id),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  executiveSummary: text("executive_summary"),
  prioritizationData: jsonb("prioritization_data"), // Heatmap and prioritization list data
  aiSuggestions: jsonb("ai_suggestions"), // AI capability suggestions
  performanceImpact: jsonb("performance_impact"), // KPI estimates
  consultantCommentary: text("consultant_commentary"),

  // NEW FIELDS (FR4.1, FR4.5)
  aiAdoptionScoreDetails: jsonb("ai_adoption_score_details"), // Store calculated score and components
  roiDetails: jsonb("roi_details"), // Store calculated ROI and its inputs
});

export const insertReportSchema = createInsertSchema(reports).pick({
  assessmentId: true,
  executiveSummary: true,
  prioritizationData: true,
  aiSuggestions: true,
  performanceImpact: true,
  consultantCommentary: true,
  // Add new fields to pick if they are set during report creation
  aiAdoptionScoreDetails: true,
  roiDetails: true,
});

// Scoring types
export const scoringCriteria = {
  valuePotential: {
    timeSavings: "time_savings",
    qualityImpact: "quality_impact",
    strategicAlignment: "strategic_alignment"
  },
  easeOfImplementation: {
    dataReadiness: "data_readiness",
    technicalFeasibility: "technical_feasibility",
    adoptionRisk: "adoption_risk"
  }
} as const;

export type ScoringCriterion = typeof scoringCriteria.valuePotential[keyof typeof scoringCriteria.valuePotential] | 
                              typeof scoringCriteria.easeOfImplementation[keyof typeof scoringCriteria.easeOfImplementation];

export type ScoreValue = 1 | 2 | 3 | 4 | 5;

export type RoleScore = {
  valuePotential: {
    timeSavings: ScoreValue;
    qualityImpact: ScoreValue;
    strategicAlignment: ScoreValue;
    total: number;
  };
  easeOfImplementation: {
    dataReadiness: ScoreValue;
    technicalFeasibility: ScoreValue;
    adoptionRisk: ScoreValue;
    total: number;
  };
  totalScore: number;
};

export type AssessmentScores = {
  roleScores: Record<number, RoleScore>;
  timestamp: string;
};

// First, define the AI Adoption Score components schema at the top of the file, before wizardStepDataSchema is defined
export const aiAdoptionScoreInputComponentsSchema = z.object({
  // User-facing inputs - adjust types as needed (e.g., string for user input, then parse)
  adoptionRateForecast: z.number().min(0).max(100).optional().describe("Estimated % adoption rate"),
  timeSavingsPerUserHours: z.number().min(0).optional().describe("Estimated hours saved per user per week"),
  affectedUserCount: z.number().min(0).optional().describe("Number of users affected by the AI solution"),
  costEfficiencyGainsAmount: z.number().min(0).optional().describe("Estimated direct cost savings (e.g., per year)"),
  performanceImprovementPercentage: z.number().min(0).optional().describe("Estimated % improvement in a key performance metric"),
  toolSprawlReductionScore: z.number().min(1).max(5).optional().describe("Score (1-5) for estimated benefit from tool sprawl reduction"),
});
export type AiAdoptionScoreInputComponents = z.infer<typeof aiAdoptionScoreInputComponentsSchema>;

// Now update the WizardStepData schema to include the aiAdoptionScoreInputs field
export const wizardStepDataSchema = z.object({
  basics: z.object({
    companyName: z.string().min(1, "Company Name is required"),
    reportName: z.string().min(1, "Report Name is required"),
    industry: z.string().min(1, "Industry is required"),
    size: z.string().min(1, "Company Size is required"),
    goals: z.string().optional(),
    stakeholders: z.array(z.string()).optional(),
    industryMaturity: z.enum(industryMaturityEnum.enumValues, { 
      required_error: "Industry Maturity is required",
      invalid_type_error: "Please select a valid Industry Maturity",
    }),
    companyStage: z.enum(companyStageEnum.enumValues, {
      required_error: "Company Stage is required",
      invalid_type_error: "Please select a valid Company Stage",
    }),
  }).optional(),
  
  roles: z.object({
    selectedDepartments: z.array(z.string()),
    selectedRoles: z.array(z.object({
      id: z.number().optional(),
      title: z.string(),
      department: z.string(),
      description: z.string().optional(),
      responsibilities: z.array(z.string()).optional(),
    })),
    prioritizedRoles: z.array(z.number()).optional(),
    customDepartment: z.string().optional(),
  }).optional(),
  
  painPoints: z.object({
    roleSpecificPainPoints: z.record(z.string(), z.object({
      description: z.string().optional(),
      severity: z.number().optional(),
      frequency: z.number().optional(),
      impact: z.number().optional(),
    })),
    generalPainPoints: z.string().optional(),
  }).optional(),
  
  workVolume: z.object({
    roleWorkVolume: z.record(z.string(), z.object({
      volume: z.string().optional(),
      timeSpent: z.string().optional(),
      complexity: z.string().optional(),
      errorRisk: z.string().optional(),
      repetitiveness: z.number().optional(),
      isDataDriven: z.boolean().optional(),
      dataDescription: z.string().optional(),
      hasPredictiveTasks: z.boolean().optional(),
      predictiveTasksDescription: z.string().optional(),
      needsContentGeneration: z.boolean().optional(),
      contentGenerationDescription: z.string().optional(),
      decisionComplexity: z.string().optional(),
    })),
  }).optional(),
  
  techStack: z.object({
    currentSystems: z.string().optional(),
    dataAvailability: z.array(z.string()).optional(),
    existingAutomation: z.string().optional(),
    dataQuality: z.string().optional(),
    dataQualityIssues: z.string().optional(),
    approvals: z.string().optional(),
    dataAccessibility: z.string().optional(), // Add this
    systemsIntegration: z.string().optional(), // Add this
    relevantTools: z.string().optional(), // Add this
    notes: z.string().optional(), // Add this
  }).optional(),
  
  adoption: z.object({
    roleAdoption: z.record(z.string(), z.object({
      openness: z.string().optional(),
      skillsReadiness: z.string().optional(),
      benefits: z.string().optional(),
      successCriteria: z.string().optional(),
      risks: z.string().optional(),
      suitability: z.number().optional(),    
    })),
    changeReadiness: z.string().optional(),
    stakeholderAlignment: z.string().optional(),
    expectedChallenges: z.string().optional(),
    successMetrics: z.string().optional(),
    trainingNeeds: z.string().optional(),  
  }).optional(),

  scores: z.object({
    assessmentScores: z.custom<AssessmentScores>(),
  }).optional(),
  
  // Add the aiAdoptionScoreInputs field
  aiAdoptionScoreInputs: aiAdoptionScoreInputComponentsSchema.optional(),
}).strict();

// Priority matrix types
export const priorityLevels = ["high", "medium", "low", "not_recommended"] as const;
export type PriorityLevel = typeof priorityLevels[number];

export const effortLevels = ["low", "medium", "high"] as const;
export type EffortLevel = typeof effortLevels[number];

export const valueLevels = ["high", "medium", "low"] as const;
export type ValueLevel = typeof valueLevels[number];

// Types
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export type JobRole = InferSelectModel<typeof jobRoles>;
export type InsertJobRole = InferInsertModel<typeof jobRoles>;

export type Assessment = InferSelectModel<typeof assessments>;
export type InsertAssessment = InferInsertModel<typeof assessments>;
export type NewAssessment = typeof assessments.$inferInsert;

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

// New type for Report joined with Assessment details
export type ReportWithAssessmentDetails = Report & Pick<
  Assessment,
  'industry' | 'industryMaturity' | 'companyStage' | 'strategicFocus' | 'title' // Added assessment title for context
> & { 
  organizationName?: string; // Optionally add organization name if needed
  aiAdoptionScore?: number; // AI Adoption Score for display in overview
};

export type WizardStepData = z.infer<typeof wizardStepDataSchema>;

export type PrioritizedItem = {
  id: number;
  title: string;
  department: string;
  valueScore: number;
  effortScore: number;
  priority: PriorityLevel;
  valueLevel: ValueLevel;
  effortLevel: EffortLevel;
  aiAdoptionScore?: number; // Optional AI Adoption Score
  role?: string;
  painPoint?: string;
  goal?: string;
  metrics?: Array<{  // Optional metrics for detailed view
    name: string;
    value: string;
    improvement: number;
  }>;
};

export type HeatmapData = {
  matrix: {
    [key in ValueLevel]: {
      [key in EffortLevel]: {
        priority: PriorityLevel;
        items: Array<{
          id: number;
          title: string;
          department: string;
          role?: string;
          painPoint?: string;
          goal?: string;
        }>;
      };
    };
  };
};

export type AISuggestion = {
  roleId: number;
  roleTitle: string;
  capabilities: Array<{
    name: string;
    description: string;
    recommendedTools?: Array<{
      id: number;
      name: string;
      description?: string;
      websiteUrl?: string;
      category?: string;
    }>;
  }>;
};

export type PerformanceImpact = {
  roleImpacts: Array<{
    roleTitle: string;
    metrics: Array<{
      name: string;
      improvement: number;
    }>;
  }>;
  estimatedRoi: number;
};

// Job Description models
export const jobDescriptions = pgTable("job_descriptions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  company: text("company"),
  location: text("location"),
  jobBoard: text("job_board").notNull(),
  sourceUrl: text("source_url").notNull(),
  rawContent: text("raw_content").notNull(),
  processedContent: jsonb("processed_content"),
  keywords: text("keywords").array(),
  dateScraped: timestamp("date_scraped").defaultNow().notNull(),
  dateProcessed: timestamp("date_processed"),
  status: text("status").default("raw").notNull(), // raw, processed, error
  error: text("error"),
});

export const insertJobDescriptionSchema = createInsertSchema(jobDescriptions).pick({
  title: true,
  company: true,
  location: true,
  jobBoard: true,
  sourceUrl: true,
  rawContent: true,
  keywords: true,
  status: true,
});

export const jobScraperConfigs = pgTable("job_scraper_configs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  targetWebsite: text("target_website").notNull(),
  keywords: text("keywords").array(),
  location: text("location"),
  isActive: boolean("is_active").default(true).notNull(),
  cronSchedule: text("cron_schedule").default("0 0 * * *").notNull(), // Daily at midnight by default
  lastRun: timestamp("last_run"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertJobScraperConfigSchema = createInsertSchema(jobScraperConfigs).pick({
  name: true,
  targetWebsite: true,
  keywords: true,
  location: true,
  isActive: true,
  cronSchedule: true,
});

// Types
export type JobDescription = typeof jobDescriptions.$inferSelect;
export type InsertJobDescription = z.infer<typeof insertJobDescriptionSchema>;

export type JobScraperConfig = typeof jobScraperConfigs.$inferSelect;
export type InsertJobScraperConfig = z.infer<typeof insertJobScraperConfigSchema>;

export type ProcessedJobContent = {
  skills: string[];
  experience: string[];
  education: string[];
  responsibilities: string[];
  benefits: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  jobType?: string;
  industry?: string;
  seniorityLevel?: string;
};

// New Table: Assessment Responses
export const assessmentResponses = pgTable("assessment_responses", {
  responseId: serial("response_id").primaryKey(),
  assessmentId: integer("assessment_id").notNull().references(() => assessments.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => userProfiles.id, { onDelete: 'cascade' }),
  questionIdentifier: text("question_identifier").notNull(), // Could be a path like "painPoints.roleX.severity" or a specific question ID
  responseText: text("response_text"),
  responseNumeric: numeric("response_numeric"),
  responseBoolean: boolean("response_boolean"),
  responseJson: jsonb("response_json"), // For multi-select, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// New Table: AI Tools
export const aiTools = pgTable("ai_tools", {
  tool_id: integer("tool_id").primaryKey().generatedByDefaultAsIdentity(), // Already an identity column in DB
  tool_name: text("tool_name").notNull(), //.unique(), // Making unique later if needed after cleanup
  primary_category: text("primary_category"), // Category of the tool itself
  license_type: text("license_type"),
  description: text("description"),
  website_url: text("website_url"),
  tags: text("tags").array(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
    toolNameIdx: uniqueIndex("idx_ai_tools_tool_name").on(table.tool_name), // Keep unique index attempt
}));

// Define Zod schema for insertion, omitting generated fields
export const insertAiToolSchema = createInsertSchema(aiTools).omit({
  tool_id: true, // Explicitly omit tool_id
  created_at: true,
  updated_at: true,
}).extend({
  tags: z.array(z.string()).optional().default([]), // Keep tag handling
});

// New Table: Capability Tool Mapping (Many-to-Many)
export const capabilityToolMapping = pgTable("capability_tool_mapping", {
  capability_id: integer("capability_id").notNull().references(() => aiCapabilitiesTable.id, { onDelete: 'cascade' }),
  tool_id: integer("tool_id").notNull().references(() => aiTools.tool_id, { onDelete: 'cascade' }), // References tool_id PK
  // Add primary key constraint for the combination
}, (table) => ({
    // pk: pg.primaryKey({ columns: [table.capability_id, table.tool_id] }), // Use primaryKey import
    pk: primaryKey({ columns: [table.capability_id, table.tool_id] }), // Composite primary key
}));

// New Table: Assessment Results
export const assessmentResults = pgTable("assessment_results", {
  resultId: serial("result_id").primaryKey(),
  assessmentId: integer("assessment_id").notNull().references(() => assessments.id, { onDelete: 'cascade' }),
  identifiedThemes: jsonb("identified_themes"), // e.g., [{ theme: "Efficiency", keywords: ["...", "..."] }]
  rankedPriorities: jsonb("ranked_priorities"), // e.g., [{ capabilityId: 1, value_score: 4, ease_score: 5, rank: 1 }, ...]
  recommendedCapabilities: jsonb("recommended_capabilities"), // Array of ai_capabilities.id or objects { id: X, rationale: "..." }
  capabilityRationale: jsonb("capability_rationale"), // { capabilityId: X, explanation: "..." }
  existingToolAnalysis: text("existing_tool_analysis"),
  recommendedTools: jsonb("recommended_tools"), // Array of ai_tools.id or objects { id: Y, reason: "..." }
  rolloutCommentary: text("rollout_commentary"),
  heatmapData: jsonb("heatmap_data"), // Structure for Value vs. Ease heatmap
  processingStatus: text("processing_status").default('Pending').notNull(), // 'Pending', 'Processing', 'Success', 'Failed'
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
}, (table) => {
  return {
    // Ensure only one result per assessment
    assessmentIdUnique: uniqueIndex("assessment_id_unique_idx").on(table.assessmentId),
  };
});

// Dummy table for testing
export const dummy_table = pgTable('dummy_table', {
  id: serial('id').primaryKey(),
  notes: text('notes'),
});

// Add infer types for new tables
export type AssessmentResponse = typeof assessmentResponses.$inferSelect;
export type InsertAssessmentResponse = typeof assessmentResponses.$inferInsert;

export type AiTool = typeof aiTools.$inferSelect;
// Define InsertAiTool based on the Zod schema
export type InsertAiTool = z.infer<typeof insertAiToolSchema>;
// Define the type for form data, excluding generated fields
export type AiToolFormData = Omit<AiTool, 'tool_id' | 'created_at' | 'updated_at'>; // Keep this if used elsewhere

export type CapabilityToolMapping = typeof capabilityToolMapping.$inferSelect;
export type InsertCapabilityToolMapping = typeof capabilityToolMapping.$inferInsert;

export type AssessmentResult = typeof assessmentResults.$inferSelect;
export type InsertAssessmentResult = typeof assessmentResults.$inferInsert;

// Add new table for assessment scores
export const assessmentScores = pgTable("assessment_scores", {
  id: serial("id").primaryKey(),
  wizardStepId: text("wizard_step_id").notNull().unique(),
  timeSavings: numeric("time_savings").notNull(),
  qualityImpact: numeric("quality_impact").notNull(),
  strategicAlignment: numeric("strategic_alignment").notNull(),
  dataReadiness: numeric("data_readiness").notNull(),
  technicalFeasibility: numeric("technical_feasibility").notNull(),
  adoptionRisk: numeric("adoption_risk").notNull(),
  valuePotentialTotal: numeric("value_potential_total").notNull(),
  easeOfImplementationTotal: numeric("ease_of_implementation_total").notNull(),
  totalScore: numeric("total_score").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AssessmentScore = typeof assessmentScores.$inferSelect;
export type InsertAssessmentScore = typeof assessmentScores.$inferInsert;

export interface AssessmentScoreData {
  id: string;
  wizardStepId: string;
  timeSavings: ScoreValue;
  qualityImpact: ScoreValue;
  strategicAlignment: ScoreValue;
  dataReadiness: ScoreValue;
  technicalFeasibility: ScoreValue;
  adoptionRisk: ScoreValue;
  valuePotentialTotal: number;
  easeOfImplementationTotal: number;
  totalScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssessmentScoreResponse {
  success: boolean;
  message?: string;
  data?: AssessmentScoreData;
}

// Type for JobRole including department name
export type JobRoleWithDepartment = JobRole & {
  departmentName: string;
};

// Performance Metrics model (NEW)
export const performanceMetricsRelevanceEnum = pgEnum('performance_metrics_relevance_enum', ['low', 'medium', 'high']);

export const performanceMetrics = pgTable("performance_metrics", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // e.g., "Time Saved", "Cost Reduction"
  unit: text("unit"), // e.g., "hours/week", "USD/year", "%"
  description: text("description"),
});

export const insertPerformanceMetricSchema = createInsertSchema(performanceMetrics).omit({
  id: true,
});
export const selectPerformanceMetricSchema = createSelectSchema(performanceMetrics);

// Job Role - Performance Metric Link Table (NEW)
export const jobRolePerformanceMetrics = pgTable("job_role_performance_metrics", {
  jobRoleId: integer("job_role_id").notNull().references(() => jobRoles.id, { onDelete: "cascade" }),
  performanceMetricId: integer("performance_metric_id").notNull().references(() => performanceMetrics.id, { onDelete: "cascade" }),
}, (t) => ({
  pk: primaryKey(t.jobRoleId, t.performanceMetricId)
}));

export const insertJobRolePerformanceMetricSchema = createInsertSchema(jobRolePerformanceMetrics);
export const selectJobRolePerformanceMetricSchema = createSelectSchema(jobRolePerformanceMetrics);


// Metric Relevance Rules model
// Stores rules for applying weights or conditions to metrics based on context
export const metricRules = pgTable("metric_rules", {
  id: serial("id").primaryKey(),
  metricId: integer("metric_id").notNull().references(() => performanceMetrics.id, { onDelete: "cascade" }),
  // rule_condition JSONB can define criteria based on assessment fields like company_stage, strategic_focus, etc.
  // Example: { "companyStage": "Startup", "strategicFocusIncludes": ["Efficiency"] }
  ruleCondition: jsonb("rule_condition"),
  weight: numeric("weight").notNull(), // Weight to apply if condition met
  description: text("description"), // Optional description of the rule
});

export const insertMetricRuleSchema = createInsertSchema(metricRules).omit({
  id: true,
  metricId: true,
  ruleCondition: true,
  weight: true,
  description: true,
});
export const selectMetricRuleSchema = createSelectSchema(metricRules);


// Performance Metrics
export type PerformanceMetrics = typeof performanceMetrics.$inferSelect;
export type InsertPerformanceMetrics = typeof insertPerformanceMetricSchema;
export type SelectPerformanceMetrics = typeof selectPerformanceMetricSchema;

// Job Role Performance Metrics
export type JobRolePerformanceMetrics = typeof jobRolePerformanceMetrics.$inferSelect;
export type InsertJobRolePerformanceMetrics = typeof insertJobRolePerformanceMetricSchema;
export type SelectJobRolePerformanceMetrics = typeof selectJobRolePerformanceMetricSchema;

// Metric Rules
export type MetricRules = typeof metricRules.$inferSelect;
export type InsertMetricRule = typeof insertMetricRuleSchema; // Use this for insertions
export type SelectMetricRule = typeof selectMetricRuleSchema; // Use this for selections

// New Table: Organization Score Weights (NEW)
export const organizationScoreWeights = pgTable("organization_score_weights", {
  organizationId: integer("organization_id").primaryKey().references(() => organizations.id, { onDelete: "cascade" }),
  adoptionRateWeight: numeric("adoption_rate_weight").notNull().default("0.2"), // Example default
  timeSavedWeight: numeric("time_saved_weight").notNull().default("0.2"),
  costEfficiencyWeight: numeric("cost_efficiency_weight").notNull().default("0.2"),
  performanceImprovementWeight: numeric("performance_improvement_weight").notNull().default("0.2"),
  toolSprawlReductionWeight: numeric("tool_sprawl_reduction_weight").notNull().default("0.2"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOrganizationScoreWeightsSchema = createInsertSchema(organizationScoreWeights, {
  // Accept both number and string, but always convert to number
  adoptionRateWeight: z.union([
    z.number(),
    z.string().refine(val => !isNaN(parseFloat(val)), { message: "Must be a number" }).transform(Number)
  ]),
  timeSavedWeight: z.union([
    z.number(),
    z.string().refine(val => !isNaN(parseFloat(val)), { message: "Must be a number" }).transform(Number)
  ]),
  costEfficiencyWeight: z.union([
    z.number(),
    z.string().refine(val => !isNaN(parseFloat(val)), { message: "Must be a number" }).transform(Number)
  ]),
  performanceImprovementWeight: z.union([
    z.number(),
    z.string().refine(val => !isNaN(parseFloat(val)), { message: "Must be a number" }).transform(Number)
  ]),
  toolSprawlReductionWeight: z.union([
    z.number(),
    z.string().refine(val => !isNaN(parseFloat(val)), { message: "Must be a number" }).transform(Number)
  ]),
}).omit({ updatedAt: true }); // Allow DB to handle updatedAt on insert/update

export const selectOrganizationScoreWeightsSchema = createSelectSchema(organizationScoreWeights, {
  // Convert numeric strings to numbers on select
  adoptionRateWeight: z.string().transform(Number),
  timeSavedWeight: z.string().transform(Number),
  costEfficiencyWeight: z.string().transform(Number),
  performanceImprovementWeight: z.string().transform(Number),
  toolSprawlReductionWeight: z.string().transform(Number),
});

// Organization Score Weights Types
export type OrganizationScoreWeights = z.infer<typeof selectOrganizationScoreWeightsSchema>;
export type InsertOrganizationScoreWeights = z.infer<typeof insertOrganizationScoreWeightsSchema>;

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;

// New Table: Capability Job Roles (Many-to-Many for applicableRoles)
export const capabilityJobRoles = pgTable("capability_job_roles", {
  capabilityId: integer("capability_id").notNull().references(() => aiCapabilitiesTable.id, { onDelete: "cascade" }),
  jobRoleId: integer("job_role_id").notNull().references(() => jobRoles.id, { onDelete: "cascade" }),
}, (t) => ({
  pk: primaryKey({ columns: [t.capabilityId, t.jobRoleId] }),
}));

export const selectCapabilityJobRoleSchema = createSelectSchema(capabilityJobRoles);
export const insertCapabilityJobRoleSchema = createInsertSchema(capabilityJobRoles);

export type CapabilityJobRole = typeof capabilityJobRoles.$inferSelect;
export type InsertCapabilityJobRole = typeof capabilityJobRoles.$inferInsert;


// New Table: Capability Role Impacts (Stores impact score per role for a capability)
export const capabilityRoleImpacts = pgTable("capability_role_impacts", {
  capabilityId: integer("capability_id").notNull().references(() => aiCapabilitiesTable.id, { onDelete: "cascade" }),
  jobRoleId: integer("job_role_id").notNull().references(() => jobRoles.id, { onDelete: "cascade" }), // Assuming impact is per job role
  impactScore: numeric("impact_score").notNull(), // e.g., 0-100, aligns with Capability.roleImpact
}, (t) => ({
  pk: primaryKey({ columns: [t.capabilityId, t.jobRoleId] }),
}));

export const selectCapabilityRoleImpactSchema = createSelectSchema(capabilityRoleImpacts);
export const insertCapabilityRoleImpactSchema = createInsertSchema(capabilityRoleImpacts, {
 impactScore: z.preprocess((val) => val ? parseFloat(String(val)) : undefined, z.number().min(0).max(100)),
});

export type CapabilityRoleImpact = typeof capabilityRoleImpacts.$inferSelect;
export type InsertCapabilityRoleImpact = typeof capabilityRoleImpacts.$inferInsert;

// New types for the context table
export type AssessmentCapabilityContext = typeof assessmentCapabilityContext.$inferSelect;
export type InsertAssessmentCapabilityContext = typeof assessmentCapabilityContext.$inferInsert;
