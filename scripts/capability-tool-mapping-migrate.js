#!/usr/bin/env node

/**
 * Script to migrate capability_tool_mapping table
 * This script assumes ai_capabilities and ai_tools have been migrated
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
        ON CONFLICT (capability_id, tool_id) DO NOTHING
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
      console.error(`Error inserting row (capability_id: ${row.capability_id}, tool_id: ${row.tool_id}):`, error.message);
      
      // Check if the references exist
      if (error.message.includes('foreign key')) {
        const errorClient = await pool.connect();
        try {
          const capabilityResult = await errorClient.query(
            'SELECT EXISTS(SELECT 1 FROM ai_capabilities WHERE id = $1) as exists',
            [row.capability_id]
          );
          
          const toolResult = await errorClient.query(
            'SELECT EXISTS(SELECT 1 FROM ai_tools WHERE tool_id = $1) as exists',
            [row.tool_id]
          );
          
          console.error(`Capability ${row.capability_id} exists: ${capabilityResult.rows[0].exists}`);
          console.error(`Tool ${row.tool_id} exists: ${toolResult.rows[0].exists}`);
        } catch (checkError) {
          console.error('Error checking references:', checkError.message);
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
  // Verify that capabilities and tools have been migrated
  const capabilitiesClient = await destPool.connect();
  const toolsClient = await destPool.connect();
  
  try {
    const capabilitiesResult = await capabilitiesClient.query('SELECT COUNT(*) FROM ai_capabilities');
    const capabilitiesCount = parseInt(capabilitiesResult.rows[0].count, 10);
    console.log(`Found ${capabilitiesCount} AI capabilities in destination database`);
    
    const toolsResult = await toolsClient.query('SELECT COUNT(*) FROM ai_tools');
    const toolsCount = parseInt(toolsResult.rows[0].count, 10);
    console.log(`Found ${toolsCount} AI tools in destination database`);
    
    if (capabilitiesCount === 0 || toolsCount === 0) {
      console.error('⚠️ Dependencies not fully migrated! Make sure to run the ai-capabilities-migrate.js and ai-tools-migrate.js scripts first.');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error verifying dependencies:', error.message);
    return false;
  } finally {
    capabilitiesClient.release();
    toolsClient.release();
  }
}

async function main() {
  try {
    console.log("Starting capability-tool mapping migration...");
    
    // Verify dependencies exist first
    const dependenciesOk = await verifyDependencies();
    if (!dependenciesOk) {
      console.error('Migration aborted: dependencies must be migrated first');
      return;
    }
    
    // Get count before migration
    const beforeCount = await countRows(destPool, 'capability_tool_mapping');
    console.log(`Current row count in capability_tool_mapping: ${beforeCount}`);
    
    // Clear the table first
    await clearTable(destPool, 'capability_tool_mapping');
    
    // Get data from source
    const mappingData = await getTableData(sourcePool, 'capability_tool_mapping');
    
    // Insert data into destination
    await insertData(destPool, 'capability_tool_mapping', mappingData);
    
    // Get count after migration
    const afterCount = await countRows(destPool, 'capability_tool_mapping');
    console.log(`Row count in capability_tool_mapping after migration: ${afterCount}`);
    
    console.log("Capability-tool mapping migration completed");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    // Close pools
    sourcePool.end();
    destPool.end();
  }
}

main(); 