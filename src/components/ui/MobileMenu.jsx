// components/ui/MobileMenu.js
import React from 'react';
import { User } from 'lucide-react';
import NavLink from './NavLink';
import SearchBar from './SearchBar';
import AuthButtons from './AuthButtons';

const MobileMenu = ({ 
  isOpen, 
  searchQuery, 
  onSearchChange, 
  onSearchSubmit, 
  onSearchClear,
  navLinks,
  userLinks,
  isAuthenticated,
  onMenuClose,
  onAuthModalOpen,
  onLogout,
  isActive
}) => {
  if (!isOpen) return null;

  return (
    <div className="xl:hidden py-4 border-t border-gray-800">
      {/* Mobile Search */}
      <SearchBar
        value={searchQuery}
        onChange={onSearchChange}
        onSubmit={onSearchSubmit}
        onClear={onSearchClear}
        placeholder="Search movies, actors, directors..."
        className="mb-4"
      />

      {/* Mobile Navigation Links */}
      <div className="space-y-2">
        {navLinks.map(({ path, label, icon }) => (
          <NavLink
            key={path}
            to={path}
            icon={icon}
            label={label}
            isActive={isActive(path)}
            onClick={onMenuClose}
          />
        ))}

        {isAuthenticated ? (
          <>
            {userLinks.map(({ path, label, icon, count }) => (
              <NavLink
                key={path}
                to={path}
                icon={icon}
                label={label}
                count={count}
                isActive={isActive(path)}
                onClick={onMenuClose}
                className="relative"
              />
            ))}
            <NavLink
              to="/profile"
              icon={User}
              label="Profile"
              isActive={isActive('/profile')}
              onClick={onMenuClose}
            />
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors w-full text-left"
            >
              <User className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <div className="space-y-2 pt-4 border-t border-gray-700">
            <button
              onClick={() => onAuthModalOpen("login")}
              className="block w-full text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => onAuthModalOpen("register")}
              className="block w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-center"
            >
              Sign Up
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileMenu;