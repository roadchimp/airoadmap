import { storage } from '@/server/storage';
import { insertReportSchema } from '@shared/schema';
import { ZodError } from 'zod';
import { unstable_noStore } from 'next/cache';
import { createClient } from '@/../../utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndSecurity } from '../middleware';
import { z } from 'zod';

// Input validation schema
const reportSchema = z.object({
  assessmentId: z.number().int().positive(),
  executiveSummary: z.string().min(1),
  prioritizationData: z.record(z.any()).optional(),
  aiSuggestions: z.record(z.any()).optional(),
  performanceImpact: z.record(z.any()).optional(),
  consultantCommentary: z.string().optional(),
  aiAdoptionScoreDetails: z.record(z.any()).optional(),
  roiDetails: z.record(z.any()).optional()
});

// GET /api/reports
async function getReports(request: Request) {
  try {
    const reports = await storage.listReports();
    return NextResponse.json({ success: true, data: reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// POST /api/reports
async function createReport(request: Request) {
  try {
    const body = await request.json();
    const validatedData = reportSchema.parse(body);
    
    const report = await storage.createReport(validatedData);
    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error('Error creating report:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid report data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}

// Export the handlers wrapped with auth and security middleware
export const GET = withAuthAndSecurity(getReports);
export const POST = withAuthAndSecurity(createReport); 