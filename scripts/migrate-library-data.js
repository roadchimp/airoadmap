#!/usr/bin/env node

/**
 * Script to migrate library data from local PostgreSQL to Neon
 * 
 * This migrates:
 * - departments
 * - job_roles
 * - ai_tools
 * - ai_capabilities
 * - capability_tool_mapping
 * - capability_job_roles
 * - capability_role_impacts
 */

import pg from 'pg';
import * as fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

// Connection details
const SOURCE_CONNECTION_STRING = 'postgresql://postgres:postgres@localhost:5432/airoadmap';
const DEST_CONNECTION_STRING = 'postgres://neondb_owner:npg_cyahU74CWOLK@ep-sweet-grass-a6pb2g91-pooler.us-west-2.aws.neon.tech/neondb';

// Check for command line arguments
const isDryRun = process.argv.includes('--dry-run');
const skipForeignKeyChecks = process.argv.includes('--skip-fk-checks') || true; // Default to true as Neon DB doesn't allow changing session_replication_role
const forceOverwrite = process.argv.includes('--force-overwrite');
const debugMode = process.argv.includes('--debug');

if (isDryRun) {
  console.log('🔍 DRY RUN MODE: No changes will be made to the destination database');
}

if (skipForeignKeyChecks) {
  console.log('⚠️ FOREIGN KEY CHECKS DISABLED: Foreign key constraints will not be enforced during migration');
}

if (forceOverwrite) {
  console.log('⚠️ FORCE OVERWRITE MODE: Existing data will be deleted before migration');
}

if (debugMode) {
  console.log('🐛 DEBUG MODE: Detailed error information will be shown');
}

// Create connection pools
const sourcePool = new Pool({
  connectionString: SOURCE_CONNECTION_STRING,
});

const destPool = new Pool({
  connectionString: DEST_CONNECTION_STRING,
  ssl: true // Proper SSL config for Neon
});

// Tables to migrate in order (respecting foreign key dependencies)
const TABLES_TO_MIGRATE = [
  'departments',
  'job_roles',
  'ai_tools',
  'ai_capabilities',
  'capability_tool_mapping',
  'capability_job_roles',
  'capability_role_impacts'
];

// Tables with identity/serial columns
const TABLES_WITH_IDENTITY = {
  'departments': 'id',
  'job_roles': 'id',
  'ai_tools': 'tool_id',
  'ai_capabilities': 'id'
};

// Debug log function
function debugLog(...args) {
  if (debugMode) {
    console.log('🐛 DEBUG:', ...args);
  }
}

