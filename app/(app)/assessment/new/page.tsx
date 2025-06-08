'use client';

import React from 'react';
import { SessionProvider } from '@/lib/session/SessionContext';
import AssessmentWizard from './_components/assessment-wizard';

const NewAssessmentPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <header className="mb-8 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">
              Create New Assessment
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Follow this guided wizard to build a tailored AI readiness assessment.
            </p>
          </header>
          
          <SessionProvider>
            <AssessmentWizard />
          </SessionProvider>
        </div>
      </div>
    </div>
  );
};

export default NewAssessmentPage; 