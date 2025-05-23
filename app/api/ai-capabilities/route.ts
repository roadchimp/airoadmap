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
    
    // Convert any numeric scores to strings to match expected types
    const formattedData = {
      ...validatedData,
      default_ease_score: validatedData.default_ease_score !== undefined && validatedData.default_ease_score !== null 
        ? String(validatedData.default_ease_score) 
        : validatedData.default_ease_score,
      default_value_score: validatedData.default_value_score !== undefined && validatedData.default_value_score !== null 
        ? String(validatedData.default_value_score) 
        : validatedData.default_value_score,
      default_feasibility_score: validatedData.default_feasibility_score !== undefined && validatedData.default_feasibility_score !== null 
        ? String(validatedData.default_feasibility_score) 
        : validatedData.default_feasibility_score,
      default_impact_score: validatedData.default_impact_score !== undefined && validatedData.default_impact_score !== null 
        ? String(validatedData.default_impact_score) 
        : validatedData.default_impact_score,
    };
    
    const capability = await storage.createAICapability(formattedData);
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