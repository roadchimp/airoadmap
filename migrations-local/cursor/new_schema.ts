import { sql } from 'drizzle-orm';
import { pgTable, pgEnum, text, serial, integer, jsonb, timestamp, boolean, numeric, uniqueIndex, primaryKey } from "drizzle-orm/pg-core";

// Reusing existing enums
export const assessmentStatusEnum = pgEnum('assessment_status', ['draft', 'submitted', 'completed']);
export const industryMaturityEnum = pgEnum('industry_maturity_enum', ['Mature', 'Immature']);
export const companyStageEnum = pgEnum('company_stage_enum', ['Startup', 'Early Growth', 'Scaling', 'Mature']);
export const aiPotentialEnum = pgEnum('ai_potential_enum', ['Low', 'Medium', 'High']);
export const performanceMetricsRelevanceEnum = pgEnum('performance_metrics_relevance_enum', ['low', 'medium', 'high']);

// Creating new enum with the correct ordering
export const capabilityPriorityEnum = pgEnum('capability_priority_enum', ['High', 'Medium', 'Low']);

// Common tables like users, organizations, departments, etc. would be defined here
// ...

// AI Capability model - UPDATED to be GLOBAL
export const aiCapabilities = pgTable("ai_capabilities", {
  id: serial("id").primaryKey(), // Changed from integer to serial
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  
  // Global/default values (new columns)
  defaultImplementationEffort: text("default_implementation_effort"), 
  defaultBusinessValue: text("default_business_value"),
  defaultEaseScore: numeric("default_ease_score"), 
  defaultValueScore: numeric("default_value_score"),
  defaultFeasibilityScore: numeric("default_feasibility_score"),
  defaultImpactScore: numeric("default_impact_score"),
  
  tags: text("tags").array(), // Global tags for the capability
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueNameCategory: uniqueIndex("ai_capabilities_name_category_idx").on(table.name, table.category),
}));

// NEW Linking table for Assessment-specific AI Capability details and scores
export const assessmentAICapabilities = pgTable("assessment_ai_capabilities", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull().references(() => assessments.id, { onDelete: 'cascade' }),
  aiCapabilityId: integer("ai_capability_id").notNull().references(() => aiCapabilities.id, { onDelete: 'cascade' }),
  
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

// New table for assessment-specific context of AI Capabilities
export const assessmentCapabilityContext = pgTable("assessment_capability_context", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull().references(() => assessments.id, { onDelete: 'cascade' }),
  aiCapabilityId: integer("ai_capability_id").notNull().references(() => aiCapabilities.id, { onDelete: 'cascade' }),
  
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

// Make sure to include assessments table since it's referenced
export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  organizationId: integer("organization_id").notNull(),
  userId: integer("user_id").notNull(),
  status: assessmentStatusEnum("status").default("draft").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  stepData: jsonb("step_data"),

  // Include any other fields needed for assessments
  industry: text("industry").notNull().default('Unknown'),
  industryMaturity: industryMaturityEnum("industry_maturity").notNull().default('Immature'),
  companyStage: companyStageEnum("company_stage").notNull().default('Startup'),
  strategicFocus: text("strategic_focus").array(),
  aiAdoptionScoreInputs: jsonb("ai_adoption_score_inputs"),
}); 