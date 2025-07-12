// components/ui/NavLink.js
import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';

const NavLink = ({ 
  to, 
  // eslint-disable-next-line no-unused-vars
  icon: Icon, 
  label, 
  isActive, 
  count, 
  onClick, 
  className 
}) => {
  const baseStyles = `
    flex items-center space-x-2 px-3 py-2 rounded-lg 
    transition-colors relative
  `;
  
  const activeStyles = isActive 
    ? "text-red-500 bg-red-500/10" 
    : "text-gray-300 hover:text-white hover:bg-gray-800";

  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(baseStyles, activeStyles, className)}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
};

export default NavLink;