// Function to check if a table exists
async function tableExists(pool, tableName) {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )
    `, [tableName]);
    return result.rows[0].exists;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error.message);
    return false;
  }
}

// Function to get count of rows in a table
async function getTableCount(pool, tableName) {
  try {
    const result = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    console.error(`Error getting count for table ${tableName}:`, error.message);
    return -1;
  }
}

// Function to fetch all rows from a table
async function getAllRows(pool, tableName) {
  console.log(`Fetching data from ${tableName}...`);
  try {
    const result = await pool.query(`SELECT * FROM ${tableName}`);
    console.log(`Retrieved ${result.rows.length} rows from ${tableName}`);
    return result.rows;
  } catch (error) {
    console.error(`Error fetching data from ${tableName}:`, error.message);
    throw new Error(`Failed to fetch data from ${tableName}: ${error.message}`);
  }
}

// Function to check if identity column exists for a table
async function checkIdentityColumn(pool, tableName, columnName) {
  try {
    const result = await pool.query(`
      SELECT 
        EXISTS (
          SELECT 1 FROM pg_attribute a
          JOIN pg_class t ON a.attrelid = t.oid
          JOIN pg_namespace s ON t.relnamespace = s.oid
          WHERE a.attname = $1
          AND t.relname = $2
          AND s.nspname = 'public'
          AND pg_get_serial_sequence('public.' || $2, $1) IS NOT NULL
        ) as has_identity
    `, [columnName, tableName]);
    
    return result.rows[0].has_identity;
  } catch (error) {
    console.error(`Error checking identity column for ${tableName}.${columnName}:`, error.message);
    return false;
  }
}

// Function to delete all rows from a table
async function deleteAllRows(pool, tableName) {
  if (isDryRun) {
    console.log(`[DRY RUN] Would delete all rows from table ${tableName}`);
    return;
  }
  
  try {
    await pool.query(`DELETE FROM ${tableName}`);
    console.log(`Deleted all rows from table ${tableName}`);
  } catch (error) {
    console.error(`Error deleting rows from table ${tableName}:`, error.message);
    throw new Error(`Failed to delete rows from table ${tableName}: ${error.message}`);
  }
}

// Function to truncate a table
async function truncateTable(pool, tableName) {
  if (isDryRun) {
    console.log(`[DRY RUN] Would truncate table ${tableName}`);
    return;
  }
  
  try {
    await pool.query(`TRUNCATE TABLE ${tableName} CASCADE`);
    console.log(`Truncated table ${tableName}`);
    return true;
  } catch (error) {
    console.error(`Error truncating table ${tableName}:`, error.message);
    return false;
  }
}

// Function to verify row existence in destination table
async function verifyRowInserted(client, tableName, identityColumn, idValue) {
  try {
    const result = await client.query(
      `SELECT EXISTS(SELECT 1 FROM ${tableName} WHERE ${identityColumn} = $1) as exists`,
      [idValue]
    );
    return result.rows[0].exists;
  } catch (error) {
    debugLog(`Error verifying row in ${tableName}:`, error.message);
    return false;
  }
}

// Function to insert rows into a destination table one by one to avoid transaction issues
async function insertRowsOneByOne(pool, tableName, rows) {
  if (rows.length === 0) {
    console.log(`No data to insert into ${tableName}`);
    return 0;
  }
  
  console.log(`Inserting ${rows.length} rows into ${tableName} one by one...`);
  
  // In dry run mode, just return the count without doing anything
  if (isDryRun) {
    console.log(`[DRY RUN] Would insert ${rows.length} rows into ${tableName}`);
    return rows.length;
  }
  
  // Get the column names from the first row
  const columns = Object.keys(rows[0]);
  
  // For identity/serial columns, we need special handling
  const identityColumn = TABLES_WITH_IDENTITY[tableName];
  let hasIdentitySequence = false;
  let maxIdentityValue = 0;
  
  if (identityColumn) {
    hasIdentitySequence = await checkIdentityColumn(pool, tableName, identityColumn);
    debugLog(`Table ${tableName} has identity column ${identityColumn}: ${hasIdentitySequence}`);
  }

  // Track results
  let insertedCount = 0;
  let failedRows = [];
  
  // One row at a time, no transaction to avoid cascading failures
  for (const row of rows) {
    const values = columns.map(col => row[col]);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    
    // Track the max identity value for sequence reset
    if (identityColumn && row[identityColumn] !== null && row[identityColumn] !== undefined) {
      maxIdentityValue = Math.max(maxIdentityValue, Number(row[identityColumn]));
    }
    
    const query = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES (${placeholders})
      ON CONFLICT DO NOTHING
      RETURNING ${identityColumn || '1'}
    `;
    
    try {
      const client = await pool.connect();
      try {
        const result = await client.query(query, values);
        
        // Verify the row was actually inserted
        if (result.rowCount > 0) {
          insertedCount++;
        } else if (identityColumn && row[identityColumn]) {
          // If no row was returned but this might be due to ON CONFLICT DO NOTHING,
          // check if the row exists
          const exists = await verifyRowInserted(client, tableName, identityColumn, row[identityColumn]);
          if (exists) {
            debugLog(`Row with ${identityColumn}=${row[identityColumn]} already exists in ${tableName}`);
            insertedCount++;
          } else {
            failedRows.push({ row, error: "Row not inserted and doesn't exist" });
          }
        } else {
          failedRows.push({ row, error: "Row not inserted" });
        }
      } catch (error) {
        console.error(`Error inserting row into ${tableName}:`, error.message);
        if (debugMode) {
          console.error('Row data:', JSON.stringify(row, null, 2));
        }
        failedRows.push({ row, error: error.message });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`Error getting client from pool:`, error.message);
      failedRows.push({ row, error: `Connection error: ${error.message}` });
    }
  }
  
  // Reset the sequence if this table has an identity column
  if (identityColumn && maxIdentityValue > 0 && hasIdentitySequence) {
    try {
      const client = await pool.connect();
      try {
        // Set the sequence value
        await client.query(`SELECT pg_catalog.setval(pg_get_serial_sequence('${tableName}', '${identityColumn}'), ${maxIdentityValue}, true)`);
        console.log(`Reset sequence for ${tableName}.${identityColumn} to ${maxIdentityValue}`);
      } catch (error) {
        console.error(`Error resetting sequence for ${tableName}.${identityColumn}:`, error.message);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`Error getting client from pool:`, error.message);
    }
  }
  
  console.log(`Successfully inserted ${insertedCount} rows into ${tableName}`);
  
  // Log failed rows if any
  if (failedRows.length > 0) {
    console.warn(`Failed to insert ${failedRows.length} rows into ${tableName}`);
    return { insertedCount, failedRows };
  }
  
  return insertedCount;
}

