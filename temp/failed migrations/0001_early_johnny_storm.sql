ALTER TABLE "ai_capabilities" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "ai_tools" ALTER COLUMN "tool_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "ai_tools" ALTER COLUMN "tags" SET DATA TYPE text[];--> statement-breakpoint
ALTER TABLE "capability_tool_mapping" ADD CONSTRAINT "capability_tool_mapping_capability_id_tool_id_pk" PRIMARY KEY("capability_id","tool_id");--> statement-breakpoint
ALTER TABLE "ai_capabilities" ADD COLUMN "primary_category" text;--> statement-breakpoint
ALTER TABLE "ai_capabilities" ADD COLUMN "license_type" text;--> statement-breakpoint
ALTER TABLE "ai_capabilities" ADD COLUMN "website_url" text;--> statement-breakpoint
ALTER TABLE "ai_capabilities" ADD COLUMN "tags" text[];--> statement-breakpoint
ALTER TABLE "ai_capabilities" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_capabilities" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ai_tools_tool_name" ON "ai_tools" USING btree ("tool_name");--> statement-breakpoint
ALTER TABLE "capability_tool_mapping" DROP COLUMN "mapping_id";--> statement-breakpoint
ALTER TABLE "capability_tool_mapping" DROP COLUMN "notes";