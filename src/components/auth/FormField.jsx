// components/auth/FormField.jsx
import React from 'react';
import { FormLabel } from './FormLabel';
import { FormInput } from './FormInput';

export const FormField = ({ 
  label, 
  name, 
  error, 
  className = '',
  ...inputProps 
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <FormLabel htmlFor={name}>{label}</FormLabel>
      <FormInput
        name={name}
        error={error}
        {...inputProps}
      />
    </div>
  );
};