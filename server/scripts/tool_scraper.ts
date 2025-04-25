// To run: npm run scraper:tools

import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import pLimit from 'p-limit';
import { storage } from '../storage'; // Correct: Import the central storage instance
import {
  // aiTools, // TODO: Define in schema
  aiCapabilities,
  // capabilityToolMapping, // TODO: Define in schema
} from '@shared/schema'; // Using tsconfig path alias
import { eq, sql } from 'drizzle-orm'; // Keep Drizzle operators for now, usage might adapt

dotenv.config(); // Load environment variables from .env file

/**
 * Simple delay function.
 * @param ms Milliseconds to delay.
 * @returns Promise that resolves after the specified delay.
 */
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Interface for the shape of data scraped from various sources
interface ScrapedToolData {
  toolName: string | null;
  description: string | null;
  websiteUrl: string; // Use URL as primary identifier
  licenseType: 'Open Source' | 'Commercial' | 'Freemium' | 'Unknown' | null;
  primaryCategory: string | null;
  tags: string[] | null; // For potential capabilities
}

// --- Database Interaction Functions ---
// NOTE: These assume direct access to 'db' and correct schema names.
// Refactoring will likely be needed to use the central 'storage' interface.

/**
 * Gets the ID of an existing AI capability by name or creates a new one.
 * @param capabilityName The name of the capability.
 * @param category Optional category for the capability.
 * @returns The ID of the capability or null if creation failed.
 */
async function getOrCreateCapability(
  capabilityName: string,
  category: string | null,
): Promise<number | null> {
  console.log(`Checking or creating capability: ${capabilityName}`);
  try {
    // Check if capability exists
    const existing = await db
      .select({ id: aiCapabilities.id })
      .from(aiCapabilities)
      .where(eq(aiCapabilities.name, capabilityName))
      .limit(1);

    if (existing.length > 0) {
      console.log(`Capability '${capabilityName}' found with ID: ${existing[0].id}`);
      return existing[0].id;
    }

    // Create new capability if it doesn't exist
    console.log(`Capability '${capabilityName}' not found, creating...`);
    const newCapability = await db
      .insert(aiCapabilities)
      .values({ 
          name: capabilityName, 
          category: category ?? 'Uncategorized' 
        })
      // .onConflictDoNothing() // Use if unique constraint is on name/category and ignoring is okay
      .returning({ id: aiCapabilities.id });

    if (newCapability.length > 0) {
      console.log(`Created capability '${capabilityName}' with ID: ${newCapability[0].id}`);
      return newCapability[0].id;
    } else {
        console.warn(`Capability '${capabilityName}' might already exist (due to conflict handling) or creation failed.`);
        // Re-query to be sure, in case onConflictDoNothing was used and successful
        const requery = await db
          .select({ id: aiCapabilities.id })
          .from(aiCapabilities)
          .where(eq(aiCapabilities.name, capabilityName))
          .limit(1);
        if(requery.length > 0) return requery[0].id;
        return null; // Truly failed or conflict wasn't handled cleanly
    }
  } catch (error) {
    console.error(`Error getting or creating capability '${capabilityName}':`, error);
    return null;
  }
}

/**
 * Inserts a new AI tool into the database, checking for duplicates by website URL.
 * @param toolData The scraped tool data.
 * @returns The ID of the newly inserted or existing tool, or null on failure.
 */
