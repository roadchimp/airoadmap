import { writeFile } from 'fs/promises';
import path from 'path';
import { storage } from '../storage.ts';

/**
 * Utility script to export all data currently in MemStorage
 * This is useful for migrating from memory-based storage to database storage
 */
async function exportMemStorage() {
  console.log('Starting export of MemStorage data...');
  
  try {
    // Get all data from storage
    const departments = await storage.listDepartments();
    const jobRoles = await storage.listJobRoles();
    const aiCapabilities = await storage.listAICapabilities();
    const assessments = await storage.listAssessments();
    const reports = await storage.listReports();
    const jobDescriptions = await storage.listJobDescriptions();
    const jobScraperConfigs = await storage.listJobScraperConfigs();
    
    // Create data object
    const data = {
      departments,
      jobRoles,
      aiCapabilities,
      assessments,
      reports,
      jobDescriptions,
      jobScraperConfigs
    };
    
    // Define output directory
    const outputDir = path.resolve(process.cwd(), 'exports');
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const outputFile = path.join(outputDir, `mem-storage-export-${timestamp}.json`);
    
    // Ensure output directory exists
    await ensureDirectoryExists(outputDir);
    
    // Write data to file
    await writeFile(outputFile, JSON.stringify(data, null, 2));
    
    console.log(`Successfully exported data to ${outputFile}`);
    
    // Output summary of exported data
    console.log('\nExport Summary:');
    console.log('---------------');
    console.log(`Departments: ${departments.length}`);
    console.log(`Job Roles: ${jobRoles.length}`);
    console.log(`AI Capabilities: ${aiCapabilities.length}`);
    console.log(`Assessments: ${assessments.length}`);
    console.log(`Reports: ${reports.length}`);
    console.log(`Job Descriptions: ${jobDescriptions.length}`);
    console.log(`Job Scraper Configs: ${jobScraperConfigs.length}`);
    
    // Print job description details if any exist
    if (jobDescriptions.length > 0) {
      console.log('\nJob Description Details:');
      console.log('------------------------');
      jobDescriptions.forEach((job, index) => {
        console.log(`[${index + 1}] ID: ${job.id}`);
        console.log(`    Title: ${job.title}`);
        console.log(`    Company: ${job.company}`);
        console.log(`    Location: ${job.location}`);
        console.log(`    Job Board: ${job.jobBoard}`);
        console.log(`    URL: ${job.sourceUrl}`);
        console.log(`    Status: ${job.status}`);
        console.log(`    Date Scraped: ${job.dateScraped}\n`);
      });
    }
    
    // Print job scraper configs
    if (jobScraperConfigs.length > 0) {
      console.log('\nJob Scraper Configs:');
      console.log('--------------------');
      jobScraperConfigs.forEach((config, index) => {
        console.log(`[${index + 1}] ID: ${config.id}`);
        console.log(`    Name: ${config.name}`);
        console.log(`    Target Website: ${config.targetWebsite}`);
        console.log(`    Keywords: ${config.keywords?.join(', ')}`);
        console.log(`    Location: ${config.location}`);
        console.log(`    Active: ${config.isActive}`);
        console.log(`    Last Run: ${config.lastRun}\n`);
      });
    }
    
  } catch (error) {
    console.error('Error exporting MemStorage data:', error);
  }
}

/**
 * Ensure directory exists, create if it doesn't
 */
async function ensureDirectoryExists(dir: string) {
  try {
    await writeFile(path.join(dir, '.gitkeep'), '');
  } catch (error) {
    // Create directory if it doesn't exist
    const { mkdir } = await import('fs/promises');
    await mkdir(dir, { recursive: true });
  }
}

// Run export function
exportMemStorage(); 