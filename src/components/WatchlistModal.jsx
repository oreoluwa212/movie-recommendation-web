import React, { useState, useEffect } from "react";
import { X, Plus, BookmarkPlus, Loader2, Trash2, Check } from "lucide-react";
import { useWatchlistStore } from "../stores/watchlistStore";

const WatchlistModal = ({ isOpen, onClose, movie, onSuccess }) => {
  const [newWatchlistName, setNewWatchlistName] = useState("");
  const [newWatchlistDescription, setNewWatchlistDescription] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [processingWatchlist, setProcessingWatchlist] = useState(null);
  const [deletingWatchlist, setDeletingWatchlist] = useState(null);
  const [addedMovies, setAddedMovies] = useState(new Set()); // Track optimistically added movies

  // Zustand store hooks
  const {
    watchlists,
    isLoading,
    loadWatchlists,
    createWatchlist,
    addMovieToWatchlist,
    getMovieWatchlistStatus
  } = useWatchlistStore();

  useEffect(() => {
    if (isOpen) {
      loadWatchlists();
      setAddedMovies(new Set()); // Reset optimistic updates when modal opens
    }
  }, [isOpen, loadWatchlists]);

  const handleCreateWatchlist = async (e) => {
    e.preventDefault();
    if (!newWatchlistName.trim()) {
      return;
    }

    const watchlistData = {
      name: newWatchlistName.trim(),
      description: newWatchlistDescription.trim() || undefined,
      isPublic: false,
    };

    const result = await createWatchlist(watchlistData);
    
    if (result.success) {
      // Reset form
      setNewWatchlistName("");
      setNewWatchlistDescription("");
      setShowCreateForm(false);
    }
  };

  const handleDeleteWatchlist = async (watchlistId) => {
    if (!window.confirm("Are you sure you want to delete this watchlist?")) {
      return;
    }

    setDeletingWatchlist(watchlistId);
    
    setDeletingWatchlist(null);
    
    // The store handles the optimistic updates and rollback automatically
    // No need to manually manage state here
  };

  const handleAddToWatchlist = async (watchlistId) => {
    if (!movie) return;

    // Check if movie is already in watchlist using store helper
    const watchlistStatus = getMovieWatchlistStatus(movie.id);
    const isInThisWatchlist = watchlistStatus.watchlists.some(w => 
      getWatchlistId(w) === watchlistId
    );

    if (isInThisWatchlist) {
      return; // Store will handle the toast
    }

    setProcessingWatchlist(watchlistId);
    
    // Optimistic update for UI feedback
    setAddedMovies(prev => new Set(prev).add(watchlistId));

    const movieData = {
      movieId: Number(movie.id),
      title: movie.title,
      poster: movie.poster || movie.poster_path,
    };

    const result = await addMovieToWatchlist(watchlistId, movieData);

    if (result.success) {
      if (onSuccess) {
        onSuccess();
      }
    } else {
      // Revert optimistic update on error
      setAddedMovies(prev => {
        const newSet = new Set(prev);
        newSet.delete(watchlistId);
        return newSet;
      });
    }

    setProcessingWatchlist(null);
  };

  const isMovieInWatchlist = (watchlist) => {
    // Enhanced safety checks and type conversion
    if (!watchlist || !watchlist.movies || !Array.isArray(watchlist.movies)) {
      return false;
    }
    
    if (!movie || !movie.id) {
      return false;
    }

    const watchlistId = getWatchlistId(watchlist);
    
    // Check optimistic updates first
    if (addedMovies.has(watchlistId)) {
      return true;
    }

    // Convert both IDs to numbers for comparison
    const movieId = Number(movie.id);
    
    return watchlist.movies.some((m) => {
      const watchlistMovieId = Number(m.movieId);
      return watchlistMovieId === movieId;
    });
  };

  // Helper function to get watchlist ID consistently
  const getWatchlistId = (watchlist) => {
    return watchlist._id || watchlist.id;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Add to Watchlist</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {movie && (
            <div className="flex items-center space-x-3 mb-6 p-3 bg-gray-700 rounded-lg">
              <div className="w-12 h-16 bg-gray-600 rounded overflow-hidden flex-shrink-0">
                {movie.poster || movie.poster_path ? (
                  <img
                    src={movie.poster || movie.poster_path}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookmarkPlus className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-medium text-white">{movie.title}</h3>
                <p className="text-sm text-gray-400">
                  {movie.releaseDate || movie.release_date
                    ? new Date(movie.releaseDate || movie.release_date).getFullYear()
                    : "Unknown"}
                </p>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-red-600" />
            </div>
          ) : (
            <>
              {/* Watchlists List */}
              <div className="space-y-2 mb-6">
                <h3 className="text-lg font-medium text-white mb-3">
                  Your Watchlists
                </h3>

                {watchlists.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <BookmarkPlus className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No watchlists yet</p>
                    <p className="text-sm">Create your first watchlist below</p>
                  </div>
                ) : (
                  watchlists.map((watchlist) => {
                    const watchlistId = getWatchlistId(watchlist);
                    const inWatchlist = isMovieInWatchlist(watchlist);
                    const isProcessing = processingWatchlist === watchlistId;
                    const isDeleting = deletingWatchlist === watchlistId;

                    return (
                      <div
                        key={watchlistId}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          inWatchlist
                            ? "bg-green-900/20 border-green-600"
                            : "bg-gray-700 border-gray-600 hover:border-gray-500"
                        }`}
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-white">
                            {watchlist.name}
                          </h4>
                          {watchlist.description && (
                            <p className="text-sm text-gray-400 mt-1">
                              {watchlist.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {watchlist.movieCount || watchlist.movies?.length || 0} movies
                            {addedMovies.has(watchlistId) && !watchlist.movies?.some(m => Number(m.movieId) === Number(movie.id)) && (
                              <span className="text-green-400 ml-1">(+1)</span>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleAddToWatchlist(watchlistId)}
                            disabled={inWatchlist || isProcessing || isDeleting}
                            className={`p-2 rounded-full transition-colors ${
                              inWatchlist
                                ? "bg-green-600 cursor-not-allowed"
                                : isProcessing || isDeleting
                                ? "bg-gray-600 cursor-not-allowed"
                                : "bg-red-600 hover:bg-red-700"
                            }`}
                            title={
                              inWatchlist
                                ? "Already in watchlist"
                                : isProcessing
                                ? "Adding..."
                                : isDeleting
                                ? "Deleting watchlist..."
                                : "Add to watchlist"
                            }
                          >
                            {isProcessing ? (
                              <Loader2 className="h-4 w-4 animate-spin text-white" />
                            ) : inWatchlist ? (
                              <Check className="h-4 w-4 text-white" />
                            ) : (
                              <Plus className="h-4 w-4 text-white" />
                            )}
                          </button>

                          <button
                            onClick={() => handleDeleteWatchlist(watchlistId)}
                            disabled={isProcessing || isDeleting}
                            className={`p-2 rounded-full transition-colors ${
                              isProcessing || isDeleting
                                ? "bg-gray-600 cursor-not-allowed"
                                : "bg-red-600 hover:bg-red-700"
                            }`}
                            title={isDeleting ? "Deleting..." : "Delete watchlist"}
                          >
                            {isDeleting ? (
                              <Loader2 className="h-4 w-4 animate-spin text-white" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-white" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Create New Watchlist */}
              <div className="border-t border-gray-700 pt-6">
                {!showCreateForm ? (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Create New Watchlist</span>
                  </button>
                ) : (
                  <form onSubmit={handleCreateWatchlist} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Watchlist Name *
                      </label>
                      <input
                        type="text"
                        value={newWatchlistName}
                        onChange={(e) => setNewWatchlistName(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                        placeholder="e.g., My Favorites"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description (Optional)
                      </label>
                      <textarea
                        value={newWatchlistDescription}
                        onChange={(e) =>
                          setNewWatchlistDescription(e.target.value)
                        }
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent resize-none"
                        placeholder="Describe your watchlist..."
                        rows="3"
                      />
                    </div>

                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        disabled={isLoading || !newWatchlistName.trim()}
                        className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        <span>{isLoading ? "Creating..." : "Create"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateForm(false);
                          setNewWatchlistName("");
                          setNewWatchlistDescription("");
                        }}
                        className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WatchlistModal;