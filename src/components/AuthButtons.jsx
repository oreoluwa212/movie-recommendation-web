// components/AuthButtons.js
import React from "react";
import { User, LogIn, UserPlus } from "lucide-react";
import Button from "./ui/Button";
import { useAuthStore } from "../stores/authStore";

const AuthButtons = ({
  size = "medium",
  variant = "primary",
  layout = "horizontal",
  showIcons = true,
  className = "",
}) => {
  const { setCurrentView } = useAuthStore();

  const handleSignUp = () => setCurrentView("register");
  const handleSignIn = () => setCurrentView("login");

  const containerClass =
    layout === "vertical"
      ? "flex flex-col space-y-2"
      : "flex flex-col sm:flex-row gap-2 sm:gap-4";

  return (
    <div className={`${containerClass} ${className}`}>
      <Button
        onClick={handleSignUp}
        variant={variant}
        size={size}
        leftIcon={showIcons ? <UserPlus className="h-4 w-4" /> : null}
      >
        Sign Up Free
      </Button>
      <Button
        onClick={handleSignIn}
        variant="outline"
        size={size}
        leftIcon={showIcons ? <LogIn className="h-4 w-4" /> : null}
      >
        Sign In
      </Button>
    </div>
  );
};

export default AuthButtons;
