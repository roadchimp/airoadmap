import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndSecurity } from '../../middleware';
import { storage } from '@/server/storage';

/**
 * GET /api/organizations/[id]
 * Get a specific organization accessible to the current user
 */
async function getOrganization(
  request: NextRequest,
  context: { params: Promise<{ id: string }>; user: any }
) {
  const { id } = await context.params;
  const { user } = context;
  
  const orgId = parseInt(id);
  
  if (isNaN(orgId)) {
    return NextResponse.json(
      { error: 'Invalid organization ID' },
      { status: 400 }
    );
  }
  
  try {
    // Pass the auth ID to the storage layer for RLS policy enforcement
    const organization = await storage.getOrganization(orgId, user.id);
    
    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(organization);
  } catch (error) {
    console.error(`Error fetching organization ${orgId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    );
  }
}

// Export the handler wrapped with auth and security middleware
export const GET = withAuthAndSecurity(getOrganization); 