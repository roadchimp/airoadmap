import { InsertJobDescription, JobScraperConfig } from '../../shared/schema.ts';
import { storage } from '../storage.ts';
import puppeteer, { Page } from 'puppeteer';
import { LINKEDIN_EMAIL, LINKEDIN_PASSWORD } from '../config.ts';
import pLimit from 'p-limit';

// Rate limiting configuration
const LINKEDIN_CONFIG = {
  MAX_JOBS_PER_KEYWORD: 1,        // Reduced to 1 for testing
  PAGE_LOAD_DELAY: 3000,          // Delay between page loads (3 seconds)
  SCROLL_DELAY: 2000,             // Delay between scrolls (2 seconds)
  BETWEEN_JOBS_DELAY: 5000,       // Delay between job detail scrapes (5 seconds)
  BETWEEN_KEYWORDS_DELAY: 30000,  // Delay between keywords (30 seconds)
  MAX_CONCURRENT_SCRAPES: 1       // Ensure single-threaded execution
};

/**
 * Scraper class for LinkedIn job descriptions
 */
class LinkedInScraper {
  private limit = pLimit(LINKEDIN_CONFIG.MAX_CONCURRENT_SCRAPES);

  private async randomDelay(min: number, max: number): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private async setupPage(page: Page): Promise<void> {
    // Enable request interception and logging
    await page.setRequestInterception(true);

    page.on('request', request => {
      console.log(`🌐 [${request.method()}] Request to: ${request.url()}`);
      request.continue();
    });

    page.on('response', async response => {
      const status = response.status();
      const statusText = response.statusText();
      const url = response.url();
      console.log(`📥 [${status} ${statusText}] Response from: ${url}`);
      
      if (status >= 400) {
        console.error(`❌ Error response: ${status} ${statusText} for ${url}`);
        try {
          const text = await response.text();
          console.error('Response body:', text);
        } catch (e) {
          console.error('Could not read response body');
        }
      }
    });

    page.on('console', msg => {
      console.log('🔍 Browser console:', msg.text());
    });

    page.on('pageerror', error => {
      console.error('❌ Page error:', error);
    });

    // Set a more descriptive user agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Increase default timeout
    page.setDefaultTimeout(60000);
  }

  private async login(page: Page): Promise<boolean> {
    try {
      console.log('🔑 Attempting to navigate to LinkedIn login page...');
      // Navigate to LinkedIn login page with more lenient wait conditions
      await page.goto('https://www.linkedin.com/login', { 
        waitUntil: 'domcontentloaded',
        timeout: 60000  // Increased timeout for initial load
      });
      
      console.log('📝 Filling in credentials...');
      // Wait for and fill in credentials with explicit waits
      await page.waitForSelector('#username', { timeout: 30000 });
      await page.waitForSelector('#password', { timeout: 30000 });
      await page.type('#username', LINKEDIN_EMAIL, { delay: 100 });
      await page.type('#password', LINKEDIN_PASSWORD, { delay: 100 });
      
      console.log('🖱️ Clicking sign in button...');
      // Click sign in button with explicit wait
      await page.waitForSelector('button[type="submit"]', { timeout: 30000 });
      await Promise.all([
        page.click('button[type="submit"]'),
        // Wait for navigation with more lenient conditions
        page.waitForNavigation({ 
          waitUntil: 'networkidle2',
          timeout: 60000 
        })
      ]);
      
      // Add a small delay to allow for any post-login redirects
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check multiple selectors that indicate successful login
      const isLoggedIn = await page.evaluate(() => {
        const selectors = [
          'div[data-control-name="identity_welcome_message"]',
          '.feed-identity-module',
          '.global-nav__me',
          '.share-box-feed-entry__wrapper',
          '.search-global-typeahead__input'
        ];
        return selectors.some(selector => document.querySelector(selector) !== null);
      });

      if (isLoggedIn) {
        console.log('✅ Successfully logged in to LinkedIn');
      } else {
        console.error('❌ Login unsuccessful - no success indicators found');
        // Take a screenshot for debugging if login fails
        await page.screenshot({ 
          path: 'linkedin-login-failed.png',
          fullPage: true 
        });
      }
      
      return isLoggedIn;
    } catch (error) {
      console.error('❌ LinkedIn login failed:', error);
      // Take a screenshot on error
      try {
        await page.screenshot({ 
          path: 'linkedin-login-error.png',
          fullPage: true 
        });
      } catch (screenshotError) {
        console.error('Failed to take error screenshot:', screenshotError);
      }
      return false;
    }
  }

  async scrapeJobDescriptions(config: JobScraperConfig): Promise<InsertJobDescription[]> {
    const jobDescriptions: InsertJobDescription[] = [];
    const keywords = config.keywords ?? [];
    const location = config.location;

    try {
      console.log('🚀 Launching browser...');
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
      });

      console.log('📄 Creating new page...');
      const page = await browser.newPage();
      
      console.log('⚙️ Setting up page with logging and monitoring...');
      await this.setupPage(page);
      
      // Login to LinkedIn first
      const isLoggedIn = await this.login(page);
      if (!isLoggedIn) {
        console.error('❌ Failed to log in to LinkedIn. Please check your credentials.');
        await browser.close();
        return jobDescriptions;
      }

      // Add a delay after login
      console.log('⏳ Adding delay after login...');
      await this.randomDelay(5000, 8000);

      if (!keywords || keywords.length === 0) {
        console.log('⚠️ No keywords provided for scraping');
        await browser.close();
        return jobDescriptions;
      }

