// components/auth/FormLabel.jsx
import React from 'react';

export const FormLabel = ({ htmlFor, children, className = '' }) => {
  return (
    <label 
      htmlFor={htmlFor}
      className={`block text-sm font-semibold text-gray-300 ${className}`}
    >
      {children}
    </label>
  );
};