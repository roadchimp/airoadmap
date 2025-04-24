import { InsertJobDescription, JobScraperConfig } from '../../shared/schema.ts';
import { storage } from '../storage.ts';
import puppeteer, { Page } from 'puppeteer';
import { LINKEDIN_EMAIL, LINKEDIN_PASSWORD } from '../config.ts';
import pLimit from 'p-limit';
import fs from 'fs';
import path from 'path';

// Create logs directory if it doesn't exist
const LOGS_DIR = path.join(process.cwd(), 'logs');
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Create a log file for HTTP responses
const LOG_FILE = path.join(LOGS_DIR, `http-responses-${new Date().toISOString().replace(/:/g, '-')}.log`);

// Logger function to write to console and file
function logToFile(message: string): void {
  // Log to console
  console.log(message);
  
  // Log to file
  fs.appendFileSync(LOG_FILE, message + '\n');
}

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

  private async scrollPage(page: Page): Promise<void> {
    logToFile('📜 Scrolling page to load more content...');
    
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
    
    // Add a small delay after scrolling to let content load
    await this.randomDelay(LINKEDIN_CONFIG.SCROLL_DELAY, LINKEDIN_CONFIG.SCROLL_DELAY * 1.5);
  }

  private async extractJobLinks(page: Page): Promise<string[]> {
    logToFile('🔍 Extracting job links from search results...');
    
    // Try multiple selectors for job cards for maximum compatibility
    const jobCardSelectors = [
      'a.job-card-container__link',
      'a.job-card-list__title',
      'a.disabled.ember-view.job-card-container__link.job-card-list__title',
      '.job-search-card a[data-control-id]'
    ];
    
    // Use page.evaluate to run code in browser context and extract links
    return await page.evaluate((selectors) => {
      let links: string[] = [];
      
      // Try each selector until we find job links
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          links = Array.from(elements)
            .map(link => (link as HTMLAnchorElement).href)
            .filter(href => href && href.includes('/jobs/view/'));
          
          if (links.length > 0) break;
        }
      }
      
      // If still no links, try a more general approach to find any job links
      if (links.length === 0) {
        const allLinks = document.querySelectorAll('a[href*="/jobs/view/"]');
        links = Array.from(allLinks)
          .map(link => (link as HTMLAnchorElement).href)
          .filter(Boolean);
      }
      
      return links;
    }, jobCardSelectors);
  }

  private async setupPage(page: Page): Promise<void> {
    // Enable request interception and logging
    await page.setRequestInterception(true);

    page.on('request', request => {
      // Log request details including post data for POST requests
      const requestDetails = {
        method: request.method(),
        url: request.url(),
        headers: request.headers(),
        resourceType: request.resourceType()
      };
      
      if (request.method() === 'POST') {
        try {
          const postData = request.postData();
          if (postData) {
            try {
              // Try to parse as JSON if possible
              const jsonData = JSON.parse(postData);
              logToFile(`🌐 [${request.method()}] Request to: ${request.url()}`);
              logToFile(`📤 Request payload: ${JSON.stringify(jsonData, null, 2)}`);
            } catch {
              // If not JSON, log as is
              logToFile(`🌐 [${request.method()}] Request to: ${request.url()}`);
              logToFile(`📤 Request payload: ${postData}`);
            }
          } else {
            logToFile(`🌐 [${request.method()}] Request to: ${request.url()}`);
          }
        } catch (e: unknown) {
          logToFile(`🌐 [${request.method()}] Request to: ${request.url()}`);
        }
      } else {
        logToFile(`🌐 [${request.method()}] Request to: ${request.url()}`);
      }
      
      request.continue();
    });

    page.on('response', async response => {
      const status = response.status();
      const statusText = response.statusText();
      const url = response.url();
      const headers = response.headers();
      const contentType = headers['content-type'] || '';
      
      logToFile(`📥 [${status} ${statusText}] Response from: ${url}`);
      
      // Log detailed response for JSON and important responses
      const isJSON = contentType.includes('application/json');
      const isImportantEndpoint = url.includes('/jobs/') || 
                                 url.includes('/api/') || 
                                 url.includes('/graphql');
      
      if ((isJSON || isImportantEndpoint) && status >= 200 && status < 300) {
        try {
          const text = await response.text();
          if (text && text.length > 0) {
            try {
              // Try to parse and pretty print JSON
              const json = JSON.parse(text);
              logToFile(`📦 Response JSON payload: ${JSON.stringify(json, null, 2)}`);
            } catch {
              // Not valid JSON, log truncated text
              if (text.length > 500) {
                logToFile(`📦 Response body (truncated): ${text.substring(0, 500)}...`);
              } else {
                logToFile(`📦 Response body: ${text}`);
              }
            }
          }
        } catch (e: unknown) {
          logToFile(`📦 Could not read response body: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
      
      // Always log error responses with details
      if (status >= 400) {
        const errorMsg = `❌ Error response: ${status} ${statusText} for ${url}`;
        console.error(errorMsg);
        logToFile(errorMsg);
        
        try {
          const text = await response.text();
          if (text && text.length > 0) {
            try {
              // Try to parse and pretty print JSON
              const json = JSON.parse(text);
              const errorResponseMsg = `📦 Error response JSON: ${JSON.stringify(json, null, 2)}`;
              console.error(errorResponseMsg);
              logToFile(errorResponseMsg);
            } catch {
              // Not valid JSON, log truncated text
              let errorResponseMsg;
              if (text.length > 500) {
                errorResponseMsg = `📦 Error response (truncated): ${text.substring(0, 500)}...`;
              } else {
                errorResponseMsg = `📦 Error response: ${text}`;
              }
              console.error(errorResponseMsg);
              logToFile(errorResponseMsg);
            }
          }
        } catch (e: unknown) {
          const errorBodyMsg = `📦 Could not read error response body: ${e instanceof Error ? e.message : String(e)}`;
          console.error(errorBodyMsg);
          logToFile(errorBodyMsg);
        }
      }
    });

    page.on('console', msg => {
      const consoleMsg = `🔍 Browser console: ${msg.text()}`;
      logToFile(consoleMsg);
    });

    page.on('pageerror', error => {
      const errorMsg = `❌ Page error: ${error}`;
      console.error(errorMsg);
      logToFile(errorMsg);
    });

    // Set a more descriptive user agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Increase default timeout
    page.setDefaultTimeout(60000);
  }

  private async login(page: Page): Promise<boolean> {
    try {
      logToFile('🔑 Attempting to navigate to LinkedIn login page...');
      // Navigate to LinkedIn login page with more lenient wait conditions
      await page.goto('https://www.linkedin.com/login', { 
        waitUntil: 'domcontentloaded',
        timeout: 60000  // Increased timeout for initial load
      });
      
      logToFile('📝 Filling in credentials...');
      // Wait for and fill in credentials with explicit waits
      await page.waitForSelector('#username', { timeout: 30000 });
      await page.waitForSelector('#password', { timeout: 30000 });
      await page.type('#username', LINKEDIN_EMAIL, { delay: 100 });
      await page.type('#password', LINKEDIN_PASSWORD, { delay: 100 });
      
      // Add a longer delay before clicking the sign-in button to allow security checks
      logToFile('⏳ Adding delay before clicking sign in button...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      logToFile('🖱️ Clicking sign in button...');
      // Click sign in button with explicit wait
      await page.waitForSelector('button[type="submit"]', { timeout: 30000 });
      await Promise.all([
        page.click('button[type="submit"]'),
        // Wait for navigation with more lenient conditions
        page.waitForNavigation({ 
          waitUntil: 'domcontentloaded',
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
        logToFile('✅ Successfully logged in to LinkedIn');
      } else {
        const errorMsg = '❌ Login unsuccessful - no success indicators found';
        console.error(errorMsg);
        logToFile(errorMsg);
        // Take a screenshot for debugging if login fails
        await page.screenshot({ 
          path: 'linkedin-login-failed.png',
          fullPage: true 
        });
      }
      
      return isLoggedIn;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const loginErrorMsg = `❌ Error during login: ${errorMessage}`;
      console.error(loginErrorMsg);
      logToFile(loginErrorMsg);
      
      try {
        await page.screenshot({ 
          path: 'linkedin-login-error.png',
          fullPage: true 
        });
      } catch (screenshotError) {
        const screenshotErrorMsg = `Failed to take error screenshot: ${screenshotError instanceof Error ? screenshotError.message : String(screenshotError)}`;
        console.error(screenshotErrorMsg);
        logToFile(screenshotErrorMsg);
      }
      
      return false;
    }
  }

  async scrapeJobDescriptions(config: JobScraperConfig): Promise<InsertJobDescription[]> {
    const { keywords, location } = config;
    const jobDescriptions: InsertJobDescription[] = [];
    
    try {
      // Check for null or empty keywords
      if (!keywords || keywords.length === 0) {
        logToFile('No keywords provided for LinkedIn scraping');
        return jobDescriptions;
      }
      
      logToFile(`🚀 Starting LinkedIn scraper with ${keywords.length} keywords`);
      
      // Launch browser with non-headless mode for testing and debugging
      logToFile('🌐 Launching browser...');
      const browser = await puppeteer.launch({
        headless: false,  // Set to true in production
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1280, height: 800 }
      });
      
      // Open a new page and set up logging
      const page = await browser.newPage();
      logToFile('🔧 Setting up page and logging...');
      await this.setupPage(page);
      
      // Log in to LinkedIn
      logToFile('🔑 Logging in to LinkedIn...');
      const loginSuccessful = await this.login(page);
      
      if (!loginSuccessful) {
        logToFile('❌ Failed to log in to LinkedIn. Aborting job scraping.');
        await browser.close();
        return [];
      }
      
      // Process each keyword with concurrency limiting
      logToFile(`🔍 Processing ${keywords.length} keywords with concurrency limit: ${LINKEDIN_CONFIG.MAX_CONCURRENT_SCRAPES}`);
      
      for (const keyword of keywords) {
        logToFile(`🔍 Processing keyword: "${keyword}"`);
        
        try {
          // Navigate to LinkedIn Jobs
          logToFile('🌐 Navigating to LinkedIn Jobs...');
          
          // Click on the Jobs icon (multiple selectors for redundancy)
          const jobsIconSelectors = [
            'a[href="https://www.linkedin.com/jobs/?"]',
            'a[data-link-to="jobs"]',
            'a[href^="/jobs"]',
            'a.app-aware-link[href^="/jobs"]'
          ];
          
          let clickedJobsIcon = false;
          for (const selector of jobsIconSelectors) {
            try {
              const element = await page.$(selector);
              if (element) {
                logToFile(`✅ Found jobs link with selector: ${selector}`);
                await element.click();
                clickedJobsIcon = true;
                break;
              }
            } catch (e) {
              // Continue trying other selectors
            }
          }
          
          if (!clickedJobsIcon) {
            // If we couldn't find the jobs icon, navigate directly to the jobs page
            logToFile('⚠️ Could not find jobs icon, navigating directly to jobs page...');
            await page.goto('https://www.linkedin.com/jobs/', {
              waitUntil: 'domcontentloaded',
              timeout: 30000
            });
          }
          
          // Wait for the jobs page to load
          await this.randomDelay(LINKEDIN_CONFIG.PAGE_LOAD_DELAY, LINKEDIN_CONFIG.PAGE_LOAD_DELAY * 1.5);
          
          // Input the keyword in the search field
          logToFile(`🔤 Entering keyword: "${keyword}"`);
          
          // Click on the search box to activate it (try multiple selectors)
          const searchBoxSelectors = [
            'input[aria-label="Search job titles or companies"]',
            'input[placeholder="Search job titles or companies"]',
            'input[role="combobox"]',
            '.jobs-search-box__text-input[aria-label="Search job titles or companies"]'
          ];
          
          let searchBoxFound = false;
          for (const selector of searchBoxSelectors) {
            try {
              const searchBox = await page.$(selector);
              if (searchBox) {
                logToFile(`✅ Found search box with selector: ${selector}`);
                await searchBox.click();
                await searchBox.type(keyword);
                searchBoxFound = true;
                break;
              }
            } catch (error) {
              // Continue trying other selectors
            }
          }
          
          if (!searchBoxFound) {
            logToFile('⚠️ Could not find the search box. Trying an alternative approach...');
            // If no search box found, try the URL approach directly
            const keywordEncoded = encodeURIComponent(keyword);
            const locationEncoded = encodeURIComponent(location || '');
            await page.goto(`https://www.linkedin.com/jobs/search/?keywords=${keywordEncoded}&location=${locationEncoded}`, {
              waitUntil: 'domcontentloaded',
              timeout: 30000
            });
          } else {
            // Press Enter to submit the search
            logToFile('🔍 Submitting search...');
            await page.keyboard.press('Enter');
          }
          
          // Wait for search results to load
          logToFile('⏳ Waiting for search results to load...');
          await this.randomDelay(LINKEDIN_CONFIG.PAGE_LOAD_DELAY, LINKEDIN_CONFIG.PAGE_LOAD_DELAY * 1.5);
          
          // Extract job links - using retries for reliability
          let jobLinks: string[] = [];
          let retries = 0;
          const maxRetries = 3;
          
          while (jobLinks.length === 0 && retries < maxRetries) {
            if (retries > 0) {
              logToFile(`🔄 Retry ${retries}/${maxRetries} extracting job links...`);
              await this.randomDelay(LINKEDIN_CONFIG.PAGE_LOAD_DELAY, LINKEDIN_CONFIG.PAGE_LOAD_DELAY * 1.5);
            }
            
            // Scroll down to load more results
            logToFile('📜 Scrolling to load more job results...');
            await this.scrollPage(page);
            
            // Extract job links
            jobLinks = await this.extractJobLinks(page);
            logToFile(`📊 Found ${jobLinks.length} job links`);
            
            retries++;
          }
          
          // Limit the number of jobs to process
          const jobLinksToProcess = jobLinks.slice(0, LINKEDIN_CONFIG.MAX_JOBS_PER_KEYWORD);
          logToFile(`🔍 Processing ${jobLinksToProcess.length} job links for keyword "${keyword}"`);
          
          // Extract job descriptions from the links concurrently with rate limiting
          const jobPromises = jobLinksToProcess.map((jobUrl, index) => {
            return this.limit(async () => {
              logToFile(`🔍 [${index + 1}/${jobLinksToProcess.length}] Getting job details for ${jobUrl}...`);
              await this.randomDelay(
                LINKEDIN_CONFIG.BETWEEN_JOBS_DELAY * 0.8,
                LINKEDIN_CONFIG.BETWEEN_JOBS_DELAY * 1.2
              );

              logToFile(`🌐 Loading job details from ${jobUrl}...`);
              // Navigate to job detail page
              try {
                await page.goto(jobUrl, {
                  waitUntil: 'domcontentloaded',
                  timeout: 30000
                });
                logToFile(`✅ Navigated to job detail page: ${jobUrl}`);
              } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                logToFile(`⚠️ Error navigating to job detail page: ${jobUrl}. Error: ${errorMessage}`);
                return; // Skip this job and move to the next
              }

              // Wait for job details with increased timeout
              logToFile('⏳ Waiting for job details to load...');
              await page.waitForSelector('.job-details', { timeout: 30000 })
                .catch(() => {
                  logToFile('⚠️ Could not find job details');
                });

              // Extract job details
              logToFile('🔍 Extracting job details...');
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
                logToFile(`✅ Successfully extracted job: "${jobDetails.title}" at "${jobDetails.company}"`);
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
                logToFile(`⚠️ Failed to extract complete job details from ${jobUrl}`);
              }
            });
          });
          
          // Wait for all job promises to complete
          await Promise.all(jobPromises);
          
          logToFile(`✅ Completed processing keyword: "${keyword}". Found ${jobDescriptions.length} job descriptions so far.`);
          
          // Add delay between keywords to prevent rate limiting
          if (keywords.indexOf(keyword) < keywords.length - 1) {
            const delayMs = LINKEDIN_CONFIG.BETWEEN_KEYWORDS_DELAY;
            logToFile(`⏳ Waiting ${delayMs / 1000} seconds before processing next keyword...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
          
        } catch (keywordError: unknown) {
          const errorMessage = keywordError instanceof Error ? keywordError.message : String(keywordError);
          logToFile(`❌ Error processing keyword "${keyword}": ${errorMessage}`);
          // Continue with next keyword
        }
      }
      
      logToFile(`🎉 LinkedIn scraping completed. Found ${jobDescriptions.length} total job descriptions.`);
      await browser.close();
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logToFile(`❌ LinkedIn scraping failed: ${errorMessage}`);
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
        logToFile('No keywords provided for Indeed scraping');
        return jobDescriptions;
      }

      logToFile('🚀 Starting Indeed scraper...');
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      
      // Set up logging for requests and responses
      page.on('console', msg => {
        const consoleMsg = `🔍 Indeed browser console: ${msg.text()}`;
        logToFile(consoleMsg);
      });
      
      page.on('pageerror', error => {
        const errorMsg = `❌ Indeed page error: ${error}`;
        console.error(errorMsg);
        logToFile(errorMsg);
      });
      
      // For each keyword, perform a search
      for (const keyword of keywords) {
        logToFile(`🔍 Processing keyword: "${keyword}" for Indeed`);
        const searchQuery = encodeURIComponent(keyword);
        const locationQuery = encodeURIComponent(location || '');
        const url = `https://www.indeed.com/jobs?q=${searchQuery}&l=${locationQuery}`;
        
        logToFile(`🌐 Navigating to Indeed search results for "${keyword}"...`);
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        
        // Wait for job listings to load
        logToFile('⏳ Waiting for Indeed job listings to load...');
        await page.waitForSelector('.jobsearch-ResultsList', { timeout: 10000 }).catch(() => {
          logToFile('⚠️ Could not find Indeed job listings');
        });
        
        // Extract job links
        logToFile('🔍 Extracting job links from Indeed search results...');
        const jobLinks = await page.evaluate(() => {
          const links = document.querySelectorAll('a.jcs-JobTitle');
          return Array.from(links).map(link => link.getAttribute('href'));
        });
        
        logToFile(`📊 Found ${jobLinks.length} job links on Indeed for keyword "${keyword}"`);
        
        // Process each job link
        for (const jobHref of jobLinks) {
          if (!jobHref) continue;
          
          try {
            const jobUrl = new URL(jobHref.startsWith('http') ? jobHref : `https://www.indeed.com${jobHref}`, 'https://www.indeed.com').href;
            
            logToFile(`🌐 Loading job details from ${jobUrl}...`);
            await page.goto(jobUrl, { waitUntil: 'domcontentloaded' });
            
            // Wait for job details to load
            logToFile('⏳ Waiting for Indeed job details to load...');
            await page.waitForSelector('#jobDescriptionText', { timeout: 10000 }).catch(() => {
              logToFile('⚠️ Could not find job description');
            });
            
            // Extract job details
            logToFile('🔍 Extracting Indeed job details...');
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
              logToFile(`✅ Successfully extracted Indeed job: "${jobDetails.title}" at "${jobDetails.company}"`);
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
            } else {
              logToFile(`⚠️ Failed to extract complete job details from ${jobUrl}`);
            }
            
            // Add delay between job scrapes
            await new Promise(resolve => setTimeout(resolve, 3000));
            
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logToFile(`⚠️ Error processing Indeed job: ${errorMessage}`);
          }
        }
        
        // Add delay between keywords
        if (keywords.indexOf(keyword) < keywords.length - 1) {
          logToFile('⏳ Waiting between Indeed keywords to avoid rate limiting...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
      
      logToFile('🎉 Indeed scraping completed.');
      await browser.close();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logToFile(`❌ Error scraping Indeed: ${errorMessage}`);
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
      logToFile(`🚀 Running job scraper for ${config.name}`);
      
      // Get the appropriate scraper
      const scraper = ScraperFactory.getScraper(config.targetWebsite);
      
      // Scrape job descriptions
      const jobDescriptions = await scraper.scrapeJobDescriptions(config);
      
      logToFile(`📊 Found ${jobDescriptions.length} job descriptions for ${config.name}`);
      
      let savedCount = 0;
      
      // Save job descriptions to storage one at a time
      for (const jobDescription of jobDescriptions) {
        try {
          // Ensure fields are properly formatted
          const sanitizedJobDescription = {
            ...jobDescription,
            // Ensure strings are actually strings
            title: String(jobDescription.title),
            company: jobDescription.company ? String(jobDescription.company) : '',
            location: jobDescription.location ? String(jobDescription.location) : '',
            jobBoard: String(jobDescription.jobBoard),
            sourceUrl: String(jobDescription.sourceUrl),
            rawContent: String(jobDescription.rawContent),
            // Ensure keywords is an array of strings
            keywords: Array.isArray(jobDescription.keywords) ? 
              jobDescription.keywords.map(k => String(k)) : 
              jobDescription.keywords ? [String(jobDescription.keywords)] : [],
            status: 'raw'
          };
          
          logToFile(`💾 Saving job: "${sanitizedJobDescription.title}" from ${sanitizedJobDescription.company}`);
          await storage.createJobDescription(sanitizedJobDescription);
          savedCount++;
          logToFile(`✅ Successfully saved job (${savedCount}/${jobDescriptions.length})`);
          
          // Add small delay between storage operations
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (saveError: unknown) {
          const errorMessage = saveError instanceof Error ? saveError.message : String(saveError);
          logToFile(`❌ Error saving job description: ${errorMessage}`);
          // Continue with next job even if this one failed
        }
      }
      
      // Update the last run time for the config
      await storage.updateJobScraperConfigLastRun(config.id);
      
      logToFile(`🎉 Job scraper completed. Saved ${savedCount} out of ${jobDescriptions.length} jobs.`);
      return savedCount;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logToFile(`❌ Error running job scraper for ${config.name}: ${errorMessage}`);
      console.error(`Error running job scraper for ${config.name}:`, error);
      return 0;
    }
  }
  
  /**
   * Run all active job scrapers
   */
  async runAllScrapers(): Promise<void> {
    try {
      logToFile('🚀 Running all active job scrapers');
      
      // Get all active job scraper configurations
      const configs = await storage.listActiveJobScraperConfigs();
      
      logToFile(`📊 Found ${configs.length} active job scraper configurations`);
      
      // Run each scraper sequentially to avoid rate limiting
      for (const config of configs) {
        logToFile(`🔍 Starting scraper for: ${config.name}`);
        
        try {
          const jobCount = await this.runScraper(config);
          logToFile(`✅ Completed scraper for ${config.name}. Found ${jobCount} jobs.`);
          
          // Update status to completed
          await storage.updateJobScraperConfigStatus(config.id, true);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logToFile(`❌ Error in scraper for ${config.name}: ${errorMessage}`);
          
          // Update status to failed
          await storage.updateJobScraperConfigStatus(config.id, false);
        }
        
        // Add delay between scraper runs
        if (configs.indexOf(config) < configs.length - 1) {
          const delayTime = 30000; // 30 seconds
          logToFile(`⏳ Waiting ${delayTime / 1000} seconds before next scraper...`);
          await new Promise(resolve => setTimeout(resolve, delayTime));
        }
      }
      
      logToFile('🎉 All job scrapers completed');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logToFile(`❌ Error running all job scrapers: ${errorMessage}`);
      console.error('Error running all job scrapers:', error);
    }
  }
} 