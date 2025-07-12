// components/ui/Button.js
import React from 'react';
import { cn } from '../../utils/cn'; // Utility for conditional classes

const Button = React.forwardRef(({ 
  className, 
  variant = 'primary', 
  size = 'medium', 
  children, 
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  ...props 
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    secondary: "bg-gray-800 text-white hover:bg-gray-700 focus:ring-gray-500",
    outline: "border border-white text-white hover:bg-white hover:text-red-600 focus:ring-white",
    ghost: "bg-transparent text-white hover:bg-white/10 focus:ring-white/20",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
    warning: "bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500",
    info: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
  };

  const sizes = {
    small: "px-4 py-2 text-sm",
    medium: "px-6 py-3 text-base",
    large: "px-8 py-4 text-lg",
  };

  const LoadingSpinner = () => (
    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
  );

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      ref={ref}
      {...props}
    >
      {loading ? (
        <>
          <LoadingSpinner />
          {children && <span className="ml-2">{children}</span>}
        </>
      ) : (
        <>
          {leftIcon && <span className="mr-2">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="ml-2">{rightIcon}</span>}
        </>
      )}
    </button>
  );
});

Button.displayName = "Button";

export default Button;