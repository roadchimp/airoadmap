#!/usr/bin/env node

/**
 * Script to migrate job_roles table
 * This script assumes departments have already been migrated
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
        ON CONFLICT (id) DO NOTHING
      `;
      
      await client.query(query, values);
      console.log(`Inserted row with id ${row.id}`);
    } catch (error) {
      console.error(`Error inserting row with id ${row.id}:`, error.message);
      console.error('Row data:', JSON.stringify(row));
      
      // Check if department exists
      if (tableName === 'job_roles' && row.department_id) {
        const deptClient = await pool.connect();
        try {
          const deptResult = await deptClient.query(
            'SELECT EXISTS(SELECT 1 FROM departments WHERE id = $1) as exists',
            [row.department_id]
          );
          console.error(`Department ${row.department_id} exists: ${deptResult.rows[0].exists}`);
        } catch (deptError) {
          console.error(`Error checking department:`, deptError.message);
        } finally {
          deptClient.release();
        }
      }
    } finally {
      client.release();
    }
  }
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

async function verifyDepartments() {
  const client = await destPool.connect();
  try {
    const result = await client.query('SELECT COUNT(*) FROM departments');
    const count = parseInt(result.rows[0].count, 10);
    console.log(`Found ${count} departments in destination database`);
    if (count === 0) {
      console.error('⚠️ No departments found! Run department-migrate.js first.');
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error verifying departments:', error.message);
    return false;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log("Starting job roles migration...");
    
    // Verify departments exist first
    const departmentsOk = await verifyDepartments();
    if (!departmentsOk) {
      console.error('Migration aborted: departments must be migrated first');
      return;
    }
    
    // Get count before migration
    const beforeCount = await countRows(destPool, 'job_roles');
    console.log(`Current row count in job_roles: ${beforeCount}`);
    
    // Clear the table first
    await clearTable(destPool, 'job_roles');
    
    // Get data from source
    const jobRolesData = await getTableData(sourcePool, 'job_roles');
    
    // Insert data into destination
    await insertData(destPool, 'job_roles', jobRolesData);
    
    // Get count after migration
    const afterCount = await countRows(destPool, 'job_roles');
    console.log(`Row count in job_roles after migration: ${afterCount}`);
    
    console.log("Job roles migration completed");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    // Close pools
    sourcePool.end();
    destPool.end();
  }
}

main(); 