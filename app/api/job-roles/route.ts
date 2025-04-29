import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { insertJobRoleSchema } from '@shared/schema';
import { ZodError } from 'zod';

// GET /api/job-roles
export async function GET() {
  try {
    const roles = await storage.listJobRoles();
    return NextResponse.json(roles);
  } catch (error) {
    console.error('Error fetching job roles:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

// POST /api/job-roles
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = insertJobRoleSchema.parse(body);
    const jobRole = await storage.createJobRole(validatedData);
    return NextResponse.json(jobRole, { status: 201 });
  } catch (error) {
    console.error('Error creating job role:', error);
    if (error instanceof ZodError) {
      return NextResponse.json({ message: "Invalid job role data", errors: error.errors }, { status: 400 });
    }
    const errorMessage = error instanceof Error ? error.message : 'Invalid job role data';
    return NextResponse.json({ message: errorMessage }, { status: 400 });
  }
} 