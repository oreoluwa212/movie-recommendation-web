import React from 'react';
import { Mail, Lock } from 'lucide-react';

export const DemoCredentials = ({ email = "demo@example.com", password = "password" }) => {
  return (
    <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
        <p className="text-blue-300 text-sm font-semibold">Demo Credentials</p>
      </div>
      <div className="space-y-1">
        <p className="text-blue-200 text-xs flex items-center gap-2">
          <Mail className="h-3 w-3" />
          Email: {email}
        </p>
        <p className="text-blue-200 text-xs flex items-center gap-2">
          <Lock className="h-3 w-3" />
          Password: {password}
        </p>
      </div>
    </div>
  );
};