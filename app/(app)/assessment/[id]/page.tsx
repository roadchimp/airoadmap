import { notFound } from 'next/navigation';
import { storage } from "@/server/storage";
import AssessmentWizard from "../new/_components/assessment-wizard"; // Use the same wizard component
import type { Assessment } from '@shared/schema';

interface AssessmentDetailPageProps {
  params: {
    id: string;
  };
}

// Fetch data for a specific assessment on the server
async function getAssessmentData(id: number): Promise<Assessment | null> {
  try {
    const assessment = await storage.getAssessment(id);
    // Explicitly return null if assessment is undefined
    return assessment ?? null; 
  } catch (error) {
    console.error(`Error fetching assessment ${id}:`, error);
    return null; // Return null on error
  }
}

export default async function EditAssessmentPage({ params }: AssessmentDetailPageProps) {
  const assessmentId = parseInt(params.id);

  if (isNaN(assessmentId)) {
    notFound(); // If ID is not a number, show 404
  }

  const initialAssessmentData = await getAssessmentData(assessmentId);

  if (!initialAssessmentData) {
    notFound(); // If assessment not found or error fetching, show 404
  }

  // Pass the fetched assessment data to the client component
  return <AssessmentWizard initialAssessmentData={initialAssessmentData} />;
}

// Optional: Add metadata generation based on assessment title
export async function generateMetadata({ params }: AssessmentDetailPageProps) {
  const assessmentId = parseInt(params.id);
  if (isNaN(assessmentId)) return { title: 'Assessment Not Found' };
  
  const assessment = await getAssessmentData(assessmentId);
  return {
    title: assessment ? `Assessment: ${assessment.title}` : 'Assessment Not Found',
  };
} 