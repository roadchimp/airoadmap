import { pgTable, foreignKey, serial, integer, text, numeric, boolean, jsonb, timestamp, unique, real, uniqueIndex, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const aiPotentialEnum = pgEnum("ai_potential_enum", ['Low', 'Medium', 'High'])
export const assessmentStatus = pgEnum("assessment_status", ['draft', 'submitted', 'completed'])
export const capabilityPriorityEnum = pgEnum("capability_priority_enum", ['High', 'Medium', 'Low'])
export const companyStageEnum = pgEnum("company_stage_enum", ['Startup', 'Early Growth', 'Scaling', 'Mature'])
export const industryMaturityEnum = pgEnum("industry_maturity_enum", ['Mature', 'Immature'])
export const performanceMetricsRelevanceEnum = pgEnum("performance_metrics_relevance_enum", ['low', 'medium', 'high'])


export const assessmentResponses = pgTable("assessment_responses", {
	responseId: serial("response_id").primaryKey().notNull(),
	assessmentId: integer("assessment_id").notNull(),
	userId: integer("user_id").notNull(),
	questionIdentifier: text("question_identifier").notNull(),
	responseText: text("response_text"),
	responseNumeric: numeric("response_numeric"),
	responseBoolean: boolean("response_boolean"),
	responseJson: jsonb("response_json"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.assessmentId],
			foreignColumns: [assessments.id],
			name: "assessment_responses_assessment_id_assessments_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "assessment_responses_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	username: text().notNull(),
	password: text().notNull(),
	fullName: text("full_name").notNull(),
	email: text().notNull(),
	role: text().default('consultant').notNull(),
}, (table) => [
	unique("users_username_unique").on(table.username),
]);

export const playingWithNeon = pgTable("playing_with_neon", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	value: real(),
});

export const aiTools = pgTable("ai_tools", {
	toolId: integer("tool_id").primaryKey().generatedByDefaultAsIdentity({ name: "ai_tools_tool_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	toolName: text("tool_name").notNull(),
	primaryCategory: text("primary_category"),
	licenseType: text("license_type"),
	description: text(),
	websiteUrl: text("website_url"),
	tags: text().array(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("idx_ai_tools_tool_name").using("btree", table.toolName.asc().nullsLast().op("text_ops")),
]);

export const assessmentResults = pgTable("assessment_results", {
	resultId: serial("result_id").primaryKey().notNull(),
	assessmentId: integer("assessment_id").notNull(),
	identifiedThemes: jsonb("identified_themes"),
	rankedPriorities: jsonb("ranked_priorities"),
	recommendedCapabilities: jsonb("recommended_capabilities"),
	capabilityRationale: jsonb("capability_rationale"),
	existingToolAnalysis: text("existing_tool_analysis"),
	recommendedTools: jsonb("recommended_tools"),
	rolloutCommentary: text("rollout_commentary"),
	heatmapData: jsonb("heatmap_data"),
	processingStatus: text("processing_status").default('Pending').notNull(),
	errorMessage: text("error_message"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
}, (table) => [
	uniqueIndex("assessment_id_unique_idx").using("btree", table.assessmentId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.assessmentId],
			foreignColumns: [assessments.id],
			name: "assessment_results_assessment_id_assessments_id_fk"
		}).onDelete("cascade"),
]);

export const assessmentScores = pgTable("assessment_scores", {
	id: serial().primaryKey().notNull(),
	wizardStepId: text("wizard_step_id").notNull(),
	timeSavings: numeric("time_savings").notNull(),
	qualityImpact: numeric("quality_impact").notNull(),
	strategicAlignment: numeric("strategic_alignment").notNull(),
	dataReadiness: numeric("data_readiness").notNull(),
	technicalFeasibility: numeric("technical_feasibility").notNull(),
	adoptionRisk: numeric("adoption_risk").notNull(),
	valuePotentialTotal: numeric("value_potential_total").notNull(),
	easeOfImplementationTotal: numeric("ease_of_implementation_total").notNull(),
	totalScore: numeric("total_score").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("assessment_scores_wizard_step_id_unique").on(table.wizardStepId),
]);

export const jobDescriptions = pgTable("job_descriptions", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	company: text(),
	location: text(),
	jobBoard: text("job_board").notNull(),
	sourceUrl: text("source_url").notNull(),
	rawContent: text("raw_content").notNull(),
	processedContent: jsonb("processed_content"),
	keywords: text().array(),
	dateScraped: timestamp("date_scraped", { mode: 'string' }).defaultNow().notNull(),
	dateProcessed: timestamp("date_processed", { mode: 'string' }),
	status: text().default('raw').notNull(),
	error: text(),
});

export const jobScraperConfigs = pgTable("job_scraper_configs", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	targetWebsite: text("target_website").notNull(),
	keywords: text().array(),
	location: text(),
	isActive: boolean("is_active").default(true).notNull(),
	cronSchedule: text("cron_schedule").default('0 0 * * *').notNull(),
	lastRun: timestamp("last_run", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const departments = pgTable("departments", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
});

export const assessments = pgTable("assessments", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	organizationId: integer("organization_id").notNull(),
	userId: integer("user_id").notNull(),
	status: assessmentStatus().default('draft').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	stepData: jsonb("step_data"),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	industry: text().default('Unknown').notNull(),
	industryMaturity: industryMaturityEnum("industry_maturity").default('Immature').notNull(),
	companyStage: companyStageEnum("company_stage").default('Startup').notNull(),
	strategicFocus: text("strategic_focus").array(),
	aiAdoptionScoreInputs: jsonb("ai_adoption_score_inputs"),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "assessments_organization_id_organizations_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "assessments_user_id_users_id_fk"
		}),
]);

