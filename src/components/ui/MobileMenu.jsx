// components/ui/MobileMenu.js
import React from "react";
import { Search, Heart, Eye, BookOpen, Star, User, LogOut } from "lucide-react";
import NavLink from "./NavLink";
import SearchBar from "./SearchBar";
import LoadingSpinner from "../LoadingSpinner";

const iconMap = {
  Heart,
  Eye,
  BookOpen,
  Star,
  User,
  LogOut,
};

const MobileMenu = ({
  isOpen,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onSearchClear,
  navLinks,
  userLinks,
  user,
  isAuthenticated,
  onMenuClose,
  onAuthModalOpen,
  onLogout,
  isActive,
  loading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="xl:hidden mt-4 border-t border-gray-800 pt-4">
      {/* Mobile Search */}
      <div className="mb-4">
        <SearchBar
          value={searchQuery}
          onChange={onSearchChange}
          onSubmit={onSearchSubmit}
          onClear={onSearchClear}
          placeholder="Search movies..."
          className="w-full"
        />
      </div>

      {/* Mobile Navigation Links */}
      <div className="space-y-2 mb-4">
        {navLinks.map(({ path, label, icon }) => (
          <NavLink
            key={path}
            to={path}
            icon={icon}
            label={label}
            isActive={isActive(path)}
            onClick={onMenuClose}
            className="block px-3 py-2 rounded-lg text-base w-full"
          />
        ))}
      </div>

      {/* Mobile User Section */}
      {isAuthenticated ? (
        <div className="border-t border-gray-800 pt-4">
          {/* Loading indicator */}
          {loading && (
            <div className="flex items-center justify-center py-2 mb-4">
              <LoadingSpinner size="sm" className="text-red-500" />
              <span className="ml-2 text-sm text-gray-400">Loading...</span>
            </div>
          )}

          {/* User Info */}
          {user && (
            <div className="flex items-center space-x-3 mb-4 px-3 py-2 bg-gray-800/50 rounded-lg">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {user.username || user.email}
                </p>
                <p className="text-xs text-gray-400">
                  {user.email && user.username ? user.email : "Member"}
                </p>
              </div>
            </div>
          )}

          {/* User Links */}
          <div className="space-y-2 mb-4">
            {userLinks.map(({ path, label, icon, count }) => {
              const IconComponent = iconMap[icon];
              return (
                <NavLink
                  key={path}
                  to={path}
                  icon={IconComponent}
                  label={
                    <div className="flex items-center justify-between w-full">
                      <span>{label}</span>
                      {count > 0 && (
                        <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                          {count}
                        </span>
                      )}
                    </div>
                  }
                  isActive={isActive(path)}
                  onClick={onMenuClose}
                  className="block px-3 py-2 rounded-lg text-base w-full"
                />
              );
            })}
          </div>

          {/* Profile and Logout */}
          <div className="space-y-2 border-t border-gray-800 pt-4">
            <NavLink
              to="/profile"
              icon={User}
              label="Profile"
              isActive={isActive("/profile")}
              onClick={onMenuClose}
              className="block px-3 py-2 rounded-lg text-base w-full"
            />
            <button
              onClick={onLogout}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-base w-full text-red-400 hover:bg-red-600/10 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      ) : (
        // Mobile Auth Buttons
        <div className="border-t border-gray-800 pt-4">
          <div className="space-y-3">
            <button
              onClick={() => onAuthModalOpen("login")}
              className="w-full px-4 py-3 text-white hover:text-red-400 transition-colors duration-200 font-medium text-left border border-gray-700 rounded-lg hover:border-red-600"
            >
              Login
            </button>
            <button
              onClick={() => onAuthModalOpen("register")}
              className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium shadow-md hover:shadow-lg"
            >
              Sign Up
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileMenu;
