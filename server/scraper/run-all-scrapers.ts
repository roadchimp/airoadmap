import { JobScraper } from '../lib/services/jobScraper';
import { storage } from '../storage';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function runAllScrapers() {
  try {
    console.log('Starting execution of all active job scrapers...');
    
    // Get all active job scraper configurations
    const configs = await storage.listActiveJobScraperConfigs();
    console.log(`Found ${configs.length} active job scraper configurations`);
    
    if (configs.length === 0) {
      console.log('No active configurations found. Use create-job-configs.ts to create some configurations first.');
      return;
    }
    
    // Create a new JobScraper instance
    const jobScraper = new JobScraper();
    
    // Run the runAllScrapers method which will execute all configurations
    console.log('Executing all job scrapers - this might take some time...');
    await jobScraper.runAllScrapers();
    
    console.log('All job scrapers completed successfully!');
    
  } catch (error) {
    console.error('Error running job scrapers:', error);
  }
}

// Run the function
runAllScrapers(); 