# Library Data Migration Script

This script migrates the library data from a local PostgreSQL database to a Neon PostgreSQL database.

## What It Migrates

The script migrates the following tables:

1. `departments` - Department information
2. `job_roles` - Job roles associated with departments
3. `ai_tools` - AI tools data
4. `ai_capabilities` - AI capabilities data
5. `capability_tool_mapping` - Mapping between AI capabilities and tools
6. `capability_job_roles` - Mapping between AI capabilities and job roles
7. `capability_role_impacts` - Impact scores for capabilities on specific roles

## Prerequisites

- Node.js installed
- PostgreSQL client package installed:
  ```bash
  npm install pg
  ```
- Source database (local PostgreSQL) must be running and accessible
- Target database (Neon) must be accessible and have the same schema

## Usage

1. Make sure you have the `pg` package installed:

```bash
npm install pg
```

2. Update the connection strings in the script if necessary:

```javascript
const SOURCE_CONNECTION_STRING = 'postgresql://postgres:postgres@localhost:5432/airoadmap';
const DEST_CONNECTION_STRING = 'postgres://neondb_owner:npg_cyahU74CWOLK@ep-sweet-grass-a6pb2g91-pooler.us-west-2.aws.neon.tech/neondb';
```

3. Run the script:

```bash
# Normal mode - performs the actual migration
node scripts/migrate-library-data.js

# Dry run mode - performs all checks but doesn't modify the destination database
node scripts/migrate-library-data.js --dry-run
```

> **Note:** The script uses ES Module syntax since the project is configured with `"type": "module"` in package.json.

## How It Works

The script performs the following steps:

1. Validates database connections and schema compatibility
2. For each table (in dependency order):
   - Fetches all rows from the source database
   - Creates a backup JSON file in the `scripts/migration_logs` directory
   - Attempts to truncate the destination table (if possible)
   - Inserts the rows using a batched approach for better performance
   - Handles identity/serial columns by temporarily dropping and restoring identity properties
   - Uses `ON CONFLICT DO NOTHING` to handle duplicate records
3. Validates the migration by comparing row counts
4. Generates a summary report of the migration

## Special Handling

- **Dry Run Mode**: Use `--dry-run` flag to test the migration without actually modifying the destination database
- **Regular User Friendly**: Works without superuser privileges (does not use `session_replication_role`)
- **Batched Inserts**: Uses batch operations for faster performance with fallback to row-by-row for error cases
- **Identity Columns**: Temporarily removes identity constraints for insert, then restores them with correct sequence values
- **Error Handling**: Detailed error tracking with separate logs for failed rows
- **Validation**: Automatic validation of row counts after migration
- **Pre-checks**: Verifies database connections and schema compatibility before starting

## Logs

All migration logs are stored in the `scripts/migration_logs` directory:
- JSON backup of each table's data with timestamp
- Failed rows logs for any insertion errors
- Summary statistics file showing rows migrated and any errors
- Validation results comparing source and destination counts

## Troubleshooting

If you encounter issues:

1. Run in dry-run mode first to check for potential problems:
   ```bash
   node scripts/migrate-library-data.js --dry-run
   ```

2. Check validation results to identify tables with mismatched counts

3. Review failed rows logs to see specific rows that couldn't be inserted

4. If database connection fails:
   - Verify connection strings are correct
   - Check that the PostgreSQL server is running
   - Ensure firewall settings allow the connection

5. If schema verification fails:
   - Make sure all required tables exist in both databases
   - Compare table structures to ensure compatibility

6. If you encounter permission issues:
   - The script is designed to work with standard user privileges
   - No superuser privileges are required
   - The script attempts different fallback approaches if certain operations fail due to permissions

For SSL-related issues with Neon, the script uses `ssl: true` which should work properly with Neon's requirements. 