async function insertAiTool(toolData: ScrapedToolData): Promise<number | null> {
  console.log(`Attempting to insert tool: ${toolData.toolName ?? toolData.websiteUrl}`);
  try {
    // Check if tool with the same website URL already exists
    const existingTool = await db
        .select({ id: aiTools.id })
        .from(aiTools)
        .where(eq(aiTools.websiteUrl, toolData.websiteUrl))
        .limit(1);

    if (existingTool.length > 0) {
        console.log(`Tool with URL ${toolData.websiteUrl} already exists with ID: ${existingTool[0].id}. Skipping insertion.`);
        return existingTool[0].id;
    }

    // Insert the new tool
    const newTool = await db
      .insert(aiTools)
      .values({
        toolName: toolData.toolName,
        description: toolData.description,
        websiteUrl: toolData.websiteUrl,
        licenseType: toolData.licenseType,
        primaryCategory: toolData.primaryCategory,
        tags: toolData.tags,
        // Assumes createdAt/updatedAt are handled by DB defaults or triggers
      })
      .returning({ toolId: aiTools.id });

    if (newTool.length > 0) {
      console.log(`Inserted tool '${toolData.toolName}' with ID: ${newTool[0].toolId}`);
      return newTool[0].toolId;
    }
    return null;
  } catch (error) {
    console.error(`Error inserting tool '${toolData.toolName}' (${toolData.websiteUrl}):`, error);
    return null;
  }
}

/**
 * Creates a mapping between an AI tool and an AI capability.
 * @param toolId The ID of the AI tool.
 * @param capabilityId The ID of the AI capability.
 */
async function mapToolToCapability(toolId: number, capabilityId: number): Promise<void> {
  console.log(`Mapping tool ID ${toolId} to capability ID ${capabilityId}`);
  try {
    await db
      .insert(capabilityToolMapping)
      .values({ toolId, capabilityId })
      .onConflictDoNothing(); // Assumes a unique constraint on (toolId, capabilityId)
    console.log(`Successfully mapped tool ID ${toolId} to capability ID ${capabilityId} (or mapping already existed).`);
  } catch (error) {
    console.error(`Error mapping tool ID ${toolId} to capability ID ${capabilityId}:`, error);
  }
}

// --- Web Scraping Functions ---

/**
 * Scrapes a single tool website to extract information.
 * NOTE: Puppeteer is used here for robustness with dynamic websites.
 * Selector logic (`page.$eval`, `page.$$eval`) is highly site-specific and MUST be adjusted for each target URL pattern.
 * 
 * @param url The URL of the tool website to scrape.
 * @returns A Promise resolving to ScrapedToolData or null if scraping fails.
 */
async function scrapeToolWebsite(url: string): Promise<ScrapedToolData | null> {
  console.log(`Scraping website: ${url}`);
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: true, // Set to false for debugging
      args: ['--no-sandbox', '--disable-setuid-sandbox'] // Common args for server environments
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 }); // Increased timeout

    // --- Placeholder Extraction Logic --- 
    // --- MUST BE CUSTOMIZED PER SITE/URL PATTERN --- 

    // Example: Tool Name (often H1 or title tag)
    const toolName = await page.$eval('h1', h1 => h1.textContent?.trim()).catch(() => null) || 
                     await page.title().catch(() => null);

    // Example: Description (meta description or specific element)
    const description = await page.$eval('meta[name="description"]', meta => meta.content?.trim()).catch(() => null) || 
                        await page.$eval('p.description-class', p => p.textContent?.trim()).catch(() => null); // Example class

    // Example: License Type (requires searching page content for keywords)
    let licenseType: ScrapedToolData['licenseType'] = 'Unknown';
    const pageContent = await page.content();
    if (pageContent.toLowerCase().includes('open source')) {
      licenseType = 'Open Source';
    } else if (pageContent.toLowerCase().includes('pricing') || pageContent.toLowerCase().includes('commercial')) {
      licenseType = 'Commercial';
    } else if (pageContent.toLowerCase().includes('free')) { // Could be Freemium or just free tier
        licenseType = 'Freemium'; // Assume Freemium if 'free' is mentioned near pricing context
    }
    // Further refinement needed here based on site structure

    // Example: Primary Category (breadcrumbs, meta tags, etc.)
    const primaryCategory = await page.$eval('.breadcrumb-class > li:last-child', el => el.textContent?.trim()).catch(() => null); // Example

    // Example: Tags/Capabilities (specific elements with tags)
    const tags = await page.$$eval('.tag-class, .chip-class', // Example selectors
       tags => tags.map(tag => tag.textContent?.trim()).filter((tag): tag is string => !!tag)
    ).catch(() => null);

    // --- End Placeholder Logic ---

    if (!toolName && !description) {
        console.warn(`Could not extract critical info (name/description) from ${url}. Skipping.`);
        return null;
    }

    const scrapedData: ScrapedToolData = {
      toolName: toolName?.trim() ?? null,
      description: description?.trim() ?? null,
      websiteUrl: url, // Use original URL or attempt canonical if needed
      licenseType,
      primaryCategory: primaryCategory?.trim() ?? null,
      tags: tags ?? null,
    };

    console.log(`Successfully scraped basic data from ${url}`);
    return scrapedData;

  } catch (error) {
    console.error(`Error scraping website ${url}:`, error);
    return null;
  } finally {
    if (browser) {
      await browser.close();
      console.log(`Closed browser instance for ${url}`);
    }
  }
}

