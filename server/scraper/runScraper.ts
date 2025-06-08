import { JobScraper } from '../lib/jobScraper.ts';
import { storage } from '../storage.ts';
import * as dotenv from 'dotenv';
import { JobScraperConfig } from '../../shared/schema.ts';

// Load environment variables from .env file
dotenv.config();

const main = async () => {
  try {
    console.log('Starting job scraper for LinkedIn tech jobs...');
    
    // Try to get an existing config
    const configs = await storage.listJobScraperConfigs();
    let config: JobScraperConfig | undefined;
    
    // If no configs exist, create one
    if (!configs || configs.length === 0) {
      console.log('No job scraper configs found, creating a new one...');
      
      // Create a new config for LinkedIn tech jobs
      config = await storage.createJobScraperConfig({
        name: 'LinkedIn Tech Jobs',
        targetWebsite: 'linkedin',
        keywords: ['backend', 'frontend', 'fullstack', 'developer'],
        location: 'Remote',
        isActive: true,
        cronSchedule: '0 0 * * *' // Daily at midnight
      });
      
      console.log(`Created new job scraper config: "${config.name}"`);
    } else {
      // Use the first config
      config = configs[0];
      console.log(`Using existing config: "${config.name}" targeting ${config.targetWebsite}`);
    }
    
    console.log(`Keywords: ${config.keywords?.join(', ')}`);
    console.log(`Location: ${config.location}`);
    
    // Run the scraper
    const scraper = new JobScraper();
    const jobsScraped = await scraper.runScraper(config);
    
    console.log(`Job scraper completed - scraped ${jobsScraped} jobs`);
  } catch (error) {
    console.error('Error running scraper:', error);
    process.exit(1);
  }
};

main(); 