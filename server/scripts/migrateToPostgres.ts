import { readFile, readdir } from 'fs/promises';
import path from 'path';
import * as dotenv from 'dotenv';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { 
  departments, jobRoles, aiCapabilities, 
  assessments, reports, jobDescriptions, jobScraperConfigs 
} from '../../shared/schema.ts';

// Load .env file
dotenv.config();

/**
 * Helper function to parse dates or return null
 */
function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  try {
    return new Date(dateString);
  } catch (e) {
    console.warn(`Failed to parse date string: ${dateString}`);
    return null;
  }
}

/**
 * Find the most recent export file
 */
async function getMostRecentExportFile(exportDir: string): Promise<string> {
  try {
    // Read all files in the exports directory
    const files = await readdir(exportDir);
    
    // Filter for export files
    const exportFiles = files.filter(file => file.startsWith('mem-storage-export-') && file.endsWith('.json'));
    
    if (exportFiles.length === 0) {
      throw new Error('No export files found in the exports directory');
    }
    
    // Sort by date (most recent first)
    exportFiles.sort().reverse();
    
    // Return the most recent file
    return path.join(exportDir, exportFiles[0]);
  } catch (error) {
    console.error('Error finding export file:', error);
    throw error;
  }
}

/**
 * Migrates data from MemStorage export to PostgreSQL
 */
async function migrateToPostgres() {
  // Check if required environment variables are set
  if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL environment variable is not set.');
    console.error('Please set this variable in your .env file or environment.');
    process.exit(1);
  }

  console.log('Starting migration to PostgreSQL...');

  try {
    // Initialize PostgreSQL connection
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    // Initialize Drizzle ORM
    const db = drizzle(pool);
    console.log('PostgreSQL database connection established');

    // Get the most recent export file
    const exportDir = path.resolve(process.cwd(), 'exports');
    const exportFile = await getMostRecentExportFile(exportDir);
    console.log(`Using export file: ${exportFile}`);
    
    // Read the export file
    const fileContent = await readFile(exportFile, 'utf-8');
    
    // Parse the exported data
    const data = JSON.parse(fileContent);
    
    // Check if the data exists
    if (!data) {
      console.error('Error: No data found in export file.');
      process.exit(1);
    }

    console.log('\nData found in export file:');
    console.log(`Departments: ${data.departments.length}`);
    console.log(`Job Roles: ${data.jobRoles.length}`);
    console.log(`AI Capabilities: ${data.aiCapabilities.length}`);
    console.log(`Assessments: ${data.assessments.length}`);
    console.log(`Reports: ${data.reports.length}`);
    console.log(`Job Descriptions: ${data.jobDescriptions.length}`);
    console.log(`Job Scraper Configs: ${data.jobScraperConfigs.length}`);

    // Migrate departments
    if (data.departments.length > 0) {
      console.log('\nMigrating departments...');
      for (const department of data.departments) {
        await db.insert(departments).values({
          id: department.id,
          name: department.name,
          description: department.description
        }).onConflictDoNothing();
      }
      console.log(`Successfully migrated ${data.departments.length} departments`);
    }

    // Migrate job roles
    if (data.jobRoles.length > 0) {
      console.log('\nMigrating job roles...');
      for (const role of data.jobRoles) {
        await db.insert(jobRoles).values({
          id: role.id,
          title: role.title,
          departmentId: role.departmentId,
          description: role.description,
          keyResponsibilities: role.keyResponsibilities,
          aiPotential: role.aiPotential
        }).onConflictDoNothing();
      }
      console.log(`Successfully migrated ${data.jobRoles.length} job roles`);
    }

    // Migrate AI capabilities
    if (data.aiCapabilities.length > 0) {
      console.log('\nMigrating AI capabilities...');
      for (const capability of data.aiCapabilities) {
        await db.insert(aiCapabilities).values({
          id: capability.id,
          name: capability.name,
          category: capability.category,
          description: capability.description,
          implementationEffort: capability.implementationEffort,
          businessValue: capability.businessValue
        }).onConflictDoNothing();
      }
      console.log(`Successfully migrated ${data.aiCapabilities.length} AI capabilities`);
    }

    // Migrate job scraper configs
    if (data.jobScraperConfigs.length > 0) {
      console.log('\nMigrating job scraper configs...');
      for (const config of data.jobScraperConfigs) {
        try {
          await db.insert(jobScraperConfigs).values({
            id: config.id,
            name: config.name,
            targetWebsite: config.targetWebsite,
            keywords: config.keywords,
            location: config.location,
            isActive: config.isActive,
            cronSchedule: config.cronSchedule,
            // Convert dates from string to Date objects or null
            createdAt: parseDate(config.createdAt) || new Date(),
            lastRun: parseDate(config.lastRun)
          }).onConflictDoNothing();
          console.log(`✓ Migrated config: ${config.name}`);
        } catch (error) {
          console.error(`Error migrating config ${config.name}:`, error);
        }
      }
      console.log(`Completed migration of job scraper configs`);
    }

    // Migrate job descriptions
    if (data.jobDescriptions.length > 0) {
      console.log('\nMigrating job descriptions...');
      for (const job of data.jobDescriptions) {
        try {
          await db.insert(jobDescriptions).values({
            id: job.id,
            title: job.title,
            company: job.company,
            location: job.location,
            jobBoard: job.jobBoard,
            sourceUrl: job.sourceUrl,
            rawContent: job.rawContent,
            processedContent: job.processedContent,
            keywords: job.keywords,
            status: job.status,
            // Convert dates from string to Date objects or null
            dateScraped: parseDate(job.dateScraped) || new Date(),
            dateProcessed: parseDate(job.dateProcessed),
            error: job.error
          }).onConflictDoNothing();
          console.log(`✓ Migrated job: ${job.title}`);
        } catch (error) {
          console.error(`Error migrating job ${job.title}:`, error);
        }
      }
      console.log(`Completed migration of job descriptions`);
    }

    console.log('\nMigration completed successfully!');
    
    // Close the database connection
    await pool.end();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error migrating to PostgreSQL:', error);
    process.exit(1);
  }
}

// Run the migration
migrateToPostgres(); 