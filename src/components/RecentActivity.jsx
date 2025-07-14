// components/RecentActivity.jsx
import React from "react";

const RecentActivity = ({ favorites, watchedMovies, onMovieClick }) => {
  const getRecentActivity = () => {
    return [...(favorites || []), ...(watchedMovies || [])]
      .filter((movie) => movie.addedAt || movie.watchedAt)
      .sort(
        (a, b) =>
          new Date(b.addedAt || b.watchedAt || 0) -
          new Date(a.addedAt || a.watchedAt || 0)
      )
      .slice(0, 5);
  };

  const recentActivity = getRecentActivity();

  const getImageUrl = (movie) => {
    const posterPath = movie.poster || movie.poster_path;
    return posterPath
      ? `https://image.tmdb.org/t/p/w200${posterPath}`
      : "https://via.placeholder.com/40x60/1f2937/9ca3af?text=No+Image";
  };

  const hasActivity = recentActivity.length > 0;

  return (
    <div className="bg-gray-800 rounded-lg p-4 md:p-6">
      <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {hasActivity ? (
          recentActivity.map((movie) => (
            <div
              key={movie.movieId || movie.id}
              className="flex items-center space-x-3 p-2 hover:bg-gray-750 rounded-lg transition-colors"
            >
              <img
                src={getImageUrl(movie)}
                alt={movie.title}
                className="w-10 h-15 object-cover rounded cursor-pointer"
                onClick={() => onMovieClick(movie)}
              />
              <div className="flex-1">
                <p className="text-sm">
                  {movie.watchedAt ? "Watched" : "Added"}{" "}
                  <span
                    className="font-medium text-white cursor-pointer hover:text-red-400"
                    onClick={() => onMovieClick(movie)}
                  >
                    {movie.title}
                  </span>{" "}
                  {movie.watchedAt ? "" : "to favorites"}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(
                    movie.addedAt || movie.watchedAt
                  ).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-center py-4">No recent activity</p>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
