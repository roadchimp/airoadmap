-- Create helper function first
CREATE OR REPLACE FUNCTION jsonb_to_text_array(jsonb_val jsonb)
RETURNS text[] AS $$
BEGIN
  -- Handle null or non-array input gracefully
  IF jsonb_val IS NULL OR jsonb_typeof(jsonb_val) != 'array' THEN
    RETURN ARRAY[]::text[];
  END IF;
  RETURN ARRAY(SELECT jsonb_array_elements_text(jsonb_val));
END;
$$ LANGUAGE plpgsql IMMUTABLE;
--> statement-breakpoint

ALTER TABLE "ai_capabilities" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "ai_tools" ALTER COLUMN "tool_id" SET DATA TYPE integer;--> statement-breakpoint
-- Use the helper function in the USING clause
ALTER TABLE "ai_tools" ALTER COLUMN "tags" SET DATA TYPE text[] USING jsonb_to_text_array(tags);--> statement-breakpoint

-- Reorder capability_tool_mapping changes:
-- 1. Drop the original PK column first
ALTER TABLE "capability_tool_mapping" DROP COLUMN "mapping_id";--> statement-breakpoint
-- 2. Drop the constraint (REMOVED - should be implicit when column is dropped)
-- ALTER TABLE "capability_tool_mapping" DROP CONSTRAINT IF EXISTS "capability_tool_mapping_pkey"; --> statement-breakpoint
-- 3. Add the new composite primary key constraint
ALTER TABLE "capability_tool_mapping" ADD CONSTRAINT "capability_tool_mapping_capability_id_tool_id_pk" PRIMARY KEY("capability_id","tool_id");--> statement-breakpoint
-- 4. Drop other unneeded columns
ALTER TABLE "capability_tool_mapping" DROP COLUMN "notes";--> statement-breakpoint

ALTER TABLE "ai_capabilities" ADD COLUMN "primary_category" text;--> statement-breakpoint
ALTER TABLE "ai_capabilities" ADD COLUMN "license_type" text;--> statement-breakpoint
ALTER TABLE "ai_capabilities" ADD COLUMN "website_url" text;--> statement-breakpoint
ALTER TABLE "ai_capabilities" ADD COLUMN "tags" text[];--> statement-breakpoint
ALTER TABLE "ai_capabilities" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_capabilities" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ai_tools_tool_name" ON "ai_tools" USING btree ("tool_name");--> statement-breakpoint

-- Optional: Drop the helper function if not needed later (unlikely to cause harm leaving it)
-- DROP FUNCTION IF EXISTS jsonb_to_text_array(jsonb);