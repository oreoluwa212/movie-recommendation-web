// components/auth/PasswordField.jsx
import React from 'react';
import { FormLabel } from './FormLabel';
import { PasswordInput } from './PasswordInput';

export const PasswordField = ({ 
  label, 
  name, 
  error, 
  className = '',
  ...inputProps 
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <FormLabel htmlFor={name}>{label}</FormLabel>
      <PasswordInput
        name={name}
        error={error}
        {...inputProps}
      />
    </div>
  );
};