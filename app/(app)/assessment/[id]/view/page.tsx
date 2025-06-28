import AssessmentViewClient from "./_components/assessment-view-client";
import { PgStorage } from "@/server/pg-storage";
import { notFound } from "next/navigation";
import { IStorage } from "@/server/storage";
import { Assessment, AssessmentResponse } from "@shared/schema";

// Define params as a Promise
type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AssessmentViewPage({ params }: PageProps) {
  // Await the params to resolve the Promise
  const { id } = await params;
  const assessmentId = parseInt(id, 10);

  if (isNaN(assessmentId)) {
    notFound();
  }

  const storage: IStorage = new PgStorage();
  let initialAssessmentData: Assessment;
  let assessmentResponses: AssessmentResponse[];

  try {
    const [assessment, responses] = await Promise.all([
      storage.getAssessment(assessmentId),
      storage.getAssessmentResponsesByAssessment(assessmentId)
    ]);

    if (!assessment) throw new Error("Assessment not found");
    
    initialAssessmentData = assessment;
    assessmentResponses = responses;
  } catch (error) {
    console.error("Failed to fetch assessment data:", error);
    notFound();
  }

  const report = await storage.getReportByAssessmentId(assessmentId);

  return (
    <AssessmentViewClient 
      assessment={initialAssessmentData} 
      reportId={report?.id}
    />
  );
}

// Update generateMetadata to handle Promise
export async function generateMetadata({ params }: PageProps) {
  // Await the params here too
  const { id } = await params;
  const assessmentId = parseInt(id, 10);
  
  if (isNaN(assessmentId)) return { title: 'Assessment Not Found' };
  
  const storage: IStorage = new PgStorage();
  const assessment = await storage.getAssessment(assessmentId);
  
  return {
    title: assessment ? `View Assessment: ${assessment.title}` : 'Assessment Not Found',
  };
} 