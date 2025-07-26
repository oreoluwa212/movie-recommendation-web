import React from 'react';
import {
  Heart,
  Eye,
  BookOpen,
  MessageSquare,
  Star,
  TrendingUp,
  Calendar,
  Award
} from 'lucide-react';

const ProfileStatistics = ({
  favorites = [],
  watchlists = [],
  watchedMovies = [],
  reviews = [],
  stats = {}
}) => {
  // Safe number formatting function with proper null/undefined checks
  const formatCount = (value) => {
    // Handle null, undefined, or non-numeric values
    if (value === null || value === undefined || value === '') {
      return '0';
    }

    // Convert to number if it's a string
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    // Check if it's a valid number
    if (isNaN(numValue) || !isFinite(numValue)) {
      return '0';
    }

    // Format the number
    if (numValue >= 1000000) {
      return (numValue / 1000000).toFixed(1) + 'M';
    } else if (numValue >= 1000) {
      return (numValue / 1000).toFixed(1) + 'K';
    } else {
      return Math.floor(numValue).toString();
    }
  };

  // Safe rating formatting
  const formatRating = (value) => {
    if (value === null || value === undefined || value === '') {
      return '0.0';
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue) || !isFinite(numValue)) {
      return '0.0';
    }

    return numValue.toFixed(1);
  };

  // Calculate stats safely with fallbacks
  const safeStats = {
    totalFavorites: Array.isArray(favorites) ? favorites.length : 0,
    totalWatched: Array.isArray(watchedMovies) ? watchedMovies.length : 0,
    totalWatchlists: Array.isArray(watchlists) ? watchlists.length : 0,
    totalReviews: Array.isArray(reviews) ? reviews.length : 0,
    averageRating: stats.averageRating || 0,
    averageReviewRating: stats.averageReviewRating || 0,
    ratedMovies: stats.ratedMovies || (Array.isArray(watchedMovies) ? watchedMovies.filter(m => m && m.rating).length : 0),
    publicWatchlists: stats.publicWatchlists || (Array.isArray(watchlists) ? watchlists.filter(w => w && w.isPublic).length : 0),
    ...stats // Spread any additional stats
  };

  // Statistics configuration
  const statisticsConfig = [
    {
      icon: Heart,
      label: 'Favorites',
      value: formatCount(safeStats.totalFavorites),
      color: 'text-red-400',
      bgColor: 'bg-red-400/10'
    },
    {
      icon: Eye,
      label: 'Watched',
      value: formatCount(safeStats.totalWatched),
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10'
    },
    {
      icon: BookOpen,
      label: 'Watchlists',
      value: formatCount(safeStats.totalWatchlists),
      color: 'text-green-400',
      bgColor: 'bg-green-400/10'
    },
    {
      icon: MessageSquare,
      label: 'Reviews',
      value: formatCount(safeStats.totalReviews),
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10'
    },
    {
      icon: Star,
      label: 'Avg Rating',
      value: formatRating(safeStats.averageRating),
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10'
    },
    {
      icon: Award,
      label: 'Rated Movies',
      value: formatCount(safeStats.ratedMovies),
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/10'
    }
  ];

  // Additional stats for expanded view
  const additionalStats = [
    {
      icon: TrendingUp,
      label: 'Review Rating',
      value: formatRating(safeStats.averageReviewRating),
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-400/10'
    },
    {
      icon: Calendar,
      label: 'Public Lists',
      value: formatCount(safeStats.publicWatchlists),
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10'
    }
  ];

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-6 text-white">Statistics</h2>

      {/* Main Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {statisticsConfig.map((stat, index) => {
          const IconComponent = stat.icon;

          return (
            <div
              key={`${stat.label}-${index}`}
              className={`${stat.bgColor} rounded-lg p-4 transition-all duration-200 hover:scale-105`}
            >
              <div className="flex items-center justify-between mb-2">
                <IconComponent className={`h-5 w-5 ${stat.color}`} />
                <span className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </span>
              </div>
              <p className="text-sm text-gray-400 font-medium">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Additional Statistics */}
      {(safeStats.totalReviews > 0 || safeStats.publicWatchlists > 0) && (
        <div className="border-t border-gray-700 pt-6">
          <h3 className="text-lg font-medium mb-4 text-gray-300">Additional Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {additionalStats.map((stat, index) => {
              const IconComponent = stat.icon;

              return (
                <div
                  key={`additional-${stat.label}-${index}`}
                  className={`${stat.bgColor} rounded-lg p-3 transition-all duration-200 hover:scale-105`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <IconComponent className={`h-4 w-4 ${stat.color}`} />
                    <span className={`text-lg font-semibold ${stat.color}`}>
                      {stat.value}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-medium">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Summary */}
      <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
        <div className="flex flex-wrap items-center justify-between text-sm text-gray-400">
          <span>
            Total Movies Tracked: <span className="text-white font-medium">
              {formatCount(safeStats.totalFavorites + safeStats.totalWatched)}
            </span>
          </span>
          {safeStats.totalReviews > 0 && (
            <span>
              Reviews Written: <span className="text-white font-medium">
                {formatCount(safeStats.totalReviews)}
              </span>
            </span>
          )}
          {safeStats.averageRating > 0 && (
            <span>
              Average Rating: <span className="text-yellow-400 font-medium">
                {formatRating(safeStats.averageRating)}/10
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Debug Information (only in development) */}
      {import.meta.env.NODE_ENV === 'development' && (
        <details className="mt-4">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
            Debug Stats Data
          </summary>
          <pre className="mt-2 text-xs text-gray-500 bg-gray-900 p-2 rounded overflow-auto max-h-32">
            {JSON.stringify({
              receivedStats: stats,
              calculatedStats: safeStats,
              arrayLengths: {
                favorites: Array.isArray(favorites) ? favorites.length : 'not array',
                watchedMovies: Array.isArray(watchedMovies) ? watchedMovies.length : 'not array',
                watchlists: Array.isArray(watchlists) ? watchlists.length : 'not array',
                reviews: Array.isArray(reviews) ? reviews.length : 'not array'
              }
            }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};

export default ProfileStatistics;