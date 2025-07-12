// components/auth/AuthContainer.jsx
import React from 'react';

export const AuthContainer = ({ children, className = '' }) => {
  return (
    <div className={`min-h-screen bg-gray-900 flex items-center justify-center px-4 py-8 ${className}`}>
      <div className="max-w-md w-full">
        {children}
      </div>
    </div>
  );
};