import { JobScraper } from '../lib/jobScraper';
import { JobProcessor } from '../lib/processors/jobProcessor';
import type { Request, Response } from 'express';

// Verify the request is authentic using a secret header
const verifyRequest = (req: Request): boolean => {
  const authHeader = req.headers['x-cron-api-key'];
  return authHeader === process.env.CRON_API_KEY;
};

/**
 * Run job scrapers
 */
export const runJobScrapers = async (req: Request, res: Response) => {
  try {
    // Verify request is authentic
    if (!verifyRequest(req)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    console.log('Starting job scraper cron job');
    const jobScraper = new JobScraper();
    await jobScraper.runAllScrapers();
    
    return res.status(200).json({ success: true, message: 'Job scrapers executed successfully' });
  } catch (error) {
    console.error('Error running job scrapers:', error);
    return res.status(500).json({ success: false, message: 'Error running job scrapers' });
  }
};

/**
 * Process pending job descriptions
 */
export const processJobDescriptions = async (req: Request, res: Response) => {
  try {
    // Verify request is authentic
    if (!verifyRequest(req)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    console.log('Starting job processor cron job');
    const jobProcessor = new JobProcessor();
    const processedCount = await jobProcessor.processAllPendingJobDescriptions();
    
    return res.status(200).json({ 
      success: true, 
      message: `Processed ${processedCount} job descriptions successfully` 
    });
  } catch (error) {
    console.error('Error processing job descriptions:', error);
    return res.status(500).json({ success: false, message: 'Error processing job descriptions' });
  }
}; 