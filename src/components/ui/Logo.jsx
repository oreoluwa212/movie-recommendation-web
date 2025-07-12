// components/ui/Logo.js
import React from 'react';
import { Link } from 'react-router-dom';
import { Film } from 'lucide-react';

const Logo = ({ className = "" }) => {
  return (
    <Link to="/" className={`flex items-center space-x-2 ${className}`}>
      <Film className="h-8 w-8 text-red-600" />
      <span className="text-xl font-bold text-white">StreamVibe</span>
    </Link>
  );
};

export default Logo;