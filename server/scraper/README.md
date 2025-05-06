# Job Description Scraping & Processing Service

This service implements a system to periodically scrape job descriptions from specified online job boards based on defined keywords and criteria, store the raw text in Vercel Blob storage, and process them through a Large Language Model (LLM) to extract structured data.

## Architecture Overview

The system operates in two main phases:

1. **Job Description Scraping**: Configurable scrapers periodically collect job postings from supported job boards (currently LinkedIn and Indeed) based on keywords, locations, and other criteria.

2. **LLM Processing**: Collected job descriptions are processed by Anthropic's Claude model to extract structured data such as skills, experience requirements, responsibilities, and more.

## Rate Limiting and Anti-Detection Measures

The job scraper includes several measures to avoid being detected and blocked by job boards:

### LinkedIn Rate Limiting Configuration

The system uses the following default rate limiting settings for LinkedIn:
- `MAX_JOBS_PER_KEYWORD`: Maximum 5 jobs scraped per keyword to limit requests
- `PAGE_LOAD_DELAY`: 3000ms (3 seconds) delay between page loads
- `SCROLL_DELAY`: 2000ms (2 seconds) delay between scrolls when loading more jobs
- `BETWEEN_JOBS_DELAY`: 5000ms (5 seconds) delay between job detail scrapes
- `BETWEEN_KEYWORDS_DELAY`: 30000ms (30 seconds) delay between keywords
- `MAX_CONCURRENT_SCRAPES`: 1 - Only scrape one job at a time

### LinkedIn Search Workflow

The LinkedIn scraper follows the exact manual workflow a human user would:

1. Navigate to `linkedin.com/login` and submit credentials
2. After successful login, click the LinkedIn Jobs icon in the navigation bar
3. Enter search keywords and location in the search field
4. Submit the search and wait for results to load
5. Extract job links from the search results
6. Visit each job detail page and extract information
7. Process the extracted information and save it to storage

This human-like navigation pattern significantly reduces the risk of being detected as an automated scraper.

### Best Practices

1. **Randomized Delays**: All delays include randomization (±20%) to appear more human-like
2. **Sequential Processing**: Jobs, keywords, and configurations are processed sequentially
3. **User Agent Rotation**: Realistic user agent strings are used
4. **Browser Fingerprinting**: Browser configuration to reduce fingerprinting
5. **Robust Error Handling**: Automatic retries with exponential backoff for failures
6. **Login Session Management**: Proper session handling with cookies
7. **Request Logging**: Comprehensive logging of requests and responses for debugging
8. **Natural Navigation Patterns**: Following the same UI paths as regular users

### Customizing Rate Limits

You can adjust the rate limiting parameters in `server/lib/jobScraper.ts` to optimize for:
- Less aggressive scraping (increase delays, reduce MAX_JOBS_PER_KEYWORD)
- More aggressive scraping (decrease delays, increase MAX_JOBS_PER_KEYWORD)

**Warning**: Decreasing delays or increasing concurrent scrapes significantly increases the risk of being detected and blocked by job boards.

### Testing Mode

For testing purposes, you can set `MAX_JOBS_PER_KEYWORD` to 1 and increase various delays to minimize the chance of detection during development.

## Components

### 1. Job Description Schema

- `JobDescription`: Database model for storing both raw and processed job data
- `JobScraperConfig`: Configuration model for defining scraping parameters

### 2. Job Scraper

- Uses Puppeteer for browser automation to scrape job boards
- Supports LinkedIn and Indeed with an extensible architecture
- Configurable for keywords, locations, and other criteria
- Runs on a scheduled basis via Vercel Cron Jobs

### 3. Job Processor

- Leverages Anthropic's Claude to analyze job descriptions
- Extracts structured data including:
  - Skills (required and preferred)
  - Experience requirements
  - Education requirements
  - Responsibilities
  - Benefits
  - Salary information (when available)
  - Job type and industry
- Runs on a scheduled basis after scraping is complete

### 4. API Endpoints

