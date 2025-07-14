// components/MovieListItem.jsx
import React from "react";
import { Star, Eye, Clock, Trash2 } from "lucide-react";
import Button from "./ui/Button";
import WatchlistButton from "./WatchlistButton";

const MovieListItem = ({
  movie,
  activeTab,
  onMovieClick,
  onRemoveFromList,
  onMarkAsWatched,
  onWatchlistSuccess,
}) => {
  const getImageUrl = () => {
    const posterPath = movie.poster || movie.poster_path;
    return posterPath
      ? `https://image.tmdb.org/t/p/w200${posterPath}`
      : "https://via.placeholder.com/100x150/1f2937/9ca3af?text=No+Image";
  };

  const getYear = () => {
    const releaseDate = movie.releaseDate || movie.release_date;
    return releaseDate ? new Date(releaseDate).getFullYear() : "N/A";
  };

  const getDateAdded = () => {
    const dateAdded = movie.watchedAt || movie.addedAt || movie.dateAdded;
    return dateAdded
      ? new Date(dateAdded).toLocaleDateString()
      : "Unknown date";
  };

  const movieData = {
    ...movie,
    id: movie.movieId || movie.id,
    poster_path: movie.poster || movie.poster_path,
    release_date: movie.releaseDate || movie.release_date,
  };

  return (
    <div className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors">
      <img
        src={getImageUrl()}
        alt={movie.title}
        className="w-16 h-24 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => onMovieClick(movie)}
      />

      <div className="flex-1 min-w-0">
        <h3
          className="font-semibold hover:text-red-400 cursor-pointer transition-colors truncate"
          onClick={() => onMovieClick(movie)}
        >
          {movie.title}
        </h3>
        <p className="text-sm text-gray-400">{getYear()}</p>

        {movie.rating && (
          <div className="flex items-center space-x-1 mt-1">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm">{movie.rating.toFixed(1)}</span>
          </div>
        )}

        <p className="text-xs text-gray-500 mt-1">
          {activeTab === "watched" ? "Watched" : "Added"} {getDateAdded()}
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="small"
          onClick={() => onMovieClick(movie)}
          title="View Details"
        >
          <Eye className="h-4 w-4" />
        </Button>

        <WatchlistButton
          movie={movieData}
          variant="ghost"
          size="small"
          showIcon={true}
          onSuccess={onWatchlistSuccess}
          className="text-blue-400 hover:text-blue-300"
        />

        {activeTab === "watchlist" && (
          <Button
            variant="ghost"
            size="small"
            onClick={() => onMarkAsWatched(movie)}
            title="Mark as Watched"
            className="text-green-400 hover:text-green-300"
          >
            <Clock className="h-4 w-4" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="small"
          onClick={() => onRemoveFromList(movie, activeTab)}
          title="Remove"
          className="text-red-400 hover:text-red-300"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default MovieListItem;
