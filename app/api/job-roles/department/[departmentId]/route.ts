import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { withAuthAndSecurity } from '../../../middleware/AuthMiddleware';
import { z } from 'zod';

const departmentParamSchema = z.object({
  departmentId: z.string().min(1)
});

// GET /api/job-roles/department/[departmentId]
async function getJobRolesByDepartment(
  request: NextRequest, 
  context: { params: Promise<{ departmentId: string }>; user: any }
) {
  try {
    const { departmentId } = await context.params;
    const validatedParams = departmentParamSchema.parse({ departmentId });
    const id = parseInt(validatedParams.departmentId);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid department ID' }, { status: 400 });
    }
    const jobRoles = await storage.listJobRolesByDepartment(id);
    return NextResponse.json({ success: true, data: jobRoles });
  } catch (error) {
    console.error('Error fetching job roles by department:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid department parameter', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to fetch job roles' }, { status: 500 });
  }
}

export const GET = withAuthAndSecurity(getJobRolesByDepartment); 