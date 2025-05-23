import { relations } from "drizzle-orm/relations";
import { organizations, userProfiles, assessments, assessmentAiCapabilities, aiCapabilities, assessmentCapabilityContext, users, assessmentResponses, assessmentResults, departments, jobRoles, performanceMetrics, metricRules, organizationScoreWeights, reports, capabilityJobRoles, capabilityToolMapping, aiTools, jobRolePerformanceMetrics, capabilityRoleImpacts } from "./schema";

export const userProfilesRelations = relations(userProfiles, ({one}) => ({
	organization: one(organizations, {
		fields: [userProfiles.organizationId],
		references: [organizations.id]
	}),
}));

export const organizationsRelations = relations(organizations, ({many}) => ({
	userProfiles: many(userProfiles),
	assessments: many(assessments),
	organizationScoreWeights: many(organizationScoreWeights),
}));

export const assessmentAiCapabilitiesRelations = relations(assessmentAiCapabilities, ({one}) => ({
	assessment: one(assessments, {
		fields: [assessmentAiCapabilities.assessmentId],
		references: [assessments.id]
	}),
	aiCapability: one(aiCapabilities, {
		fields: [assessmentAiCapabilities.aiCapabilityId],
		references: [aiCapabilities.id]
	}),
}));

export const assessmentsRelations = relations(assessments, ({one, many}) => ({
	assessmentAiCapabilities: many(assessmentAiCapabilities),
	assessmentCapabilityContexts: many(assessmentCapabilityContext),
	organization: one(organizations, {
		fields: [assessments.organizationId],
		references: [organizations.id]
	}),
	user: one(users, {
		fields: [assessments.userId],
		references: [users.id]
	}),
	assessmentResponses: many(assessmentResponses),
	assessmentResults: many(assessmentResults),
	reports: many(reports),
	aiCapabilities: many(aiCapabilities),
}));

export const aiCapabilitiesRelations = relations(aiCapabilities, ({one, many}) => ({
	assessmentAiCapabilities: many(assessmentAiCapabilities),
	assessmentCapabilityContexts: many(assessmentCapabilityContext),
	assessment: one(assessments, {
		fields: [aiCapabilities.assessmentId],
		references: [assessments.id]
	}),
	capabilityJobRoles: many(capabilityJobRoles),
	capabilityToolMappings: many(capabilityToolMapping),
	capabilityRoleImpacts: many(capabilityRoleImpacts),
}));

export const assessmentCapabilityContextRelations = relations(assessmentCapabilityContext, ({one}) => ({
	assessment: one(assessments, {
		fields: [assessmentCapabilityContext.assessmentId],
		references: [assessments.id]
	}),
	aiCapability: one(aiCapabilities, {
		fields: [assessmentCapabilityContext.aiCapabilityId],
		references: [aiCapabilities.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	assessments: many(assessments),
	assessmentResponses: many(assessmentResponses),
}));

export const assessmentResponsesRelations = relations(assessmentResponses, ({one}) => ({
	assessment: one(assessments, {
		fields: [assessmentResponses.assessmentId],
		references: [assessments.id]
	}),
	user: one(users, {
		fields: [assessmentResponses.userId],
		references: [users.id]
	}),
}));

export const assessmentResultsRelations = relations(assessmentResults, ({one}) => ({
	assessment: one(assessments, {
		fields: [assessmentResults.assessmentId],
		references: [assessments.id]
	}),
}));

export const jobRolesRelations = relations(jobRoles, ({one, many}) => ({
	department: one(departments, {
		fields: [jobRoles.departmentId],
		references: [departments.id]
	}),
	capabilityJobRoles: many(capabilityJobRoles),
	jobRolePerformanceMetrics: many(jobRolePerformanceMetrics),
	capabilityRoleImpacts: many(capabilityRoleImpacts),
}));

export const departmentsRelations = relations(departments, ({many}) => ({
	jobRoles: many(jobRoles),
}));

export const metricRulesRelations = relations(metricRules, ({one}) => ({
	performanceMetric: one(performanceMetrics, {
		fields: [metricRules.metricId],
		references: [performanceMetrics.id]
	}),
}));

export const performanceMetricsRelations = relations(performanceMetrics, ({many}) => ({
	metricRules: many(metricRules),
	jobRolePerformanceMetrics: many(jobRolePerformanceMetrics),
}));

export const organizationScoreWeightsRelations = relations(organizationScoreWeights, ({one}) => ({
	organization: one(organizations, {
		fields: [organizationScoreWeights.organizationId],
		references: [organizations.id]
	}),
}));

export const reportsRelations = relations(reports, ({one}) => ({
	assessment: one(assessments, {
		fields: [reports.assessmentId],
		references: [assessments.id]
	}),
}));

export const capabilityJobRolesRelations = relations(capabilityJobRoles, ({one}) => ({
	aiCapability: one(aiCapabilities, {
		fields: [capabilityJobRoles.capabilityId],
		references: [aiCapabilities.id]
	}),
	jobRole: one(jobRoles, {
		fields: [capabilityJobRoles.jobRoleId],
		references: [jobRoles.id]
	}),
}));

export const capabilityToolMappingRelations = relations(capabilityToolMapping, ({one}) => ({
	aiCapability: one(aiCapabilities, {
		fields: [capabilityToolMapping.capabilityId],
		references: [aiCapabilities.id]
	}),
	aiTool: one(aiTools, {
		fields: [capabilityToolMapping.toolId],
		references: [aiTools.toolId]
	}),
}));

export const aiToolsRelations = relations(aiTools, ({many}) => ({
	capabilityToolMappings: many(capabilityToolMapping),
}));

export const jobRolePerformanceMetricsRelations = relations(jobRolePerformanceMetrics, ({one}) => ({
	jobRole: one(jobRoles, {
		fields: [jobRolePerformanceMetrics.jobRoleId],
		references: [jobRoles.id]
	}),
	performanceMetric: one(performanceMetrics, {
		fields: [jobRolePerformanceMetrics.performanceMetricId],
		references: [performanceMetrics.id]
	}),
}));

export const capabilityRoleImpactsRelations = relations(capabilityRoleImpacts, ({one}) => ({
	aiCapability: one(aiCapabilities, {
		fields: [capabilityRoleImpacts.capabilityId],
		references: [aiCapabilities.id]
	}),
	jobRole: one(jobRoles, {
		fields: [capabilityRoleImpacts.jobRoleId],
		references: [jobRoles.id]
	}),
}));