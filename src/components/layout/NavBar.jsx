// components/layout/Navbar.js - Fixed version
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Film, Search } from "lucide-react";
import { toast } from "react-toastify";
import { useAuthStore } from "../../stores/authStore";
import { useUserStore } from "../../stores/userStore";
import { AuthModal } from "../AuthComponent";

// Import reusable components
import Logo from "../ui/Logo";
import NavLink from "../ui/NavLink";
import SearchBar from "../ui/SearchBar";
import UserNavigation from "../ui/UserNavigation";
import AuthButtons from "../ui/AuthButtons";
import MobileMenu from "../ui/MobileMenu";
import ErrorBoundary from "../ui/ErrorBoundary";
import LoadingSpinner from "../LoadingSpinner";

const Navbar = () => {
  // Local state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [isInitializing, setIsInitializing] = useState(false);

  // Refs to prevent duplicate calls
  const initializationRef = useRef(false);
  const currentUserIdRef = useRef(null);

  // Store hooks
  const { user, isAuthenticated, logout } = useAuthStore();
  const {
    favorites,
    watchedMovies,
    watchlists,
    reviews,
    minimalProfile,
    isInitialized,
    isLoading: userStoreLoading,
    error: userStoreError,
    initialize,
    syncWithServer,
    clearError,
    reset: resetUserStore,
  } = useUserStore();

  const navigate = useNavigate();
  const location = useLocation();

  // Memoized navigation configuration
  const navLinks = useMemo(() => [
    { path: "/", label: "Home", icon: Film },
    { path: "/search", label: "Search", icon: Search },
  ], []);

  // Memoized user links - only recalculate when counts change
  const userLinks = useMemo(() => [
    {
      path: "/favorites",
      label: "Favorites",
      icon: "Heart",
      count: favorites.length,
    },
    {
      path: "/watched",
      label: "Watched",
      icon: "Eye",
      count: watchedMovies.length,
    },
    {
      path: "/watchlists",
      label: "Watchlists",
      icon: "BookOpen",
      count: watchlists.length,
    },
    {
      path: "/reviews",
      label: "Reviews",
      icon: "Star",
      count: reviews.length,
    },
  ], [favorites.length, watchedMovies.length, watchlists.length, reviews.length]);

  // Get current user ID for stable reference
  const currentUserId = user?._id || null;

  // Memoized initialization function
  const initializeUserData = useCallback(async () => {
    // Skip if not authenticated
    if (!isAuthenticated || !currentUserId) {
      return { success: false, error: 'Not authenticated' };
    }

    // Skip if already initializing
    if (initializationRef.current) {
      return { success: true, message: 'Already initializing' };
    }

    // Skip if already initialized for this user
    if (isInitialized && currentUserIdRef.current === currentUserId) {
      return { success: true, message: 'Already initialized' };
    }

    try {
      initializationRef.current = true;
      setIsInitializing(true);
      clearError();

      console.log(`🔄 Initializing user data for user: ${currentUserId}`);

      // Initialize user store
      const result = await initialize();
      
      if (result.success) {
        console.log('✅ User data initialized successfully');
        currentUserIdRef.current = currentUserId;
        
        // Background sync - don't await
        syncWithServer().catch(error => {
          console.warn('Background sync failed:', error);
        });
        
        return { success: true, data: result.data };
      } else {
        console.error('❌ User initialization failed:', result.error);
        
        // Handle auth errors
        if (result.error?.includes('Authentication') || 
            result.error?.includes('Access forbidden') ||
            result.error?.includes('invalid token')) {
          toast.error('Please log in again');
          logout();
        }
        
        return result;
      }
    } catch (error) {
      console.error('❌ User initialization error:', error);
      
      // Handle auth errors
      if (error.message?.includes('Authentication') || 
          error.message?.includes('Access forbidden') ||
          error.message?.includes('invalid token')) {
        toast.error('Please log in again');
        logout();
      }
      
      return { success: false, error: error.message };
    } finally {
      initializationRef.current = false;
      setIsInitializing(false);
    }
  }, [isAuthenticated, currentUserId, isInitialized, initialize, syncWithServer, clearError, logout]);

  // Initialize user data when user logs in or changes
  useEffect(() => {
    if (isAuthenticated && currentUserId) {
      // Only initialize if we haven't for this user yet
      if (!isInitialized || currentUserIdRef.current !== currentUserId) {
        initializeUserData();
      }
    }
  }, [isAuthenticated, currentUserId, isInitialized, initializeUserData]);

  // Reset when user logs out
  useEffect(() => {
    if (!isAuthenticated || !currentUserId) {
      // Reset all refs and state
      initializationRef.current = false;
      currentUserIdRef.current = null;
      setIsInitializing(false);
      
      // Clear user store if we had data for a different user
      if (currentUserIdRef.current !== null) {
        resetUserStore();
      }
    }
  }, [isAuthenticated, currentUserId, resetUserStore]);

  // Handle user store errors
  useEffect(() => {
    if (userStoreError && isAuthenticated) {
      console.error('User store error:', userStoreError);
      
      // Only handle auth-related errors
      if (userStoreError.includes('Authentication') || 
          userStoreError.includes('Access forbidden') ||
          userStoreError.includes('invalid token')) {
        toast.error('Please log in again');
        logout();
      }
      
      clearError();
    }
  }, [userStoreError, isAuthenticated, logout, clearError]);

  // Update search query from URL
  useEffect(() => {
    if (location.pathname === '/search') {
      const urlParams = new URLSearchParams(location.search);
      const query = urlParams.get('query') || '';
      setSearchQuery(query);
    } else {
      setSearchQuery('');
    }
  }, [location.pathname, location.search]);

  // Event handlers - all memoized
  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
      setIsMenuOpen(false);
    } else {
      toast.info('Please enter a search term');
    }
  }, [searchQuery, navigate]);

  const handleSearchInputChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    if (location.pathname === '/search') {
      navigate('/search');
    }
  }, [location.pathname, navigate]);

  const handleLogout = useCallback(async () => {
    try {
      // Reset all state
      initializationRef.current = false;
      currentUserIdRef.current = null;
      setIsInitializing(false);
      
      await logout();
      toast.success('Logged out successfully');
      navigate('/');
      setIsMenuOpen(false);
    } catch (error) {
      toast.error('Failed to logout');
      console.error('Logout error:', error);
    }
  }, [logout, navigate]);

  const handleAuthModalOpen = useCallback((mode) => {
    setAuthMode(mode);
    setShowAuthModal(true);
    setIsMenuOpen(false);
  }, []);

  const handleAuthModalClose = useCallback(() => {
    setShowAuthModal(false);
  }, []);

  const handleAuthSuccess = useCallback((message) => {
    toast.success(message || 'Authentication successful');
    setShowAuthModal(false);
    // Reset initialization state to allow new user data loading
    initializationRef.current = false;
    currentUserIdRef.current = null;
  }, []);

  const handleAuthError = useCallback((error) => {
    toast.error(error || 'Authentication failed');
  }, []);

  const isActive = useCallback((path) => location.pathname === path, [location.pathname]);

  // Determine display user and loading state
  const displayUser = minimalProfile || user;
  const isUserDataLoading = isInitializing || userStoreLoading;

  // Debug info (only in development)
  if (import.meta.env.NODE_ENV === 'development') {
    console.log('🎯 Navbar State:', {
      isAuthenticated,
      currentUserId,
      hasMinimalProfile: !!minimalProfile,
      isInitialized,
      isUserDataLoading,
      displayUser: displayUser ? {
        id: displayUser._id,
        username: displayUser.username,
      } : null,
    });
  }

  return (
    <ErrorBoundary>
      <nav className="bg-black/90 backdrop-blur-md sticky py-4 top-0 z-50 border-b border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Logo />

            {/* Desktop Navigation */}
            <div className="hidden xl:flex items-center space-x-8">
              {navLinks.map(({ path, label, icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  icon={icon}
                  label={label}
                  isActive={isActive(path)}
                  className="px-3 py-2 rounded-lg"
                />
              ))}
            </div>

            {/* Desktop Search Bar */}
            <SearchBar
              value={searchQuery}
              onChange={handleSearchInputChange}
              onSubmit={handleSearch}
              onClear={clearSearch}
              placeholder="Search movies, actors, directors..."
              className="hidden xl:flex items-center w-80"
            />

            {/* Desktop User Section */}
            <div className="hidden xl:flex items-center space-x-4">
              {isAuthenticated ? (
                displayUser ? (
                  <div className="flex items-center space-x-4">
                    {/* Loading indicator */}
                    {isUserDataLoading && (
                      <div className="flex items-center space-x-2">
                        <LoadingSpinner size="sm" className="text-red-500" />
                        <span className="text-sm text-gray-400">Loading...</span>
                      </div>
                    )}

                    {/* User Navigation */}
                    <UserNavigation
                      user={displayUser}
                      userLinks={userLinks}
                      onLogout={handleLogout}
                      isActive={isActive}
                      className="flex items-center space-x-4"
                    />
                  </div>
                ) : (
                  /* Authenticated but no user data yet */
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size="sm" className="text-red-500" />
                    <span className="text-sm text-gray-400">Loading profile...</span>
                  </div>
                )
              ) : (
                /* Guest Users */
                <AuthButtons
                  onLogin={() => handleAuthModalOpen('login')}
                  onRegister={() => handleAuthModalOpen('register')}
                />
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="xl:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          <MobileMenu
            isOpen={isMenuOpen}
            searchQuery={searchQuery}
            onSearchChange={handleSearchInputChange}
            onSearchSubmit={handleSearch}
            onSearchClear={clearSearch}
            navLinks={navLinks}
            userLinks={isAuthenticated ? userLinks : []}
            user={displayUser}
            isAuthenticated={isAuthenticated}
            onMenuClose={() => setIsMenuOpen(false)}
            onAuthModalOpen={handleAuthModalOpen}
            onLogout={handleLogout}
            isActive={isActive}
            loading={isUserDataLoading}
          />
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={handleAuthModalClose}
        initialMode={authMode}
        onSuccess={handleAuthSuccess}
        onError={handleAuthError}
      />
    </ErrorBoundary>
  );
};

export default Navbar;