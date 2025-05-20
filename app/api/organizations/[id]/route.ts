import { NextResponse } from 'next/server';
import { getAuthUser, requireAuth } from '../../middleware';
import { storage } from '@/../../server/pg-storage';

/**
 * GET /api/organizations/[id]
 * Get a specific organization accessible to the current user
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Check if the user is authenticated
  const authResponse = await requireAuth(request);
  if (authResponse) return authResponse;
  
  // Get the authenticated user
  const { user } = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const id = parseInt(params.id);
  
  if (isNaN(id)) {
    return NextResponse.json(
      { error: 'Invalid organization ID' },
      { status: 400 }
    );
  }
  
  try {
    // Pass the auth ID to the storage layer for RLS policy enforcement
    const organization = await storage.getOrganization(id, user.id);
    
    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(organization);
  } catch (error) {
    console.error(`Error fetching organization ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    );
  }
} 