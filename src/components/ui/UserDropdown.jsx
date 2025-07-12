// components/ui/UserDropdown.js
import React from 'react';
import { Link } from 'react-router-dom';
import { User } from 'lucide-react';

const UserDropdown = ({ user, onLogout }) => {
  return (
    <div className="relative group">
      <button className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors">
        <User className="h-4 w-4" />
        <span className="hidden lg:inline">
          {user?.username || "User"}
        </span>
      </button>
      <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-lg border border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
        <Link
          to="/profile"
          className="block px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white first:rounded-t-lg"
        >
          Profile
        </Link>
        <button
          onClick={onLogout}
          className="block w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white last:rounded-b-lg"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default UserDropdown;