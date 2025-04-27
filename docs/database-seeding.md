# Database Seeding Guide

This guide outlines the steps to clear and re-seed the local PostgreSQL database (`airoadmap`) for the AI Roadmap project.

## Prerequisites

1.  **Node.js & npm:** Ensure Node.js (which includes npm) is installed.
2.  **PostgreSQL:** A local PostgreSQL server must be running.
3.  **Database:** The `airoadmap` database must exist.
4.  **`.env` File:** A valid `.env` file should be present in the project root, containing connection details for the local database (e.g., `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`).
5.  **Dependencies:** Run `npm install` to ensure all project dependencies are installed.
6.  **Schema:** Ensure the database schema is up-to-date by running `npm run db:push`. If you encounter issues later, re-running this might help.

## Seeding Process

The seeding process involves populating the `ai_capabilities`, `ai_tools`, and `capability_tool_mapping` tables using data from JSON/JSONL files located in `server/batch-processing/`.

### Optional: Clear Existing Data

If you want to start with empty tables, run the following commands using `psql` or a database client connected to the `airoadmap` database. **Warning:** This will delete all data in these tables.

```sql
TRUNCATE TABLE capability_tool_mapping, ai_tools, ai_capabilities RESTART IDENTITY CASCADE;
-- Or truncate individually if preferred:
-- TRUNCATE TABLE capability_tool_mapping RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE ai_tools RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE ai_capabilities RESTART IDENTITY CASCADE;
```

### Phase 1: Seed Base Capabilities

This phase populates the `ai_capabilities` table with the initial set of core capabilities.

1.  **Script:** `server/scripts/seedCapabilities.ts`
2.  **Input File:** `server/batch-processing/SDR_capabilities_clean.json`
3.  **Command:**
    ```bash
    npx tsx server/scripts/seedCapabilities.ts
    ```
4.  **Verification:**
    ```bash
    # Check count (should be 7 initially)
    psql -U postgres -d airoadmap -h localhost -p 5432 -c "SELECT COUNT(*) FROM ai_capabilities;" | cat
    # Optionally view data
    psql -U postgres -d airoadmap -h localhost -p 5432 -c "SELECT * FROM ai_capabilities ORDER BY id LIMIT 10;" | cat
    ```

### Phase 2: Process Job Descriptions & New Capability Suggestions

This phase processes batch output containing job responsibilities and suggested new capabilities, adding the suggestions to the `ai_capabilities` table.

1.  **Script:** `server/scripts/processBatchOutput.ts`
2.  **Input File:** `server/batch-processing/SDR_batch_output.jsonl`
3.  **Output File (Reference):** `server/job_responsibility_mappings.json`
4.  **Command:**
    ```bash
    npx tsx server/scripts/processBatchOutput.ts
    ```
5.  **Verification:**
    ```bash
    # Check count (should increase from Phase 1)
    psql -U postgres -d airoadmap -h localhost -p 5432 -c "SELECT COUNT(*) FROM ai_capabilities;" | cat
    # Check for 'Suggested' category
    psql -U postgres -d airoadmap -h localhost -p 5432 -c "SELECT * FROM ai_capabilities WHERE category = 'Suggested' ORDER BY id LIMIT 10;" | cat
    # Check the generated mappings file
    ls -l server/job_responsibility_mappings.json
    ```

### Phase 3: Populate Tools & Mappings

This phase processes batch output containing suggested tools for capabilities, populating the `ai_tools` table and linking them in `capability_tool_mapping`.

1.  **Script:** `server/scripts/processToolBatchOutput.ts`
2.  **Input File:** `server/batch-processing/responses/tool_batch_output.jsonl`
3.  **Output File (Reference):** `server/batch-processing/tool_processing_summary.json`
4.  **Command:**
    ```bash
    npx tsx server/scripts/processToolBatchOutput.ts
    ```
5.  **Verification:**
    ```bash
    # Check tool count
    psql -U postgres -d airoadmap -h localhost -p 5432 -c "SELECT COUNT(*) FROM ai_tools;" | cat
    # Check mapping count
    psql -U postgres -d airoadmap -h localhost -p 5432 -c "SELECT COUNT(*) FROM capability_tool_mapping;" | cat
    # Check the generated summary file
    ls -l server/batch-processing/tool_processing_summary.json
    ```

## Troubleshooting Common Issues

*   **Schema Mismatches (`column ... does not exist`)**:
    *   Ensure you ran `npm run db:push` successfully *before* starting the seeding.
    *   Double-check column names in the script's SQL queries (e.g., `business_value` vs `businessValue`). Scripts should use snake_case to match the database.
    *   If `db:push` reports no changes but errors persist, the database might be genuinely out of sync. Consider manually checking the table definition (`psql -c "\\d table_name"`) and potentially resetting the database or manually applying schema changes if comfortable.
*   **Missing Files (`ENOENT: no such file or directory`)**:
    *   Verify the input JSON/JSONL files exist at the exact paths specified in the scripts (e.g., `server/batch-processing/SDR_capabilities_clean.json`, `server/batch-processing/responses/tool_batch_output.jsonl`).
    *   Ensure the script is constructing the path correctly (preferably relative to the script file's location using `path.resolve(__dirname, ...)`).
*   **`ON CONFLICT` Errors**:
    *   `no unique or exclusion constraint matching the ON CONFLICT specification`: This means the script uses `ON CONFLICT (column_name)` but the database table doesn't have a `UNIQUE` constraint defined on `column_name`. Either add the unique constraint via schema definition (`shared/schema.ts`) and `npm run db:push`, or remove the `ON CONFLICT` clause from the script if duplicates are acceptable or handled differently.
*   **`tool_id` / `id` Generation Errors (`null value in column ... violates not-null constraint`, `relation ..._seq does not exist`)**:
    *   This usually indicates the `SERIAL` or auto-incrementing mechanism for the primary key column is broken in the database.
    *   Check the table definition (`psql -c "\\d table_name"`). The primary key column (e.g., `tool_id`) should have a `Default` value like `nextval('sequence_name'::regclass)`.
    *   If the default is missing or the sequence doesn't exist, `npm run db:push` *should* fix it, but sometimes fails to detect the issue.
    *   **Manual Fix (if `db:push` doesn't work):**
        ```sql
        -- Replace table_name and column_name appropriately
        CREATE SEQUENCE IF NOT EXISTS table_name_column_name_seq;
        ALTER TABLE table_name ALTER COLUMN column_name SET DEFAULT nextval('table_name_column_name_seq');
        -- Optional: Reset sequence start value if table already has data
        SELECT setval('table_name_column_name_seq', COALESCE((SELECT MAX(column_name) + 1 FROM table_name), 1), false);
        ```
    *   Ensure the script **does not** try to insert a value for the auto-incrementing ID column. The database handles it. 