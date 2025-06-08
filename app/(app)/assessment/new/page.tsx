'use client';

import React from 'react';
import { SessionProvider } from '@/lib/session/SessionContext';
import WizardLayout from './_components/WizardLayout';
import { AssessmentWizard } from './_components/assessment-wizard';

const NewAssessmentPage: React.FC = () => {
  return (
    <SessionProvider>
      <WizardLayout>
        <AssessmentWizard />
      </WizardLayout>
    </SessionProvider>
  );
};

export default NewAssessmentPage; 