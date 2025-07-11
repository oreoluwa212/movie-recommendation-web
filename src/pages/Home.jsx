import React, { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "../stores/authStore";
import { useMovieStore } from "../stores/movieStore";
import { useUserStore } from "../stores/userStore";
import { useFilterStore } from "../stores/useFilterStore";
import Hero from "../components/Hero";
import MovieSection from "../components/MovieSection";
import MovieFilter from "../components/MovieFilter";
import ErrorMessage from "../components/ErrorMessage";
import { Filter, X, RotateCcw } from "lucide-react";

// Import the skeleton components
import {
  HeroSkeleton,
  MovieSectionSkeleton,
} from "../components/loaders/SkeletonLoaders";

const Home = () => {
  const { user, isAuthenticated } = useAuthStore();
  const {
    popularMovies,
    featuredMovies,
    topRatedMovies,
    nowPlayingMovies,
    upcomingMovies,
    getPopularMovies,
    getTopRatedMovies,
    getNowPlayingMovies,
    getUpcomingMovies,
    getTrendingMovies,
    initializeFeaturedMovies,
    genres,
    getGenres,
    isLoadingPopular,
    isLoadingTopRated,
    isLoadingNowPlaying,
    isLoadingUpcoming,
    isLoadingTrending,
    error: movieError,
  } = useMovieStore();

  const { favorites, watchedMovies } = useUserStore();

  // Filter store - Complete destructuring
  const {
    activeFilters,
    filteredMovies,
    isFilterLoading,
    filterError,
    filterPagination,
    showFilters,
    hasActiveFilters,
    applyFilters,
    resetFilters,
    toggleFilters,
    hideFilters,
    getActiveFilterCount,
    changePage,
  } = useFilterStore();

  const [homeData, setHomeData] = useState({
    hero: [],
    popular: [],
    topRated: [],
    nowPlaying: [],
    upcoming: [],
    trending: [],
    personalized: [],
  });

  const [loadingStates, setLoadingStates] = useState({
    hero: true,
    popular: true,
    topRated: true,
    nowPlaying: true,
    upcoming: true,
    trending: true,
    personalized: true,
  });

  const [errors, setErrors] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Check if filters are active
  const hasFilters = hasActiveFilters();

  const updateLoadingState = useCallback((section, isLoading) => {
    setLoadingStates((prev) => ({ ...prev, [section]: isLoading }));
  }, []);

  const updateData = useCallback((section, data) => {
    setHomeData((prev) => ({ ...prev, [section]: data }));
  }, []);

  const updateError = useCallback((section, error) => {
    setErrors((prev) => ({ ...prev, [section]: error }));
  }, []);

  const fetchWithErrorHandling = useCallback(
    async (fetchFunction, section) => {
      try {
        updateLoadingState(section, true);
        updateError(section, null);

        const response = await fetchFunction();

        if (Array.isArray(response)) {
          updateData(section, response);
        } else if (response?.results) {
          updateData(section, response.results);
        } else if (response?.movies) {
          updateData(section, response.movies);
        } else {
          updateData(section, []);
        }
      } catch (error) {
        console.error(`Error fetching ${section}:`, error);

        let errorMessage = "Something went wrong.";
        if (error.message.includes("Rate limit")) {
          errorMessage = "Too many requests. Please try again later.";
        } else if (error.message.includes("Network")) {
          errorMessage = "Network error. Check your connection.";
        } else if (error.message.includes("500")) {
          errorMessage = "Server error. Please try again later.";
        } else if (error.message.includes("404")) {
          errorMessage = "Content not found.";
        }

        updateError(section, errorMessage);
        updateData(section, []);
      } finally {
        updateLoadingState(section, false);
      }
    },
    [updateData, updateError, updateLoadingState]
  );

  const generatePersonalizedRecommendations = useCallback(() => {
    if (!isAuthenticated) return [];

    const userMovies = [...favorites, ...watchedMovies];
    const userGenres = userMovies.flatMap((movie) => movie.genre_ids || []);
    const genreCount = userGenres.reduce((acc, genre) => {
      acc[genre] = (acc[genre] || 0) + 1;
      return acc;
    }, {});

    const topGenres = Object.entries(genreCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([genre]) => parseInt(genre));

    const allMovies = [
      ...popularMovies,
      ...topRatedMovies,
      ...nowPlayingMovies,
      ...upcomingMovies,
    ];

    const recommendations = allMovies
      .filter(
        (movie) =>
          !userMovies.some((m) => m.id === movie.id) &&
          movie.genre_ids?.some((g) => topGenres.includes(g))
      )
      .slice(0, 10);

    return recommendations.length > 0
      ? recommendations
      : allMovies.slice(0, 10);
  }, [
    isAuthenticated,
    favorites,
    watchedMovies,
    popularMovies,
    topRatedMovies,
    nowPlayingMovies,
    upcomingMovies,
  ]);

  // Initialize data on component mount
  useEffect(() => {
    if (isInitialized) return;

    const initializeData = async () => {
      try {
        console.log("Initializing home data...");

        // Get genres first for filtering
        await getGenres();

        // Initialize featured movies first
        await initializeFeaturedMovies();

        // Fetch all movie categories
        await Promise.all([
          fetchWithErrorHandling(getPopularMovies, "popular"),
          fetchWithErrorHandling(getTopRatedMovies, "topRated"),
          fetchWithErrorHandling(getNowPlayingMovies, "nowPlaying"),
          fetchWithErrorHandling(getUpcomingMovies, "upcoming"),
          getTrendingMovies
            ? fetchWithErrorHandling(getTrendingMovies, "trending")
            : Promise.resolve(),
        ]);

        // Generate personalized recommendations if user is authenticated
        if (isAuthenticated) {
          updateLoadingState("personalized", true);
          const personalized = generatePersonalizedRecommendations();
          updateData("personalized", personalized);
          updateLoadingState("personalized", false);
        }

        setIsInitialized(true);
        console.log("Home data initialized successfully");
      } catch (error) {
        console.error("Error initializing home data:", error);
        setIsInitialized(true);
      }
    };

    initializeData();
  }, [
    isInitialized,
    initializeFeaturedMovies,
    getPopularMovies,
    getTopRatedMovies,
    getNowPlayingMovies,
    getUpcomingMovies,
    getTrendingMovies,
    fetchWithErrorHandling,
    isAuthenticated,
    generatePersonalizedRecommendations,
    updateLoadingState,
    updateData,
    getGenres,
  ]);

  // Update hero section when featured movies are loaded
  useEffect(() => {
    if (featuredMovies.length > 0) {
      updateData("hero", featuredMovies);
      updateLoadingState("hero", false);
    } else if (popularMovies.length > 0) {
      updateData("hero", popularMovies.slice(0, 3));
      updateLoadingState("hero", false);
    }
  }, [featuredMovies, popularMovies, updateData, updateLoadingState]);

  // Update section data when store data changes
  useEffect(() => {
    if (popularMovies.length > 0) {
      updateData("popular", popularMovies);
      updateLoadingState("popular", false);
    }
  }, [popularMovies, updateData, updateLoadingState]);

  useEffect(() => {
    if (topRatedMovies.length > 0) {
      updateData("topRated", topRatedMovies);
      updateLoadingState("topRated", false);
    }
  }, [topRatedMovies, updateData, updateLoadingState]);

  useEffect(() => {
    if (nowPlayingMovies.length > 0) {
      updateData("nowPlaying", nowPlayingMovies);
      updateLoadingState("nowPlaying", false);
    }
  }, [nowPlayingMovies, updateData, updateLoadingState]);

  useEffect(() => {
    if (upcomingMovies.length > 0) {
      updateData("upcoming", upcomingMovies);
      updateLoadingState("upcoming", false);
    }
  }, [upcomingMovies, updateData, updateLoadingState]);

  // Update personalized recommendations when user data changes
  useEffect(() => {
    if (isAuthenticated && isInitialized) {
      const personalized = generatePersonalizedRecommendations();
      updateData("personalized", personalized);
    }
  }, [
    isAuthenticated,
    isInitialized,
    generatePersonalizedRecommendations,
    updateData,
  ]);

  // FIXED: Handle filter changes with automatic application
  const handleFilterChange = useCallback(
    async (filters) => {
      console.log("Filter change received:", filters);

      // Check if any filters are actually active
      const isActiveFilter =
        filters.genres?.length > 0 ||
        filters.minRating !== "" ||
        filters.maxRating !== "" ||
        filters.releaseYear !== "" ||
        filters.sortBy !== "";

      if (isActiveFilter) {
        // Apply filters immediately when they change
        try {
          await applyFilters(filters);
        } catch (error) {
          console.error("Error applying filters:", error);
        }
      } else {
        // Reset filters if no active filters
        resetFilters();
      }
    },
    [applyFilters, resetFilters]
  );

  // Apply filters with enhanced error handling
  const handleApplyFilters = useCallback(
    async (filters) => {
      console.log("Manually applying filters:", filters);
      try {
        hideFilters();
        await applyFilters(filters);
      } catch (error) {
        console.error("Error applying filters:", error);
        // Could add toast notification here
      }
    },
    [applyFilters, hideFilters]
  );

  // Reset filters
  const handleResetFilters = useCallback(() => {
    console.log("Resetting filters");
    resetFilters();
    hideFilters();
  }, [resetFilters, hideFilters]);

  // Handle pagination for filtered results
  const handlePageChange = useCallback(
    async (page) => {
      console.log("Changing page to:", page);
      try {
        await changePage(page);
      } catch (error) {
        console.error("Error changing page:", error);
      }
    },
    [changePage]
  );

  const retryFailedRequests = useCallback(async () => {
    const failedSections = Object.keys(errors).filter(
      (section) => errors[section]
    );

    for (const section of failedSections) {
      switch (section) {
        case "popular":
          await fetchWithErrorHandling(getPopularMovies, section);
          break;
        case "topRated":
          await fetchWithErrorHandling(getTopRatedMovies, section);
          break;
        case "nowPlaying":
          await fetchWithErrorHandling(getNowPlayingMovies, section);
          break;
        case "upcoming":
          await fetchWithErrorHandling(getUpcomingMovies, section);
          break;
        case "trending":
          if (getTrendingMovies) {
            await fetchWithErrorHandling(getTrendingMovies, section);
          }
          break;
        case "personalized":
          if (isAuthenticated) {
            updateLoadingState(section, true);
            const personalized = generatePersonalizedRecommendations();
            updateData(section, personalized);
            updateLoadingState(section, false);
          }
          break;
        default:
          break;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }, [
    errors,
    fetchWithErrorHandling,
    getPopularMovies,
    getTopRatedMovies,
    getNowPlayingMovies,
    getUpcomingMovies,
    getTrendingMovies,
    isAuthenticated,
    generatePersonalizedRecommendations,
    updateData,
    updateLoadingState,
  ]);

  // Show error only if there's a critical error and no data
  if (
    !isInitialized &&
    (errors.popular || movieError) &&
    !homeData.popular.length &&
    !homeData.hero.length
  ) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <ErrorMessage
          message="Failed to load homepage content"
          onRetry={retryFailedRequests}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section - Always show when not in filter mode */}
      {!hasFilters && (
        <>
          {loadingStates.hero ? (
            <HeroSkeleton />
          ) : (
            homeData.hero.length > 0 && <Hero movies={homeData.hero} />
          )}
        </>
      )}

      {/* Filter Section */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleFilters}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span>Filter Movies</span>
              {getActiveFilterCount() > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
                  {getActiveFilterCount()}
                </span>
              )}
            </button>
            {hasFilters && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Clear Filters</span>
              </button>
            )}
          </div>
          {hasFilters && (
            <div className="text-sm text-gray-400">
              Showing filtered results ({filterPagination.totalResults} movies)
            </div>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <MovieFilter
              onFilterChange={handleFilterChange}
              genres={genres}
              initialFilters={activeFilters}
              onApply={handleApplyFilters}
              onReset={handleResetFilters}
              compact={false}
            />
          </div>
        )}
      </div>

      {/* Content Sections */}
      <div className="container mx-auto px-4 space-y-8">
        {/* Show filtered results when filters are active */}
        {hasFilters ? (
          <div className="space-y-6">
            {isFilterLoading ? (
              <MovieSectionSkeleton
                cardSize="medium"
                cardCount={12}
                showViewAll={false}
                showScrollButtons={false}
              />
            ) : filterError ? (
              <ErrorMessage
                message={filterError}
                onRetry={() => applyFilters(activeFilters)}
              />
            ) : filteredMovies.length > 0 ? (
              <MovieSection
                title="Filtered Results"
                movies={filteredMovies}
                loading={false}
                error={null}
                showViewAll={false}
                cardSize="medium"
                showPagination={filterPagination.totalPages > 1}
                pagination={filterPagination}
                onPageChange={handlePageChange}
              />
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Filter className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">
                    No movies found
                  </h3>
                  <p>Try adjusting your filters to see more results.</p>
                </div>
                <button
                  onClick={handleResetFilters}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Show default movie sections when no filters are active */
          <>
            {/* Personalized Recommendations */}
            {isAuthenticated && (
              <>
                {loadingStates.personalized ? (
                  <MovieSectionSkeleton
                    cardSize="medium"
                    cardCount={6}
                    showViewAll={true}
                    showScrollButtons={true}
                  />
                ) : (
                  <MovieSection
                    title={`Recommended for ${user?.username || "You"}`}
                    movies={homeData.personalized}
                    loading={false}
                    error={errors.personalized}
                    showViewAll={homeData.personalized.length > 0}
                    viewAllLink="/movies/recommendations"
                    cardSize="medium"
                    onRetry={() => {
                      updateLoadingState("personalized", true);
                      const personalized =
                        generatePersonalizedRecommendations();
                      updateData("personalized", personalized);
                      updateLoadingState("personalized", false);
                    }}
                  />
                )}
              </>
            )}

            {/* Trending Movies */}
            {getTrendingMovies && (
              <>
                {loadingStates.trending || isLoadingTrending ? (
                  <MovieSectionSkeleton
                    cardSize="medium"
                    cardCount={6}
                    showViewAll={true}
                    showScrollButtons={true}
                  />
                ) : (
                  <MovieSection
                    title="Trending Now"
                    movies={homeData.trending}
                    loading={false}
                    error={errors.trending}
                    showViewAll={homeData.trending?.length > 0}
                    viewAllLink="/movies/trending"
                    cardSize="medium"
                    onRetry={() =>
                      fetchWithErrorHandling(getTrendingMovies, "trending")
                    }
                  />
                )}
              </>
            )}

            {/* Popular Movies */}
            {loadingStates.popular || isLoadingPopular ? (
              <MovieSectionSkeleton
                cardSize="medium"
                cardCount={6}
                showViewAll={true}
                showScrollButtons={true}
              />
            ) : (
              <MovieSection
                title="Popular Movies"
                movies={homeData.popular}
                loading={false}
                error={errors.popular}
                showViewAll={homeData.popular?.length > 0}
                viewAllLink="/movies/popular"
                cardSize="medium"
                onRetry={() =>
                  fetchWithErrorHandling(getPopularMovies, "popular")
                }
              />
            )}

            {/* Now Playing Movies */}
            {loadingStates.nowPlaying || isLoadingNowPlaying ? (
              <MovieSectionSkeleton
                cardSize="medium"
                cardCount={6}
                showViewAll={true}
                showScrollButtons={true}
              />
            ) : (
              <MovieSection
                title="Now Playing in Theaters"
                movies={homeData.nowPlaying}
                loading={false}
                error={errors.nowPlaying}
                showViewAll={homeData.nowPlaying?.length > 0}
                viewAllLink="/movies/now-playing"
                cardSize="medium"
                onRetry={() =>
                  fetchWithErrorHandling(getNowPlayingMovies, "nowPlaying")
                }
              />
            )}

            {/* Top Rated Movies */}
            {loadingStates.topRated || isLoadingTopRated ? (
              <MovieSectionSkeleton
                cardSize="medium"
                cardCount={6}
                showViewAll={true}
                showScrollButtons={true}
              />
            ) : (
              <MovieSection
                title="Top Rated Movies"
                movies={homeData.topRated}
                loading={false}
                error={errors.topRated}
                showViewAll={homeData.topRated?.length > 0}
                viewAllLink="/movies/top-rated"
                cardSize="medium"
                onRetry={() =>
                  fetchWithErrorHandling(getTopRatedMovies, "topRated")
                }
              />
            )}

            {/* Upcoming Movies */}
            {loadingStates.upcoming || isLoadingUpcoming ? (
              <MovieSectionSkeleton
                cardSize="medium"
                cardCount={6}
                showViewAll={true}
                showScrollButtons={true}
              />
            ) : (
              <MovieSection
                title="Coming Soon"
                movies={homeData.upcoming}
                loading={false}
                error={errors.upcoming}
                showViewAll={homeData.upcoming?.length > 0}
                viewAllLink="/movies/upcoming"
                cardSize="medium"
                onRetry={() =>
                  fetchWithErrorHandling(getUpcomingMovies, "upcoming")
                }
              />
            )}

            {/* Auth CTA Section */}
            {!isAuthenticated && (
              <section className="bg-gradient-to-r from-red-600 to-red-800 rounded-lg p-8 text-center my-12">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Get Personalized Recommendations
                </h2>
                <p className="text-red-100 mb-6 max-w-2xl mx-auto">
                  Create an account to receive personalized movie
                  recommendations, build your watchlists, and track your
                  favorite movies.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() =>
                      useAuthStore.getState().setCurrentView("register")
                    }
                    className="bg-white text-red-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Sign Up Free
                  </button>
                  <button
                    onClick={() =>
                      useAuthStore.getState().setCurrentView("login")
                    }
                    className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-red-600 transition-colors"
                  >
                    Sign In
                  </button>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
