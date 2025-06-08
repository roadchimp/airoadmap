import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { withAuthAndSecurity } from '../../../middleware/AuthMiddleware';
import { z } from 'zod';

const idParamSchema = z.object({
  id: z.string().min(1)
});
const statusUpdateSchema = z.object({
  isActive: z.boolean()
});

// PATCH /api/job-scraper-configs/[id]/status
async function updateJobScraperConfigStatus(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = idParamSchema.parse(params);
    const configId = parseInt(id);
    if (isNaN(configId)) {
      return NextResponse.json({ error: 'Invalid job scraper config ID' }, { status: 400 });
    }
    const body = await request.json();
    const validatedData = statusUpdateSchema.parse(body);
    const config = await storage.updateJobScraperConfigStatus(configId, validatedData.isActive);
    if (!config) {
      return NextResponse.json({ error: 'Job scraper config not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error('Error updating job scraper config status:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid status data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update job scraper config status' }, { status: 500 });
  }
}

export const PATCH = withAuthAndSecurity(updateJobScraperConfigStatus); 