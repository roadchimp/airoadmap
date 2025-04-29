import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';

interface Params {
  departmentId: string;
}

// GET /api/job-roles/department/:departmentId
export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const departmentId = parseInt(params.departmentId);
    if (isNaN(departmentId)) {
      return NextResponse.json({ message: 'Invalid department ID' }, { status: 400 });
    }
    
    const roles = await storage.listJobRolesByDepartment(departmentId);
    return NextResponse.json(roles);
  } catch (error) {
    console.error('Error fetching job roles by department:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
} 