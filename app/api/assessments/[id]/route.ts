import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { withAuthAndSecurity } from '../../middleware/AuthMiddleware';
import { z } from 'zod';
import { wizardStepDataSchema, JobRoleWithDepartment } from '@shared/schema';


// Input validation schema
const assessmentUpdateSchema = wizardStepDataSchema.partial().extend({
  strategicFocus: z.array(z.string()).optional()
});

// GET /api/assessments/[id]
async function getAssessment(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const assessmentId = parseInt(resolvedParams.id);
    if (isNaN(assessmentId)) {
      return NextResponse.json(
        { error: 'Invalid assessment ID' },
        { status: 400 }
      );
    }

    const assessment = await storage.getAssessment(assessmentId, );
    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Enrich roles: map selected/prioritized role IDs to full objects
    let rolesDetailed: JobRoleWithDepartment[] = [];
    const stepData = assessment.stepData && typeof assessment.stepData === 'object' ? assessment.stepData : {};
    const roles = (stepData as any).roles;
    
    console.log('API Route - Raw roles data:', roles);
    console.log('API Route - selectedRoles:', roles?.selectedRoles);
    console.log('API Route - selectedRoles type:', typeof roles?.selectedRoles);
    console.log('API Route - selectedRoles length:', roles?.selectedRoles?.length);
    
    if (roles && (roles.selectedRoles?.length || roles.prioritizedRoles?.length)) {
      // Collect all unique role IDs referenced
      const roleIds = [
        ...(roles.selectedRoles || []),
        ...(roles.prioritizedRoles || [])
      ]
        .map(r => typeof r === 'number' ? r : (typeof r === 'object' && r?.id ? r.id : null))
        .filter((v, i, a) => v != null && a.indexOf(v) === i);
      
      console.log('API Route - Extracted roleIds:', roleIds);
      
      if (roleIds.length > 0) {
        const allRoles = await storage.listJobRoles();
        console.log('API Route - All roles from storage:', allRoles.map(r => ({ id: r.id, title: r.title })));
        
        rolesDetailed = allRoles.filter(r => roleIds.includes(r.id));
        console.log('API Route - Filtered rolesDetailed:', rolesDetailed.map(r => ({ id: r.id, title: r.title })));
        
        // Replace selectedRoles with full role objects for frontend
        if (roles.selectedRoles) {
          roles.selectedRoles = rolesDetailed.filter(role => 
            roles.selectedRoles.some((id: any) => 
              typeof id === 'number' ? id === role.id : (typeof id === 'object' && id?.id === role.id)
            )
          );
          console.log('API Route - Updated selectedRoles:', roles.selectedRoles.map((r: any) => ({ id: r.id, title: r.title })));
        }
      }
    } else {
      console.log('API Route - No roles found or roles array is empty');
    }

    console.log('API Route - Final rolesDetailed:', rolesDetailed.map(r => ({ id: r.id, title: r.title })));

    return NextResponse.json({ success: true, data: { ...assessment, rolesDetailed } });
  } catch (error) {
    console.error('Error fetching assessment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessment' },
      { status: 500 }
    );
  }
}

// PATCH /api/assessments/[id]
async function updateAssessment(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const assessmentId = parseInt(resolvedParams.id);
    if (isNaN(assessmentId)) {
      return NextResponse.json(
        { error: 'Invalid assessment ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = assessmentUpdateSchema.parse(body);

    // Extract strategicFocus if present
    const { strategicFocus, ...stepData } = validatedData;

    const assessment = await storage.updateAssessmentStep(
      assessmentId,
      stepData,
      strategicFocus
    );
    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: assessment });
  } catch (error) {
    console.error('Error updating assessment:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid assessment data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update assessment' },
      { status: 500 }
    );
  }
}

// DELETE /api/assessments/[id]
async function deleteAssessment(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const assessmentId = parseInt(resolvedParams.id);
    if (isNaN(assessmentId)) {
      return NextResponse.json(
        { error: 'Invalid assessment ID' },
        { status: 400 }
      );
    }

    await storage.deleteAssessment(assessmentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting assessment:', error);
    return NextResponse.json(
      { error: 'Failed to delete assessment' },
      { status: 500 }
    );
  }
}

// Export the handlers wrapped with auth and security middleware
export const GET = withAuthAndSecurity(getAssessment);
export const PATCH = withAuthAndSecurity(updateAssessment);
export const DELETE = withAuthAndSecurity(deleteAssessment); 