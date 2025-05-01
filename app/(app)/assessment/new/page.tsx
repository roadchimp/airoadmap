import AssessmentWizard from "./_components/assessment-wizard";
import { Suspense } from 'react';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner'; // Assuming a loading spinner component exists

export default function NewAssessmentPage() {
  // This Server Component simply renders the main client component for the wizard.
  // Any initial data needed by the wizard that *can* be fetched server-side 
  // could potentially be fetched here and passed down as props, but given the
  // dynamic nature of the wizard, most logic will live in the client component.
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AssessmentWizard />
    </Suspense>
  );
} 