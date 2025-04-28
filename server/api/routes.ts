import express from 'express';
import { runJobScrapers, processJobDescriptions } from './cronJobs';
import capabilitiesRouter from './capabilities';
import toolsRouter from './tools';

const router = express.Router();

// --- Temporary Debug Route - REMOVE AFTER USE ---
router.get('/debug-env', (req, res) => {
  // Only expose non-sensitive variables!
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL ? '***set***' : '***not set***',
    DATABASE_PGHOST: process.env.DATABASE_PGHOST ? '***set***' : '***not set***',
    DATABASE_PGDATABASE: process.env.DATABASE_PGDATABASE ? '***set***' : '***not set***',
    DATABASE_PGUSER: process.env.DATABASE_PGUSER ? '***set***' : '***not set***',
    // Add more non-sensitive variables here if needed
  });
});
// --- End Debug Route ---

// Cron job routes
router.post('/cron/run-job-scrapers', runJobScrapers);
router.post('/cron/process-job-descriptions', processJobDescriptions);

// Capabilities routes
router.use('/capabilities', capabilitiesRouter);

// AI Tools routes
router.use('/tools', toolsRouter);

export default router; 