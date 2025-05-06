import { relations } from "drizzle-orm/relations";
import { assessments, assessmentResults, assessmentResponses, users, aiCapabilities, capabilityToolMapping, aiTools } from "./schema";

export const assessmentResultsRelations = relations(assessmentResults, ({one}) => ({
	assessment: one(assessments, {
		fields: [assessmentResults.assessmentId],
		references: [assessments.id]
	}),
}));

export const assessmentsRelations = relations(assessments, ({many}) => ({
	assessmentResults: many(assessmentResults),
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

export const usersRelations = relations(users, ({many}) => ({
	assessmentResponses: many(assessmentResponses),
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

export const aiCapabilitiesRelations = relations(aiCapabilities, ({many}) => ({
	capabilityToolMappings: many(capabilityToolMapping),
}));

export const aiToolsRelations = relations(aiTools, ({many}) => ({
	capabilityToolMappings: many(capabilityToolMapping),
}));