#!/usr/bin/env node

/**
 * Simple script to migrate just the departments table
 * This is a simplified test script to troubleshoot migration issues
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
      console.error('Row data:', row);
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

async function main() {
  try {
    console.log("Starting simple migration test...");
    
    // Get count before migration
    const beforeCount = await countRows(destPool, 'departments');
    console.log(`Current row count in departments: ${beforeCount}`);
    
    // Clear the table first
    await clearTable(destPool, 'departments');
    
    // Get data from source
    const departmentsData = await getTableData(sourcePool, 'departments');
    
    // Insert data into destination
    await insertData(destPool, 'departments', departmentsData);
    
    // Get count after migration
    const afterCount = await countRows(destPool, 'departments');
    console.log(`Row count in departments after migration: ${afterCount}`);
    
    console.log("Simple migration test completed");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    // Close pools
    sourcePool.end();
    destPool.end();
  }
}

main(); 