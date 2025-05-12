import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';

/**
 * GET /api/organizations
 * Returns a list of all organizations
 */
export async function GET() {
  try {
    const organizations = await storage.listOrganizations();
    return NextResponse.json(organizations);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
  }
} 