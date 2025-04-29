import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { insertJobScraperConfigSchema } from '@shared/schema';
import { ZodError } from 'zod';

// GET /api/job-scraper-configs
export async function GET() {
  try {
    const configs = await storage.listJobScraperConfigs();
    return NextResponse.json(configs);
  } catch (error) {
    console.error('Error fetching job scraper configs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

// POST /api/job-scraper-configs
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = insertJobScraperConfigSchema.parse(body);
    const config = await storage.createJobScraperConfig(validatedData);
    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    console.error('Error creating job scraper config:', error);
    if (error instanceof ZodError) {
      return NextResponse.json({ message: "Invalid job scraper config data", errors: error.errors }, { status: 400 });
    }
    const errorMessage = error instanceof Error ? error.message : 'Invalid job scraper config data';
    return NextResponse.json({ message: errorMessage }, { status: 400 });
  }
} 