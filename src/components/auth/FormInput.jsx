// components/auth/FormInput.jsx
import React from 'react';

export const FormInput = ({
  type = 'text',
  name,
  value,
  onChange,
  onKeyPress,
  placeholder,
  icon: Icon,
  error,
  className = '',
  autoComplete,
  maxLength,
  ...props
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onKeyPress={onKeyPress}
          autoComplete={autoComplete}
          maxLength={maxLength}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3 bg-gray-700/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 text-white transition-all duration-200 placeholder-gray-400 ${
            error
              ? 'border-red-500/50 bg-red-500/5'
              : 'border-gray-600 hover:border-gray-500'
          }`}
          placeholder={placeholder}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-red-400 flex items-center gap-1">
          <div className="w-1 h-1 bg-red-400 rounded-full"></div>
          {error}
        </p>
      )}
    </div>
  );
};