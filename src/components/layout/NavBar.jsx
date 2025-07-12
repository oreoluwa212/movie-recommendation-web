// components/layout/Navbar.js - Refactored main component
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  Film,
  Heart,
  Eye,
  BookOpen,
  Star,
  Search,
} from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { useUserStore } from "../../stores/userStore";
import { AuthModal } from "../AuthComponent";

// Import our new reusable components
import Logo from "../ui/Logo";
import NavLink from "../ui/NavLink";
import SearchBar from "../ui/SearchBar";
import UserDropdown from "../ui/UserDropdown";
import AuthButtons from "../ui/AuthButtons";
import MobileMenu from "../ui/MobileMenu";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  const { user, isAuthenticated, logout } = useAuthStore();
  const { favorites, watchedMovies, syncWithServer } = useUserStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation configuration
  const navLinks = [
    { path: "/", label: "Home", icon: Film },
    { path: "/search", label: "Search", icon: Search },
  ];

  const userLinks = [
    {
      path: "/favorites",
      label: "Favorites",
      icon: Heart,
      count: favorites.length,
    },
    {
      path: "/watched",
      label: "Watched",
      icon: Eye,
      count: watchedMovies.length,
    },
    { path: "/watchlists", label: "Watchlists", icon: BookOpen },
    { path: "/reviews", label: "Reviews", icon: Star },
  ];

  // Sync user data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      syncWithServer().catch((error) => {
        console.error("Failed to sync user data:", error);
      });
    }
  }, [isAuthenticated, syncWithServer]);

  // Update search query from URL params
  useEffect(() => {
    if (location.pathname === "/search") {
      const urlParams = new URLSearchParams(location.search);
      const query = urlParams.get("query");
      if (query) {
        setSearchQuery(query);
      }
    } else {
      setSearchQuery("");
    }
  }, [location]);

  // Event handlers
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
      setIsMenuOpen(false);
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery("");
    if (location.pathname === "/search") {
      navigate("/search");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsMenuOpen(false);
  };

  const handleAuthModalOpen = (mode) => {
    setAuthMode(mode);
    setShowAuthModal(true);
    setIsMenuOpen(false);
  };

  const handleAuthModalClose = () => {
    setShowAuthModal(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
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
                  className="px-3 py-2"
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
                <div className="flex items-center space-x-4">
                  {userLinks.map(({ path, label, icon, count }) => (
                    <NavLink
                      key={path}
                      to={path}
                      icon={icon}
                      label={label}
                      count={count}
                      isActive={isActive(path)}
                      className="px-3 py-2 hidden lg:flex"
                    />
                  ))}
                  <UserDropdown user={user} onLogout={handleLogout} />
                </div>
              ) : (
                <AuthButtons
                  onLogin={() => handleAuthModalOpen("login")}
                  onRegister={() => handleAuthModalOpen("register")}
                />
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="xl:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors"
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
            userLinks={userLinks}
            isAuthenticated={isAuthenticated}
            onMenuClose={() => setIsMenuOpen(false)}
            onAuthModalOpen={handleAuthModalOpen}
            onLogout={handleLogout}
            isActive={isActive}
          />
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={handleAuthModalClose}
        initialMode={authMode}
      />
    </>
  );
};

export default Navbar;
