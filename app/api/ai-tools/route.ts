import { NextResponse, NextRequest } from 'next/server';
import { storage } from '@/server/storage';
// Correcting the import casing based on linter error
import type { AiTool, InsertAiTool } from '@shared/schema';
import { ZodError } from 'zod'; // Assuming zod might be used for future validation
import { Description } from '@radix-ui/react-toast';

// GET /api/ai-tools
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const licenseType = searchParams.get('licenseType') || undefined;

    const tools = await storage.listAITools(search, category, licenseType);
    return NextResponse.json(tools);
  } catch (error) {
    console.error('Error fetching AI tools:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

// POST /api/ai-tools
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Use the corrected InsertAiTool type which omits generated fields
    const toolData: InsertAiTool = {
      tool_name: body.tool_name,
      primary_category: body.primary_category,
      license_type: body.license_type,
      description: body.description,
      website_url: body.website_url,
      tags: body.tags || [] // Default to empty array if tags are missing
    };

    // Add more robust validation here if needed before calling storage
    if (!toolData.tool_name || !toolData.primary_category || !toolData.license_type) {
        return NextResponse.json({ message: 'Missing required fields (tool_name, primary_category, license_type)' }, { status: 400 });
    }

    const tool = await storage.createAITool(toolData);
    return NextResponse.json(tool, { status: 201 });
  } catch (error) {
    console.error('Error creating AI tool:', error);
    // Add ZodError check if using Zod validation
    // if (error instanceof ZodError) {
    //   return NextResponse.json({ message: "Invalid AI tool data", errors: error.errors }, { status: 400 });
    // }
    const errorMessage = error instanceof Error ? error.message : 'Invalid AI tool data';
    return NextResponse.json({ message: errorMessage }, { status: 400 }); // Original used 400
  }
} 