// Alternative approach that doesn't require superuser privileges
async function handleTableInOrder(pool, tableName, rows) {
  if (isDryRun) {
    console.log(`[DRY RUN] Would handle table ${tableName} with ${rows.length} rows`);
    return rows.length;
  }
  
  try {
    // If force overwrite is enabled, try to delete all rows
    if (forceOverwrite) {
      try {
        if (await truncateTable(pool, tableName)) {
          console.log(`Successfully truncated table ${tableName}`);
        } else {
          console.log(`Could not truncate ${tableName}, will try DELETE`);
          await deleteAllRows(pool, tableName);
        }
      } catch (error) {
        console.warn(`Could not clear ${tableName}, will use INSERT with ON CONFLICT instead: ${error.message}`);
      }
    }
    
    // Insert the rows one by one without transaction to avoid cascading failures
    return await insertRowsOneByOne(pool, tableName, rows);
  } catch (error) {
    console.error(`Error handling table ${tableName}:`, error.message);
    throw error;
  }
}

// Function to validate migration by comparing counts
async function validateMigration() {
  console.log('\n🔍 Validating migration results...');
  const validationResults = {};
  
  for (const tableName of TABLES_TO_MIGRATE) {
    try {
      const sourceCount = await getTableCount(sourcePool, tableName);
      const destCount = await getTableCount(destPool, tableName);
      
      validationResults[tableName] = {
        sourceCount,
        destCount,
        isValid: sourceCount === destCount,
        difference: sourceCount - destCount
      };
      
      if (!validationResults[tableName].isValid) {
        console.warn(`⚠️ Validation failed for table ${tableName}: Source has ${sourceCount} rows, destination has ${destCount} rows`);
      } else {
        console.log(`✅ Validation passed for table ${tableName}: ${sourceCount} rows`);
      }
    } catch (error) {
      validationResults[tableName] = {
        error: error.message,
        isValid: false
      };
      console.error(`❌ Error validating table ${tableName}:`, error.message);
    }
  }
  
  return validationResults;
}

// Function to verify database connections
async function checkConnections() {
  console.log('Checking database connections...');
  
  try {
    // Check source connection
    console.log('Testing source database connection...');
    const sourceClient = await sourcePool.connect();
    await sourceClient.query('SELECT 1');
    sourceClient.release();
    console.log('✅ Source database connection successful');
    
    // Check destination connection
    console.log('Testing destination database connection...');
    const destClient = await destPool.connect();
    await destClient.query('SELECT 1');
    destClient.release();
    console.log('✅ Destination database connection successful');
    
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    return false;
  }
}

// Function to get table column information
async function getTableColumns(pool, tableName) {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);
    
    return result.rows;
  } catch (error) {
    console.error(`Error getting column information for ${tableName}:`, error.message);
    return [];
  }
}

