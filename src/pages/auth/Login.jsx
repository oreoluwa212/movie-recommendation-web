// pages/auth/Login.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Mail } from "lucide-react";
import { useAuthStore } from "../../stores/authStore";

// Import reusable components
import { AuthContainer } from "../../components/auth/AuthContainer";
import { AuthCard } from "../../components/auth/AuthCard";
import { AuthHeader } from "../../components/auth/AuthHeader";
import { DemoCredentials } from "../../components/auth/DemoCredentials";
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

const Login = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isLoading, error: authError, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const {
    formData,
    errors,
    handleInputChange,
    setErrors,
  } = useAuthForm({
    email: "",
    password: ""
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  // Handle auth errors with toast
  useEffect(() => {
    if (authError) {
      toast.error(authError, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  }, [authError]);

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateForm(formData, ['email', 'password']);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
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
          navigate("/");
        }, 1000);
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed. Please try again.", {
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

  const handleSocialLogin = (provider) => {
    toast.info(`${provider} authentication will be available soon!`, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  return (
    <AuthContainer>
      <AuthCard>
        <AuthHeader 
          title="Welcome Back" 
          subtitle="Sign in to your account" 
        />

        <div className="p-6 space-y-6">
          <DemoCredentials />

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <SocialLoginButton
                provider="Google"
                onClick={handleSocialLogin}
                icon={GoogleIcon}
              />
              <FormDivider />
            </div>

            <FormField
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              autoComplete="username"
              placeholder="Enter your email address"
              icon={Mail}
              error={errors.email}
            />

            <PasswordField
              label="Password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              autoComplete="current-password"
              placeholder="Enter your password"
              error={errors.password}
            />

            <div className="text-right">
              <button
                type="button"
                className="text-sm text-red-400 hover:text-red-300 transition-colors font-medium hover:underline"
              >
                Forgot your password?
              </button>
            </div>

            <SubmitButton
              isLoading={isSubmitting || isLoading}
              loadingText="Signing In..."
            >
              Sign In
            </SubmitButton>
          </form>

          <div className="text-center pt-4 border-t border-gray-700">
            <p className="text-gray-400">
              Don't have an account?{" "}
              <AuthLink to="/register">Sign Up</AuthLink>
            </p>
          </div>
        </div>
      </AuthCard>
    </AuthContainer>
  );
};

export default Login;