      for (const keyword of keywords) {
        console.log(`🔍 Scraping jobs for keyword: "${keyword}"`);
        
        const searchQuery = encodeURIComponent(`${keyword} ${location || ''}`);
        const url = `https://www.linkedin.com/jobs/search/?keywords=${searchQuery}`;
        
        console.log(`⏳ Adding delay before loading search page for "${keyword}"...`);
        await this.randomDelay(LINKEDIN_CONFIG.PAGE_LOAD_DELAY * 0.8, LINKEDIN_CONFIG.PAGE_LOAD_DELAY * 1.2);
        
        console.log(`🌐 Navigating to search results for "${keyword}"...`);
        await page.goto(url, { 
          waitUntil: 'networkidle0',
          timeout: 60000 
        });

        // Wait for job listings with increased timeout
        const jobListSelector = '.jobs-search__results-list';
        console.log('⏳ Waiting for job listings to load...');
        await page.waitForSelector(jobListSelector, { timeout: 60000 })
          .catch(() => {
            console.log('⚠️ Could not find job listings, might be rate limited');
            return [];
          });

        // Scroll to load more jobs
        console.log('📜 Scrolling to load more jobs...');
        await page.evaluate(async () => {
          await new Promise<void>((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
              const scrollHeight = document.documentElement.scrollHeight;
              window.scrollBy(0, distance);
              totalHeight += distance;
              
              if (totalHeight >= scrollHeight) {
                clearInterval(timer);
                resolve();
              }
            }, 100);
          });
        });

        // Wait a bit after scrolling
        console.log('⏳ Adding delay after scrolling...');
        await this.randomDelay(2000, 3000);

        // Extract job links with retry mechanism
        let jobLinks: string[] = [];
        let retryCount = 0;
        while (retryCount < 3 && jobLinks.length === 0) {
          console.log(`🔍 Attempt ${retryCount + 1} to extract job links...`);
          jobLinks = await page.evaluate(() => {
            const links = document.querySelectorAll<HTMLAnchorElement>('a.job-card-container__link');
            return Array.from(links)
              .map(link => link.href)
              .filter((href): href is string => href !== null);
          });
          
          if (jobLinks.length === 0) {
            console.log(`⚠️ Retry ${retryCount + 1}: No job links found, waiting...`);
            retryCount++;
            await this.randomDelay(2000, 3000);
          }
        }

        console.log(`✅ Found ${jobLinks.length} job links for "${keyword}"`);

        // Process only a limited number of jobs
        const jobsToProcess = jobLinks.slice(0, LINKEDIN_CONFIG.MAX_JOBS_PER_KEYWORD);
        console.log(`ℹ️ Processing ${jobsToProcess.length} jobs (limited by MAX_JOBS_PER_KEYWORD)`);
        
        for (const jobUrl of jobsToProcess) {
          if (!jobUrl) continue;

          // Use p-limit to ensure only one job is processed at a time
          await this.limit(async () => {
            try {
              console.log(`⏳ Adding delay before loading job details for ${jobUrl}...`);
              await this.randomDelay(
                LINKEDIN_CONFIG.BETWEEN_JOBS_DELAY * 0.8,
                LINKEDIN_CONFIG.BETWEEN_JOBS_DELAY * 1.2
              );

              console.log(`🌐 Loading job details from ${jobUrl}...`);
              await page.goto(jobUrl, { 
                waitUntil: 'networkidle0',
                timeout: 30000 
              });

              // Wait for job details with increased timeout
              console.log('⏳ Waiting for job details to load...');
              await page.waitForSelector('.job-details', { timeout: 30000 })
                .catch(() => {
                  console.log('⚠️ Could not find job details');
                  return null;
                });

              // Extract job details
              console.log('🔍 Extracting job details...');
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
                console.log(`✅ Successfully extracted job: "${jobDetails.title}" at "${jobDetails.company}"`);
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
              } else {
                console.error('❌ Failed to extract job details - missing title or description');
              }
            } catch (error) {
              console.error(`❌ Error scraping job ${jobUrl}:`, error);
            }
          });
        }

        if (keywords.indexOf(keyword) < keywords.length - 1) {
          console.log('⏳ Waiting between keywords to avoid rate limiting...');
          await this.randomDelay(
            LINKEDIN_CONFIG.BETWEEN_KEYWORDS_DELAY * 0.8,
            LINKEDIN_CONFIG.BETWEEN_KEYWORDS_DELAY * 1.2
          );
        }
      }

      console.log('🏁 Closing browser...');
      await browser.close();
    } catch (error) {
      console.error('❌ Error scraping LinkedIn:', error);
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
      // Check for null or empty keywords
      if (!keywords || keywords.length === 0) {
        console.log('No keywords provided for Indeed scraping');
        return jobDescriptions;
      }

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
      
      // Save job descriptions to storage one at a time
      for (const jobDescription of jobDescriptions) {
        await storage.createJobDescription(jobDescription);
        // Add small delay between storage operations
        await new Promise(resolve => setTimeout(resolve, 1000));
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
   * Run all active scrapers sequentially
   */
  async runAllScrapers(): Promise<void> {
    try {
      const configs = await storage.listActiveJobScraperConfigs();
      
      console.log(`Running ${configs.length} active job scrapers sequentially`);
      
      // Process configs one at a time
      for (const config of configs) {
        console.log(`Processing config: ${config.name}`);
        await this.runScraper(config);
        // Add delay between configs
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (error) {
      console.error('Error running job scrapers:', error);
    }
  }
} 