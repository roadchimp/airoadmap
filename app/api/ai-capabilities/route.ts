import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { insertAICapabilitySchema } from '@shared/schema';
import { ZodError } from 'zod';

// GET /api/ai-capabilities
export async function GET() {
  try {
    const capabilities = await storage.listAICapabilities();
    return NextResponse.json(capabilities);
  } catch (error) {
    console.error('Error fetching AI capabilities:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

// POST /api/ai-capabilities
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = insertAICapabilitySchema.parse(body);
    const capability = await storage.createAICapability(validatedData);
    return NextResponse.json(capability, { status: 201 });
  } catch (error) {
    console.error('Error creating AI capability:', error);
    if (error instanceof ZodError) {
      return NextResponse.json({ message: "Invalid AI capability data", errors: error.errors }, { status: 400 });
    }
    const errorMessage = error instanceof Error ? error.message : 'Invalid AI capability data';
    return NextResponse.json({ message: errorMessage }, { status: 400 });
  }
} 