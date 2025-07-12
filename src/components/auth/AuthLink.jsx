// components/auth/AuthLink.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export const AuthLink = ({ to, children, className = '' }) => {
  return (
    <Link
      to={to}
      className={`text-red-400 hover:text-red-300 transition-colors font-semibold hover:underline ${className}`}
    >
      {children}
    </Link>
  );
};