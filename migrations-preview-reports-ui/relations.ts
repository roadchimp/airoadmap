import { relations } from "drizzle-orm/relations";
import { assessments, assessmentResponses, userProfiles, assessmentResults, organizations, jobDescriptions, jobRoles, reports, performanceMetrics, metricRules, organizationScoreWeights, departments, aiCapabilities, assessmentAiCapabilities, assessmentCapabilityContext, capabilityToolMapping, aiTools, jobRolePerformanceMetrics, capabilityJobRoles, capabilityRoleImpacts } from "./schema";

export const assessmentResponsesRelations = relations(assessmentResponses, ({one}) => ({
	assessment: one(assessments, {
		fields: [assessmentResponses.assessmentId],
		references: [assessments.id]
	}),
	userProfile: one(userProfiles, {
		fields: [assessmentResponses.userId],
		references: [userProfiles.id]
	}),
}));

export const assessmentsRelations = relations(assessments, ({one, many}) => ({
	assessmentResponses: many(assessmentResponses),
	assessmentResults: many(assessmentResults),
	organization: one(organizations, {
		fields: [assessments.organizationId],
		references: [organizations.id]
	}),
	userProfile: one(userProfiles, {
		fields: [assessments.userId],
		references: [userProfiles.id]
	}),
	reports: many(reports),
	aiCapabilities: many(aiCapabilities),
	assessmentAiCapabilities: many(assessmentAiCapabilities),
	assessmentCapabilityContexts: many(assessmentCapabilityContext),
}));

export const userProfilesRelations = relations(userProfiles, ({one, many}) => ({
	assessmentResponses: many(assessmentResponses),
	assessments: many(assessments),
	reports: many(reports),
	organization: one(organizations, {
		fields: [userProfiles.organizationId],
		references: [organizations.id]
	}),
}));

export const assessmentResultsRelations = relations(assessmentResults, ({one}) => ({
	assessment: one(assessments, {
		fields: [assessmentResults.assessmentId],
		references: [assessments.id]
	}),
}));

export const jobDescriptionsRelations = relations(jobDescriptions, ({one}) => ({
	organization: one(organizations, {
		fields: [jobDescriptions.organizationId],
		references: [organizations.id]
	}),
	jobRole: one(jobRoles, {
		fields: [jobDescriptions.jobRoleId],
		references: [jobRoles.id]
	}),
}));

export const organizationsRelations = relations(organizations, ({many}) => ({
	jobDescriptions: many(jobDescriptions),
	assessments: many(assessments),
	organizationScoreWeights: many(organizationScoreWeights),
	userProfiles: many(userProfiles),
}));

export const jobRolesRelations = relations(jobRoles, ({one, many}) => ({
	jobDescriptions: many(jobDescriptions),
	department: one(departments, {
		fields: [jobRoles.departmentId],
		references: [departments.id]
	}),
	jobRolePerformanceMetrics: many(jobRolePerformanceMetrics),
	capabilityJobRoles: many(capabilityJobRoles),
	capabilityRoleImpacts: many(capabilityRoleImpacts),
}));

export const reportsRelations = relations(reports, ({one}) => ({
	assessment: one(assessments, {
		fields: [reports.assessmentId],
		references: [assessments.id]
	}),
	userProfile: one(userProfiles, {
		fields: [reports.userId],
		references: [userProfiles.id]
	}),
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

export const departmentsRelations = relations(departments, ({many}) => ({
	jobRoles: many(jobRoles),
}));

export const aiCapabilitiesRelations = relations(aiCapabilities, ({one, many}) => ({
	assessment: one(assessments, {
		fields: [aiCapabilities.assessmentId],
		references: [assessments.id]
	}),
	aiCapability: one(aiCapabilities, {
		fields: [aiCapabilities.mergedIntoId],
		references: [aiCapabilities.id],
		relationName: "aiCapabilities_mergedIntoId_aiCapabilities_id"
	}),
	aiCapabilities: many(aiCapabilities, {
		relationName: "aiCapabilities_mergedIntoId_aiCapabilities_id"
	}),
	assessmentAiCapabilities: many(assessmentAiCapabilities),
	assessmentCapabilityContexts: many(assessmentCapabilityContext),
	capabilityToolMappings: many(capabilityToolMapping),
	capabilityJobRoles: many(capabilityJobRoles),
	capabilityRoleImpacts: many(capabilityRoleImpacts),
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