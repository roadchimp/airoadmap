import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

export const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ReactErrorBoundary
    fallback={
      <div className="p-4 bg-red-100 text-red-700 rounded">
        Something went wrong. Please refresh the page.
      </div>
    }
  >
    {children}
  </ReactErrorBoundary>
);

export default ErrorBoundary; 