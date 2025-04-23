import express from 'express';
import { runJobScrapers, processJobDescriptions } from './cronJobs';

const router = express.Router();

// Cron job routes
router.post('/cron/run-job-scrapers', runJobScrapers);
router.post('/cron/process-job-descriptions', processJobDescriptions);

export default router; 