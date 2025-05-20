import { NextResponse } from 'next/server';
import { storage } from '@/../../server/pg-storage';
import { withAuthGet, withAuthPost } from '../middleware';
import { unstable_noStore } from 'next/cache';

/**
 * GET /api/organizations
 * Get all organizations accessible to the current user
 */
async function getOrganizationsHandler(request: Request, authId: string) {
  // Disable caching for this route
  unstable_noStore();
  
  try {
    // Pass the authId to storage methods to enable RLS
    const organizations = await storage.listOrganizations(authId);
    
    return NextResponse.json(organizations);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}

// Export the handler wrapped with auth middleware
export const GET = withAuthGet(getOrganizationsHandler);

// Handler for creating organizations
async function createOrganizationHandler(request: Request, authId: string) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.industry || !data.size) {
      return NextResponse.json(
        { error: 'Name, industry, and size are required' },
        { status: 400 }
      );
    }
    
    // Create the organization
    const organization = await storage.createOrganization({
      name: data.name,
      industry: data.industry,
      size: data.size,
      description: data.description
    });
    
    // Create a link between user and organization in user_profiles
    await storage.createUserProfile({
      auth_id: authId,
      organization_id: organization.id,
      full_name: data.fullName || null
    });
    
    return NextResponse.json(organization);
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    );
  }
}

// Export the handler wrapped with auth middleware
export const POST = withAuthPost(createOrganizationHandler); 