// Function to verify schema compatibility more thoroughly
async function verifySchemas() {
  console.log('Verifying database schemas...');
  const schemaVerification = { valid: true, issues: [], details: {} };
  
  for (const tableName of TABLES_TO_MIGRATE) {
    try {
      // Check if table exists in both databases
      const sourceExists = await tableExists(sourcePool, tableName);
      const destExists = await tableExists(destPool, tableName);
      
      if (!sourceExists) {
        console.error(`❌ Table ${tableName} does not exist in source database`);
        schemaVerification.valid = false;
        schemaVerification.issues.push(`Table ${tableName} missing from source`);
        continue;
      }
      
      if (!destExists) {
        console.error(`❌ Table ${tableName} does not exist in destination database`);
        schemaVerification.valid = false;
        schemaVerification.issues.push(`Table ${tableName} missing from destination`);
        continue;
      }
      
      // Compare column definitions
      const sourceColumns = await getTableColumns(sourcePool, tableName);
      const destColumns = await getTableColumns(destPool, tableName);
      
      // Build maps for easy comparison
      const sourceColumnMap = Object.fromEntries(sourceColumns.map(col => [col.column_name, col]));
      const destColumnMap = Object.fromEntries(destColumns.map(col => [col.column_name, col]));
      
      const sourceColumnNames = Object.keys(sourceColumnMap);
      const destColumnNames = Object.keys(destColumnMap);
      
      // Check for missing columns
      const missingInDest = sourceColumnNames.filter(col => !destColumnNames.includes(col));
      const missingInSource = destColumnNames.filter(col => !sourceColumnNames.includes(col));
      
      if (missingInDest.length > 0) {
        console.warn(`⚠️ Table ${tableName} is missing columns in destination: ${missingInDest.join(', ')}`);
        schemaVerification.issues.push(`Table ${tableName} missing columns in destination: ${missingInDest.join(', ')}`);
      }
      
      if (missingInSource.length > 0) {
        console.warn(`⚠️ Table ${tableName} has extra columns in destination: ${missingInSource.join(', ')}`);
        // This is just a warning, not a critical issue
      }
      
      // Check for type mismatches in common columns
      const commonColumns = sourceColumnNames.filter(col => destColumnNames.includes(col));
      const typeMismatches = commonColumns.filter(col => 
        sourceColumnMap[col].data_type !== destColumnMap[col].data_type
      );
      
      if (typeMismatches.length > 0) {
        console.warn(`⚠️ Table ${tableName} has type mismatches: ${typeMismatches.join(', ')}`);
        schemaVerification.issues.push(`Table ${tableName} has type mismatches: ${typeMismatches.join(', ')}`);
      }
      
      // Store details for debugging
      schemaVerification.details[tableName] = {
        sourceColumns: sourceColumnMap,
        destColumns: destColumnMap,
        missingInDest,
        missingInSource,
        typeMismatches
      };
      
      if (missingInDest.length === 0 && typeMismatches.length === 0) {
        console.log(`✅ Table ${tableName} schema is compatible`);
      } else {
        schemaVerification.valid = false;
      }
    } catch (error) {
      console.error(`❌ Error verifying table ${tableName}:`, error.message);
      schemaVerification.valid = false;
      schemaVerification.issues.push(`Error checking table ${tableName}: ${error.message}`);
    }
  }
  
  return schemaVerification;
}

