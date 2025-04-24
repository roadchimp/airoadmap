import { storage } from '../storage.ts';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const main = async () => {
  try {
    console.log('Querying database for job descriptions...');
    
    // Get all job descriptions with pagination
    const jobDescriptions = await storage.listJobDescriptions(100, 0);
    
    console.log(`Found ${jobDescriptions.length} job descriptions:`);
    
    // Print job details in a readable format
    jobDescriptions.forEach((job, index) => {
      console.log(`\n--- Job ${index + 1} ---`);
      console.log(`ID: ${job.id}`);
      console.log(`Title: ${job.title}`);
      console.log(`Company: ${job.company}`);
      console.log(`Job Board: ${job.jobBoard}`);
      console.log(`Location: ${job.location}`);
      console.log(`Status: ${job.status}`);
      console.log(`Date Scraped: ${job.dateScraped}`);
      console.log(`Keywords: ${job.keywords ? job.keywords.join(', ') : 'None'}`);
    });
    
    // Also query job scraper configs
    const scraperConfigs = await storage.listJobScraperConfigs();
    
    console.log(`\nFound ${scraperConfigs.length} job scraper configurations:`);
    
    // Print config details
    scraperConfigs.forEach((config, index) => {
      console.log(`\n--- Config ${index + 1} ---`);
      console.log(`ID: ${config.id}`);
      console.log(`Name: ${config.name}`);
      console.log(`Target Website: ${config.targetWebsite}`);
      console.log(`Keywords: ${config.keywords ? config.keywords.join(', ') : 'None'}`);
      console.log(`Location: ${config.location}`);
      console.log(`Is Active: ${config.isActive}`);
      console.log(`Last Run: ${config.lastRun || 'Never'}`);
    });
    
    // Disconnect from database
    await storage.disconnect();
    
  } catch (error) {
    console.error('Error querying database:', error);
    process.exit(1);
  }
};

main(); 