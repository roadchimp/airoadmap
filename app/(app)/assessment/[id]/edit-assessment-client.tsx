'use client';

import React from 'react';
import { SessionProvider } from '@/lib/session/SessionContext';
import WizardLayout from '../new/_components/WizardLayout';
import { AssessmentWizard } from '../new/_components/AssessmentWizard';
import type { Assessment } from '@shared/schema';

interface EditAssessmentClientProps {
  initialAssessmentData: Assessment;
}

const EditAssessmentClient: React.FC<EditAssessmentClientProps> = ({ 
  initialAssessmentData 
}) => {
  return (
    <SessionProvider assessmentId={initialAssessmentData.id.toString()}>
      <WizardLayout>
        <AssessmentWizard initialAssessmentData={initialAssessmentData} />
      </WizardLayout>
    </SessionProvider>
  );
};

export default EditAssessmentClient; 