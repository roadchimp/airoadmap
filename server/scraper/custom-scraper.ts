import { JobScraper } from '../lib/jobScraper.ts';
import type { JobScraperConfig, JobDescription } from '../../shared/schema.ts';
import { storage } from '../storage.ts';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Multi-role job scraper with random intervals
 * 
 * USAGE:
 * 1. Make sure DATABASE_URL, LINKEDIN_EMAIL, and LINKEDIN_PASSWORD are in your .env file
 * 2. Run with: npx tsx server/scraper/custom-scraper.ts
 */

// Define job roles to scrape
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

// Track existing job URLs to avoid duplicates
let existingJobUrls = new Set<string>();

async function loadExistingJobUrls() {
  try {
    // Get all existing job descriptions
    const allJobs = await storage.listJobDescriptions(1000, 0);
    
    // Extract and store all source URLs in a Set for efficient lookup
    existingJobUrls = new Set(allJobs.map(job => job.sourceUrl));
    console.log(`Loaded ${existingJobUrls.size} existing job URLs from database to avoid duplicates`);
  } catch (error) {
    console.error('Error loading existing job URLs:', error);
    console.log('Will continue without duplicate checking');
  }
}

// Function to filter out duplicate jobs
function filterNewJobs(jobs: JobDescription[]): JobDescription[] {
  const newJobs = jobs.filter(job => !existingJobUrls.has(job.sourceUrl));
  
  // Add new URLs to our set to prevent duplicates within this run
  newJobs.forEach(job => existingJobUrls.add(job.sourceUrl));
  
  if (jobs.length !== newJobs.length) {
    console.log(`Filtered out ${jobs.length - newJobs.length} duplicate jobs`);
  }
  
  return newJobs;
}

// Monkey patch the JobScraper class to add duplicate filtering
const originalRunScraper = JobScraper.prototype.runScraper;
JobScraper.prototype.runScraper = async function(config: JobScraperConfig): Promise<number> {
  // Call the original method which returns number of jobs scraped
  const scrapedJobs = await originalRunScraper.call(this, config);
  
  // We don't have direct access to the job descriptions here, but we'll check after each role
  return scrapedJobs;
};

async function runMultiRoleScraper() {
  try {
    console.log('Starting multi-role job scraper with random intervals...');
    console.log('Will collect up to 50 total job descriptions across multiple roles');
    
    // Load existing job URLs first to prevent duplicates
    await loadExistingJobUrls();
    
    const jobScraper = new JobScraper();
    let totalJobsScraped = 0;
    const maxJobsToScrape = 50;
    
    // Get current job count in database - using listJobDescriptions since countJobDescriptions doesn't exist
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
      
      console.log(`\nPreparing to scrape for: ${role.title}`);
      
      // Random delay before starting this role (3-10 seconds)
      const startDelay = getRandomDelay(3, 10);
      console.log(`Waiting ${startDelay/1000} seconds before starting...`);
      await new Promise(resolve => setTimeout(resolve, startDelay));
      
      // Create configuration for this role
      const config: JobScraperConfig = {
        id: Math.floor(Math.random() * 10000), // Random ID for this run
        name: `${role.title} Jobs`,
        targetWebsite: 'linkedin', // Use LinkedIn only
        keywords: role.keywords,
        location: 'Remote', // Default to remote
        isActive: true,
        lastRun: null,
        createdAt: new Date(),
        cronSchedule: '0 0 * * *', // Not relevant for manual run
      };
      
      console.log(`Starting scrape for ${role.title}...`);
      console.log(`Keywords: ${config.keywords?.join(', ') || 'No keywords specified'}`);
      console.log(`Target website: LinkedIn`);
      
      // Run the scraper with our configuration
      try {
        const jobsScraped = await jobScraper.runScraper(config);
        
        // After scraping, check for new jobs that might have been added
        const afterScrapingJobs = await storage.listJobDescriptions(1000, 0);
        const newJobUrls = afterScrapingJobs
          .filter(job => !existingJobUrls.has(job.sourceUrl))
          .map(job => job.sourceUrl);
        
        // Update our tracking set with any new jobs
        newJobUrls.forEach(url => existingJobUrls.add(url));
        
        // Update our count of actual new jobs
        totalJobsScraped += newJobUrls.length;
        
        console.log(`Completed ${role.title}. Found ${jobsScraped} jobs, ${newJobUrls.length} new unique jobs.`);
        console.log(`Total new unique jobs scraped so far: ${totalJobsScraped}/${maxJobsToScrape}`);
      } catch (roleError) {
        console.error(`Error scraping for ${role.title}:`, roleError);
        console.log('Continuing with next role...');
      }
      
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

// Run the scraper
runMultiRoleScraper(); 