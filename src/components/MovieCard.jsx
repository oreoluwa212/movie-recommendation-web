import React, { useState } from "react";
import { Star, Play, Heart, Eye, Plus, Calendar } from "lucide-react";

// Movie Card Skeleton
const MovieCardSkeleton = ({ size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-40',
    medium: 'w-48',
    large: 'w-56'
  };

  const posterSizeClasses = {
    small: 'h-56',
    medium: 'h-64',
    large: 'h-72'
  };

  return (
    <div className={`${sizeClasses[size]} flex-shrink-0`}>
      {/* Poster skeleton */}
      <div className={`animate-pulse ${posterSizeClasses[size]} bg-gray-800 rounded-lg mb-2`} />
      
      {/* Title skeleton */}
      <div className="animate-pulse h-4 bg-gray-700 rounded w-4/5 mb-2" />
      
      {/* Rating and year skeleton */}
      <div className="flex items-center justify-between">
        <div className="animate-pulse h-3 bg-gray-700 rounded w-12" />
        <div className="animate-pulse h-3 bg-gray-700 rounded w-10" />
      </div>
    </div>
  );
};

const MovieCard = ({
  movie,
  size = "medium",
  showActions = true,
  isAuthenticated = true,
  onMovieClick,
  isLoading = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Show skeleton while loading
  if (isLoading) {
    return <MovieCardSkeleton size={size} />;
  }

  // Return null if no movie data
  if (!movie) {
    return null;
  }

  // Handle both API response formats (poster vs poster_path)
  const imageUrl =
    movie.poster || movie.poster_path
      ? movie.poster || `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : "https://via.placeholder.com/400x600/1f2937/9ca3af?text=No+Image";

  const sizeClasses = {
    small: "w-40",
    medium: "w-48",
    large: "w-56",
  };

  const posterSizeClasses = {
    small: "h-56",
    medium: "h-64",
    large: "h-72",
  };

  const handleAddToFavorites = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Add to favorites:", movie.title);
  };

  const handleAddToWatchlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Add to watchlist:", movie.title);
  };

  const handleMarkAsWatched = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Mark as watched:", movie.title);
  };

  const handleMovieClick = () => {
    if (onMovieClick) {
      onMovieClick(movie);
    }
  };

  // Handle different date formats
  const getReleaseYear = () => {
    const date = movie.releaseDate || movie.release_date;
    if (!date) return null;
    return new Date(date).getFullYear();
  };

  // Handle different rating formats
  const getRating = () => {
    const rating = movie.rating || movie.vote_average;
    return rating ? rating.toFixed(1) : null;
  };

  return (
    <div
      className={`relative ${sizeClasses[size]} group cursor-pointer transition-all duration-300 hover:scale-105`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleMovieClick}
    >
      {/* Movie Poster */}
      <div
        className={`relative ${posterSizeClasses[size]} overflow-hidden rounded-lg bg-gray-800 shadow-lg`}
      >
        <img
          src={imageUrl}
          alt={movie.title}
          className={`w-full h-full object-cover transition-all duration-300 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/400x600/1f2937/9ca3af?text=No+Image";
            setImageLoaded(true);
          }}
        />

        {/* Loading placeholder */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Play Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-red-600 rounded-full p-3 transform transition-all duration-300 hover:bg-red-700 hover:scale-110">
              <Play className="h-6 w-6 text-white fill-current" />
            </div>
          </div>

          {/* Movie Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/70 to-transparent">
            <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2 leading-tight">
              {movie.title}
            </h3>

            <div className="flex items-center justify-between text-xs text-gray-300">
              <div className="flex items-center space-x-3">
                {getRating() && (
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    <span>{getRating()}</span>
                  </div>
                )}
                {getReleaseYear() && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{getReleaseYear()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {showActions && isAuthenticated && (
            <div className="absolute top-2 right-2 flex flex-col space-y-1">
              <button
                onClick={handleAddToFavorites}
                className="bg-black/70 p-2 rounded-full hover:bg-red-600 transition-colors backdrop-blur-sm"
                title="Add to Favorites"
              >
                <Heart className="h-4 w-4 text-white" />
              </button>
              <button
                onClick={handleAddToWatchlist}
                className="bg-black/70 p-2 rounded-full hover:bg-blue-600 transition-colors backdrop-blur-sm"
                title="Add to Watchlist"
              >
                <Plus className="h-4 w-4 text-white" />
              </button>
              <button
                onClick={handleMarkAsWatched}
                className="bg-black/70 p-2 rounded-full hover:bg-green-600 transition-colors backdrop-blur-sm"
                title="Mark as Watched"
              >
                <Eye className="h-4 w-4 text-white" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Movie Title and Info (shown below poster) */}
      <div className="mt-2 px-1">
        <h3 className="text-white font-medium text-sm line-clamp-1 leading-tight mb-1">
          {movie.title}
        </h3>
        <div className="flex items-center justify-between text-xs text-gray-400">
          {getRating() && (
            <div className="flex items-center space-x-1">
              <Star className="h-3 w-3 text-yellow-400 fill-current" />
              <span>{getRating()}</span>
            </div>
          )}
          {getReleaseYear() && <span>{getReleaseYear()}</span>}
        </div>
      </div>
    </div>
  );
};

export default MovieCard;