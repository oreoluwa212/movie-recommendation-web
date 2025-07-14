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
import UserPageHeader from "../components/UserPageHeader";
import UserPageTabs from "../components/UserPageTabs";
import MovieControls from "../components/MovieControls";
import WatchlistCard from "../components/WatchlistCard";
import ProfileStatistics from "../components/ProfileStatistics";
import ProfileEditForm from "../components/ProfileEditForm";
import RecentActivity from "../components/RecentActivity";
import EmptyState from "../components/EmptyState";

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
        <EmptyState
          icon={config.icon}
          title={config.title}
          description={config.description}
          buttonText={!searchTerm ? "Browse Movies" : null}
          buttonAction={!searchTerm ? () => navigate("/") : null}
          showButton={!searchTerm}
        />
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredMovies.map((movie) => (
          <MovieCard
            key={movie.id || movie.movieId}
            movie={movie}
            onClick={() => handleMovieClick(movie)}
            onRemove={() => handleRemoveFromList(movie, activeTab)}
            showRemove
            showWatchlistButton
            showMarkAsWatched={activeTab === "watchlist"}
            onMarkAsWatched={() => handleMarkAsWatched(movie)}
          />
        ))}
      </div>
    );
  };

  const renderWatchlistsSection = () => {
    const filteredWatchlists = filterAndSortWatchlists(watchlists);

    if (isLoadingWatchlists) {
      return (
        <EmptyState
          icon={BookOpen}
          title={searchTerm ? "No watchlists found" : "No watchlists yet"}
          description={
            searchTerm
              ? "Try adjusting your search term."
              : "Create your first watchlist to organize movies you want to watch."
          }
          buttonText={!searchTerm ? "Create Your First Watchlist" : null}
          buttonAction={!searchTerm ? handleCreateWatchlist : null}
          showButton={!searchTerm}
        />
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
        <ProfileEditForm
          userData={userData}
          editForm={editForm}
          setEditForm={setEditForm}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          onSave={handleSaveProfile}
          onCancel={handleCancelEdit}
          loading={loading}
        />

        {/* Statistics */}
        <ProfileStatistics />

        {/* Recent Activity */}
        <RecentActivity />

        {/* Account Actions */}
        {watchlists.filter(Boolean).map((watchlist) => (
          <WatchlistCard
            key={watchlist.id || watchlist._id}
            watchlist={watchlist}
            onView={(id) => navigate(`/watchlist/${id}`)}
            onDelete={handleDeleteWatchlist}
          />
        ))}
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
        <UserPageHeader
          activeTab={activeTab}
          user={user}
          profile={profile}
          onBackClick={() => navigate("/")} // 👈 add this line
        />

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
        <UserPageTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          getTabCount={getTabCount}
        />

        {/* Content */}
        {activeTab === "profile" ? (
          renderProfileSection()
        ) : activeTab === "watchlist" ? (
          renderWatchlistsSection()
        ) : (
          <div>
            {/* Controls */}
            <MovieControls />

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
