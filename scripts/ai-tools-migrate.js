#!/usr/bin/env node

/**
 * Script to migrate ai_tools table
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
const DEST_CONNECTION_STRING = 'postgres://neondb_owner:npg_cyahU74CWOLK@ep-broad-cake-a63511f5-pooler.us-west-2.aws.neon.tech/neondb';

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
        ON CONFLICT (tool_id) DO NOTHING
      `;
      
      const result = await client.query(query, values);
      if (result.rowCount > 0) {
        successCount++;
        if (successCount % 20 === 0) {
          console.log(`Inserted ${successCount}/${rows.length} rows...`);
        }
      } else {
        failureCount++;
      }
    } catch (error) {
      console.error(`Error inserting row with tool_id ${row.tool_id}:`, error.message);
      if (error.message.includes('duplicate key')) {
        console.error('This is likely a duplicate key issue. The row already exists.');
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

async function resetSequence(pool, tableName, idColumn) {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT MAX(${idColumn}) as max_id FROM ${tableName}
    `);
    
    const maxId = result.rows[0].max_id || 0;
    
    if (maxId > 0) {
      await client.query(`
        SELECT setval(pg_get_serial_sequence('${tableName}', '${idColumn}'), ${maxId})
      `);
      console.log(`Reset sequence for ${tableName}.${idColumn} to ${maxId}`);
    }
  } catch (error) {
    console.error(`Error resetting sequence for ${tableName}.${idColumn}:`, error.message);
  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log("Starting AI tools migration...");
    
    // Get count before migration
    const beforeCount = await countRows(destPool, 'ai_tools');
    console.log(`Current row count in ai_tools: ${beforeCount}`);
    
    // Clear the table first
    await clearTable(destPool, 'ai_tools');
    
    // Get data from source
    const aiToolsData = await getTableData(sourcePool, 'ai_tools');
    
    // Insert data into destination
    await insertData(destPool, 'ai_tools', aiToolsData);
    
    // Reset sequence if needed
    await resetSequence(destPool, 'ai_tools', 'tool_id');
    
    // Get count after migration
    const afterCount = await countRows(destPool, 'ai_tools');
    console.log(`Row count in ai_tools after migration: ${afterCount}`);
    
    console.log("AI tools migration completed");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    // Close pools
    sourcePool.end();
    destPool.end();
  }
}

main(); 