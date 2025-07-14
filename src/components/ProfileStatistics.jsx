import React, { memo, useMemo } from "react";
import { Heart, BookOpen, Eye, Star, TrendingUp } from "lucide-react";

const ProfileStatistics = memo(({ 
  favorites = [], 
  watchlists = [], 
  watchedMovies = [], 
  reviews = [],
  stats = {},
  showTrends = false,
  className = ""
}) => {
  // Memoize statistics - prioritize backend stats over calculated ones
  const calculatedStats = useMemo(() => {
    // Use backend stats if available, otherwise calculate from arrays
    const ratedMovies = watchedMovies.filter(movie => movie.rating && movie.rating > 0);
    const averageRating = stats.averageRating !== undefined 
      ? stats.averageRating.toFixed(1)
      : ratedMovies.length > 0
        ? (ratedMovies.reduce((sum, movie) => sum + movie.rating, 0) / ratedMovies.length).toFixed(1)
        : "0";

    const publicWatchlists = watchlists.filter(w => w.isPublic).length;
    
    const averageReviewRating = stats.averageReviewRating !== undefined
      ? stats.averageReviewRating.toFixed(1)
      : reviews.length > 0
        ? (reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length).toFixed(1)
        : "0";

    return {
      // Prioritize backend stats over array lengths
      totalFavorites: stats.totalFavorites ?? favorites.length,
      totalWatchlists: stats.totalWatchlists ?? watchlists.length,
      totalWatched: stats.totalWatched ?? watchedMovies.length,
      totalReviews: stats.totalReviews ?? reviews.length,
      averageRating,
      publicWatchlists: stats.publicWatchlists ?? publicWatchlists,
      averageReviewRating,
      ratedMovies: stats.ratedMovies ?? ratedMovies.length
    };
  }, [favorites, watchlists, watchedMovies, reviews, stats]);

  // Memoize statistics data to prevent recreation on every render
  const statisticsData = useMemo(() => [
    {
      icon: Heart,
      count: calculatedStats.totalFavorites,
      label: "Favorites",
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      hoverColor: "hover:bg-red-500/20",
      subText: calculatedStats.totalFavorites === 1 ? "movie" : "movies"
    },
    {
      icon: Eye,
      count: calculatedStats.totalWatched,
      label: "Watched",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      hoverColor: "hover:bg-green-500/20",
      subText: calculatedStats.averageRating !== "0" ? `${calculatedStats.averageRating}★ avg` : "No ratings"
    },
    {
      icon: Star,
      count: calculatedStats.totalReviews,
      label: "Reviews",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      hoverColor: "hover:bg-yellow-500/20",
      subText: calculatedStats.averageReviewRating !== "0" ? `${calculatedStats.averageReviewRating}★ avg` : "No reviews"
    },
  ], [calculatedStats]);

  // Format large numbers for better readability
  const formatCount = (count) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8 ${className}`}>
      {statisticsData.map((stat, index) => (
        <div
          key={`${stat.label}-${index}`}
          className={`
            relative overflow-hidden rounded-lg p-4 md:p-6 text-center 
            transition-all duration-300 ease-in-out
            bg-gray-800 hover:bg-gray-750 
            ${stat.bgColor} ${stat.hoverColor}
            hover:scale-105 hover:shadow-lg
            border border-gray-700/50 hover:border-gray-600
          `}
        >
          {/* Background decoration */}
          <div className={`absolute top-0 right-0 w-16 h-16 ${stat.color} opacity-5 transform rotate-12 translate-x-4 -translate-y-4`}>
            <stat.icon className="w-full h-full" />
          </div>

          {/* Main content */}
          <div className="relative z-10">
            <stat.icon
              className={`h-6 md:h-8 w-6 md:w-8 ${stat.color} mx-auto mb-2 transition-transform duration-300 hover:scale-110`}
            />
            <h3 className="text-xl md:text-2xl font-bold text-white mb-1">
              {formatCount(stat.count)}
            </h3>
            <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
            {stat.subText && (
              <p className="text-xs text-gray-500">{stat.subText}</p>
            )}
          </div>

          {/* Trend indicator (optional) */}
          {showTrends && (
            <div className="absolute top-2 right-2">
              <TrendingUp className="h-3 w-3 text-green-400 opacity-60" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

ProfileStatistics.displayName = "ProfileStatistics";

export default ProfileStatistics;