// components/AuthCTA.js
import React from 'react';
import AuthButtons from './AuthButtons';

const AuthCTA = ({ 
  title = "Get Personalized Recommendations",
  subtitle = "Create an account to receive personalized movie recommendations, build your watchlists, and track your favorite movies.",
  variant = "default", // "default", "compact", "minimal"
  className = ""
}) => {
  if (variant === "compact") {
    return (
      <div className={`bg-gradient-to-r from-red-600/20 to-transparent rounded-lg p-4 ${className}`}>
        <p className="text-red-100 text-sm mb-3">
          {subtitle}
        </p>
        <AuthButtons 
          size="small" 
          variant="primary"
          showIcons={false}
          className="justify-start"
        />
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div className={`text-center ${className}`}>
        <p className="text-gray-300 mb-4">
          {subtitle}
        </p>
        <AuthButtons 
          size="medium" 
          variant="primary"
          showIcons={true}
          className="justify-center"
        />
      </div>
    );
  }

  // Default variant
  return (
    <section className={`bg-gradient-to-r from-red-600 to-red-800 rounded-lg p-8 text-center my-12 ${className}`}>
      <h2 className="text-3xl font-bold text-white mb-4">
        {title}
      </h2>
      <p className="text-red-100 mb-6 max-w-2xl mx-auto">
        {subtitle}
      </p>
      <AuthButtons 
        size="medium" 
        variant="primary"
        showIcons={true}
        className="justify-center"
      />
    </section>
  );
};

export default AuthCTA;