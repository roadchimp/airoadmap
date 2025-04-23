import { InsertJobDescription, JobScraperConfig } from '@shared/schema';
import { storage } from '../storage';
import puppeteer from 'puppeteer';

/**
 * Scraper class for LinkedIn job descriptions
 */
class LinkedInScraper {
  async scrapeJobDescriptions(config: JobScraperConfig): Promise<InsertJobDescription[]> {
    const { keywords, location } = config;
    const jobDescriptions: InsertJobDescription[] = [];
    
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      
      // For each keyword, perform a search
      for (const keyword of keywords) {
        const searchQuery = encodeURIComponent(`${keyword} ${location || ''}`);
        const url = `https://www.linkedin.com/jobs/search/?keywords=${searchQuery}`;
        
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        
        // Wait for job listings to load
        await page.waitForSelector('.jobs-search__results-list', { timeout: 10000 }).catch(() => {
          console.log('Could not find job listings');
        });
        
        // Extract job links
        const jobLinks = await page.evaluate(() => {
          const links = document.querySelectorAll('.jobs-search__results-list a.job-card-container');
          return Array.from(links).map(link => link.getAttribute('href'));
        });
        
        // Visit each job posting and extract details
        for (let i = 0; i < Math.min(jobLinks.length, 10); i++) {
          const jobUrl = jobLinks[i];
          
          if (!jobUrl) continue;
          
          await page.goto(jobUrl, { waitUntil: 'domcontentloaded' });
          
          // Wait for job description to load
          await page.waitForSelector('.job-details', { timeout: 10000 }).catch(() => {
            console.log('Could not find job details');
          });
          
          // Extract job details
          const jobDetails = await page.evaluate(() => {
            const title = document.querySelector('.job-details-jobs-unified-top-card__job-title')?.textContent?.trim();
            const company = document.querySelector('.job-details-jobs-unified-top-card__company-name')?.textContent?.trim();
            const location = document.querySelector('.job-details-jobs-unified-top-card__bullet')?.textContent?.trim();
            const descriptionElement = document.querySelector('.jobs-description__content');
            const description = descriptionElement?.textContent?.trim();
            
            return {
              title,
              company,
              location,
              description
            };
          });
          
          if (jobDetails.title && jobDetails.description) {
            jobDescriptions.push({
              title: jobDetails.title,
              company: jobDetails.company || '',
              location: jobDetails.location || '',
              jobBoard: 'linkedin',
              sourceUrl: jobUrl,
              rawContent: jobDetails.description,
              keywords: [keyword],
              status: 'raw'
            });
          }
        }
      }
      
      await browser.close();
    } catch (error) {
      console.error('Error scraping LinkedIn:', error);
    }
    
    return jobDescriptions;
  }
}

/**
 * Scraper class for Indeed job descriptions
 */
class IndeedScraper {
  async scrapeJobDescriptions(config: JobScraperConfig): Promise<InsertJobDescription[]> {
    const { keywords, location } = config;
    const jobDescriptions: InsertJobDescription[] = [];
    
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      
      // For each keyword, perform a search
      for (const keyword of keywords) {
        const searchQuery = encodeURIComponent(keyword);
        const locationQuery = encodeURIComponent(location || '');
        const url = `https://www.indeed.com/jobs?q=${searchQuery}&l=${locationQuery}`;
        
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        
        // Wait for job listings to load
        await page.waitForSelector('.jobsearch-ResultsList', { timeout: 10000 }).catch(() => {
          console.log('Could not find job listings');
        });
        
        // Extract job links
        const jobLinks = await page.evaluate(() => {
          const links = document.querySelectorAll('a.jcs-JobTitle');
          return Array.from(links).map(link => link.getAttribute('href'));
        });
        
        // Visit each job posting and extract details
        for (let i = 0; i < Math.min(jobLinks.length, 10); i++) {
          let jobUrl = jobLinks[i];
          
          if (!jobUrl) continue;
          
          // Make sure the URL is absolute
          if (jobUrl.startsWith('/')) {
            jobUrl = `https://www.indeed.com${jobUrl}`;
          }
          
          await page.goto(jobUrl, { waitUntil: 'domcontentloaded' });
          
          // Wait for job description to load
          await page.waitForSelector('.jobsearch-JobComponent', { timeout: 10000 }).catch(() => {
            console.log('Could not find job details');
          });
          
          // Extract job details
          const jobDetails = await page.evaluate(() => {
            const title = document.querySelector('.jobsearch-JobInfoHeader-title')?.textContent?.trim();
            const company = document.querySelector('.jobsearch-CompanyInfoContainer a')?.textContent?.trim();
            const location = document.querySelector('.jobsearch-JobInfoHeader-subtitle .jobsearch-JobInfoHeader-compLocation')?.textContent?.trim();
            const descriptionElement = document.querySelector('#jobDescriptionText');
            const description = descriptionElement?.textContent?.trim();
            
            return {
              title,
              company,
              location,
              description
            };
          });
          
          if (jobDetails.title && jobDetails.description) {
            jobDescriptions.push({
              title: jobDetails.title,
              company: jobDetails.company || '',
              location: jobDetails.location || '',
              jobBoard: 'indeed',
              sourceUrl: jobUrl,
              rawContent: jobDetails.description,
              keywords: [keyword],
              status: 'raw'
            });
          }
        }
      }
      
      await browser.close();
    } catch (error) {
      console.error('Error scraping Indeed:', error);
    }
    
    return jobDescriptions;
  }
}

/**
 * Factory for creating the appropriate scraper based on the job board
 */
class ScraperFactory {
  static getScraper(jobBoard: string) {
    switch (jobBoard.toLowerCase()) {
      case 'linkedin':
        return new LinkedInScraper();
      case 'indeed':
        return new IndeedScraper();
      default:
        throw new Error(`Unsupported job board: ${jobBoard}`);
    }
  }
}

/**
 * Main class for managing job description scraping
 */
export class JobScraper {
  /**
   * Run the scraper for a specific configuration
   */
  async runScraper(config: JobScraperConfig): Promise<number> {
    try {
      console.log(`Running job scraper for ${config.name}`);
      
      // Get the appropriate scraper
      const scraper = ScraperFactory.getScraper(config.targetWebsite);
      
      // Scrape job descriptions
      const jobDescriptions = await scraper.scrapeJobDescriptions(config);
      
      console.log(`Found ${jobDescriptions.length} job descriptions for ${config.name}`);
      
      // Save job descriptions to storage
      for (const jobDescription of jobDescriptions) {
        await storage.createJobDescription(jobDescription);
      }
      
      // Update the last run time for the config
      await storage.updateJobScraperConfigLastRun(config.id);
      
      return jobDescriptions.length;
    } catch (error) {
      console.error(`Error running job scraper for ${config.name}:`, error);
      return 0;
    }
  }
  
  /**
   * Run all active scrapers
   */
  async runAllScrapers(): Promise<void> {
    try {
      const configs = await storage.listActiveJobScraperConfigs();
      
      console.log(`Running ${configs.length} active job scrapers`);
      
      for (const config of configs) {
        await this.runScraper(config);
      }
    } catch (error) {
      console.error('Error running all job scrapers:', error);
    }
  }
} 