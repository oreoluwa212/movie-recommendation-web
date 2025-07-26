// pages/auth/Register.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail } from "lucide-react";
import { toast } from "react-toastify";
import { useAuthStore } from "../../stores/authStore";

// Import reusable components
import { AuthContainer } from "../../components/auth/AuthContainer";
import { AuthCard } from "../../components/auth/AuthCard";
import { AuthHeader } from "../../components/auth/AuthHeader";
import { SocialLoginButton } from "../../components/auth/SocialLoginButton";
import { GoogleIcon } from "../../components/auth/GoogleIcon";
import { FormDivider } from "../../components/auth/FormDivider";
import { FormField } from "../../components/auth/FormField";
import { PasswordField } from "../../components/auth/PasswordField";
import { SubmitButton } from "../../components/auth/SubmitButton";
import { AuthLink } from "../../components/auth/AuthLink";

// Import hooks and utils
import { useAuthForm } from "../../hooks/useAuthForm";
import { validateForm } from "../../utils/validation";

const Register = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, isLoading, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const {
    formData,
    errors,
    handleInputChange,
    setErrors
  } = useAuthForm({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateForm(formData, ['username', 'email', 'password', 'confirmPassword']);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await register(
        formData.username,
        formData.email,
        formData.password
      );
      if (result.success) {
        setTimeout(() => {
          navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
        }, 1500);
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = (provider) => {
    toast.info(`${provider} registration integration coming soon!`);
  };

  return (
    <AuthContainer>
      <AuthCard>
        <AuthHeader 
          title="Create Account" 
          subtitle="Join StreamVibe today" 
        />

        <div className="p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <SocialLoginButton
                provider="Google"
                onClick={handleSocialLogin}
                icon={GoogleIcon}
                className="py-2.5 rounded-lg"
              />
              <FormDivider />
            </div>

            <FormField
              label="Username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleInputChange}
              autoComplete="username"
              placeholder="Enter your username"
              icon={User}
              error={errors.username}
            />

            <FormField
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              autoComplete="email"
              placeholder="Enter your email"
              icon={Mail}
              error={errors.email}
            />

            <PasswordField
              label="Password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              autoComplete="new-password"
              placeholder="Enter your password"
              error={errors.password}
            />

            <PasswordField
              label="Confirm Password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              autoComplete="new-password"
              placeholder="Confirm your password"
              error={errors.confirmPassword}
            />

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                required
                className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 focus:ring-offset-0 border-gray-400 rounded bg-gray-700"
              />
              <label
                htmlFor="terms"
                className="text-sm text-gray-300 leading-relaxed"
              >
                I agree to the{" "}
                <Link
                  to="/terms"
                  className="text-red-400 hover:text-red-300 underline transition-colors"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  className="text-red-400 hover:text-red-300 underline transition-colors"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>

            <SubmitButton
              isLoading={isSubmitting || isLoading}
              loadingText="Creating Account..."
              className="rounded-lg focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              Create Account
            </SubmitButton>
          </form>

          <div className="text-center pt-4 border-t border-gray-700">
            <p className="text-gray-400">
              Already have an account?{" "}
              <AuthLink to="/login">Sign In</AuthLink>
            </p>
          </div>
        </div>
      </AuthCard>
    </AuthContainer>
  );
};

export default Register;