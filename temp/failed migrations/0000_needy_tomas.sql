CREATE TABLE "ai_capabilities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"description" text,
	"implementation_effort" text,
	"business_value" text,
	"ease_score" numeric,
	"value_score" numeric
);
--> statement-breakpoint
CREATE TABLE "ai_tools" (
	"tool_id" serial PRIMARY KEY NOT NULL,
	"tool_name" text NOT NULL,
	"description" text,
	"website_url" text,
	"license_type" text,
	"primary_category" text,
	"tags" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_responses" (
	"response_id" serial PRIMARY KEY NOT NULL,
	"assessment_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"question_identifier" text NOT NULL,
	"response_text" text,
	"response_numeric" numeric,
	"response_boolean" boolean,
	"response_json" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_results" (
	"result_id" serial PRIMARY KEY NOT NULL,
	"assessment_id" integer NOT NULL,
	"identified_themes" jsonb,
	"ranked_priorities" jsonb,
	"recommended_capabilities" jsonb,
	"capability_rationale" jsonb,
	"existing_tool_analysis" text,
	"recommended_tools" jsonb,
	"rollout_commentary" text,
	"heatmap_data" jsonb,
	"processing_status" text DEFAULT 'Pending' NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "assessment_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"wizard_step_id" text NOT NULL,
	"time_savings" numeric NOT NULL,
	"quality_impact" numeric NOT NULL,
	"strategic_alignment" numeric NOT NULL,
	"data_readiness" numeric NOT NULL,
	"technical_feasibility" numeric NOT NULL,
	"adoption_risk" numeric NOT NULL,
	"value_potential_total" numeric NOT NULL,
	"ease_of_implementation_total" numeric NOT NULL,
	"total_score" numeric NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "assessment_scores_wizard_step_id_unique" UNIQUE("wizard_step_id")
);
--> statement-breakpoint
CREATE TABLE "assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"organization_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"step_data" jsonb
);
--> statement-breakpoint
CREATE TABLE "capability_tool_mapping" (
	"mapping_id" serial PRIMARY KEY NOT NULL,
	"capability_id" integer NOT NULL,
	"tool_id" integer NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "job_descriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"company" text,
	"location" text,
	"job_board" text NOT NULL,
	"source_url" text NOT NULL,
	"raw_content" text NOT NULL,
	"processed_content" jsonb,
	"keywords" text[],
	"date_scraped" timestamp DEFAULT now() NOT NULL,
	"date_processed" timestamp,
	"status" text DEFAULT 'raw' NOT NULL,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "job_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"department_id" integer NOT NULL,
	"description" text,
	"key_responsibilities" text[],
	"ai_potential" text
);
--> statement-breakpoint
CREATE TABLE "job_scraper_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"target_website" text NOT NULL,
	"keywords" text[],
	"location" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"cron_schedule" text DEFAULT '0 0 * * *' NOT NULL,
	"last_run" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"industry" text NOT NULL,
	"size" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"assessment_id" integer NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"executive_summary" text,
	"prioritization_data" jsonb,
	"ai_suggestions" jsonb,
	"performance_impact" jsonb,
	"consultant_commentary" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'consultant' NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "assessment_responses" ADD CONSTRAINT "assessment_responses_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_responses" ADD CONSTRAINT "assessment_responses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capability_tool_mapping" ADD CONSTRAINT "capability_tool_mapping_capability_id_ai_capabilities_id_fk" FOREIGN KEY ("capability_id") REFERENCES "public"."ai_capabilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capability_tool_mapping" ADD CONSTRAINT "capability_tool_mapping_tool_id_ai_tools_tool_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."ai_tools"("tool_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assessment_id_unique_idx" ON "assessment_results" USING btree ("assessment_id");