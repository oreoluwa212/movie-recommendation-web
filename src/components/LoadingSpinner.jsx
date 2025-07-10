import React from 'react';

const LoadingSpinner = ({ size = 'medium', text = 'Loading...', fullScreen = false }) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
    xlarge: 'h-16 w-16'
  };

  const Component = (
    <div className={`flex flex-col items-center justify-center ${fullScreen ? 'min-h-screen' : 'py-8'}`}>
      <div className={`inline-block animate-spin rounded-full border-b-2 border-red-600 ${sizeClasses[size]}`}></div>
      {text && <p className="mt-4 text-gray-400 text-sm">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gray-900 z-50">
        {Component}
      </div>
    );
  }

  return Component;
};

export default LoadingSpinner;