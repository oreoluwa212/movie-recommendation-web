// components/auth/FormDivider.jsx
import React from 'react';

export const FormDivider = ({ text = "Or continue with email" }) => {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-600"></div>
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-3 bg-gray-800 text-gray-400 font-medium">
          {text}
        </span>
      </div>
    </div>
  );
};