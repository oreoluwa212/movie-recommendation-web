/* eslint-disable no-unused-vars */
// pages/UserPage.jsx - Updated version with WatchlistButton integration
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Heart,
  BookOpen,
  User,
  Settings,
  Star,
  Eye,
  Trash2,
  Edit3,
  Save,
  X,
  ArrowLeft,
  Filter,
  Grid,
  List,
  Plus,
  Clock,
  FolderPlus,
  Lock,
  Globe,
  Users,
  Calendar,
  MoreVertical,
  Search,
  BookmarkPlus,
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useUserStore } from "../stores/userStore";
import { useWatchlistStore } from "../stores/watchlistStore";
import MovieCard from "../components/MovieCard";
import Button from "../components/ui/Button";
import WatchlistButton from "../components/WatchlistButton";
import { toast } from "react-toastify";
import WatchlistModal from "../components/WatchlistModal";

const UserPage = () => {
  const { section } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine current section from URL path
  const getCurrentSection = () => {
    if (section) return section;
    const path = location.pathname.split("/").pop();
    return ["favorites", "watchlist", "watched", "profile"].includes(path)
      ? path
      : "favorites";
  };

  const [isWatchlistModalOpen, setIsWatchlistModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(getCurrentSection());
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("dateAdded");
  const [filterBy, setFilterBy] = useState("all");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    bio: "",
    firstName: "",
    lastName: "",
  });

  const { user, isAuthenticated, logout } = useAuthStore();
  const userStore = useUserStore();

  // Watchlist store integration
  const {
    watchlists,
    isLoading: isLoadingWatchlists,
    error: watchlistError,
    loadWatchlists,
    deleteWatchlist,
    syncWithServer,
    reset: resetWatchlistStore,
  } = useWatchlistStore();

  // Safely destructure from userStore with fallbacks
  const {
    favorites = [],
    watchedMovies = [],
    watchlists: userWatchlists = [],
    profile = null,
    removeFromFavorites,
    removeFromWatched,
    addToWatched,
    isLoading = false,
    error = null,
    clearAllData,
    loadProfile,
    getStats,
  } = userStore || {};

  // Initialize user data when component mounts
  useEffect(() => {
    if (isAuthenticated && userStore?.initialize) {
      userStore.initialize();
    }
  }, [isAuthenticated, userStore]);

  // Load profile data and watchlists
  useEffect(() => {
    if (isAuthenticated) {
      if (loadProfile) {
        loadProfile();
      }
      // Load watchlists from the watchlist store
      loadWatchlists();
    }
  }, [isAuthenticated, loadProfile, loadWatchlists]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Please log in to access this page");
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Update active tab based on URL
  useEffect(() => {
    const currentSection = getCurrentSection();
    setActiveTab(currentSection);
  }, [location.pathname]);

  // Initialize edit form with user data
  useEffect(() => {
    const userData = profile || user;
    if (userData) {
      setEditForm({
        username: userData.username || "",
        email: userData.email || "",
        bio: userData.bio || "",
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
      });
    }
  }, [user, profile]);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/user/${tab}`);
  };

  // Handle movie click
  const handleMovieClick = (movie) => {
    const movieId = movie.movieId || movie.id;
    navigate(`/movie/${movieId}`);
  };

  // Handle remove from list
  const handleRemoveFromList = async (movie, listType) => {
    try {
      const movieId = movie.movieId || movie.id;
      const movieTitle = movie.title;

      if (listType === "favorites" && removeFromFavorites) {
        await removeFromFavorites(movieId);
        toast.success(`Removed "${movieTitle}" from favorites`);
      } else if (listType === "watched" && removeFromWatched) {
        await removeFromWatched(movieId);
        toast.success(`Removed "${movieTitle}" from watched list`);
      }
    } catch (error) {
      console.error("Error removing movie:", error);
      toast.error("Failed to remove movie");
    }
  };

  // Handle mark as watched (for watchlist items)
  const handleMarkAsWatched = async (movie) => {
    try {
      const movieData = {
        id: movie.movieId || movie.id,
        title: movie.title,
        poster_path: movie.poster,
        release_date: movie.releaseDate,
        rating: movie.rating,
        overview: movie.overview,
        ...movie,
      };

      if (addToWatched) {
        await addToWatched(movieData);
        toast.success(`"${movie.title}" marked as watched`);
      }
    } catch (error) {
      console.error("Error marking as watched:", error);
      toast.error("Failed to mark as watched");
    }
  };

  // Handle create new watchlist
  const handleCreateWatchlist = () => {
    setIsWatchlistModalOpen(true);
  };

  // Handle delete watchlist
  const handleDeleteWatchlist = async (watchlistId, watchlistName) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${watchlistName}"? This action cannot be undone.`
      )
    ) {
      const result = await deleteWatchlist(watchlistId);
      if (result.success) {
        // Success toast is already handled by the store
      }
    }
  };

  // Handle profile edit
  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // Validate form
      if (!editForm.username.trim()) {
        toast.error("Username is required");
        return;
      }

      if (!editForm.email.trim()) {
        toast.error("Email is required");
        return;
      }

      // Here you would call your API to update user profile
      // For now, we'll simulate the API call
      console.log("Saving profile:", editForm);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    const userData = profile || user;
    setEditForm({
      username: userData?.username || "",
      email: userData?.email || "",
      bio: userData?.bio || "",
      firstName: userData?.firstName || "",
      lastName: userData?.lastName || "",
    });
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    if (clearAllData) {
      clearAllData();
    }
    resetWatchlistStore();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handleWatchlistModalClose = () => {
    setIsWatchlistModalOpen(false);
  };

  const handleWatchlistModalSuccess = () => {
    setIsWatchlistModalOpen(false);
    loadWatchlists(); // Refresh watchlists after creating new one
    toast.success("Watchlist created successfully!");
  };

  // Handle watchlist success (refresh data)
  const handleWatchlistSuccess = () => {
    // Refresh watchlists after adding movie to watchlist
    loadWatchlists();
    toast.success("Movie added to watchlist!");
  };

  // Filter and sort movies
  const filterAndSortMovies = (movies) => {
    if (!Array.isArray(movies)) return [];

    let filtered = [...movies];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((movie) =>
        movie.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type (if the movie has a type property)
    if (filterBy !== "all") {
      filtered = filtered.filter((movie) => movie.type === filterBy);
    }

    // Sort movies
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "title":
          return (a.title || "").localeCompare(b.title || "");
        case "year": {
          const aYear = a.releaseDate || a.release_date;
          const bYear = b.releaseDate || b.release_date;
          if (!aYear && !bYear) return 0;
          if (!aYear) return 1;
          if (!bYear) return -1;
          return new Date(bYear) - new Date(aYear);
        }
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "dateAdded":
        default: {
          const aAdded = a.addedAt || a.watchedAt || a.dateAdded;
          const bAdded = b.addedAt || b.watchedAt || b.dateAdded;
          if (!aAdded && !bAdded) return 0;
          if (!aAdded) return 1;
          if (!bAdded) return -1;
          return new Date(bAdded) - new Date(aAdded);
        }
      }
    });

    return filtered;
  };

  // Filter and sort watchlists
  const filterAndSortWatchlists = (watchlists) => {
    if (!Array.isArray(watchlists)) return [];

    let filtered = [...watchlists];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (watchlist) =>
          watchlist.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          watchlist.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Sort watchlists
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "movieCount":
          return (
            (b.movieCount || b.movies?.length || 0) -
            (a.movieCount || a.movies?.length || 0)
          );
        case "dateAdded":
        default:
          return (
            new Date(b.createdAt || b.updatedAt || 0) -
            new Date(a.createdAt || a.updatedAt || 0)
          );
      }
    });

    return filtered;
  };

  // Get current movies based on active tab
  const getCurrentMovies = () => {
    switch (activeTab) {
      case "favorites":
        return favorites || [];
      case "watchlist":
        // Return empty array since we're showing watchlists instead
        return [];
      case "watched":
        return watchedMovies || [];
      default:
        return [];
    }
  };

  // Get current count for tabs
  const getTabCount = (tabId) => {
    switch (tabId) {
      case "favorites":
        return Array.isArray(favorites) ? favorites.length : 0;
      case "watchlist":
        return Array.isArray(watchlists) ? watchlists.length : 0;
      case "watched":
        return Array.isArray(watchedMovies) ? watchedMovies.length : 0;
      default:
        return 0;
    }
  };

  const tabs = [
    {
      id: "favorites",
      label: "Favorites",
      icon: Heart,
      count: getTabCount("favorites"),
    },
    {
      id: "watchlist",
      label: "Watchlists",
      icon: BookOpen,
      count: getTabCount("watchlist"),
    },
    {
      id: "watched",
      label: "Watched",
      icon: Eye,
      count: getTabCount("watched"),
    },
    { id: "profile", label: "Profile", icon: User, count: null },
  ];

  const renderMovieGrid = (movies) => {
    const filteredMovies = filterAndSortMovies(movies);

    if (filteredMovies.length === 0) {
      const emptyStateConfig = {
        favorites: {
          icon: Heart,
          title: searchTerm ? "No favorites found" : "No favorites yet",
          description: searchTerm
            ? "Try adjusting your search term."
            : "Start adding movies to your favorites to see them here.",
        },
        watched: {
          icon: Eye,
          title: searchTerm
            ? "No watched movies found"
            : "No watched movies yet",
          description: searchTerm
            ? "Try adjusting your search term."
            : "Movies you've watched will appear here.",
        },
      };

      const config = emptyStateConfig[activeTab];
      if (!config) return null;

      return (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <config.icon className="h-16 w-16 mx-auto mb-4 opacity-50" />
          </div>
          <h3 className="text-xl font-semibold mb-2">{config.title}</h3>
          <p className="text-gray-400 mb-6">{config.description}</p>
          {!searchTerm && (
            <Button
              variant="primary"
              size="medium"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => navigate("/")}
            >
              Browse Movies
            </Button>
          )}
        </div>
      );
    }

    return (
      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6"
            : "space-y-4"
        }
      >
        {filteredMovies.map((movie) => (
          <div key={movie.movieId || movie.id || movie._id}>
            {viewMode === "grid" ? (
              <MovieCard
                movie={{
                  ...movie,
                  id: movie.movieId || movie.id,
                  poster_path: movie.poster || movie.poster_path,
                  release_date: movie.releaseDate || movie.release_date,
                }}
                size="small"
                onClick={() => handleMovieClick(movie)}
                showActions={true}
                onRemove={() => handleRemoveFromList(movie, activeTab)}
                onMarkWatched={
                  activeTab === "watchlist"
                    ? () => handleMarkAsWatched(movie)
                    : null
                }
              />
            ) : (
              <div className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors">
                <img
                  src={
                    movie.poster || movie.poster_path
                      ? `https://image.tmdb.org/t/p/w200${
                          movie.poster || movie.poster_path
                        }`
                      : "https://via.placeholder.com/100x150/1f2937/9ca3af?text=No+Image"
                  }
                  alt={movie.title}
                  className="w-16 h-24 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => handleMovieClick(movie)}
                />
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-semibold hover:text-red-400 cursor-pointer transition-colors truncate"
                    onClick={() => handleMovieClick(movie)}
                  >
                    {movie.title}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {movie.releaseDate || movie.release_date
                      ? new Date(
                          movie.releaseDate || movie.release_date
                        ).getFullYear()
                      : "N/A"}
                  </p>
                  {movie.rating && (
                    <div className="flex items-center space-x-1 mt-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm">{movie.rating.toFixed(1)}</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {activeTab === "watched" ? "Watched" : "Added"}{" "}
                    {movie.watchedAt || movie.addedAt || movie.dateAdded
                      ? new Date(
                          movie.watchedAt || movie.addedAt || movie.dateAdded
                        ).toLocaleDateString()
                      : "Unknown date"}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => handleMovieClick(movie)}
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  {/* Add WatchlistButton here for easy access */}
                  <WatchlistButton
                    movie={{
                      ...movie,
                      id: movie.movieId || movie.id,
                      poster_path: movie.poster || movie.poster_path,
                      release_date: movie.releaseDate || movie.release_date,
                    }}
                    variant="ghost"
                    size="small"
                    showIcon={true}
                    onSuccess={handleWatchlistSuccess}
                    className="text-blue-400 hover:text-blue-300"
                  />

                  {activeTab === "watchlist" && (
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={() => handleMarkAsWatched(movie)}
                      title="Mark as Watched"
                      className="text-green-400 hover:text-green-300"
                    >
                      <Clock className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => handleRemoveFromList(movie, activeTab)}
                    title="Remove"
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderWatchlistsSection = () => {
    const filteredWatchlists = filterAndSortWatchlists(watchlists);

    if (isLoadingWatchlists) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-gray-400">Loading watchlists...</p>
        </div>
      );
    }

    if (watchlistError) {
      return (
        <div className="text-center py-12">
          <div className="text-red-400 mb-4">
            <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-red-400">
            Error Loading Watchlists
          </h3>
          <p className="text-gray-400 mb-6">{watchlistError}</p>
          <Button
            variant="primary"
            size="medium"
            onClick={() => loadWatchlists(true)}
          >
            Try Again
          </Button>
        </div>
      );
    }

    return (
      <div>
        {/* Header with Create Button */}
        <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4 mb-6">
          <Button
            variant="primary"
            size="medium"
            leftIcon={<FolderPlus className="h-4 w-4" />}
            onClick={handleCreateWatchlist}
            className="w-full sm:w-auto"
          >
            Create New Watchlist
          </Button>
        </div>

        {/* Watchlists Grid */}
        {filteredWatchlists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredWatchlists.map((watchlist) => (
              <div
                key={watchlist._id || watchlist.id}
                className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate group-hover:text-red-400 transition-colors">
                      {watchlist.name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm text-gray-400">
                        {watchlist.movieCount || watchlist.movies?.length || 0}{" "}
                        movies
                      </span>
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
                      onClick={() =>
                        navigate(`/watchlist/${watchlist._id || watchlist.id}`)
                      }
                      title="View Watchlist"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={() =>
                        handleDeleteWatchlist(
                          watchlist._id || watchlist.id,
                          watchlist.name
                        )
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
                    <span>
                      {watchlist.createdAt
                        ? new Date(watchlist.createdAt).toLocaleDateString()
                        : "Unknown date"}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() =>
                      navigate(`/watchlist/${watchlist._id || watchlist.id}`)
                    }
                    className="text-red-400 hover:text-red-300"
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {searchTerm ? "No watchlists found" : "No watchlists yet"}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchTerm
                ? "Try adjusting your search term."
                : "Create your first watchlist to organize movies you want to watch."}
            </p>
            {!searchTerm && (
              <Button
                variant="primary"
                size="medium"
                leftIcon={<FolderPlus className="h-4 w-4" />}
                onClick={handleCreateWatchlist}
              >
                Create Your First Watchlist
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderProfileSection = () => {
    const userData = profile || user;
    if (!userData) return null;

    const stats = getStats ? getStats() : { totalReviews: 0 };

    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-lg p-4 md:p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold">Profile Information</h2>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              {!isEditing ? (
                <Button
                  variant="secondary"
                  size="medium"
                  leftIcon={<Edit3 className="h-4 w-4" />}
                  onClick={handleEditProfile}
                  className="w-full sm:w-auto"
                >
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button
                    variant="primary"
                    size="medium"
                    leftIcon={<Save className="h-4 w-4" />}
                    onClick={handleSaveProfile}
                    loading={loading}
                    className="w-full sm:w-auto"
                  >
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="medium"
                    leftIcon={<X className="h-4 w-4" />}
                    onClick={handleCancelEdit}
                    disabled={loading}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                First Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.firstName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, firstName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-red-500 focus:outline-none"
                />
              ) : (
                <p className="text-gray-300">
                  {userData.firstName || "Not specified"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Last Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.lastName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, lastName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-red-500 focus:outline-none"
                />
              ) : (
                <p className="text-gray-300">
                  {userData.lastName || "Not specified"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) =>
                    setEditForm({ ...editForm, username: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-red-500 focus:outline-none"
                />
              ) : (
                <p className="text-gray-300">{userData.username}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-red-500 focus:outline-none"
                />
              ) : (
                <p className="text-gray-300">{userData.email}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Bio</label>
              {isEditing ? (
                <textarea
                  value={editForm.bio}
                  onChange={(e) =>
                    setEditForm({ ...editForm, bio: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-red-500 focus:outline-none"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="text-gray-300">
                  {userData.bio || "No bio added yet."}
                </p>
              )}
            </div>
          </div>
        </div>
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-4 md:p-6 text-center hover:bg-gray-750 transition-colors">
            <Heart className="h-6 md:h-8 w-6 md:w-8 text-red-500 mx-auto mb-2" />
            <h3 className="text-xl md:text-2xl font-bold">
              {favorites?.length || 0}
            </h3>
            <p className="text-sm text-gray-400">Favorites</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 md:p-6 text-center hover:bg-gray-750 transition-colors">
            <BookOpen className="h-6 md:h-8 w-6 md:w-8 text-blue-500 mx-auto mb-2" />
            <h3 className="text-xl md:text-2xl font-bold">
              {watchlists?.length || 0}
            </h3>
            <p className="text-sm text-gray-400">Watchlists</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 md:p-6 text-center hover:bg-gray-750 transition-colors">
            <Eye className="h-6 md:h-8 w-6 md:w-8 text-green-500 mx-auto mb-2" />
            <h3 className="text-xl md:text-2xl font-bold">
              {watchedMovies?.length || 0}
            </h3>
            <p className="text-sm text-gray-400">Watched</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 md:p-6 text-center hover:bg-gray-750 transition-colors">
            <Star className="h-6 md:h-8 w-6 md:w-8 text-yellow-500 mx-auto mb-2" />
            <h3 className="text-xl md:text-2xl font-bold">
              {stats.totalReviews}
            </h3>
            <p className="text-sm text-gray-400">Reviews</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-lg p-4 md:p-6">
          <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {[...(favorites || []), ...(watchedMovies || [])]
              .filter((movie) => movie.addedAt || movie.watchedAt)
              .sort(
                (a, b) =>
                  new Date(b.addedAt || b.watchedAt || 0) -
                  new Date(a.addedAt || a.watchedAt || 0)
              )
              .slice(0, 5)
              .map((movie) => (
                <div
                  key={movie.movieId || movie.id}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-750 rounded-lg transition-colors"
                >
                  <img
                    src={
                      movie.poster || movie.poster_path
                        ? `https://image.tmdb.org/t/p/w200${
                            movie.poster || movie.poster_path
                          }`
                        : "https://via.placeholder.com/40x60/1f2937/9ca3af?text=No+Image"
                    }
                    alt={movie.title}
                    className="w-10 h-15 object-cover rounded cursor-pointer"
                    onClick={() => handleMovieClick(movie)}
                  />
                  <div className="flex-1">
                    <p className="text-sm">
                      {movie.watchedAt ? "Watched" : "Added"}{" "}
                      <span
                        className="font-medium text-white cursor-pointer hover:text-red-400"
                        onClick={() => handleMovieClick(movie)}
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
              ))}
            {(!favorites || favorites.length === 0) &&
              (!watchedMovies || watchedMovies.length === 0) && (
                <p className="text-gray-400 text-center py-4">
                  No recent activity
                </p>
              )}
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-gray-800 rounded-lg p-4 md:p-6 mt-8">
          <h3 className="text-xl font-semibold mb-4">Account Actions</h3>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <Button
              variant="secondary"
              size="medium"
              leftIcon={<Settings className="h-4 w-4" />}
              onClick={() => toast.info("Settings coming soon!")}
              className="w-full sm:w-auto"
            >
              Settings
            </Button>
            <Button
              variant="danger"
              size="medium"
              onClick={handleLogout}
              className="w-full sm:w-auto"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="medium"
              leftIcon={<ArrowLeft className="h-5 w-5" />}
              onClick={() => navigate("/")}
            >
              Back to Home
            </Button>
            <h1 className="text-3xl font-bold">
              {activeTab === "profile"
                ? "Profile"
                : activeTab === "watched"
                ? "Watched Movies"
                : activeTab === "watchlist"
                ? "My Watchlists"
                : `My ${
                    activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
                  }`}
            </h1>
          </div>

          {(profile || user) && (
            <div className="flex items-center space-x-2">
              <User className="h-6 w-6 text-gray-400" />
              <span className="text-lg">{(profile || user).username}</span>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-2 text-gray-400">Loading...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-800 mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-red-600 text-red-600"
                    : "border-transparent text-gray-400 hover:text-gray-300"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        {activeTab === "profile" ? (
          renderProfileSection()
        ) : activeTab === "watchlist" ? (
          renderWatchlistsSection()
        ) : (
          <div>
            {/* Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                  >
                    <option value="dateAdded">Date Added</option>
                    <option value="title">Title</option>
                    <option value="year">Year</option>
                    <option value="rating">Rating</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">Filter:</span>
                  <select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                  >
                    <option value="all">All</option>
                    <option value="movie">Movies</option>
                    <option value="tv">TV Shows</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === "grid" ? "primary" : "ghost"}
                  size="small"
                  onClick={() => setViewMode("grid")}
                  title="Grid View"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "primary" : "ghost"}
                  size="small"
                  onClick={() => setViewMode("list")}
                  title="List View"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Movies */}
            {renderMovieGrid(getCurrentMovies())}
          </div>
        )}
      </div>
      <WatchlistModal
        isOpen={isWatchlistModalOpen}
        onClose={handleWatchlistModalClose}
        movie={null} // No movie selected, so this will show create new watchlist mode
        onSuccess={handleWatchlistModalSuccess}
        createMode={true} // Optional prop to indicate we're in create mode
      />
    </div>
  );
};

export default UserPage;