// --- Main Execution Logic ---

(async () => {
  console.log('Starting AI tool scraping script...');

  // Replace with actual target URLs (directory pages or specific tool pages)
  const startUrls = [
    'https://example-ai-directory.com/tools', 
    'https://another-list.com/ai'
  ]; 

  const limit = pLimit(3); // Limit to 3 concurrent scraping operations
  let successfulScrapes = 0;
  let failedScrapes = 0;

  const scrapingTasks = startUrls.map(url => limit(async () => {
    console.log(`Processing start URL: ${url}`);
    
    // TODO: Add logic here if the start URL is a directory/list page.
    // This would involve: 
    // 1. Launching Puppeteer for the directory URL.
    // 2. Extracting all individual tool page links (e.g., page.$$eval('a.tool-link', links => links.map(a => a.href))).
    // 3. Iterating through the extracted tool links instead of just the startUrl.
    // For now, we assume startUrls are direct tool pages for simplicity.
    const toolUrl = url; // Assuming startUrl is the actual tool page for now

    try {
      const toolData = await scrapeToolWebsite(toolUrl);
      await delay(1500); // Delay between requests

      if (toolData) {
        const toolId = await insertAiTool(toolData);

        if (toolId !== null) {
          successfulScrapes++;
          console.log(`Successfully processed and saved/updated tool from: ${toolUrl} (ID: ${toolId})`);
          
          // Attempt to map tags to capabilities
          if (toolData.tags && toolData.tags.length > 0) {
            console.log(`Attempting to map ${toolData.tags.length} tags as capabilities for tool ID ${toolId}...`);
            for (const tag of toolData.tags) {
              const capabilityId = await getOrCreateCapability(tag, toolData.primaryCategory);
              if (capabilityId !== null) {
                await mapToolToCapability(toolId, capabilityId);
              }
              await delay(100); // Small delay between capability checks/maps
            }
          }
        } else {
          failedScrapes++;
          console.error(`Failed to insert tool data into DB for: ${toolUrl}`);
        }
      } else {
        failedScrapes++;
        console.warn(`Failed to scrape data from: ${toolUrl}`);
      }
    } catch (err) {
        failedScrapes++;
        console.error(`Unhandled error processing URL ${toolUrl}:`, err);
    }
  })); // End of limit function call

  try {
    await Promise.all(scrapingTasks);
    console.log('\n-----------------------------------');
    console.log('Scraping script finished.');
    console.log(`Successfully processed: ${successfulScrapes} tools`);
    console.log(`Failed to process: ${failedScrapes} tools`);
    console.log('-----------------------------------');
    // Optional: Clean exit for script context
    // process.exit(0);
  } catch (error) {
    console.error('\n-----------------------------------');
    console.error('An error occurred during the scraping process:', error);
    console.log('-----------------------------------');
    // process.exit(1);
  }
})(); 