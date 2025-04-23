import { JobScraper } from '../lib/jobScraper.ts';

const main = async () => {
  try {
    const scraper = new JobScraper();
    console.log('Starting job scraper...');
    await scraper.runAllScrapers();
    console.log('Job scraper completed');
  } catch (error) {
    console.error('Error running scraper:', error);
    process.exit(1);
  }
};

main(); 