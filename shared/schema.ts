import { pgTable, text, serial, integer, jsonb, timestamp, boolean, numeric, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model for authentication (minimal for v1)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  role: text("role").default("consultant").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  role: true,
});

// Company/Organization model
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  industry: text("industry").notNull(),
  size: text("size").notNull(), // Small, Medium, Large, Enterprise
  description: text("description"),
});

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
});

export const insertDepartmentSchema = createInsertSchema(departments).pick({
  name: true,
  description: true,
});

// Job Role model
export const jobRoles = pgTable("job_roles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  departmentId: integer("department_id").notNull(),
  description: text("description"),
  keyResponsibilities: text("key_responsibilities").array(),
  aiPotential: text("ai_potential"), // High, Medium, Low
});

export const insertJobRoleSchema = createInsertSchema(jobRoles).pick({
  title: true,
  departmentId: true,
  description: true,
  keyResponsibilities: true,
  aiPotential: true,
});

// AI Capability model
export const aiCapabilities = pgTable("ai_capabilities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  implementationEffort: text("implementation_effort"), // High, Medium, Low (Qualitative)
  businessValue: text("business_value"), // High, Medium, Low (Qualitative)
  // Add numeric scores for calculations
  easeScore: numeric("ease_score"), // Quantitative score for ease (e.g., 1-5)
  valueScore: numeric("value_score"), // Quantitative score for value (e.g., 1-5)
});

export const insertAICapabilitySchema = createInsertSchema(aiCapabilities).pick({
  name: true,
  category: true,
  description: true,
  implementationEffort: true,
  businessValue: true,
  easeScore: true,
  valueScore: true,
}).extend({
  businessValue: z.enum(["Low", "Medium", "High", "Very High"]).default("Medium"),
  implementationEffort: z.enum(["Low", "Medium", "High"]).default("Medium"),
});

// Assessment model
export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  organizationId: integer("organization_id").notNull(),
  userId: integer("user_id").notNull(),
  status: text("status").default("draft").notNull(), // draft, completed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  stepData: jsonb("step_data"), // Store all wizard step data as a JSON object
});

export const insertAssessmentSchema = createInsertSchema(assessments).pick({
  title: true,
  organizationId: true,
  userId: true,
  status: true,
  stepData: true,
});

// Report model
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  executiveSummary: text("executive_summary"),
  prioritizationData: jsonb("prioritization_data"), // Heatmap and prioritization list data
  aiSuggestions: jsonb("ai_suggestions"), // AI capability suggestions
  performanceImpact: jsonb("performance_impact"), // KPI estimates
  consultantCommentary: text("consultant_commentary"),
});

export const insertReportSchema = createInsertSchema(reports).pick({
  assessmentId: true,
  executiveSummary: true,
  prioritizationData: true,
  aiSuggestions: true,
  performanceImpact: true,
  consultantCommentary: true,
});

// Wizard Step Data schema
export const wizardStepDataSchema = z.object({
  basics: z.object({
    companyName: z.string(),
    industry: z.string(),
    size: z.string(),
    goals: z.string(),
    stakeholders: z.array(z.string()),
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
    })),
  }).optional(),
  
  techStack: z.object({
    currentSystems: z.string().optional(),
    dataAvailability: z.array(z.string()).optional(), 
    existingAutomation: z.string().optional(),
    dataQuality: z.number().optional(),
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
  }).optional(),
});

// Priority matrix types
export const priorityLevels = ["high", "medium", "low", "not_recommended"] as const;
export type PriorityLevel = typeof priorityLevels[number];

export const effortLevels = ["low", "medium", "high"] as const;
export type EffortLevel = typeof effortLevels[number];

export const valueLevels = ["high", "medium", "low"] as const;
export type ValueLevel = typeof valueLevels[number];

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export type JobRole = typeof jobRoles.$inferSelect;
export type InsertJobRole = z.infer<typeof insertJobRoleSchema>;

export type AICapability = typeof aiCapabilities.$inferSelect;
export type InsertAICapability = z.infer<typeof insertAICapabilitySchema>;

export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

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
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  questionIdentifier: text("question_identifier").notNull(), // Could be a path like "painPoints.roleX.severity" or a specific question ID
  responseText: text("response_text"),
  responseNumeric: numeric("response_numeric"),
  responseBoolean: boolean("response_boolean"),
  responseJson: jsonb("response_json"), // For multi-select, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// New Table: AI Tools
export const aiTools = pgTable("ai_tools", {
  toolId: serial("tool_id").primaryKey(),
  toolName: text("tool_name").notNull(),
  description: text("description"),
  websiteUrl: text("website_url"),
  licenseType: text("license_type"), // 'Open Source', 'Commercial', 'Freemium', etc.
  primaryCategory: text("primary_category"), // Align with ai_capabilities categories?
  tags: jsonb("tags"), // Using JSONB for flexible tagging
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(), // Consider onUpdateNow() trigger in DB
});

// New Table: Capability Tool Mapping (Many-to-Many)
export const capabilityToolMapping = pgTable("capability_tool_mapping", {
  mappingId: serial("mapping_id").primaryKey(),
  capabilityId: integer("capability_id").notNull().references(() => aiCapabilities.id, { onDelete: 'cascade' }),
  toolId: integer("tool_id").notNull().references(() => aiTools.toolId, { onDelete: 'cascade' }),
  notes: text("notes"), // Optional notes on suitability, integration, etc.
});

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

// Add infer types for new tables
export type AssessmentResponse = typeof assessmentResponses.$inferSelect;
export type InsertAssessmentResponse = typeof assessmentResponses.$inferInsert;

export type AiTool = typeof aiTools.$inferSelect;
export type InsertAiTool = typeof aiTools.$inferInsert;

export type CapabilityToolMapping = typeof capabilityToolMapping.$inferSelect;
export type InsertCapabilityToolMapping = typeof capabilityToolMapping.$inferInsert;

export type AssessmentResult = typeof assessmentResults.$inferSelect;
export type InsertAssessmentResult = typeof assessmentResults.$inferInsert;
