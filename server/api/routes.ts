import express from 'express';
import { runJobScrapers, processJobDescriptions } from './cronJobs';
import capabilitiesRouter from './capabilities';

const router = express.Router();

// Cron job routes
router.post('/cron/run-job-scrapers', runJobScrapers);
router.post('/cron/process-job-descriptions', processJobDescriptions);

// Capabilities routes
router.use('/capabilities', capabilitiesRouter);

export default router; 