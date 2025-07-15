import { JobScraper } from '../lib/services/jobScraper';
import type { JobScraperConfig } from '../../shared/schema';
import { storage } from '../storage';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// --- Start of Logging Setup ---
const LOGS_DIR = path.join(process.cwd(), 'logs');
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

const logFileName = `scraper-run-${new Date().toISOString().replace(/:/g, '-')}.log`;
const logFilePath = path.join(LOGS_DIR, logFileName);
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = (...args: any[]) => {
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg).join(' ');
  logStream.write(`[LOG] ${new Date().toISOString()}: ${message}\n`);
  originalConsoleLog.apply(console, args);
};

console.error = (...args: any[]) => {
  const message = args.map(arg => {
    if (arg instanceof Error) {
      return arg.stack;
    }
    return typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg;
  }).join(' ');
  logStream.write(`[ERROR] ${new Date().toISOString()}: ${message}\n`);
  originalConsoleError.apply(console, args);
};

console.log(`Logging scraper activity to: ${logFilePath}`);
// --- End of Logging Setup ---

/**
 * Multi-role job scraper with random intervals
 *
 * USAGE:
 * 1. For a single, specific job scrape:
 *    - Create a config file (e.g., server/scraper/configs/your-job.json).
 *    - Run: npx tsx server/scraper/custom-scraper.ts --config server/scraper/configs/your-job.json
 * 
 * 2. For scraping multiple hardcoded roles:
 *    - Make sure DATABASE_URL, LINKEDIN_EMAIL, and LINKEDIN_PASSWORD are in your .env file
 *    - Run with: NODE_ENV=development npx tsx server/scraper/custom-scraper.ts
 */

// Define job roles to scrape (used when not in single-scrape mode)
const jobRolesToScrape = [
  {
    title: 'Customer Success Manager',
    keywords: ['Customer Success Manager', 'CSM', 'Client Success Manager', 'Customer Success']
  },
  {
    title: 'Customer Support',
    keywords: ['Customer Support', 'CSR', 'Support Representative', 'Client Support']
  },
  {
    title: 'Marketing Manager',
    keywords: ['Marketing Manager', 'Digital Marketing Manager', 'Growth Marketing', 'Product Marketing Manager']
  },
  {
    title: 'Revenue Operations',
    keywords: ['Revenue Operations', 'GTM Operations', 'RevOps', 'Revenue Operations Manager', 'Sales Operations']
  },
  {
    title: 'Sales Manager',
    keywords: ['Sales Manager', 'Regional Sales Manager', 'Account Manager', 'Account Executive']
  },
  {
    title: 'Sales Development Representative',
    keywords: ['Sales Development Representative', 'SDR', 'Business Development Representative']
  },
  {
    title: 'Sales Engineer',
    keywords: ['Sales Engineer', 'Solutions Engineer', 'SE', 'Pre-Sales Engineer', 'Pre-Sales Solutions Engineer']
  },
  {
    title: 'Seller Enablement',
    keywords: ['Sales Enablement', 'Sales Enablement Manager', 'Seller Productivity', 'GTM Enablement']
  },
  {
    title: 'IT Systems Analyst',
    keywords: ['IT Systems Analyst', 'IT Systems', 'IT Support Engineer', 'IT Support Representative']
  }
  
];

// Function to get a random delay between min and max seconds
function getRandomDelay(minSeconds: number, maxSeconds: number): number {
  return Math.floor(Math.random() * (maxSeconds - minSeconds + 1) + minSeconds) * 1000;
}

async function scrapeSingleRole(config: JobScraperConfig): Promise<number> {
  const jobScraper = new JobScraper();

  console.log(`\nPreparing to scrape for: ${config.name}`);
      
  // Random delay before starting this role (3-10 seconds)
  const startDelay = getRandomDelay(3, 10);
  console.log(`Waiting ${startDelay/1000} seconds before starting...`);
  await new Promise(resolve => setTimeout(resolve, startDelay));
  
  console.log(`Starting scrape for ${config.name}...`);
  console.log(`Keywords: ${config.keywords?.join(', ') || 'No keywords specified'}`);
  console.log(`Locations: ${config.location || 'N/A'}`);
  console.log(`Max results to fetch for this run: ${config.maxResults}`);

  try {
    // The runScraper method now handles all logic internally, including duplicate checking and saving.
    // It returns the count of NEW jobs that were successfully saved to the database.
    const newJobsCount = await jobScraper.runScraper(config);
    
    console.log(`Completed ${config.name}. Saved ${newJobsCount} new unique jobs to the database.`);
    return newJobsCount;
  } catch (roleError) {
    console.error(`Error scraping for ${config.name}:`, roleError);
    return 0; // Return 0 if there was an error
  }
}


