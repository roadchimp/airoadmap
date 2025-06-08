import React from 'react';

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
    const sizeClasses = {
        sm: 'h-6 w-6 border-b-2',
        md: 'h-12 w-12 border-b-2',
        lg: 'h-16 w-16 border-b-4',
    };
    return (
        <div className="flex justify-center items-center">
            <div className={`animate-spin rounded-full border-blue-600 ${sizeClasses[size]}`}></div>
        </div>
    );
};

export default LoadingSpinner; 