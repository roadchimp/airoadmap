#!/usr/bin/env node

/**
 * Script to migrate capability_role_impacts table
 * This script assumes capability_job_roles has been migrated
 */

import pg from 'pg';
import { fileURLToPath } from 'url';
import path from 'path';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

// Connection details
const SOURCE_CONNECTION_STRING = 'postgresql://postgres:postgres@localhost:5432/airoadmap';
const DEST_CONNECTION_STRING = 'postgresql://neondb_owner:npg_cyahU74CWOLK@ep-broad-cake-a63511f5-pooler.us-west-2.aws.neon.tech/neondb';

// Create connection pools
const sourcePool = new Pool({
  connectionString: SOURCE_CONNECTION_STRING,
});

const destPool = new Pool({
  connectionString: DEST_CONNECTION_STRING,
  ssl: true
});

async function clearTable(pool, tableName) {
  console.log(`Clearing table ${tableName}...`);
  const client = await pool.connect();
  try {
    await client.query(`DELETE FROM ${tableName}`);
    console.log(`Table ${tableName} cleared`);
  } catch (error) {
    console.error(`Error clearing table ${tableName}:`, error.message);
  } finally {
    client.release();
  }
}

async function getTableData(pool, tableName) {
  console.log(`Fetching data from ${tableName}...`);
  const client = await pool.connect();
  try {
    const result = await client.query(`SELECT * FROM ${tableName}`);
    console.log(`Retrieved ${result.rows.length} rows from ${tableName}`);
    return result.rows;
  } catch (error) {
    console.error(`Error fetching data from ${tableName}:`, error.message);
    return [];
  } finally {
    client.release();
  }
}

async function insertData(pool, tableName, rows) {
  if (rows.length === 0) {
    console.log(`No data to insert into ${tableName}`);
    return;
  }
  
  console.log(`Inserting ${rows.length} rows into ${tableName}...`);
  
  let successCount = 0;
  let failureCount = 0;
  
  // Insert each row one by one
  for (const row of rows) {
    const client = await pool.connect();
    try {
      const columns = Object.keys(row);
      const values = Object.values(row);
      
      // Construct placeholders ($1, $2, etc.)
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      
      const query = `
        INSERT INTO ${tableName} (${columns.join(', ')})
        VALUES (${placeholders})
        ON CONFLICT (capability_id, job_role_id, impact_area) DO NOTHING
      `;
      
      const result = await client.query(query, values);
      if (result.rowCount > 0) {
        successCount++;
        if (successCount % 50 === 0) {
          console.log(`Inserted ${successCount}/${rows.length} rows...`);
        }
      } else {
        failureCount++;
      }
    } catch (error) {
      console.error(`Error inserting row (capability_id: ${row.capability_id}, job_role_id: ${row.job_role_id}, impact_area: ${row.impact_area}):`, error.message);
      
      // Check if the capability-job role mapping exists
      if (error.message.includes('foreign key')) {
        const errorClient = await pool.connect();
        try {
          const mappingResult = await errorClient.query(
            'SELECT EXISTS(SELECT 1 FROM capability_job_roles WHERE capability_id = $1 AND job_role_id = $2) as exists',
            [row.capability_id, row.job_role_id]
          );
          
          console.error(`Capability-job role mapping (${row.capability_id}, ${row.job_role_id}) exists: ${mappingResult.rows[0].exists}`);
        } catch (checkError) {
          console.error('Error checking capability-job role mapping:', checkError.message);
        } finally {
          errorClient.release();
        }
      }
      
      failureCount++;
    } finally {
      client.release();
    }
  }
  
  console.log(`Successfully inserted ${successCount} rows, failed to insert ${failureCount} rows`);
  return { successCount, failureCount };
}

async function countRows(pool, tableName) {
  const client = await pool.connect();
  try {
    const result = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    console.error(`Error counting rows in ${tableName}:`, error.message);
    return -1;
  } finally {
    client.release();
  }
}

async function verifyDependencies() {
  // Verify that capability_job_roles have been migrated
  const client = await destPool.connect();
  
  try {
    const result = await client.query('SELECT COUNT(*) FROM capability_job_roles');
    const count = parseInt(result.rows[0].count, 10);
    console.log(`Found ${count} capability-job role mappings in destination database`);
    
    if (count === 0) {
      console.error('⚠️ Dependencies not fully migrated! Make sure to run the capability-job-roles-migrate.js script first.');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error verifying dependencies:', error.message);
    return false;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log("Starting capability role impacts migration...");
    
    // Verify dependencies exist first
    const dependenciesOk = await verifyDependencies();
    if (!dependenciesOk) {
      console.error('Migration aborted: dependencies must be migrated first');
      return;
    }
    
    // Get count before migration
    const beforeCount = await countRows(destPool, 'capability_role_impacts');
    console.log(`Current row count in capability_role_impacts: ${beforeCount}`);
    
    // Clear the table first
    await clearTable(destPool, 'capability_role_impacts');
    
    // Get data from source
    const impactsData = await getTableData(sourcePool, 'capability_role_impacts');
    
    // Insert data into destination
    await insertData(destPool, 'capability_role_impacts', impactsData);
    
    // Get count after migration
    const afterCount = await countRows(destPool, 'capability_role_impacts');
    console.log(`Row count in capability_role_impacts after migration: ${afterCount}`);
    
    console.log("Capability role impacts migration completed");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    // Close pools
    sourcePool.end();
    destPool.end();
  }
}

main(); 