async function runMultiRoleScraper() {
  try {
    console.log('Starting multi-role job scraper with random intervals...');
    console.log('Will collect up to 50 total job descriptions across multiple roles');
    
    const jobScraper = new JobScraper();
    let totalJobsScraped = 0;
    const maxJobsToScrape = 50;
    
    // Get current job count in database
    try {
      const existingJobs = await storage.listJobDescriptions();
      console.log(`Currently have ${existingJobs.length} job descriptions in database`);
    } catch (error) {
      console.log('Could not get existing job count, continuing with scraping');
    }
    
    // Randomize the order of roles
    const shuffledRoles = [...jobRolesToScrape].sort(() => Math.random() - 0.5);
    
    // Process each role with random delays
    for (const role of shuffledRoles) {
      if (totalJobsScraped >= maxJobsToScrape) {
        console.log(`Reached limit of ${maxJobsToScrape} jobs. Stopping.`);
        break;
      }
      
      const config: JobScraperConfig = {
        id: Math.floor(Math.random() * 10000), // Random ID for this run
        name: `${role.title} Jobs`,
        targetWebsite: 'linkedin',
        keywords: role.keywords,
        location: 'Remote',
        isActive: true,
        lastRun: null,
        createdAt: new Date(),
        cronSchedule: '0 0 * * *',
        maxResults: maxJobsToScrape - totalJobsScraped,
      };
      
      const newJobsCount = await scrapeSingleRole(config);
      totalJobsScraped += newJobsCount;

      console.log(`Total new unique jobs scraped so far: ${totalJobsScraped}/${maxJobsToScrape}`);
      
      // Random delay before next role (15-45 seconds)
      if (totalJobsScraped < maxJobsToScrape && shuffledRoles.indexOf(role) < shuffledRoles.length - 1) {
        const nextDelay = getRandomDelay(15, 45);
        console.log(`Waiting ${nextDelay/1000} seconds before next role...`);
        await new Promise(resolve => setTimeout(resolve, nextDelay));
      }
    }
    
    console.log(`\nScraping complete. Total new unique jobs scraped: ${totalJobsScraped}`);
    
  } catch (error) {
    console.error('Error running job scraper:', error);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const configArgIndex = args.findIndex(arg => arg === '--config');
  
  const initialJobs = await storage.listJobDescriptions();
  console.log(`Found ${initialJobs.length} jobs in the database initially.`);

  if (configArgIndex !== -1 && args[configArgIndex + 1]) {
    const configPath = path.resolve(args[configArgIndex + 1]);
    console.log(`Running in single-scrape mode with config: ${configPath}`);
    
    try {
      const configFile = fs.readFileSync(configPath, 'utf-8');
      const externalConfig = JSON.parse(configFile);

      const locations = Array.isArray(externalConfig.locations) ? externalConfig.locations : [externalConfig.locations];
      const globalMaxResults = externalConfig.maxResults || 50;
      let totalJobsScraped = 0;

      for (const location of locations) {
        if (totalJobsScraped >= globalMaxResults) {
          console.log(`Global max results limit of ${globalMaxResults} reached. Halting all scraping.`);
          break;
        }

        console.log(`\n--- Starting scrape for location: ${location} ---`);
        const remainingJobsToScrape = globalMaxResults - totalJobsScraped;
        console.log(`Need to find ${remainingJobsToScrape} more jobs.`);


        const config: JobScraperConfig = {
          id: Math.floor(Math.random() * 10000),
          name: `${externalConfig.jobTitle} (${location})` || `Custom Scrape (${location})`,
          targetWebsite: externalConfig.source || 'linkedin',
          keywords: externalConfig.searchTerms || [],
          location: location,
          maxResults: remainingJobsToScrape,
          isActive: true,
          lastRun: null,
          createdAt: new Date(),
          cronSchedule: '',
        };
        
        const newJobsCount = await scrapeSingleRole(config);
        totalJobsScraped += newJobsCount;
      }
      console.log(`\n--- Total new unique jobs scraped across all locations: ${totalJobsScraped} ---`);

    } catch (error) {
      console.error(`Error reading or parsing config file at ${configPath}:`, error);
      process.exit(1);
    }
  } else {
    console.log('No --config flag found. Running in multi-role scraper mode.');
    await runMultiRoleScraper();
  }
}


// Run the scraper
main();