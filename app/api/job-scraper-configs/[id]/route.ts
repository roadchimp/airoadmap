import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { withAuthAndSecurity } from '../../middleware/AuthMiddleware';
import { z } from 'zod';

const idParamSchema = z.object({
  id: z.string().min(1)
});

// GET /api/job-scraper-configs/[id]
async function getJobScraperConfig(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = idParamSchema.parse(params);
    const configId = parseInt(id);
    if (isNaN(configId)) {
      return NextResponse.json({ error: 'Invalid job scraper config ID' }, { status: 400 });
    }
    const config = await storage.getJobScraperConfig(configId);
    if (!config) {
      return NextResponse.json({ error: 'Job scraper config not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error('Error fetching job scraper config:', error);
    return NextResponse.json({ error: 'Failed to fetch job scraper config' }, { status: 500 });
  }
}

export const GET = withAuthAndSecurity(getJobScraperConfig); 