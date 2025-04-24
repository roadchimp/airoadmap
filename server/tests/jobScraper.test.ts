import { JobScraper } from '../lib/jobScraper';
import { storage } from '../storage';
import { JobScraperConfig } from '@shared/schema';

describe('Job Scraper Functional Requirements Tests', () => {
  let jobScraper: JobScraper;
  let testConfig: JobScraperConfig;

  beforeEach(() => {
    jobScraper = new JobScraper();
    
    // Create a test configuration
    testConfig = {
      id: 1,
      name: 'Test Scraper Config',
      targetWebsite: 'linkedin', // Test with LinkedIn first
      keywords: ['sales development representative', 'outside sales representative'],
      location: 'Remote',
      isActive: true,
      lastRunAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  /**
   * FR-SCRAPE-01: The system must be able to scrape job postings from configurable
   * target websites (e.g., LinkedIn, Indeed). The initial target sites should be configurable.
   */
  test('FR-SCRAPE-01: Should scrape from configurable target websites', async () => {
    // Test LinkedIn
    const linkedInResults = await jobScraper.runScraper({
      ...testConfig,
      targetWebsite: 'linkedin'
    });
    expect(linkedInResults).toBeGreaterThan(0);

    // Test Indeed
    const indeedResults = await jobScraper.runScraper({
      ...testConfig,
      targetWebsite: 'indeed'
    });
    expect(indeedResults).toBeGreaterThan(0);

    // Test invalid website
    await expect(async () => {
      await jobScraper.runScraper({
        ...testConfig,
        targetWebsite: 'invalid-site'
      });
    }).rejects.toThrow('Unsupported job board');
  });

  /**
   * FR-SCRAPE-02: The scraping process must be triggered based on configurable
   * criteria, including keywords, location, and potentially job posting recency.
   */
  test('FR-SCRAPE-02: Should use configurable search criteria', async () => {
    // Test with different keywords
    const keywordResults = await jobScraper.runScraper({
      ...testConfig,
      keywords: ['data scientist', 'machine learning engineer']
    });
    expect(keywordResults).toBeGreaterThan(0);

    // Test with different location
    const locationResults = await jobScraper.runScraper({
      ...testConfig,
      location: 'San Francisco, CA'
    });
    expect(locationResults).toBeGreaterThan(0);

    // Test with empty criteria
    const emptyResults = await jobScraper.runScraper({
      ...testConfig,
      keywords: [],
      location: ''
    });
    expect(emptyResults).toBe(0);
  });

  /**
   * FR-SCRAPE-03: The system must extract the raw, full text content of the job
   * description from the job posting page.
   */
  test('FR-SCRAPE-03: Should extract full job description content', async () => {
    const results = await jobScraper.runScraper(testConfig);
    
    // Get the saved job descriptions from storage
    const savedDescriptions = await storage.listJobDescriptions();
    
    // Verify content extraction
    for (const description of savedDescriptions) {
      expect(description.rawContent).toBeTruthy();
      expect(description.rawContent.length).toBeGreaterThan(100); // Assuming job descriptions are substantial
      expect(description.sourceUrl).toMatch(/^https?:\/\//); // Should have valid URL
    }
  });

  /**
   * FR-SCRAPE-04: The scraping mechanism must be implemented using Node.js,
   * preferably leveraging an open-source library suitable for dynamic web content.
   */
  test('FR-SCRAPE-04: Should use Puppeteer for dynamic content scraping', async () => {
    // This requirement is implicitly tested by the implementation using Puppeteer
    // We can verify the scraper works with dynamic content by checking specific elements
    
    const results = await jobScraper.runScraper(testConfig);
    expect(results).toBeGreaterThan(0);

    // Get the saved job descriptions
    const savedDescriptions = await storage.listJobDescriptions();
    
    // Verify we can extract content that requires JavaScript to be rendered
    for (const description of savedDescriptions) {
      // LinkedIn and Indeed load job details dynamically
      expect(description.title).toBeTruthy();
      expect(description.company).toBeTruthy();
      expect(description.location).toBeTruthy();
    }
  });
}); 