// Main migration function
async function migrateData() {
  console.log('\n🚀 Starting library data migration...');
  console.log(`Source: ${SOURCE_CONNECTION_STRING}`);
  console.log(`Destination: ${DEST_CONNECTION_STRING}`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE RUN'}`);
  
  // Create a log directory if it doesn't exist
  const logDir = path.join(__dirname, 'migration_logs');
  try {
    await fs.mkdir(logDir, { recursive: true });
  } catch (error) {
    console.error('Error creating log directory:', error.message);
  }
  
  // Test database connections
  const connectionsOk = await checkConnections();
  if (!connectionsOk) {
    throw new Error('Database connection test failed. Aborting migration.');
  }
  
  // Verify schemas
  const schemaCheck = await verifySchemas();
  if (!schemaCheck.valid) {
    console.error('Schema verification failed:');
    console.error(schemaCheck.issues.join('\n'));
    
    // Save schema details for debugging
    const schemaFilePath = path.join(logDir, `schema_check_${new Date().toISOString().replace(/:/g, '-')}.json`);
    await fs.writeFile(schemaFilePath, JSON.stringify(schemaCheck, null, 2));
    console.log(`Schema verification details saved to ${schemaFilePath}`);
    
    if (!process.argv.includes('--ignore-schema-errors')) {
      throw new Error('Schema verification failed. Use --ignore-schema-errors to proceed anyway.');
    } else {
      console.warn('Proceeding despite schema errors due to --ignore-schema-errors flag');
    }
  }
  
  const migrationStats = {};
  const migrationTime = new Date().toISOString().replace(/:/g, '-');
  
  // Migrate each table in order
  for (const tableName of TABLES_TO_MIGRATE) {
    try {
      // Get data from source
      const rows = await getAllRows(sourcePool, tableName);
      
      // Save to backup file
      const backupFilePath = path.join(logDir, `${tableName}_${migrationTime}.json`);
      await fs.writeFile(backupFilePath, JSON.stringify(rows, null, 2));
      console.log(`Backup saved to ${backupFilePath}`);
      
      // Insert into destination
      const result = await handleTableInOrder(destPool, tableName, rows);
      
      if (typeof result === 'object' && result.failedRows) {
        // Save failed rows to file
        const failedRowsPath = path.join(logDir, `${tableName}_failed_rows_${migrationTime}.json`);
        await fs.writeFile(failedRowsPath, JSON.stringify(result.failedRows, null, 2));
        console.log(`Failed rows saved to ${failedRowsPath}`);
        
        migrationStats[tableName] = {
          sourceCount: rows.length,
          insertedCount: result.insertedCount,
          failedCount: result.failedRows.length,
          failedRowsFile: failedRowsPath
        };
      } else {
        migrationStats[tableName] = {
          sourceCount: rows.length,
          insertedCount: result
        };
      }
    } catch (error) {
      console.error(`Error migrating ${tableName}:`, error.message);
      migrationStats[tableName] = {
        error: error.message
      };
    }
  }
  
  // Save migration stats
  const statsFilePath = path.join(logDir, `migration_stats_${migrationTime}.json`);
  await fs.writeFile(statsFilePath, JSON.stringify(migrationStats, null, 2));
  console.log(`Migration stats saved to ${statsFilePath}`);
  
  // Validate the migration
  if (!isDryRun) {
    const validationResults = await validateMigration();
    
    // Save validation results
    const validationFilePath = path.join(logDir, `validation_results_${migrationTime}.json`);
    await fs.writeFile(validationFilePath, JSON.stringify(validationResults, null, 2));
    console.log(`Validation results saved to ${validationFilePath}`);
    
    // Add validation results to migration stats
    for (const tableName in validationResults) {
      if (migrationStats[tableName]) {
        migrationStats[tableName].validation = validationResults[tableName];
      }
    }
    
    // Check if any validations failed
    const failedValidations = Object.entries(validationResults)
      .filter(([_, result]) => !result.isValid)
      .map(([table, _]) => table);
    
    if (failedValidations.length > 0) {
      console.warn(`⚠️ Validation failed for tables: ${failedValidations.join(', ')}`);
    }
  }
  
  console.log('\n✅ Migration completed.');
  console.log('Summary:');
  console.table(migrationStats);
  
  return migrationStats;
}

// Execute migration
migrateData()
  .then((stats) => {
    // Check if any tables had failed rows
    const tablesWithFailures = Object.entries(stats)
      .filter(([_, info]) => info.failedCount > 0)
      .map(([table, _]) => table);
    
    if (tablesWithFailures.length > 0) {
      console.warn(`⚠️ Migration completed with failures in tables: ${tablesWithFailures.join(', ')}`);
      console.warn(`Run with --force-overwrite to attempt clearing destination tables before migration`);
      process.exit(1); // Non-zero exit code indicates problems
    } else {
      console.log('Migration script completed successfully');
      process.exit(0);
    }
  })
  .catch(error => {
    console.error('Migration script failed:', error);
    process.exit(1);
  })
  .finally(() => {
    // Close connection pools
    sourcePool.end();
    destPool.end();
  }); 