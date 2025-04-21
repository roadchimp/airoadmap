import { pgTable, text, serial, integer, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
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
  implementationEffort: text("implementation_effort"), // High, Medium, Low
  businessValue: text("business_value"), // High, Medium, Low
});

export const insertAICapabilitySchema = createInsertSchema(aiCapabilities).pick({
  name: true,
  category: true,
  description: true,
  implementationEffort: true,
  businessValue: true,
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
