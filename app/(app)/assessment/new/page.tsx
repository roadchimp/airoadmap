import AssessmentWizard from "./_components/assessment-wizard";
import { Suspense } from 'react';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner'; // Assuming a loading spinner component exists
import { storage } from '@/server/storage';
import { Assessment } from '@shared/schema';

interface NewAssessmentPageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Function to fetch assessment data if an ID is provided
async function getInitialAssessmentData(id: string | undefined): Promise<Assessment | null> {
  if (!id) return null;
  const assessmentId = parseInt(id, 10);
  if (isNaN(assessmentId)) return null;
  
  try {
    const assessment = await storage.getAssessment(assessmentId);
    return assessment || null;
  } catch (error) {
    console.error(`Error fetching assessment ${assessmentId} for wizard:`, error);
    return null;
  }
}

export default async function NewAssessmentPage({ searchParams }: NewAssessmentPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const assessmentId = resolvedSearchParams?.id as string | undefined;
  let initialAssessmentData: Assessment | null = null;

  if (assessmentId) {
    initialAssessmentData = await getInitialAssessmentData(assessmentId);
    // Optional: if assessment data is not found for a given ID, you might want to redirect or show an error
    // For now, the wizard will start fresh if initialAssessmentData is null.
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AssessmentWizard initialAssessmentData={initialAssessmentData} />
    </Suspense>
  );
} 