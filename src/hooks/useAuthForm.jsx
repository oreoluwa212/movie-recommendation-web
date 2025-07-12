// hooks/useAuthForm.js
import { useState, useCallback, useMemo } from "react";

export const useAuthForm = (initialData = {}) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});

  // Memoize the initial data to prevent unnecessary re-renders
  const memoizedInitialData = useMemo(() => initialData, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    setErrors((prev) => {
      if (prev[name]) {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      }
      return prev;
    });
  }, []);

  const setError = useCallback((field, message) => {
    setErrors((prev) => ({
      ...prev,
      [field]: message,
    }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const resetForm = useCallback(() => {
    setFormData(memoizedInitialData);
    setErrors({});
  }, [memoizedInitialData]);

  // Return memoized object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      formData,
      errors,
      handleInputChange,
      setError,
      clearErrors,
      resetForm,
      setFormData,
      setErrors,
    }),
    [formData, errors, handleInputChange, setError, clearErrors, resetForm]
  );
};
