import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage'; // Assuming @/server alias points to server/
import { withAuthAndSecurity } from '../middleware/AuthMiddleware';

// GET /api/departments
async function getDepartments(
  request: NextRequest,
  context: { user: any }
) {
  try {
    const departments = await storage.listDepartments();
    return NextResponse.json({ success: true, data: departments });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch departments' }, 
      { status: 500 }
    );
  }
}

// Export the handler wrapped with auth and security middleware
export const GET = withAuthAndSecurity(getDepartments); 