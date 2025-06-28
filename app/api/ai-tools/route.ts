import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { withAuthAndSecurity } from '../middleware/AuthMiddleware';
import { z } from 'zod';

// Input validation schema
const aiToolSchema = z.object({
  tool_name: z.string().min(1),
  description: z.string().min(1),
  primary_category: z.string().min(1),
  website_url: z.string().url().optional(),
  license_type: z.string().min(1),
  tags: z.array(z.string()).default([])
});

// GET /api/ai-tools
async function getAiTools(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const assessmentId = searchParams.get('assessmentId');

    if (assessmentId) {
      const tools = await storage.getTools({ assessmentId });
      return NextResponse.json(tools);
    }

    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const licenseType = searchParams.get('licenseType') || undefined;

    const tools = await storage.listAITools(search, category, licenseType);
    return NextResponse.json(tools);
  } catch (error) {
    console.error('Error fetching AI tools:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI tools' },
      { status: 500 }
    );
  }
}

// POST /api/ai-tools
async function createAiTool(request: Request) {
  try {
    const body = await request.json();
    const validatedData = aiToolSchema.parse(body);
    
    const tool = await storage.createAITool(validatedData);
    return NextResponse.json({ success: true, data: tool });
  } catch (error) {
    console.error('Error creating AI tool:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid AI tool data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create AI tool' },
      { status: 500 }
    );
  }
}

// Export the handlers wrapped with auth and security middleware
export const GET = getAiTools;
export const POST = withAuthAndSecurity(createAiTool); 