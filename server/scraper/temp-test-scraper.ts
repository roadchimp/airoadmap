import { JobScraper } from '../lib/services/jobScraper';
import type { JobScraperConfig } from '../../shared/schema';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Monkey patch console methods to add timestamps
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = function(...args) {
  originalLog(`[${new Date().toISOString()}] 📝`, ...args);
};

console.error = function(...args) {
  originalError(`[${new Date().toISOString()}] ❌`, ...args);
};

console.warn = function(...args) {
  originalWarn(`[${new Date().toISOString()}] ⚠️`, ...args);
};

// Add debug logging for network requests
process.env.DEBUG = 'puppeteer:*';

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
      cronSchedule: '0 0 * * *',
      maxResults: 10, // Add max results for testing
    };

    console.log('Starting test scrape with verbose logging...');
    const numJobs = await jobScraper.runScraper(testConfig);
    console.log(`Scraping complete. Found ${numJobs} jobs.`);
  } catch (error) {
    console.error('Error running test scrape:', error);
  }
}

// Run the test
testScraper(); 