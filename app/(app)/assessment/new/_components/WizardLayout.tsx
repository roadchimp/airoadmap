import React from 'react';
import { WizardProgressSidebar } from './WizardProgressSidebar';

interface WizardLayoutProps {
  children: React.ReactNode;
}

const WizardLayout: React.FC<WizardLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-white">
      <WizardProgressSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default WizardLayout; 