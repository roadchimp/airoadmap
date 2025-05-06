import { pgTable, uniqueIndex, integer, text, timestamp, foreignKey, serial, jsonb, numeric, unique, boolean, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const aiTools = pgTable("ai_tools", {
	toolId: integer("tool_id").primaryKey().notNull(),
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

export const aiCapabilities = pgTable("ai_capabilities", {
	id: integer().primaryKey().notNull(),
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
});

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

export const departments = pgTable("departments", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
});

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

export const assessments = pgTable("assessments", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	organizationId: integer("organization_id").notNull(),
	userId: integer("user_id").notNull(),
	status: text().default('draft').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	stepData: jsonb("step_data"),
});

export const jobRoles = pgTable("job_roles", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	departmentId: integer("department_id").notNull(),
	description: text(),
	keyResponsibilities: text("key_responsibilities").array(),
	aiPotential: text("ai_potential"),
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

export const organizations = pgTable("organizations", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	industry: text().notNull(),
	size: text().notNull(),
	description: text(),
});

export const reports = pgTable("reports", {
	id: serial().primaryKey().notNull(),
	assessmentId: integer("assessment_id").notNull(),
	generatedAt: timestamp("generated_at", { mode: 'string' }).defaultNow().notNull(),
	executiveSummary: text("executive_summary"),
	prioritizationData: jsonb("prioritization_data"),
	aiSuggestions: jsonb("ai_suggestions"),
	performanceImpact: jsonb("performance_impact"),
	consultantCommentary: text("consultant_commentary"),
});

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
