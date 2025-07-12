// components/auth/SubmitButton.jsx
import React from 'react';
import { Loader2 } from 'lucide-react';

export const SubmitButton = ({
  isLoading,
  loadingText,
  children,
  disabled,
  className = '',
  ...props
}) => {
  return (
    <button
      type="submit"
      disabled={isLoading || disabled}
      className={`w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 text-white py-3 px-4 rounded-xl transition-all duration-200 font-semibold disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:transform-none ${className}`}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="animate-spin h-5 w-5" />
          <span>{loadingText}</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};