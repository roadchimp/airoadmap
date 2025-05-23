import { storage } from '../storage.ts';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function createScraperConfigs() {
  try {
    console.log('Creating job scraper configurations based on job roles in the database...');
    
    // Get all job roles from the database
    const jobRoles = await storage.listJobRoles();
    console.log(`Found ${jobRoles.length} job roles in the database`);
    
    if (jobRoles.length === 0) {
      console.log('No job roles found in the database. Please add job roles first.');
      return;
    }
    
    // Process each job role
    for (const role of jobRoles) {
      console.log(`Creating configuration for ${role.title}...`);
      
      // Generate keywords based on the job title
      const keywords = generateKeywords(role.title);
      
      // Create config for LinkedIn
      const linkedInConfig = await storage.createJobScraperConfig({
        name: `LinkedIn ${role.title} Jobs`,
        targetWebsite: 'linkedin',
        keywords: keywords,
        location: 'Remote', // Default to remote, can be customized
        isActive: true,
        cronSchedule: '0 0 * * 0' // Weekly on Sunday
      });
      
      console.log(`Created LinkedIn config for ${role.title} with ID: ${linkedInConfig.id}`);
      
      // Create config for Indeed
      const indeedConfig = await storage.createJobScraperConfig({
        name: `Indeed ${role.title} Jobs`,
        targetWebsite: 'indeed',
        keywords: keywords,
        location: 'Remote', // Default to remote, can be customized
        isActive: true,
        cronSchedule: '0 0 * * 3' // Weekly on Wednesday
      });
      
      console.log(`Created Indeed config for ${role.title} with ID: ${indeedConfig.id}`);
    }
    
    console.log('All job scraper configurations created successfully!');
    
    // List all configurations
    const allConfigs = await storage.listJobScraperConfigs();
    console.log(`Total job scraper configurations: ${allConfigs.length}`);
    
  } catch (error) {
    console.error('Error creating job scraper configurations:', error);
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

// Run the function to create configurations
createScraperConfigs(); 