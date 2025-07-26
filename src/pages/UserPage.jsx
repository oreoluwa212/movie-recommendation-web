import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Heart,
  BookOpen,
  Eye,
  Trash2,
  FolderPlus,
  Lock,
  Globe,
  Calendar,
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useProfile } from "../hooks/useProfile"; // Using the fixed hook
import { useWatchlistStore } from "../stores/watchlistStore";
import MovieCard from "../components/MovieCard";
import Button from "../components/ui/Button";
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

  const getCurrentSection = () => {
    if (section) return section;
    const path = location.pathname.split("/").pop();
    return ["favorites", "watchlist", "watched", "profile"].includes(path)
      ? path
      : "favorites";
  };

  const [isWatchlistModalOpen, setIsWatchlistModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(getCurrentSection());
  const [sortBy] = useState("dateAdded");
  const [filterBy] = useState("all");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm] = useState("");
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    bio: "",
    firstName: "",
    lastName: "",
  });

  const { user, isAuthenticated } = useAuthStore();

  // Use the fixed profile hook
  const {
    currentUser,
    favorites,
    watchedMovies,
    reviews,
    userStats,
    isLoading: profileLoading,
    isInitialized,
    error: userError,
    updateProfile: handleUpdateProfile,
    uploadAvatar: handleAvatarUpload,
    deleteAvatar: handleAvatarDelete,
    ensureFullProfileLoaded,
    hasData,
    isReady
  } = useProfile();

  const {
    isLoading: isLoadingWatchlists,
    error: watchlistError,
    loadWatchlists,
    deleteWatchlist,
    watchlists = [],
  } = useWatchlistStore();

  // Load data when component mounts and user is authenticated
  useEffect(() => {
    if (isAuthenticated && isInitialized) {
      // Ensure we have full profile data including favorites
      ensureFullProfileLoaded();
      loadWatchlists();
    }
  }, [isAuthenticated, isInitialized, ensureFullProfileLoaded, loadWatchlists]);

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

  // Update edit form when user data changes
  useEffect(() => {
    if (currentUser) {
      setEditForm({
        username: currentUser.username || "",
        email: currentUser.email || "",
        bio: currentUser.bio || "",
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
      });
    }
  }, [currentUser]);

  // Debug log to check favorites data
  useEffect(() => {
    console.log('UserPage - Profile data:', {
      currentUser: !!currentUser,
      favorites: favorites?.length || 0,
      watchedMovies: watchedMovies?.length || 0,
      isReady,
      hasData,
      isInitialized,
      profileLoading
    });
  }, [currentUser, favorites, watchedMovies, isReady, hasData, isInitialized, profileLoading]);

  const handleThemeChange = async (theme) => {
    try {
      // Apply theme to document
      const root = document.documentElement;
      if (theme === "light") {
        root.classList.remove("dark");
        root.classList.add("light");
      } else {
        root.classList.remove("light");
        root.classList.add("dark");
      }

      // Store theme preference in localStorage
      localStorage.setItem("theme", theme);

      toast.success(`Theme changed to ${theme} mode`);
    } catch (error) {
      console.error("Theme change error:", error);
      toast.error("Failed to update theme");
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/user/${tab}`);
  };

  const handleMovieClick = (movie) => {
    const movieId = movie.movieId || movie.id;
    navigate(`/movie/${movieId}`);
  };

  const handleCreateWatchlist = () => {
    setIsWatchlistModalOpen(true);
  };

  const handleDeleteWatchlist = async (watchlistId, watchlistName) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${watchlistName}"? This action cannot be undone.`
      )
    ) {
      await deleteWatchlist(watchlistId);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      if (!editForm.username.trim()) {
        toast.error("Username is required");
        return;
      }

      if (!editForm.email.trim()) {
        toast.error("Email is required");
        return;
      }

      const result = await handleUpdateProfile(editForm);

      if (result.success) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Profile update error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (currentUser) {
      setEditForm({
        username: currentUser.username || "",
        email: currentUser.email || "",
        bio: currentUser.bio || "",
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
      });
    }
  };

  const handleWatchlistModalSuccess = () => {
    setIsWatchlistModalOpen(false);
    loadWatchlists();
    toast.success("Watchlist created successfully!");
  };

  const filterAndSortMovies = (movies) => {
    if (!Array.isArray(movies)) return [];

    let filtered = [...movies];

    if (searchTerm) {
      filtered = filtered.filter((movie) =>
        movie.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterBy !== "all") {
      filtered = filtered.filter((movie) => movie.type === filterBy);
    }

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

  const filterAndSortWatchlists = (watchlists) => {
    if (!Array.isArray(watchlists)) return [];

    let filtered = [...watchlists];

    if (searchTerm) {
      filtered = filtered.filter(
        (watchlist) =>
          watchlist.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          watchlist.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

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

  const getCurrentMovies = () => {
    switch (activeTab) {
      case "favorites":
        return favorites || [];
      case "watchlist":
        return [];
      case "watched":
        return watchedMovies || [];
      default:
        return [];
    }
  };

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
            showRemove
            showWatchlistButton
            showMarkAsWatched={activeTab === "watchlist"}
          />
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
        )}
      </div>
    );
  };

  const renderProfileSection = () => {
    if (!currentUser) return null;

    return (
      <div className="max-w-4xl mx-auto">
        <ProfileEditForm
          userData={currentUser}
          editForm={editForm}
          setEditForm={setEditForm}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          onSave={handleSaveProfile}
          onCancel={handleCancelEdit}
          loading={loading}
          onAvatarUpload={handleAvatarUpload}
          onAvatarDelete={handleAvatarDelete}
          onThemeChange={handleThemeChange}
        />
        <ProfileStatistics
          favorites={favorites}
          watchlists={watchlists}
          watchedMovies={watchedMovies}
          reviews={reviews}
          stats={userStats || {}}
        />
        <RecentActivity />
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

  // Show loading state while initializing
  if (!isAuthenticated) {
    return null;
  }

  // Show loading state while profile is being initialized
  if (!isInitialized || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UserPageHeader
          activeTab={activeTab}
          user={user}
          profile={currentUser}
          onBackClick={() => navigate("/")}
        />

        {userError && (
          <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded mb-6">
            {userError}
          </div>
        )}

        <UserPageTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          getTabCount={getTabCount}
        />

        {activeTab === "profile" ? (
          renderProfileSection()
        ) : activeTab === "watchlist" ? (
          renderWatchlistsSection()
        ) : (
          <div>
            <MovieControls />
            {renderMovieGrid(getCurrentMovies())}
          </div>
        )}
      </div>
      <WatchlistModal
        isOpen={isWatchlistModalOpen}
        onClose={() => setIsWatchlistModalOpen(false)}
        movie={null}
        onSuccess={handleWatchlistModalSuccess}
        createMode={true}
      />
    </div>
  );
};

export default UserPage;