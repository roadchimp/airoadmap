import { JobScraper } from '../lib/jobScraper.ts';
import { storage } from '../storage.ts';
import type { JobScraperConfig } from '../../shared/schema.ts';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check for required environment variables
const requiredEnvVars = ['DATABASE_URL', 'LINKEDIN_EMAIL', 'LINKEDIN_PASSWORD'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Error: The following required environment variables are missing:');
  missingVars.forEach(varName => console.error(`- ${varName}`));
  console.error('\nPlease ensure these variables are set in your .env file.');
  process.exit(1);
}

// Get the role ID from command line arguments
const roleId = process.argv[2] ? parseInt(process.argv[2], 10) : null;

if (!roleId) {
  console.error('Please provide a role ID as an argument: npx tsx server/scraper/scrape-by-role-id.ts <roleId>');
  process.exit(1);
}

async function scrapeByRoleId(roleId: number) {
  try {
    console.log(`Looking up job role with ID ${roleId}...`);
    
    // Get the job role from the database
    const role = await storage.getJobRole(roleId);
    
    if (!role) {
      console.error(`No job role found with ID ${roleId}`);
      return;
    }
    
    console.log(`Found job role: ${role.title}`);
    
    // Generate keywords based on the job title
    const keywords = generateKeywords(role.title);
    
    // Create a temporary configuration for this run
    const config: JobScraperConfig = {
      id: 9999, // Temporary ID for this run
      name: `${role.title} Jobs (Manual Run)`,
      targetWebsite: 'linkedin', // Default to LinkedIn
      keywords: keywords,
      location: 'Remote', // Default to remote
      isActive: true,
      lastRun: null,
      createdAt: new Date(),
      cronSchedule: '0 0 * * *', // Not relevant for manual run
    };
    
    console.log(`Starting job scrape for ${role.title}...`);
    console.log(`Keywords: ${config.keywords?.join(', ') || 'No keywords specified'}`);
    console.log(`Location: ${config.location || 'No location specified'}`);
    
    // Create a job scraper instance
    const jobScraper = new JobScraper();
    
    // Run the scraper with our configuration
    const numJobs = await jobScraper.runScraper(config);
    
    console.log(`Scraping complete. Found ${numJobs} jobs for ${role.title}.`);
  } catch (error) {
    console.error('Error running job scraper:', error);
    if (error instanceof Error) {
      if (error.message.includes('DATABASE_URL')) {
        console.error('\nDatabase connection error. Please check your DATABASE_URL in the .env file.');
      } else if (error.message.includes('getJobRole')) {
        console.error('\nError retrieving job role. Make sure your database is properly set up and contains job roles.');
      }
    }
  }
}

/**
 * Generate relevant keywords for a job title
 */
function generateKeywords(jobTitle: string): string[] {
  const keywords = [jobTitle];
  
  // Add variations based on common job title patterns
  if (jobTitle.includes('Manager')) {
    keywords.push(jobTitle.replace('Manager', 'Lead'));
  }
  
  if (jobTitle === 'Customer Success Manager') {
    keywords.push('CSM', 'Client Success Manager', 'Customer Success');
  } else if (jobTitle === 'Sales Development Representative') {
    keywords.push('SDR', 'Sales Representative', 'Business Development Representative');
  } else if (jobTitle === 'Sales Engineer') {
    keywords.push('Solutions Engineer', 'SE', 'Technical Sales');
  } else if (jobTitle.includes('Support')) {
    keywords.push('Customer Support', 'Technical Support', 'Help Desk');
  } else if (jobTitle.includes('Operations')) {
    keywords.push('Revenue Operations', 'RevOps', 'Business Operations');
  }
  
  return keywords;
}

// Run the scraper with the provided role ID
scrapeByRoleId(roleId); 