#!/usr/bin/env node

/**
 * Main script to migrate all library data in the correct order:
 * 1. departments
 * 2. job_roles
 * 3. ai_tools
 * 4. ai_capabilities
 * 5. capability_tool_mapping
 * 6. capability_job_roles
 * 7. capability_role_impacts
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define migration scripts in order
const migrationScripts = [
  'department-migrate.js',
  'job-roles-migrate.js',
  'ai-tools-migrate.js',
  'ai-capabilities-migrate.js',
  'capability-tool-mapping-migrate.js',
  'capability-job-roles-migrate.js',
  'capability-role-impacts-migrate.js'
];

// Check all scripts exist
for (const script of migrationScripts) {
  const scriptPath = path.join(__dirname, script);
  if (!fs.existsSync(scriptPath)) {
    console.error(`Migration script not found: ${scriptPath}`);
    process.exit(1);
  }
}

// Function to run a script and wait for completion
function runScript(scriptName) {
  return new Promise((resolve, reject) => {
    console.log(`\n========== Running ${scriptName} ==========\n`);
    
    const scriptPath = path.join(__dirname, scriptName);
    const child = spawn('node', [scriptPath], { stdio: 'inherit' });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ ${scriptName} completed successfully\n`);
        resolve();
      } else {
        console.error(`\n❌ ${scriptName} failed with code ${code}\n`);
        reject(new Error(`Script ${scriptName} exited with code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      console.error(`\n❌ Failed to start ${scriptName}: ${error.message}\n`);
      reject(error);
    });
  });
}

async function main() {
  console.log('Starting library data migration...');
  console.log(`Will run ${migrationScripts.length} migration scripts in sequence`);
  
  let success = true;
  
  for (const script of migrationScripts) {
    try {
      await runScript(script);
    } catch (error) {
      console.error(`Migration script ${script} failed:`, error.message);
      success = false;
      
      // Ask whether to continue
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        readline.question('Do you want to continue with the next script? (y/n): ', (answer) => {
          readline.close();
          resolve(answer.toLowerCase());
        });
      });
      
      if (answer !== 'y') {
        console.log('Migration aborted.');
        process.exit(1);
      }
    }
  }
  
  if (success) {
    console.log('\n🎉 All migration scripts completed successfully!');
    console.log('Library data migration completed.');
  } else {
    console.log('\n⚠️ Migration completed with some errors. Please check the logs.');
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 