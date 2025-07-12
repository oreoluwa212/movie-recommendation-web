// pages/auth/VerifyEmail.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle,
  Film,
  Loader2,
  Mail,
  ArrowLeft,
  RefreshCw,
  LogIn,
} from "lucide-react";
import { useAuthStore } from "../../stores/authStore";

const VerifyEmail = () => {
  const [verificationCode, setVerificationCode] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isVerified, setIsVerified] = useState(false);

  const { user, isAuthenticated, verifyEmail, resendVerificationCode } =
    useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || user?.email || "";

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  // Countdown timer for resend button
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const validateForm = () => {
    const newErrors = {};

    if (!verificationCode.trim()) {
      newErrors.verificationCode = "Verification code is required";
    } else if (verificationCode.length !== 6) {
      newErrors.verificationCode = "Verification code must be 6 digits";
    } else if (!/^\d{6}$/.test(verificationCode)) {
      newErrors.verificationCode =
        "Verification code must contain only numbers";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setVerificationCode(value);

    // Clear errors when user types
    if (errors.verificationCode) {
      setErrors({});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (!email) {
      setErrors({ verificationCode: "Email is required for verification" });
      return;
    }

    setIsSubmitting(true);
    setSuccess("");
    setErrors({});

    try {
      // Call the actual API endpoint via auth store
      const result = await verifyEmail(email, verificationCode);

      if (result.success) {
        setIsVerified(true);

        // Redirect to login page after successful verification
        setTimeout(() => {
          navigate("/login", {
            state: {
              message: "Email verified successfully! Please login to continue.",
              email: email,
            },
          });
        }, 2000);
      } else {
        setErrors({
          verificationCode:
            result.error || "Verification failed. Please try again.",
        });
      }
    } catch (error) {
      console.error("Verification error:", error);
      setErrors({
        verificationCode:
          error.message || "Verification failed. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (timeLeft > 0) return;

    if (!email) {
      setErrors({ verificationCode: "Email is required to resend code" });
      return;
    }

    setResendLoading(true);
    setResendSuccess(false);
    setErrors({});

    try {
      // Call the actual API endpoint via auth store
      const result = await resendVerificationCode(email);

      if (result.success) {
        setResendSuccess(true);
        setTimeLeft(60); // 60 second cooldown
        setTimeout(() => setResendSuccess(false), 3000);
      } else {
        setErrors({
          verificationCode:
            result.error || "Failed to resend code. Please try again.",
        });
      }
    } catch (error) {
      console.error("Resend error:", error);
      setErrors({
        verificationCode:
          error.message || "Failed to resend code. Please try again.",
      });
    } finally {
      setResendLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  const handleGoToLogin = () => {
    navigate("/login", {
      state: {
        message: "Email verified successfully! Please login to continue.",
        email: email,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Film className="h-8 w-8 text-white" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                    <Mail className="h-2.5 w-2.5 text-white" />
                  </div>
                </div>
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-white">
                    {isVerified ? "Email Verified!" : "Verify Your Email"}
                  </h1>
                  <p className="text-red-100 text-sm">
                    {isVerified
                      ? "You can now login to your account"
                      : "We've sent you a verification code"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Email Info */}
            {!isVerified && (
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center w-16 h-16 bg-red-500 bg-opacity-10 rounded-full mx-auto mb-4">
                  <Mail className="h-8 w-8 text-red-400" />
                </div>
                <p className="text-gray-300">
                  We've sent a 6-digit verification code to:
                </p>
                <p className="text-white font-semibold break-all">
                  {email || "your email address"}
                </p>
                <p className="text-gray-400 text-sm">
                  Please check your inbox and enter the code below
                </p>
              </div>
            )}

            {/* Success state */}
            {isVerified && (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center w-16 h-16 bg-green-500 bg-opacity-10 rounded-full mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
                <p className="text-green-400 font-semibold">
                  Your email has been verified successfully!
                </p>
                <p className="text-gray-300 text-sm">
                  You can now login to your StreamVibe account.
                </p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-3 bg-green-500 bg-opacity-10 border border-green-500 border-opacity-30 rounded-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span className="text-green-400 text-sm">{success}</span>
              </div>
            )}

            {/* Resend Success Message */}
            {resendSuccess && (
              <div className="p-3 bg-blue-500 bg-opacity-10 border border-blue-500 border-opacity-30 rounded-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <span className="text-blue-400 text-sm">
                  New verification code sent!
                </span>
              </div>
            )}

            {/* Verification Form - Only show if not verified */}
            {!isVerified && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Verification Code Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    maxLength="6"
                    className={`w-full px-4 py-4 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white text-center text-2xl tracking-wider font-mono transition-colors ${
                      errors.verificationCode
                        ? "border-red-500"
                        : "border-gray-600 focus:border-red-500"
                    }`}
                    placeholder="000000"
                    autoComplete="one-time-code"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || verificationCode.length !== 6}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-600 text-white py-3 px-4 rounded-lg transition-all font-medium disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin h-5 w-5" />
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    "Verify Email"
                  )}
                </button>
              </form>
            )}

            {/* Login Button - Only show if verified */}
            {isVerified && (
              <div className="space-y-4">
                <button
                  onClick={handleGoToLogin}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 px-4 rounded-lg transition-all font-medium transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="flex items-center justify-center gap-2">
                    <LogIn className="h-5 w-5" />
                    <span>Continue to Login</span>
                  </div>
                </button>
              </div>
            )}

            {/* Resend Code Section - Only show if not verified */}
            {!isVerified && (
              <div className="text-center space-y-3">
                <p className="text-gray-400 text-sm">
                  Didn't receive the code?
                </p>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendLoading || timeLeft > 0}
                  className="inline-flex items-center gap-2 text-red-400 hover:text-red-300 disabled:text-gray-500 transition-colors text-sm font-medium disabled:cursor-not-allowed"
                >
                  {resendLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {timeLeft > 0
                    ? `Resend in ${timeLeft}s`
                    : resendLoading
                    ? "Sending..."
                    : "Resend Code"}
                </button>
              </div>
            )}

            {/* Back to Login */}
            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors text-sm font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
