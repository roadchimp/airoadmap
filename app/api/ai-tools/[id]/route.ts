import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { withAuthAndSecurity } from '../../middleware/AuthMiddleware';
import { z } from 'zod';

interface Params {
  id: string;
}

// Input validation schema
const aiToolSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string(),
  vendor: z.string().optional(),
  url: z.string().url().optional(),
  status: z.enum(['active', 'inactive']).optional()
});

// Input validation schema for update
const aiToolUpdateSchema = z.object({
  tool_name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  primary_category: z.string().min(1).optional(),
  website_url: z.string().url().optional(),
  license_type: z.string().min(1).optional(),
  tags: z.array(z.string()).optional()
});

// GET /api/ai-tools/[id]
async function getAiTool(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const toolId = parseInt(params.id);
    if (isNaN(toolId)) {
      return NextResponse.json(
        { error: 'Invalid tool ID' },
        { status: 400 }
      );
    }

    const tool = await storage.getAITool(toolId);
    if (!tool) {
      return NextResponse.json(
        { error: 'AI tool not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: tool });
  } catch (error) {
    console.error('Error fetching AI tool:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI tool' },
      { status: 500 }
    );
  }
}

// PATCH /api/ai-tools/[id]
async function updateAiTool(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const toolId = parseInt(params.id);
    if (isNaN(toolId)) {
      return NextResponse.json(
        { error: 'Invalid tool ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = aiToolUpdateSchema.parse(body);

    const tool = await storage.updateAITool(toolId, validatedData);
    if (!tool) {
      return NextResponse.json(
        { error: 'AI tool not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: tool });
  } catch (error) {
    console.error('Error updating AI tool:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid tool data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update AI tool' },
      { status: 500 }
    );
  }
}

// DELETE /api/ai-tools/[id]
async function deleteAiTool(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const toolId = parseInt(params.id);
    if (isNaN(toolId)) {
      return NextResponse.json(
        { error: 'Invalid tool ID' },
        { status: 400 }
      );
    }

    await storage.deleteAITool(toolId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting AI tool:', error);
    return NextResponse.json(
      { error: 'Failed to delete AI tool' },
      { status: 500 }
    );
  }
}

// Export the handlers wrapped with auth and security middleware
export const GET = withAuthAndSecurity(getAiTool);
export const PATCH = withAuthAndSecurity(updateAiTool);
export const DELETE = withAuthAndSecurity(deleteAiTool); 