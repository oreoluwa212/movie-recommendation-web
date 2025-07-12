// components/ui/UserProfile.js
import React, { useState, useEffect } from 'react';
import { User, Settings, LogOut, Mail, Star, Heart, Eye, BookOpen } from 'lucide-react';
import { useUserStore } from '../../stores/userStore';

const UserProfile = ({ user, onLogout, showStats = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { loadMinimalProfile, favorites, watchedMovies, watchlists, reviews } = useUserStore();

  useEffect(() => {
    if (user && !user.stats) {
      loadMinimalProfile();
    }
  }, [user, loadMinimalProfile]);

  const handleLogout = async () => {
    setIsOpen(false);
    await onLogout();
  };

  if (!user) return null;

  const stats = {
    favorites: favorites.length,
    watched: watchedMovies.length,
    watchlists: watchlists.length,
    reviews: reviews.length
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-800 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.username} 
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User className="w-4 h-4 text-white" />
          )}
        </div>
        <span className="hidden md:block font-medium">{user.username}</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-xl z-50 border border-gray-700">
            {/* User Info */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.username} 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{user.username}</h3>
                  <p className="text-sm text-gray-400">{user.email}</p>
                  {!user.isEmailVerified && (
                    <div className="flex items-center space-x-1 text-xs text-yellow-400 mt-1">
                      <Mail className="w-3 h-3" />
                      <span>Email not verified</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            {showStats && (
              <div className="p-4 border-b border-gray-700">
                <h4 className="text-sm font-medium text-gray-400 mb-3">Your Activity</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className="text-sm">{stats.favorites} Favorites</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">{stats.watched} Watched</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-green-500" />
                    <span className="text-sm">{stats.watchlists} Lists</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm">{stats.reviews} Reviews</span>
                  </div>
                </div>
              </div>
            )}

            {/* Menu Items */}
            <div className="p-2">
              <button className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-700 rounded-lg transition-colors">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-700 rounded-lg transition-colors text-red-400"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserProfile;