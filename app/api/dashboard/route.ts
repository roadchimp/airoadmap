// app/api/dashboard/route.ts
import { storage } from "@/server/storage";
import { NextResponse } from "next/server";
import { withAuthAndSecurity } from "../middleware/AuthMiddleware";

export const GET = withAuthAndSecurity(async () => {
  try {
    const assessments = await storage.listAssessments();
    const reports = await storage.listReports();
    
    const assessmentCountInProgress = assessments.filter(a => a.status !== 'completed').length;
    const assessmentCountCompleted = assessments.filter(a => a.status === 'completed').length;
    const reportCount = reports.length;

    return NextResponse.json({
      assessmentCountInProgress,
      assessmentCountCompleted,
      reportCount
    });
  } catch (error) {
    console.error("Dashboard data fetch error:", error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' }, 
      { status: 500 }
    );
  }
});