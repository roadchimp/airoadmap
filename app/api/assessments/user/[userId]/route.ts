import { storage } from '@/server/storage';
import { createClient } from '@/../../utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndSecurity } from '@/app/api/middleware/AuthMiddleware';

interface Params {
  userId: string;
}

// GET /api/assessments/user/:userId
async function getAssessmentsForUser(request: Request, context: any) {
  const { user } = context;

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userProfile = await storage.getUserProfileByAuthId(user.id);
    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const assessments = await storage.listAssessmentsForUser(userProfile);
    
    // Similarly, fetch reports to map report IDs to assessments
    // This part can be optimized later if needed
    const reports = await storage.listReports(); 
    const assessmentToReportMap = new Map();
    if (Array.isArray(reports)) {
      reports.forEach(report => {
        if (report.assessmentId) {
          assessmentToReportMap.set(report.assessmentId, report.id);
        }
      });
    }

    const assessmentsWithReportIds = assessments.map(assessment => ({
      ...assessment,
      reportId: assessmentToReportMap.get(assessment.id) || null
    }));
    
    return NextResponse.json(assessmentsWithReportIds);
  } catch (error) {
    console.error('Error fetching assessments for user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = withAuthAndSecurity(getAssessmentsForUser);

export async function PUT(request: NextRequest) {
  try {
    // CRITICAL: Add this authentication block at the start
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Your existing route logic continues here...
    return NextResponse.json({ message: 'PUT not implemented yet' }, { status: 501 });
  } catch (error) {
    console.error('Error in PUT request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}