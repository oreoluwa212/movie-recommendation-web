import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle,
  X,
  Film,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";

export const AuthModal = ({ isOpen, onClose, initialMode = "login" }) => {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState(initialMode);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    verificationCode: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const {
    login,
    register,
    isLoading,
    error: authError,
    isAuthenticated,
  } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      onClose();
    }
  }, [isAuthenticated, onClose]);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
        username: "",
        verificationCode: "",
      });
      setErrors({});
      setVerificationSent(false);
      setAuthMode(initialMode);
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    setErrors({});
  }, [authMode]);

  // Handle auth errors with toast
  useEffect(() => {
    if (authError && isOpen) {
      toast.error(authError, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  }, [authError, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (authMode === "register") {
      if (!formData.username.trim()) {
        newErrors.username = "Username is required";
      } else if (formData.username.length < 3) {
        newErrors.username = "Username must be at least 3 characters";
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        newErrors.username =
          "Username can only contain letters, numbers, and underscores";
      }

      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }

      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        newErrors.password =
          "Password must contain at least one uppercase letter, one lowercase letter, and one number";
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    } else if (authMode === "login") {
      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }

      if (!formData.password) {
        newErrors.password = "Password is required";
      }
    } else if (authMode === "verify") {
      if (!formData.verificationCode.trim()) {
        newErrors.verificationCode = "Verification code is required";
      } else if (formData.verificationCode.length !== 6) {
        newErrors.verificationCode = "Verification code must be 6 digits";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (authMode === "login") {
        const result = await login(formData.email, formData.password);
        if (result.success) {
          toast.success("Welcome back! Login successful.", {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
          setTimeout(() => {
            onClose();
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
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
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
            // If no verification required, just show success and close
            toast.success("Account created successfully! Welcome!", {
              position: "top-right",
              autoClose: 3000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });
            setTimeout(() => {
              onClose();
            }, 1000);
          }
        }
      } else if (authMode === "verify") {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (formData.verificationCode === "123456") {
          toast.success("Email verified successfully!", {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
          setTimeout(() => {
            onClose();
          }, 1000);
        } else {
          setErrors({
            verificationCode: "Invalid verification code. Try 123456 for demo.",
          });
          toast.error("Invalid verification code. Try 123456 for demo.", {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast.error("An error occurred. Please try again.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
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
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
    setTimeout(() => setVerificationSent(false), 3000);
  };

  const handleSocialLogin = (provider) => {
    toast.info(`${provider} login integration coming soon!`, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-red-600 to-red-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Film className="h-6 w-6 text-white" />
              <div>
                <h2 className="text-xl font-bold text-white">
                  {authMode === "login" && "Welcome Back"}
                  {authMode === "register" && "Join StreamVibe"}
                  {authMode === "verify" && "Verify Email"}
                </h2>
                <p className="text-red-100 text-sm">
                  {authMode === "login" && "Sign in to your account"}
                  {authMode === "register" && "Create your account"}
                  {authMode === "verify" && "Enter verification code"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-red-100 hover:text-white transition-colors p-1 rounded-full hover:bg-red-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            {/* Social Login Options */}
            {(authMode === "login" || authMode === "register") && (
              <div className="space-y-3">
                <button
                  onClick={() => handleSocialLogin("Google")}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-300 transition-colors font-medium"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-900 text-gray-400">
                      Or continue with email
                    </span>
                  </div>
                </div>
              </div>
            )}

            {authMode === "register" && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className={`w-full pl-10 pr-4 py-3 bg-gray-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white transition-colors ${
                      errors.username
                        ? "border-red-500"
                        : "border-gray-600 focus:border-red-500"
                    }`}
                    placeholder="Enter your username"
                  />
                </div>
                {errors.username && (
                  <p className="mt-1 text-sm text-red-400">{errors.username}</p>
                )}
              </div>
            )}

            {(authMode === "login" || authMode === "register") && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className={`w-full pl-10 pr-4 py-3 bg-gray-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white transition-colors ${
                      errors.email
                        ? "border-red-500"
                        : "border-gray-600 focus:border-red-500"
                    }`}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                )}
              </div>
            )}

            {(authMode === "login" || authMode === "register") && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className={`w-full pl-10 pr-10 py-3 bg-gray-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white transition-colors ${
                      errors.password
                        ? "border-red-500"
                        : "border-gray-600 focus:border-red-500"
                    }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-400">{errors.password}</p>
                )}
              </div>
            )}

            {authMode === "register" && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className={`w-full pl-10 pr-10 py-3 bg-gray-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white transition-colors ${
                      errors.confirmPassword
                        ? "border-red-500"
                        : "border-gray-600 focus:border-red-500"
                    }`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            {authMode === "verify" && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Verification Code
                </label>
                <div className="text-sm text-gray-400 mb-3">
                  Enter the 6-digit code sent to your email address
                </div>
                <input
                  type="text"
                  name="verificationCode"
                  value={formData.verificationCode}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  maxLength="6"
                  className={`w-full px-4 py-3 bg-gray-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white text-center text-2xl tracking-wider transition-colors ${
                    errors.verificationCode
                      ? "border-red-500"
                      : "border-gray-600 focus:border-red-500"
                  }`}
                  placeholder="000000"
                />
                {errors.verificationCode && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.verificationCode}
                  </p>
                )}
                <div className="mt-3 text-center">
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
              <div className="text-center">
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

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || isLoading}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-600 text-white py-3 px-4 rounded-lg transition-all font-medium disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isSubmitting || isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin h-5 w-5" />
                  <span>
                    {authMode === "login" && "Signing In..."}
                    {authMode === "register" && "Creating Account..."}
                    {authMode === "verify" && "Verifying..."}
                  </span>
                </div>
              ) : (
                <>
                  {authMode === "login" && "Sign In"}
                  {authMode === "register" && "Create Account"}
                  {authMode === "verify" && "Verify Email"}
                </>
              )}
            </button>
          </div>

          {/* Toggle between login and register */}
          {authMode !== "verify" && (
            <div className="text-center">
              <p className="text-gray-400">
                {authMode === "login"
                  ? "Don't have an account?"
                  : "Already have an account?"}
                <button
                  onClick={() =>
                    setAuthMode(authMode === "login" ? "register" : "login")
                  }
                  className="ml-1 text-red-400 hover:text-red-300 underline transition-colors font-medium"
                >
                  {authMode === "login" ? "Sign Up" : "Sign In"}
                </button>
              </p>
            </div>
          )}

          {/* Back to login from verification */}
          {authMode === "verify" && (
            <div className="text-center">
              <button
                onClick={() => setAuthMode("login")}
                className="text-red-400 hover:text-red-300 underline transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
