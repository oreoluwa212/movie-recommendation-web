import React from 'react';

export const SocialLoginButton = ({ 
  provider, 
  onClick, 
  icon: Icon,
  className = ''
}) => {
  return (
    <button
      type="button"
      onClick={() => onClick(provider)}
      className={`w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-xl border border-gray-200 transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:scale-[1.01] active:scale-[0.99] ${className}`}
    >
      {Icon && <Icon className="h-5 w-5" />}
      Continue with {provider}
    </button>
  );
};