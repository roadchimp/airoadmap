import { JobScraper } from './server/lib/jobScraper.ts';
import type { JobScraperConfig } from './shared/schema';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testScraper() {
  try {
    const jobScraper = new JobScraper();
    
    // Create a minimal test configuration
    const testConfig: JobScraperConfig = {
      id: 1,
      name: 'Test Scraper',
      targetWebsite: 'linkedin',
      keywords: ['software engineer'], // Just one keyword for testing
      location: 'Remote',
      isActive: true,
      lastRun: null,
      createdAt: new Date(),
      cronSchedule: '0 0 * * *'
    };

    console.log('Starting test scrape...');
    const numJobs = await jobScraper.runScraper(testConfig);
    console.log(`Scraping complete. Found ${numJobs} jobs.`);
  } catch (error) {
    console.error('Error running test scrape:', error);
  }
}

// Run the test
testScraper(); 