import { storage } from "@/server/storage";
import { NextResponse } from "next/server";
import { createClient } from '@/../../utils/supabase/server';

export async function GET() {
  try {
    console.log('Simple dashboard endpoint hit');
    
    // Basic auth check without CSRF
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.log('Dashboard auth failed:', error);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('Dashboard user authenticated:', user.id);
    
    const assessments = await storage.listAssessments();
    const reports = await storage.listReports();
    
    console.log('Dashboard data:', { 
      assessmentsCount: assessments.length, 
      reportsCount: reports.length 
    });
    
    const assessmentCountInProgress = assessments.filter(a => a.status !== 'completed').length;
    const assessmentCountCompleted = assessments.filter(a => a.status === 'completed').length;
    const reportCount = reports.length;

    return NextResponse.json({
      assessmentCountInProgress,
      assessmentCountCompleted,
      reportCount,
      debug: {
        totalAssessments: assessments.length,
        totalReports: reports.length,
        userId: user.id
      }
    });
  } catch (error) {
    console.error("Simple dashboard error:", error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
} 