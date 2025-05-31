import { notFound } from 'next/navigation';
import { storage } from "@/server/storage";
import { Assessment } from '@shared/schema';
import AssessmentViewer from "../../_components/assessment-viewer"; // We'll create this component

interface AssessmentViewPageProps {
  params: Promise<{
    id: string;
  }>;
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

// Fetch assessment responses
async function getAssessmentResponses(id: number) {
  try {
    const responses = await storage.getAssessmentResponsesByAssessment(id);
    return responses;
  } catch (error) {
    console.error(`Error fetching assessment responses for ${id}:`, error);
    return [];
  }
}

export default async function ViewAssessmentPage({ params }: AssessmentViewPageProps) {
  const { id } = await params;
  const assessmentId = parseInt(id);

  if (isNaN(assessmentId)) {
    notFound(); // If ID is not a number, show 404
  }

  const initialAssessmentData = await getAssessmentData(assessmentId);
  const assessmentResponses = await getAssessmentResponses(assessmentId);

  if (!initialAssessmentData) {
    notFound(); // If assessment not found or error fetching, show 404
  }

  // Pass the fetched assessment data to the viewer component
  return (
    <AssessmentViewer 
      assessment={initialAssessmentData} 
      responses={assessmentResponses} 
    />
  );
}

// Add metadata generation based on assessment title
export async function generateMetadata({ params }: AssessmentViewPageProps) {
  const { id } = await params;
  const assessmentId = parseInt(id);
  if (isNaN(assessmentId)) return { title: 'Assessment Not Found' };
  
  const assessment = await getAssessmentData(assessmentId);
  return {
    title: assessment ? `View Assessment: ${assessment.title}` : 'Assessment Not Found',
  };
} 