The system exposes API endpoints through Next.js API Routes (`app/api/`):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/job-descriptions` | GET | List all job descriptions with pagination |
| `/api/job-descriptions/status/[status]` | GET | List job descriptions by status |
| `/api/job-descriptions/[id]` | GET | Get a specific job description |
| `/api/job-descriptions` | POST | Create a new job description manually |
| `/api/job-descriptions/[id]/process` | PATCH | Update processed content for a job description |
| `/api/job-descriptions/[id]/status` | PATCH | Update status of a job description |
| `/api/job-scraper-configs` | GET | List all scraper configurations |
| `/api/job-scraper-configs/active` | GET | List active scraper configurations |
| `/api/job-scraper-configs/[id]` | GET | Get a specific scraper configuration |
| `/api/job-scraper-configs` | POST | Create a new scraper configuration |
| `/api/job-scraper-configs/[id]/last-run` | PATCH | Update last run time for a configuration |
| `/api/job-scraper-configs/[id]/status` | PATCH | Update active status of a configuration |
| `/api/cron/run-job-scrapers` | POST | Trigger job scraping process |
| `/api/cron/process-job-descriptions` | POST | Trigger job processing |

## Environment Variables

- `ANTHROPIC_API_KEY`: API key for Anthropic Claude
- `CRON_API_KEY`: Secret key for authenticating cron job requests

## Cron Job Schedule

The system uses Vercel Cron Jobs to automate the scraping and processing:

- **Job Scraping**: Runs daily at midnight (`0 0 * * *`)
- **Job Processing**: Runs daily at 2 AM (`0 2 * * *`)

## Development and Testing

To test the job scraper locally:

1. Create a `.env` file with the required environment variables
2. Run `npm run dev` to start the development server
3. Use the API endpoints to configure and trigger scraping manually

### Running the Scraper Directly

For development or debugging purposes, you can run the job scraper directly using the npm script:

```bash
npm run scraper:run
```

Alternatively, you can execute the script using `tsx`:

```bash
# Using tsx for TypeScript execution with ESM support
npx tsx server/scraper/runScraper.ts
```

This script will:
1. Load active job scraper configurations from storage
2. Execute each configuration sequentially
3. Log detailed information about the scraping process
4. Save scraped job descriptions to storage

You can modify `server/scraper/runScraper.ts` to target specific configurations or add custom parameters for testing.

## Troubleshooting

### Common Issues

#### LinkedIn Login Failures

If you encounter login failures with LinkedIn:

1. **Timeout Errors**:
   - Verify your LinkedIn credentials are correct (currently hardcoded or managed elsewhere, not via .env)
   - Increase the login timeout within the scraper script (`runScraper.ts` or related modules)
   - Check if your IP address has been temporarily blocked by LinkedIn

2. **Login Page Selectors**:
   - If LinkedIn updates their login page, the selectors might need updating
   - Check the browser console logs for errors related to selectors
   - Update the selector paths in the scraper script (`runScraper.ts` or related modules)

3. **CAPTCHA/Verification**:
   - LinkedIn may require CAPTCHA or phone verification for suspicious logins
   - You may need to manually log in to LinkedIn once before running the scraper
   - Consider using a dedicated LinkedIn account for scraping

4. **Page Loading Issues**:
   - The scraper now uses `domcontentloaded` instead of `networkidle0` for improved reliability
   - If page content isn't fully loaded, consider adjusting wait conditions or adding explicit waits
   - Check for missing elements in the browser console when running in non-headless mode

#### Performance Optimization

1. **Slow Scraping**:
   - Adjust `MAX_JOBS_PER_KEYWORD` to control the number of jobs scraped
   - Consider running during off-peak hours (nights/weekends)
   - Distribute scraping over multiple days for large numbers of keywords

2. **Memory Issues**:
   - Ensure your system has sufficient RAM for browser automation
   - Close unnecessary browser tabs and applications
   - Add `--disable-dev-shm-usage` to Puppeteer launch arguments (already included)

#### Browser Compatibility

1. **Chrome Installation**:
   - Puppeteer requires Chrome to be installed
   - If using Docker, ensure the Chrome binary is included in the container
   - Consider using `puppeteer-core` with a specific Chrome executable path

2. **Headless Mode Issues**:
   - If encountering problems in headless mode, try setting `headless: false` temporarily for debugging
   - Some websites detect headless browsers; adjust the browser configuration as needed

## Running the Scraper in Non-Headless Mode

For debugging purposes, the LinkedIn scraper is configured to run in non-headless mode by default (`headless: false` in the Puppeteer launch options). This allows you to observe the browser as it navigates through LinkedIn, searches for jobs, and extracts information.

Benefits of non-headless mode:
- Directly observe the login process and identify any issues
- See how the scraper interacts with LinkedIn's interface
- Verify search keywords and results in real-time
- Debug selector issues by observing the page structure

To change to headless mode for production, modify the `headless` option in the Puppeteer launch configuration within the scraper script (`runScraper.ts` or related modules):

```typescript
const browser = await puppeteer.launch({
  headless: true, // Change to true for production
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu'
  ]
});
```

## Extending the System

### Adding a New Job Board

1. Create a new scraper class implementing the same interface as `LinkedInScraper` or `IndeedScraper`
2. Add the new scraper to the `ScraperFactory` class
3. Update the job board options in the frontend if applicable

### Customizing LLM Processing

The prompt and output structure for Claude can be customized in the `JobProcessor` class to extract different or additional information from job descriptions.

## Integration with AI Roadmap

The job scraping system is integrated with the main AI Roadmap application to enhance AI capability recommendations. The extracted data from job descriptions is used to:

1. Analyze current job market trends for different roles
2. Identify in-demand skills related to AI capabilities
3. Provide data-driven insights for prioritization of AI transformation initiatives
4. Suggest specific AI tools and technologies based on industry and role relevance

This integration leverages the consistent client-server component architecture of the main application, with data fetching handled by Server Components and UI rendering by Client Components. 