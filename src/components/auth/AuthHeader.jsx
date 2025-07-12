// components/auth/AuthHeader.jsx
import React from 'react';
import { Film, X } from 'lucide-react';

export const AuthHeader = ({ 
  title, 
  subtitle, 
  onClose,
  showCloseButton = false 
}) => {
  return (
    <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Film className="h-8 w-8 text-white" />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            <p className="text-red-100 text-sm">{subtitle}</p>
          </div>
        </div>
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-red-100 hover:text-white transition-colors p-1 rounded-full hover:bg-red-600"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>
  );
};