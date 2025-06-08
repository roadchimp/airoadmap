import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { withAuthAndSecurity } from '../../middleware/AuthMiddleware';
import { z } from 'zod';
import type { ProcessedJobContent } from '@shared/schema';

// Input validation schema for processed content
const processedContentSchema = z.object({
  skills: z.array(z.string()),
  experience: z.array(z.string()),
  education: z.array(z.string()),
  responsibilities: z.array(z.string()),
  benefits: z.array(z.string()),
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  salaryRange: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    currency: z.string().optional()
  }).optional(),
  jobType: z.string().optional(),
  industry: z.string().optional(),
  seniorityLevel: z.string().optional()
});

const jobDescriptionUpdateSchema = z.object({
  title: z.string().optional(),
  company: z.string().optional(),
  location: z.string().optional(),
  jobBoard: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  rawContent: z.string().optional(),
  processedContent: z.any().optional(),
  keywords: z.array(z.string()).optional(),
  status: z.string().optional(),
  error: z.string().optional()
});

// GET /api/job-descriptions/:id
async function getJobDescription(
  request: NextRequest, 
  context: { params: Promise<{ id: string }>; user: any }
) {
  try {
    const { id } = await context.params;
    const jobDescriptionId = parseInt(id);
    if (isNaN(jobDescriptionId)) {
      return NextResponse.json(
        { error: 'Invalid job description ID' },
        { status: 400 }
      );
    }
    
    const jobDescription = await storage.getJobDescription(jobDescriptionId);
    if (!jobDescription) {
      return NextResponse.json(
        { error: 'Job description not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: jobDescription
    });
  } catch (error) {
    console.error('Error fetching job description:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job description' },
      { status: 500 }
    );
  }
}

// PATCH /api/job-descriptions/:id
async function updateJobDescription(
  request: NextRequest, 
  context: { params: Promise<{ id: string }>; user: any }
) {
  try {
    const { id } = await context.params;
    const jobDescriptionId = parseInt(id);
    if (isNaN(jobDescriptionId)) {
      return NextResponse.json(
        { error: 'Invalid job description ID' },
        { status: 400 }
      );
    }
    const body = await request.json();
    const validatedData = jobDescriptionUpdateSchema.parse(body);
    // Only allow updating processedContent via a dedicated method
    if (validatedData.processedContent) {
      const updated = await storage.updateJobDescriptionProcessedContent(jobDescriptionId, validatedData.processedContent);
      return NextResponse.json({ success: true, data: updated });
    }
    // Only allow updating status via a dedicated method
    if (validatedData.status) {
      const updated = await storage.updateJobDescriptionStatus(jobDescriptionId, validatedData.status, validatedData.error);
      return NextResponse.json({ success: true, data: updated });
    }
    return NextResponse.json({ error: 'Only processedContent or status can be updated via this endpoint.' }, { status: 400 });
  } catch (error) {
    console.error('Error updating job description:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid job description data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update job description' },
      { status: 500 }
    );
  }
}

// Export the handlers wrapped with auth middleware
export const GET = withAuthAndSecurity(getJobDescription);
export const PATCH = withAuthAndSecurity(updateJobDescription); 