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

### Best Practices

1. **Randomized Delays**: All delays include randomization (±20%) to appear more human-like
2. **Sequential Processing**: Jobs, keywords, and configurations are processed sequentially
3. **User Agent Rotation**: Realistic user agent strings are used
4. **Browser Fingerprinting**: Browser configuration to reduce fingerprinting
5. **Robust Error Handling**: Automatic retries with exponential backoff for failures
6. **Login Session Management**: Proper session handling with cookies
7. **Request Logging**: Comprehensive logging of requests and responses for debugging

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

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/job-descriptions` | GET | List all job descriptions with pagination |
| `/api/job-descriptions/status/:status` | GET | List job descriptions by status |
| `/api/job-descriptions/:id` | GET | Get a specific job description |
| `/api/job-descriptions` | POST | Create a new job description manually |
| `/api/job-descriptions/:id/process` | PATCH | Update processed content for a job description |
| `/api/job-descriptions/:id/status` | PATCH | Update status of a job description |
| `/api/job-scraper-configs` | GET | List all scraper configurations |
| `/api/job-scraper-configs/active` | GET | List active scraper configurations |
| `/api/job-scraper-configs/:id` | GET | Get a specific scraper configuration |
| `/api/job-scraper-configs` | POST | Create a new scraper configuration |
| `/api/job-scraper-configs/:id/last-run` | PATCH | Update last run time for a configuration |
| `/api/job-scraper-configs/:id/status` | PATCH | Update active status of a configuration |
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

For development or debugging purposes, you can run the job scraper directly:

```bash
# Using tsx for TypeScript execution with ESM support
npx tsx server/scripts/runScraper.ts
```

This script will:
1. Load active job scraper configurations from storage
2. Execute each configuration sequentially
3. Log detailed information about the scraping process
4. Save scraped job descriptions to storage

You can modify `server/scripts/runScraper.ts` to target specific configurations or add custom parameters for testing.

## Troubleshooting

### Common Issues

#### LinkedIn Login Failures

If you encounter login failures with LinkedIn:

1. **Timeout Errors**:
   - Verify your LinkedIn credentials are correct in environment variables
   - Increase the login timeout in `server/lib/jobScraper.ts` (currently 60000ms)
   - Check if your IP address has been temporarily blocked by LinkedIn
   - Try running from a different network or using a VPN

2. **Login Page Selectors**:
   - If LinkedIn updates their login page, the selectors might need updating
   - Check the browser console logs for errors related to selectors
   - Update the selector paths in the `login` method in `LinkedInScraper` class

3. **CAPTCHA/Verification**:
   - LinkedIn may require CAPTCHA or phone verification for suspicious logins
   - You may need to manually log in to LinkedIn once before running the scraper
   - Consider using a dedicated LinkedIn account for scraping

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

## Extending the System

### Adding a New Job Board

1. Create a new scraper class implementing the same interface as `LinkedInScraper` or `IndeedScraper`
2. Add the new scraper to the `ScraperFactory` class
3. Update the job board options in the frontend if applicable

### Customizing LLM Processing

The prompt and output structure for Claude can be customized in the `JobProcessor` class to extract different or additional information from job descriptions.

## Implementation Summary

This implementation includes:

1. **Database Schema:**
   - Added `jobDescriptions` and `jobScraperConfigs` tables with corresponding schemas
   - Created TypeScript types and Zod schemas for validation

2. **Storage Layer:**
   - Extended `IStorage` interface with methods for job descriptions and scraper configs
   - Implemented methods in `MemStorage` class (in-memory storage)
   - Added sample job scraper configurations

3. **Job Scraper:**
   - Created a modular web scraper system with support for LinkedIn and Indeed
   - Implemented `ScraperFactory` pattern for extensibility
   - Added error handling and logging

4. **Job Processor:**
   - Integrated Anthropic Claude API for job description analysis
   - Created a structured prompt for extracting job details
   - Implemented response parsing and error handling

5. **API Routes:**
   - Added CRUD endpoints for job descriptions and scraper configurations
   - Created secure endpoints for cron job execution
   - Implemented authentication for cron job endpoints

6. **Vercel Integration:**
   - Configured Vercel Cron Jobs for scheduled execution
   - Set up serverless functions for job scraping and processing

## Required Environment Variables

```
# API Keys
ANTHROPIC_API_KEY=your_anthropic_api_key_here
CRON_API_KEY=your_cron_secret_key_here

# Server Configuration
PORT=5000
HOST=127.0.0.1

# Client URL for CORS (in production)
CLIENT_URL=https://your-client-url.vercel.app 

## Batch Processing

The system supports batch processing of job descriptions using OpenAI's API. This is useful for processing large numbers of job descriptions efficiently. The batch processing workflow consists of two steps:

1. **Export for Batch Processing**
   - Use the `/api/job-descriptions/batch/export` endpoint to export unprocessed job descriptions
   - This creates a JSONL file in the `server/batch-processing/requests` directory
   - A manifest file is also created to track job IDs and processing status

2. **Process Batch Results**
   - After processing the JSONL file through OpenAI's API
   - Place the response file in the `server/batch-processing/responses` directory
   - Use the `/api/job-descriptions/batch/process` endpoint with the response file path
   - The system will update each job description with the processed content

### Batch Processing Directory Structure

```
server/batch-processing/
├── requests/          # Contains JSONL files for OpenAI batch processing
│   ├── batch_*.jsonl  # Batch request files
│   └── batch_*_manifest.json  # Manifest files with job IDs
└── responses/         # Contains OpenAI API response files
    └── batch_*.jsonl  # Processed response files
```

### Batch Processing API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/job-descriptions/batch/export` | POST | Export unprocessed job descriptions for batch processing |
| `/api/job-descriptions/batch/process` | POST | Process batch results from OpenAI API | 