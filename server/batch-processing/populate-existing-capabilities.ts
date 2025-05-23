#!/usr/bin/env tsx

/**
 * Single-use script to process all existing AI capabilities for job role matching
 * This script will:
 * 1. Export all existing capabilities for batch processing
 * 2. Generate a JSONL file for OpenAI batch processing
 * 3. The file can then be submitted to OpenAI for processing
 * 
 * Usage:
 * npx tsx server/batch-processing/populate-existing-capabilities.ts
 * 
 * After running this script:
 * 1. Submit the generated JSONL file to OpenAI for batch processing
 * 2. Download the response file
 * 3. Run: npx tsx server/batch-processing/batchProcessor.ts process-job-roles <response_file_path>
 */

import { storage } from '../storage.js';
import { exportCapabilitiesForJobRoleMatching } from './batchProcessor.js';

async function main() {
  console.log('🚀 Starting capability-job role matching for all existing capabilities...\n');
  
  try {
    // First, check how many capabilities we have
    const capabilities = await storage.listAICapabilities();
    console.log(`📊 Found ${capabilities.length} AI capabilities in the database`);
    
    if (capabilities.length === 0) {
      console.log('❌ No capabilities found. Please run the job scraper and batch processor first.');
      process.exit(1);
    }
    
    // Check job roles
    const jobRoles = await storage.listJobRoles();
    console.log(`👥 Found ${jobRoles.length} job roles in the database`);
    
    if (jobRoles.length === 0) {
      console.log('❌ No job roles found. Please populate the job roles table first.');
      process.exit(1);
    }
    
    console.log('\n🔄 Exporting capabilities for job role matching...');
    
    // Export all capabilities for job role matching (force include all)
    const filePath = await exportCapabilitiesForJobRoleMatching(true);
    
    console.log(`\n✅ Successfully exported capabilities for job role matching!`);
    console.log(`📄 JSONL file created: ${filePath}`);
    console.log(`📋 Manifest file created: ${filePath.replace('.jsonl', '_manifest.json')}`);
    
    console.log('\n📝 Next steps:');
    console.log('1. Submit the JSONL file to OpenAI for batch processing');
    console.log('2. Wait for OpenAI to process the batch');
    console.log('3. Download the response file');
    console.log('4. Run the following command to process the results:');
    console.log(`   npx tsx server/batch-processing/batchProcessor.ts process-job-roles <response_file_path>`);
    
    console.log('\n💡 OpenAI Batch Processing Instructions:');
    console.log('- Upload the JSONL file to OpenAI Files API');
    console.log('- Create a batch job with the file ID');
    console.log('- Monitor the batch status');
    console.log('- Download the output file when complete');
    
    console.log('\n🎯 Expected outcomes:');
    console.log(`- Process ${capabilities.length} capabilities`);
    console.log(`- Match capabilities to ${jobRoles.length} available job roles`);
    console.log('- Populate the capability_job_roles table');
    console.log('- Enable role-based filtering in reports');
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run the script if executed directly
if (import.meta.url === import.meta.resolve('./populate-existing-capabilities.ts')) {
  main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
} 