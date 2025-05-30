import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { withAuthAndSecurity } from '../../../middleware';
import { z } from 'zod';

const statusParamSchema = z.object({
  status: z.string().min(1)
});

// GET /api/job-descriptions/status/[status]
async function getJobDescriptionsByStatus(request: Request, { params }: { params: { status: string } }) {
  try {
    const { status } = statusParamSchema.parse(params);
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;
    const jobDescriptions = await storage.listJobDescriptionsByStatus(status, limit, offset);
    return NextResponse.json({ success: true, data: jobDescriptions });
  } catch (error) {
    console.error('Error fetching job descriptions by status:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid status parameter', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to fetch job descriptions' }, { status: 500 });
  }
}

export const GET = withAuthAndSecurity(getJobDescriptionsByStatus); 