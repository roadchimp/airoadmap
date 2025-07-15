# AI Roadmap Job Description Processing Pipeline

This document outlines the multi-stage pipeline for collecting, analyzing, and integrating job descriptions (JDs) into the AI Roadmap platform. The primary goal is to extract AI-related capabilities from real-world job postings and map them to job roles within an organization.

The pipeline consists of three main stages:
1.  **Stage 1: Collect Job Descriptions** - Scrape job descriptions from LinkedIn.
2.  **Stage 2: Analyze for AI Capabilities** - Use OpenAI's batch processing to identify AI capabilities in the scraped JDs.
3.  **Stage 3: Match to Job Roles** - Map the identified AI capabilities to the organization's defined job roles.

---

## Stage 1: Collect Job Descriptions

The first stage involves scraping job descriptions from LinkedIn using a custom script. This process is highly configurable and is the primary way to feed new data into the analysis pipeline.

For detailed instructions on how to run the scraper, configure it for specific roles, and troubleshoot issues, please refer to the comprehensive guide in the scraper's directory:

**[➡️ Full Scraper Documentation: `server/scraper/README.md`](../../scraper/README.md)**

### Quick Start

1.  **Ensure prerequisites** are met (e.g., `.env` file with `DATABASE_URL` and LinkedIn credentials).
2.  **Create a config file** in `server/scraper/configs/` for your target job role.
3.  **Run the scraper** using the `--config` flag:
    ```bash
    NODE_ENV=development npx tsx server/scraper/custom-scraper.ts --config server/scraper/configs/your-config-file.json
    ```

---

## Stage 2: Analyze for AI Capabilities via Batch Processing