export const reports = pgTable("reports", {
	id: serial().primaryKey().notNull(),
	assessmentId: integer("assessment_id").notNull(),
	generatedAt: timestamp("generated_at", { mode: 'string' }).defaultNow().notNull(),
	executiveSummary: text("executive_summary"),
	prioritizationData: jsonb("prioritization_data"),
	aiSuggestions: jsonb("ai_suggestions"),
	performanceImpact: jsonb("performance_impact"),
	consultantCommentary: text("consultant_commentary"),
	aiAdoptionScoreDetails: jsonb("ai_adoption_score_details"),
	roiDetails: jsonb("roi_details"),
}, (table) => [
	foreignKey({
			columns: [table.assessmentId],
			foreignColumns: [assessments.id],
			name: "reports_assessment_id_assessments_id_fk"
		}),
]);

export const jobRoles = pgTable("job_roles", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	departmentId: integer("department_id").notNull(),
	description: text(),
	keyResponsibilities: text("key_responsibilities").array(),
	aiPotential: aiPotentialEnum("ai_potential").default('Medium'),
}, (table) => [
	foreignKey({
			columns: [table.departmentId],
			foreignColumns: [departments.id],
			name: "job_roles_department_id_departments_id_fk"
		}),
]);

export const performanceMetrics = pgTable("performance_metrics", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	unit: text(),
	description: text(),
}, (table) => [
	unique("performance_metrics_name_unique").on(table.name),
]);

export const metricRules = pgTable("metric_rules", {
	id: serial().primaryKey().notNull(),
	metricId: integer("metric_id").notNull(),
	ruleCondition: jsonb("rule_condition"),
	weight: numeric().notNull(),
	description: text(),
}, (table) => [
	foreignKey({
			columns: [table.metricId],
			foreignColumns: [performanceMetrics.id],
			name: "metric_rules_metric_id_performance_metrics_id_fk"
		}).onDelete("cascade"),
]);

