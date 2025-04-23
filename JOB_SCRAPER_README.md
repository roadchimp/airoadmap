# Job Description Scraping & Processing Service

This service implements a system to periodically scrape job descriptions from specified online job boards based on defined keywords and criteria, store the raw text in Vercel Blob storage, and process them through a Large Language Model (LLM) to extract structured data.

## Architecture Overview

The system operates in two main phases:

1. **Job Description Scraping**: Configurable scrapers periodically collect job postings from supported job boards (currently LinkedIn and Indeed) based on keywords, locations, and other criteria.

2. **LLM Processing**: Collected job descriptions are processed by Anthropic's Claude model to extract structured data such as skills, experience requirements, responsibilities, and more.

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