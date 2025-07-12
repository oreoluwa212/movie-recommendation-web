// components/ui/UserNavigation.js
import React, { useEffect } from 'react';
import { Heart, Eye, BookOpen, Star, User } from 'lucide-react';
import { useUserStore } from '../../stores/userStore';
import NavLink from './NavLink';
import UserProfile from './UserProfile';

const UserNavigation = ({ user, onLogout, isActive, className = "" }) => {
  const { 
    favorites, 
    watchedMovies, 
    watchlists, 
    reviews, 
    loadMinimalProfile,
    syncWithServer,
    isLoading
  } = useUserStore();

  useEffect(() => {
    if (user && !isLoading) {
      // Load minimal profile data for navbar
      loadMinimalProfile().catch(console.error);
      
      // Sync with server to get latest counts
      syncWithServer().catch(console.error);
    }
  }, [user, loadMinimalProfile, syncWithServer, isLoading]);

  if (!user) return null;

  const userLinks = [
    {
      path: "/favorites",
      label: "Favorites",
      icon: Heart,
      count: favorites.length,
    },
    {
      path: "/watched",
      label: "Watched",
      icon: Eye,
      count: watchedMovies.length,
    },
    {
      path: "/watchlists",
      label: "Watchlists",
      icon: BookOpen,
      count: watchlists.length,
    },
    {
      path: "/reviews",
      label: "Reviews",
      icon: Star,
      count: reviews.length,
    },
  ];

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {/* User Navigation Links */}
      {userLinks.map(({ path, label, icon, count }) => (
        <NavLink
          key={path}
          to={path}
          icon={icon}
          label={label}
          count={count}
          isActive={isActive(path)}
          className="px-3 py-2 rounded-lg hidden lg:flex"
        />
      ))}
      
      {/* User Profile Dropdown */}
      <UserProfile user={user} onLogout={onLogout} />
    </div>
  );
};

export default UserNavigation;