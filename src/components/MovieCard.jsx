import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Play, Heart, Eye, BookmarkPlus, Calendar, Check } from "lucide-react";
import { toast } from 'react-toastify';
import { useUserStore } from "../stores/userStore";

// Movie Card Skeleton
const MovieCardSkeleton = ({ size = "medium" }) => {
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

  return (
    <div className={`${sizeClasses[size]} flex-shrink-0`}>
      <div className={`animate-pulse ${posterSizeClasses[size]} bg-gray-800 rounded-lg mb-2`} />
      <div className="animate-pulse h-4 bg-gray-700 rounded w-4/5 mb-2" />
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
  const navigate = useNavigate();

  const {
    addToFavorites,
    removeFromFavorites,
    addToWatched,
    removeFromWatched,
    isFavorite,
    isWatched,
    getWatchedRating,
    watchlists,
    addMovieToWatchlist,
    isLoading: userStoreLoading
  } = useUserStore();

  if (isLoading) {
    return <MovieCardSkeleton size={size} />;
  }

  if (!movie) {
    return null;
  }

  const imageUrl = movie.poster || movie.poster_path
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

  const movieIsFavorite = isFavorite(movie.id);
  const movieIsWatched = isWatched(movie.id);
  const userRating = getWatchedRating(movie.id);

  const handleAddToFavorites = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (movieIsFavorite) {
        await removeFromFavorites(movie.id);
        toast.success(`${movie.title} removed from favorites`);
      } else {
        await addToFavorites(movie);
      }
    } catch (error) {
      toast.error('Failed to update favorites');
      console.error('Error updating favorites:', error);
    }
  };

  const handleAddToWatchlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (watchlists.length > 0) {
        const firstWatchlist = watchlists[0];
        await addMovieToWatchlist(firstWatchlist.id, movie);
        toast.success(`${movie.title} added to watchlist`);
      } else {
        toast.info('Please create a watchlist first');
      }
    } catch (error) {
      toast.error('Failed to add to watchlist');
      console.error('Error adding to watchlist:', error);
    }
  };

  const handleMarkAsWatched = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (movieIsWatched) {
        await removeFromWatched(movie.id);
        toast.success(`${movie.title} removed from watched`);
      } else {
        await addToWatched(movie);
      }
    } catch (error) {
      toast.error('Failed to update watched status');
      console.error('Error updating watched status:', error);
    }
  };

  const handleMovieClick = (e) => {
    e.preventDefault();
    if (onMovieClick) {
      onMovieClick(movie);
    } else {
      navigate(`/movie/${movie.id}`);
    }
  };

  const getReleaseYear = () => {
    const date = movie.releaseDate || movie.release_date;
    if (!date) return null;
    return new Date(date).getFullYear();
  };

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
      <div className={`relative ${posterSizeClasses[size]} overflow-hidden rounded-lg bg-gray-800 shadow-lg`}>
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

        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        <div className="absolute top-2 left-2 flex flex-col space-y-1">
          {movieIsFavorite && (
            <div className="bg-red-600 rounded-full p-1" title="In Favorites">
              <Heart className="h-3 w-3 text-white fill-current" />
            </div>
          )}
          {movieIsWatched && (
            <div className="bg-green-600 rounded-full p-1" title="Watched">
              <Check className="h-3 w-3 text-white" />
            </div>
          )}
        </div>

        <div className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-red-600 rounded-full p-3 transform transition-all duration-300 hover:bg-red-700 hover:scale-110">
              <Play className="h-6 w-6 text-white fill-current" />
            </div>
          </div>

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
                {userRating && (
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 text-blue-400 fill-current" />
                    <span>{userRating}</span>
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

          {showActions && isAuthenticated && (
            <div className="absolute top-2 right-2 flex flex-col space-y-1">
              <button
                onClick={handleAddToFavorites}
                disabled={userStoreLoading}
                className={`p-2 rounded-full transition-all backdrop-blur-sm ${
                  movieIsFavorite
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-black/70 hover:bg-red-600"
                } ${userStoreLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                title={movieIsFavorite ? "Remove from Favorites" : "Add to Favorites"}
              >
                <Heart className={`h-4 w-4 text-white ${movieIsFavorite ? "fill-current" : ""}`} />
              </button>
              
              <button
                onClick={handleAddToWatchlist}
                disabled={userStoreLoading || watchlists.length === 0}
                className={`p-2 rounded-full transition-all backdrop-blur-sm ${
                  watchlists.length === 0
                    ? "bg-black/50 cursor-not-allowed"
                    : "bg-black/70 hover:bg-blue-600"
                } ${userStoreLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                title={watchlists.length === 0 ? "Create a watchlist first" : "Add to Watchlist"}
              >
                <BookmarkPlus className="h-4 w-4 text-white" />
              </button>
              
              <button
                onClick={handleMarkAsWatched}
                disabled={userStoreLoading}
                className={`p-2 rounded-full transition-all backdrop-blur-sm ${
                  movieIsWatched
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-black/70 hover:bg-green-600"
                } ${userStoreLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                title={movieIsWatched ? "Remove from Watched" : "Mark as Watched"}
              >
                <Eye className={`h-4 w-4 text-white ${movieIsWatched ? "fill-current" : ""}`} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 px-1">
        <h3 className="text-white font-medium text-sm line-clamp-1 leading-tight mb-1">
          {movie.title}
        </h3>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-2">
            {getRating() && (
              <div className="flex items-center space-x-1">
                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                <span>{getRating()}</span>
              </div>
            )}
            {userRating && (
              <div className="flex items-center space-x-1">
                <Star className="h-3 w-3 text-blue-400 fill-current" />
                <span>{userRating}</span>
              </div>
            )}
          </div>
          {getReleaseYear() && <span>{getReleaseYear()}</span>}
        </div>
      </div>
    </div>
  );
};

export default MovieCard;