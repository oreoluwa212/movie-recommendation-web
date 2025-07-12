// components/auth/AuthCard.jsx
import React from 'react';

export const AuthCard = ({ children, className = '' }) => {
  return (
    <div className={`bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden ${className}`}>
      {children}
    </div>
  );
};