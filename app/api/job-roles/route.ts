import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { withAuthAndSecurity } from '../middleware/AuthMiddleware';
import { z } from 'zod';

// Input validation schema
const jobRoleSchema = z.object({
  title: z.string().min(1),
  departmentId: z.number().int().positive(),
  description: z.string().min(1),
  keyResponsibilities: z.array(z.string()).default([]),
  aiPotential: z.enum(['Low', 'Medium', 'High']).optional()
});

// GET /api/job-roles
async function getJobRoles(
  request: NextRequest,
  context: { user: any }
) {
  try {
    const roles = await storage.listJobRoles();
    return NextResponse.json({ success: true, data: roles });
  } catch (error) {
    console.error('Error fetching job roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job roles' },
      { status: 500 }
    );
  }
}

// POST /api/job-roles
async function createJobRole(
  request: NextRequest,
  context: { user: any }
) {
  try {
    const body = await request.json();
    const validatedData = jobRoleSchema.parse(body);
    
    const role = await storage.createJobRole(validatedData);
    return NextResponse.json({ success: true, data: role });
  } catch (error) {
    console.error('Error creating job role:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid job role data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create job role' },
      { status: 500 }
    );
  }
}

// Export the handlers wrapped with auth and security middleware
export const GET = withAuthAndSecurity(getJobRoles);
export const POST = withAuthAndSecurity(createJobRole); 