export const organizationScoreWeights = pgTable("organization_score_weights", {
	organizationId: integer("organization_id").primaryKey().notNull(),
	adoptionRateWeight: numeric("adoption_rate_weight").default('0.2').notNull(),
	timeSavedWeight: numeric("time_saved_weight").default('0.2').notNull(),
	costEfficiencyWeight: numeric("cost_efficiency_weight").default('0.2').notNull(),
	performanceImprovementWeight: numeric("performance_improvement_weight").default('0.2').notNull(),
	toolSprawlReductionWeight: numeric("tool_sprawl_reduction_weight").default('0.2').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "organization_score_weights_organization_id_organizations_id_fk"
		}).onDelete("cascade"),
]);

export const dummyTable = pgTable("dummy_table", {
	id: serial().primaryKey().notNull(),
	notes: text(),
});

export const aiCapabilities = pgTable("ai_capabilities", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "ai_capabilities_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: text().notNull(),
	category: text().notNull(),
	description: text(),
	implementationEffort: text("implementation_effort"),
	businessValue: text("business_value"),
	easeScore: numeric("ease_score"),
	valueScore: numeric("value_score"),
	primaryCategory: text("primary_category"),
	licenseType: text("license_type"),
	websiteUrl: text("website_url"),
	tags: text().array(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	defaultImplementationEffort: text("default_implementation_effort"),
	defaultBusinessValue: text("default_business_value"),
	defaultEaseScore: numeric("default_ease_score"),
	defaultValueScore: numeric("default_value_score"),
	defaultFeasibilityScore: numeric("default_feasibility_score"),
	defaultImpactScore: numeric("default_impact_score"),
	feasibilityScore: numeric("feasibility_score"),
	impactScore: numeric("impact_score"),
	priority: capabilityPriorityEnum().default('Medium'),
	rank: integer(),
	implementationFactors: jsonb("implementation_factors"),
	quickImplementation: boolean("quick_implementation").default(false),
	hasDependencies: boolean("has_dependencies").default(false),
	recommendedTools: jsonb("recommended_tools"),
	applicableRoles: jsonb("applicable_roles"),
	roleImpact: jsonb("role_impact"),
	assessmentId: integer("assessment_id"),
	isDuplicate: boolean("is_duplicate").default(false).notNull(),
	mergedIntoId: integer("merged_into_id"),
}, (table) => [
	uniqueIndex("ai_capabilities_name_category_idx").using("btree", table.name.asc().nullsLast().op("text_ops"), table.category.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.assessmentId],
			foreignColumns: [assessments.id],
			name: "ai_capabilities_assessment_id_assessments_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.mergedIntoId],
			foreignColumns: [table.id],
			name: "ai_capabilities_merged_into_id_ai_capabilities_id_fk"
		}).onDelete("set null"),
]);

export const organizations = pgTable("organizations", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	industry: text().notNull(),
	size: text().notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const assessmentAiCapabilities = pgTable("assessment_ai_capabilities", {
	id: serial().primaryKey().notNull(),
	assessmentId: integer("assessment_id").notNull(),
	aiCapabilityId: integer("ai_capability_id").notNull(),
	valueScore: numeric("value_score"),
	feasibilityScore: numeric("feasibility_score"),
	impactScore: numeric("impact_score"),
	easeScore: numeric("ease_score"),
	priority: capabilityPriorityEnum(),
	rank: integer(),
	implementationEffort: text("implementation_effort"),
	businessValue: text("business_value"),
	assessmentNotes: text("assessment_notes"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	uniqueIndex("assessment_ai_capability_idx").using("btree", table.assessmentId.asc().nullsLast().op("int4_ops"), table.aiCapabilityId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.assessmentId],
			foreignColumns: [assessments.id],
			name: "assessment_ai_capabilities_assessment_id_assessments_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.aiCapabilityId],
			foreignColumns: [aiCapabilities.id],
			name: "assessment_ai_capabilities_ai_capability_id_ai_capabilities_id_"
		}).onDelete("cascade"),
]);

