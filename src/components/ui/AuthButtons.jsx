// components/ui/AuthButtons.js
import React from "react";
import Button from "./Button";

const AuthButtons = ({ onLogin, onRegister, className = "" }) => {
  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      <Button variant="ghost" onClick={onLogin} className="px-4 py-2">
        Login
      </Button>
      <Button variant="primary" onClick={onRegister} className="px-4 py-2">
        Sign Up
      </Button>
    </div>
  );
};

export default AuthButtons;
