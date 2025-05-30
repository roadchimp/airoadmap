import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { withAuthAndSecurity } from '../../../middleware';
import { z } from 'zod';

const idParamSchema = z.object({
  id: z.string().min(1)
});

// PATCH /api/job-scraper-configs/[id]/last-run
async function updateJobScraperConfigLastRun(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = idParamSchema.parse(params);
    const configId = parseInt(id);
    if (isNaN(configId)) {
      return NextResponse.json({ error: 'Invalid job scraper config ID' }, { status: 400 });
    }
    const config = await storage.updateJobScraperConfigLastRun(configId);
    if (!config) {
      return NextResponse.json({ error: 'Job scraper config not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error('Error updating job scraper config last run:', error);
    return NextResponse.json({ error: 'Failed to update job scraper config last run' }, { status: 500 });
  }
}

export const PATCH = withAuthAndSecurity(updateJobScraperConfigLastRun); 