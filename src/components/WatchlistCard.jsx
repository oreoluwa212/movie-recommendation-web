// components/WatchlistCard.jsx
import React from "react";
import { Eye, Trash2, Globe, Lock, Calendar } from "lucide-react";
import Button from "./ui/Button";

const WatchlistCard = ({ watchlist, onView, onDelete }) => {
  if (!watchlist) return null; // Prevent rendering if no watchlist

  const movieCount = watchlist.movieCount || watchlist.movies?.length || 0;
  const createdDate = watchlist.createdAt
    ? new Date(watchlist.createdAt).toLocaleDateString()
    : "Unknown date";

  return (
    <div className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate group-hover:text-red-400 transition-colors">
            {watchlist.name}
          </h3>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-sm text-gray-400">{movieCount} movies</span>
            <span className="text-gray-500">•</span>
            <div className="flex items-center space-x-1">
              {watchlist.isPublic ? (
                <Globe className="h-3 w-3 text-green-400" />
              ) : (
                <Lock className="h-3 w-3 text-gray-400" />
              )}
              <span className="text-xs text-gray-500">
                {watchlist.isPublic ? "Public" : "Private"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="small"
            onClick={() => onView(watchlist._id || watchlist.id)}
            title="View Watchlist"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="small"
            onClick={() =>
              onDelete(watchlist._id || watchlist.id, watchlist.name)
            }
            title="Delete Watchlist"
            className="text-red-400 hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {watchlist.description && (
        <p className="text-sm text-gray-400 mb-4 line-clamp-2">
          {watchlist.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <Calendar className="h-3 w-3" />
          <span>{createdDate}</span>
        </div>
        <Button
          variant="ghost"
          size="small"
          onClick={() => onView(watchlist._id || watchlist.id)}
          className="text-red-400 hover:text-red-300"
        >
          View
        </Button>
      </div>
    </div>
  );
};

export default WatchlistCard;
