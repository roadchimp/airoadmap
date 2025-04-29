import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';

// GET /api/job-scraper-configs/active
export async function GET() {
  try {
    const configs = await storage.listActiveJobScraperConfigs();
    return NextResponse.json(configs);
  } catch (error) {
    console.error('Error fetching active job scraper configs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
} 