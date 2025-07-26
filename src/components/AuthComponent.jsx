import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { User, Loader2, X } from "lucide-react";
import { useAuthStore } from "../stores/authStore";

// Import reusable components
import { AuthContainer } from "../components/auth/AuthContainer";
import { AuthCard } from "../components/auth/AuthCard";
import { AuthHeader } from "../components/auth/AuthHeader";
import { FormField } from "../components/auth/FormField";
import { PasswordField } from "../components/auth/PasswordField";
import { FormInput } from "../components/auth/FormInput";
import { FormLabel } from "../components/auth/FormLabel";
import { SubmitButton } from "../components/auth/SubmitButton";
import { SocialLoginButton } from "../components/auth/SocialLoginButton";
import { GoogleIcon } from "../components/auth/GoogleIcon";
import { FormDivider } from "../components/auth/FormDivider";
import { AuthLink } from "../components/auth/AuthLink";
import { DemoCredentials } from "../components/auth/DemoCredentials";
import { useAuthForm } from "../hooks/useAuthForm";
import { validateForm } from "../utils/validation";

export const AuthModal = ({ isOpen, onClose, initialMode = "login", onSuccess }) => {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState(initialMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const {
    formData,
    errors,
    handleInputChange,
    setErrors,
    resetForm,
  } = useAuthForm({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    verificationCode: "",
  });

  const {
    login,
    register,
    isLoading,
    isAuthenticated,
  } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    }
  }, [isAuthenticated, onClose, onSuccess]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
      setVerificationSent(false);
      setAuthMode(initialMode);
    }
  }, [isOpen, initialMode, resetForm]);

  useEffect(() => {
    setErrors({});
  }, [authMode, setErrors]);

  // Handle ESC key and prevent background scroll - but don't interfere with navbar
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      // Don't manage body overflow here - let parent component handle it
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    // Validate form based on current mode
    const fieldsToValidate = {
      login: ['email', 'password'],
      register: ['username', 'email', 'password', 'confirmPassword'],
      verify: ['verificationCode']
    };

    const validationErrors = validateForm(formData, fieldsToValidate[authMode] || []);
    
    // Custom validation for verification code
    if (authMode === 'verify') {
      if (!formData.verificationCode.trim()) {
        validationErrors.verificationCode = 'Verification code is required';
      } else if (formData.verificationCode.length !== 6) {
        validationErrors.verificationCode = 'Verification code must be 6 digits';
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      if (authMode === "login") {
        const result = await login(formData.email, formData.password);
        if (result.success) {
          toast.success("Welcome back!", {
            position: "top-right",
            autoClose: 2000,
          });
          setTimeout(() => {
            onClose();
            if (onSuccess) {
              onSuccess();
            }
          }, 1000);
        }
      } else if (authMode === "register") {
        const result = await register(
          formData.username,
          formData.email,
          formData.password
        );
        if (result.success) {
          // Check if email verification is required
          if (result.emailVerificationRequired) {
            toast.success(
              "Account created successfully! Redirecting to email verification...",
              {
                position: "top-right",
                autoClose: 3000,
              }
            );
            setTimeout(() => {
              onClose();
              // Navigate to verify email page with email as state
              navigate("/verify-email", {
                state: {
                  email: formData.email,
                  fromRegistration: true,
                  user: result.user,
                },
              });
            }, 1500);
          } else {
            toast.success("Account created successfully!", {
              position: "top-right",
              autoClose: 2000,
            });
            setTimeout(() => {
              onClose();
              if (onSuccess) {
                onSuccess();
              }
            }, 1000);
          }
        }
      } else if (authMode === "verify") {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (formData.verificationCode === "123456") {
          toast.success("Email verified successfully!", {
            position: "top-right",
            autoClose: 3000,
          });
          setTimeout(() => {
            onClose();
            if (onSuccess) {
              onSuccess();
            }
          }, 1000);
        } else {
          setErrors({
            verificationCode: "Invalid verification code. Please try again.",
          });
          toast.error("Invalid verification code.", {
            position: "top-right",
            autoClose: 5000,
          });
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast.error("An error occurred. Please try again.", {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendVerificationCode = async () => {
    setVerificationSent(true);
    toast.success("Verification code sent to your email!", {
      position: "top-right",
      autoClose: 3000,
    });
    setTimeout(() => setVerificationSent(false), 3000);
  };

  const handleSocialLogin = (provider) => {
    toast.info(`${provider} login integration coming soon!`, {
      position: "top-right",
      autoClose: 3000,
    });
  };

  const getHeaderContent = () => {
    const content = {
      login: { title: "Sign In", subtitle: "Welcome back to StreamVibe" },
      register: { title: "Create Account", subtitle: "Join StreamVibe today" },
      verify: { title: "Verify Email", subtitle: "Check your email for the code" }
    };
    return content[authMode];
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const headerContent = getHeaderContent();

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
      style={{ zIndex: 9999 }} // Ensure it's above everything but not conflicting with navbar
    >
      <div className="w-full max-w-md relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 z-10 bg-gray-800 hover:bg-gray-700 text-white rounded-full p-2 transition-colors shadow-lg"
          type="button"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        <AuthCard>
          <AuthHeader
            title={headerContent.title}
            subtitle={headerContent.subtitle}
          />

          <div className="p-6 space-y-6">
            {/* Social Login Options */}
            {(authMode === "login" || authMode === "register") && (
              <div className="space-y-3">
                <SocialLoginButton
                  provider="Google"
                  onClick={handleSocialLogin}
                  icon={GoogleIcon}
                />
                <FormDivider />
              </div>
            )}

            <div className="space-y-4">
              {/* Username Field for Register */}
              {authMode === "register" && (
                <FormField
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your username"
                  icon={User}
                  error={errors.username}
                  autoComplete="username"
                />
              )}

              {/* Email Field for Login and Register */}
              {(authMode === "login" || authMode === "register") && (
                <FormField
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your email"
                  icon={null} // Will use default Mail icon from FormInput
                  error={errors.email}
                  autoComplete="email"
                />
              )}

              {/* Password Field for Login and Register */}
              {(authMode === "login" || authMode === "register") && (
                <PasswordField
                  label="Password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your password"
                  error={errors.password}
                  autoComplete={authMode === "login" ? "current-password" : "new-password"}
                />
              )}

              {/* Confirm Password Field for Register */}
              {authMode === "register" && (
                <PasswordField
                  label="Confirm Password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Confirm your password"
                  error={errors.confirmPassword}
                  autoComplete="new-password"
                />
              )}

              {/* Verification Code Field */}
              {authMode === "verify" && (
                <div className="space-y-2">
                  <FormLabel htmlFor="verificationCode">
                    Verification Code
                  </FormLabel>
                  <div className="text-sm text-gray-400 mb-3">
                    Enter the 6-digit code sent to your email address
                  </div>
                  <FormInput
                    name="verificationCode"
                    value={formData.verificationCode}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    maxLength={6}
                    placeholder="000000"
                    error={errors.verificationCode}
                    className="text-center text-2xl tracking-wider"
                  />
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={resendVerificationCode}
                      disabled={verificationSent}
                      className="text-sm text-red-400 hover:text-red-300 underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {verificationSent ? "Code Sent!" : "Resend Code"}
                    </button>
                  </div>
                </div>
              )}

              {/* Forgot Password Link */}
              {authMode === "login" && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() =>
                      toast.info("Password reset feature coming soon!")
                    }
                    className="text-sm text-red-400 hover:text-red-300 underline transition-colors"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <SubmitButton
                isLoading={isSubmitting || isLoading}
                loadingText={
                  authMode === "login" ? "Signing In..." :
                  authMode === "register" ? "Creating Account..." :
                  "Verifying..."
                }
                onClick={handleSubmit}
              >
                {authMode === "login" && "Sign In"}
                {authMode === "register" && "Create Account"}
                {authMode === "verify" && "Verify Email"}
              </SubmitButton>
            </div>

            {/* Toggle between login and register */}
            {authMode !== "verify" && (
              <div className="text-center pt-4 border-t border-gray-700">
                <p className="text-gray-400">
                  {authMode === "login"
                    ? "Don't have an account?"
                    : "Already have an account?"}{" "}
                  <button
                    onClick={() =>
                      setAuthMode(authMode === "login" ? "register" : "login")
                    }
                    className="text-red-400 hover:text-red-300 underline transition-colors font-medium"
                    type="button"
                  >
                    {authMode === "login" ? "Create Account" : "Sign In"}
                  </button>
                </p>
              </div>
            )}

            {/* Back to login from verification */}
            {authMode === "verify" && (
              <div className="text-center pt-4 border-t border-gray-700">
                <button
                  onClick={() => setAuthMode("login")}
                  className="text-red-400 hover:text-red-300 underline transition-colors font-medium"
                  type="button"
                >
                  Back to Sign In
                </button>
              </div>
            )}
          </div>
        </AuthCard>
      </div>
    </div>
  );
};