export const assessmentCapabilityContext = pgTable("assessment_capability_context", {
	id: serial().primaryKey().notNull(),
	assessmentId: integer("assessment_id").notNull(),
	aiCapabilityId: integer("ai_capability_id").notNull(),
	valueScore: numeric("value_score").notNull(),
	feasibilityScore: numeric("feasibility_score").notNull(),
	impactScore: numeric("impact_score"),
	priority: capabilityPriorityEnum().default('Medium'),
	rank: integer(),
	implementationEffort: text("implementation_effort"),
	businessValue: text("business_value"),
	easeScore: numeric("ease_score"),
	contextualNotes: text("contextual_notes"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("assessment_capability_unique_idx").using("btree", table.assessmentId.asc().nullsLast().op("int4_ops"), table.aiCapabilityId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.assessmentId],
			foreignColumns: [assessments.id],
			name: "assessment_capability_context_assessment_id_assessments_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.aiCapabilityId],
			foreignColumns: [aiCapabilities.id],
			name: "assessment_capability_context_ai_capability_id_ai_capabilities_"
		}).onDelete("cascade"),
]);

export const userProfiles = pgTable("user_profiles", {
	id: serial().primaryKey().notNull(),
	authId: text("auth_id").notNull(),
	organizationId: integer("organization_id"),
	fullName: text("full_name"),
	avatarUrl: text("avatar_url"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "user_profiles_organization_id_organizations_id_fk"
		}),
	unique("user_profiles_auth_id_unique").on(table.authId),
]);

export const capabilityToolMapping = pgTable("capability_tool_mapping", {
	capabilityId: integer("capability_id").notNull(),
	toolId: integer("tool_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.capabilityId],
			foreignColumns: [aiCapabilities.id],
			name: "capability_tool_mapping_capability_id_ai_capabilities_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.toolId],
			foreignColumns: [aiTools.toolId],
			name: "capability_tool_mapping_tool_id_ai_tools_tool_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.capabilityId, table.toolId], name: "capability_tool_mapping_capability_id_tool_id_pk"}),
]);

export const jobRolePerformanceMetrics = pgTable("job_role_performance_metrics", {
	jobRoleId: integer("job_role_id").notNull(),
	performanceMetricId: integer("performance_metric_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.jobRoleId],
			foreignColumns: [jobRoles.id],
			name: "job_role_performance_metrics_job_role_id_job_roles_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.performanceMetricId],
			foreignColumns: [performanceMetrics.id],
			name: "job_role_performance_metrics_performance_metric_id_performance_"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.jobRoleId, table.performanceMetricId], name: "job_role_performance_metrics_job_role_id_performance_metric_id_"}),
]);

export const capabilityJobRoles = pgTable("capability_job_roles", {
	capabilityId: integer("capability_id").notNull(),
	jobRoleId: integer("job_role_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.capabilityId],
			foreignColumns: [aiCapabilities.id],
			name: "capability_job_roles_capability_id_ai_capabilities_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.jobRoleId],
			foreignColumns: [jobRoles.id],
			name: "capability_job_roles_job_role_id_job_roles_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.capabilityId, table.jobRoleId], name: "capability_job_roles_capability_id_job_role_id_pk"}),
]);

export const capabilityRoleImpacts = pgTable("capability_role_impacts", {
	capabilityId: integer("capability_id").notNull(),
	jobRoleId: integer("job_role_id").notNull(),
	impactScore: numeric("impact_score").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.capabilityId],
			foreignColumns: [aiCapabilities.id],
			name: "capability_role_impacts_capability_id_ai_capabilities_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.jobRoleId],
			foreignColumns: [jobRoles.id],
			name: "capability_role_impacts_job_role_id_job_roles_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.capabilityId, table.jobRoleId], name: "capability_role_impacts_capability_id_job_role_id_pk"}),
]);
