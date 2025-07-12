// components/ui/MobileUserMenu.js
import React from "react";
import {
  Heart,
  Eye,
  BookOpen,
  Star,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import NavLink from "./NavLink";

const MobileUserMenu = ({
  user,
  userLinks,
  onLogout,
  onMenuClose,
  isActive,
}) => {
  const handleLogout = async () => {
    onMenuClose();
    await onLogout();
  };

  return (
    <div className="border-t border-gray-800 pt-4">
      {/* User Info */}
      <div className="flex items-center space-x-3 px-4 py-3 bg-gray-800 rounded-lg mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.username}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User className="w-5 h-5 text-white" />
          )}
        </div>
        <div>
          <h3 className="font-semibold text-white">{user.username}</h3>
          <p className="text-sm text-gray-400">{user.email}</p>
        </div>
      </div>

      {/* User Links */}
      <div className="space-y-2">
        {userLinks.map(({ path, label, icon, count }) => (
          <NavLink
            key={path}
            to={path}
            icon={icon}
            label={label}
            count={count}
            isActive={isActive(path)}
            onClick={onMenuClose}
            className="px-4 py-3 rounded-lg w-full justify-start"
          />
        ))}
      </div>

      {/* Actions */}
      <div className="border-t border-gray-800 mt-4 pt-4 space-y-2">
        <button className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors w-full">
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default MobileUserMenu;
