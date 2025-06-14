import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { withAuthAndSecurity } from '../middleware/AuthMiddleware';
import { z } from 'zod';

// Input validation schema
const organizationSchema = z.object({
  name: z.string().min(1),
  industry: z.string().min(1),
  size: z.enum([
    'Small', 'Medium', 'Large', 'Enterprise',
    'Small (1-50 employees)', 'Medium (51-500 employees)', 
    'Large (501-5000 employees)', 'Enterprise (5000+ employees)'
  ]).transform((value) => {
    // Normalize detailed values to simple values for storage
    if (value.includes('(1-50 employees)')) return 'Small';
    if (value.includes('(51-500 employees)')) return 'Medium';
    if (value.includes('(501-5000 employees)')) return 'Large';
    if (value.includes('(5000+ employees)')) return 'Enterprise';
    // Return as-is for simple values
    return value;
  }),
  description: z.string().optional(),
  website: z.string().url().optional(),
  metadata: z.record(z.any()).optional()
});

/**
 * GET /api/organizations
 * Get all organizations accessible to the current user
 */
async function getOrganizations(request: Request) {
  try {
    const organizations = await storage.listOrganizations();
    return NextResponse.json({ success: true, data: organizations });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}

// POST /api/organizations
async function createOrganization(request: Request) {
  try {
    const body = await request.json();
    const validatedData = organizationSchema.parse(body);
    
    const organization = await storage.createOrganization(validatedData);
    return NextResponse.json({ success: true, data: organization });
  } catch (error) {
    console.error('Error creating organization:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid organization data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    );
  }
}

// Export the handlers wrapped with auth and security middleware
export const GET = withAuthAndSecurity(getOrganizations);
export const POST = withAuthAndSecurity(createOrganization); 