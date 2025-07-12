// components/auth/PasswordInput.jsx
import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

export const PasswordInput = ({
  name,
  value,
  onChange,
  onKeyPress,
  placeholder,
  error,
  autoComplete = 'current-password',
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type={showPassword ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          onKeyPress={onKeyPress}
          autoComplete={autoComplete}
          className={`w-full pl-10 pr-12 py-3 bg-gray-700/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 text-white transition-all duration-200 placeholder-gray-400 ${
            error
              ? 'border-red-500/50 bg-red-500/5'
              : 'border-gray-600 hover:border-gray-500'
          }`}
          placeholder={placeholder}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors p-1 rounded-md hover:bg-gray-600/30"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
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