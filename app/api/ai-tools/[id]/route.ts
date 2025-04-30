import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import type { AiTool, InsertAiTool } from '@shared/schema';

interface Params {
  id: string;
}

// GET /api/ai-tools/:id
export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid tool ID' }, { status: 400 });
    }

    const tool = await storage.getAITool(id);
    if (!tool) {
      return NextResponse.json({ message: 'AI tool not found' }, { status: 404 });
    }

    return NextResponse.json(tool);
  } catch (error) {
    console.error('Error fetching AI tool by ID:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

// PUT /api/ai-tools/:id
export async function PUT(request: Request, { params }: { params: Params }) {
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ message: 'Invalid tool ID' }, { status: 400 });
  }

  try {
    const body = await request.json();
    
    // Use Partial<InsertAiTool> for update data type
    const updateData: Partial<InsertAiTool> = {
      tool_name: body.tool_name,
      primary_category: body.primary_category,
      license_type: body.license_type,
      description: body.description,
      website_url: body.website_url,
      tags: body.tags // Keep null/undefined check below
    };

    // Remove undefined values to allow partial updates
    Object.keys(updateData).forEach(key => 
      (updateData as any)[key] === undefined && delete (updateData as any)[key]
    );

    // Add validation if needed - e.g., check if updateData is empty
    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ message: 'No update fields provided' }, { status: 400 });
    }

    const tool = await storage.updateAITool(id, updateData);
    return NextResponse.json(tool);
  } catch (error) {
    console.error('Error updating AI tool:', error);
    let errorMessage = 'Error updating AI tool';
    let statusCode = 400; // Default to 400 as per original catch block

    // Handle specific error cases like 'not found' if storage throws identifiable errors
    if (error instanceof Error) {
        errorMessage = error.message;
        // Example: Check for a specific not found error pattern
        if (error.message.toLowerCase().includes('not found')) {
            statusCode = 404;
        }
    }
    
    return NextResponse.json({ message: errorMessage }, { status: statusCode });
  }
}

// DELETE /api/ai-tools/:id
export async function DELETE(request: Request, { params }: { params: Params }) {
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ message: 'Invalid tool ID' }, { status: 400 });
  }

  try {
    await storage.deleteAITool(id); // storage.deleteAITool likely returns void or throws
    // Successful deletion returns 204 No Content
    return new NextResponse(null, { status: 204 }); 
  } catch (error) {
    console.error('Error deleting AI tool:', error);
    let errorMessage = 'Error deleting AI tool';
    let statusCode = 500; // Default to 500 for unexpected delete errors

    if (error instanceof Error) {
      errorMessage = error.message;
      // Example: Check if storage layer indicates not found on delete
      if (error.message.toLowerCase().includes('not found')) {
        statusCode = 404;
      }
    }

    return NextResponse.json({ message: errorMessage }, { status: statusCode });
  }
} 