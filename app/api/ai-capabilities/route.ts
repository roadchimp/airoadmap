import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { withAuthAndSecurity } from '../middleware';
import { z } from 'zod';

// Input validation schema
const aiCapabilitySchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(1),
  default_business_value: z.string().optional(),
  default_implementation_effort: z.string().optional(),
  default_ease_score: z.string().optional(),
  default_value_score: z.string().optional(),
  default_feasibility_score: z.string().optional(),
  default_impact_score: z.string().optional(),
  tags: z.array(z.string()).default([])
});

// GET /api/ai-capabilities
async function getAiCapabilities(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const assessmentId = searchParams.get('assessmentId') || undefined;
    const roleIds = searchParams.get('roleIds')?.split(',') || undefined;
    const categoryFilter = searchParams.get('categoryFilter')?.split(',') || undefined;

    const capabilities = await storage.listAICapabilities({
      assessmentId,
      roleIds,
      categoryFilter
    });
    return NextResponse.json({ success: true, data: capabilities });
  } catch (error) {
    console.error('Error fetching AI capabilities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI capabilities' },
      { status: 500 }
    );
  }
}

// POST /api/ai-capabilities
async function createAiCapability(request: Request) {
  try {
    const body = await request.json();
    const validatedData = aiCapabilitySchema.parse(body);
    
    const capability = await storage.createAICapability(validatedData);
    return NextResponse.json({ success: true, data: capability });
  } catch (error) {
    console.error('Error creating AI capability:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid AI capability data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create AI capability' },
      { status: 500 }
    );
  }
}

// Export the handlers wrapped with auth and security middleware
export const GET = withAuthAndSecurity(getAiCapabilities);
export const POST = withAuthAndSecurity(createAiCapability); 