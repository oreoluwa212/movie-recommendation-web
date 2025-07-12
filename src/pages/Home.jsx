// Home.js (Refactored)
import React, { useCallback } from "react";
import { useAuthStore } from "../stores/authStore";
import { useFilterStore } from "../stores/useFilterStore";
import { useMovieStore } from "../stores/movieStore";
import { useHomeData } from "../hooks/useHomeData";
import Hero from "../components/Hero";
import MovieFilter from "../components/MovieFilter";
import ErrorMessage from "../components/ErrorMessage";
import FilterControls from "../components/FilterControls";
import FilteredResults from "../components/FilteredResults";
import MovieSectionsList from "../components/MovieSectionsList";
import { HeroSkeleton } from "../components/loaders/SkeletonLoaders";

const Home = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { genres } = useMovieStore();
  const {
    homeData,
    loadingStates,
    errors,
    isInitialized,
    retryFailedRequests,
    fetchWithErrorHandling,
    getTrendingMovies,
    getPopularMovies,
    getTopRatedMovies,
    getNowPlayingMovies,
    getUpcomingMovies,
    isLoadingPopular,
    isLoadingTopRated,
    isLoadingNowPlaying,
    isLoadingUpcoming,
    isLoadingTrending,
    movieError,
    generatePersonalizedRecommendations,
    updateData,
    updateLoadingState,
  } = useHomeData();

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

  const hasFilters = hasActiveFilters();

  const handleFilterChange = useCallback(
    async (filters) => {
      console.log("Filter change received:", filters);

      const isActiveFilter =
        filters.genres?.length > 0 ||
        filters.minRating !== "" ||
        filters.maxRating !== "" ||
        filters.releaseYear !== "" ||
        filters.sortBy !== "";

      if (isActiveFilter) {
        try {
          await applyFilters(filters);
        } catch (error) {
          console.error("Error applying filters:", error);
        }
      } else {
        resetFilters();
      }
    },
    [applyFilters, resetFilters]
  );

  const handleApplyFilters = useCallback(
    async (filters) => {
      console.log("Manually applying filters:", filters);
      try {
        hideFilters();
        await applyFilters(filters);
      } catch (error) {
        console.error("Error applying filters:", error);
      }
    },
    [applyFilters, hideFilters]
  );

  const handleResetFilters = useCallback(() => {
    console.log("Resetting filters");
    resetFilters();
    hideFilters();
  }, [resetFilters, hideFilters]);

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

  const handleSectionRetry = useCallback(
    async (section) => {
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
    },
    [
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
    ]
  );

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
        <FilterControls
          showFilters={showFilters}
          activeFilterCount={getActiveFilterCount()}
          hasFilters={hasFilters}
          totalResults={filterPagination.totalResults}
          onToggleFilters={toggleFilters}
          onResetFilters={handleResetFilters}
        />

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
            <FilteredResults
              isLoading={isFilterLoading}
              error={filterError}
              movies={filteredMovies}
              pagination={filterPagination}
              onPageChange={handlePageChange}
              onRetry={() => applyFilters(activeFilters)}
              onResetFilters={handleResetFilters}
            />
          </div>
        ) : (
          /* Show default movie sections when no filters are active */
          <MovieSectionsList
            homeData={homeData}
            loadingStates={loadingStates}
            errors={errors}
            isAuthenticated={isAuthenticated}
            user={user}
            onRetry={handleSectionRetry}
            getTrendingMovies={getTrendingMovies}
            isLoadingTrending={isLoadingTrending}
            isLoadingPopular={isLoadingPopular}
            isLoadingNowPlaying={isLoadingNowPlaying}
            isLoadingTopRated={isLoadingTopRated}
            isLoadingUpcoming={isLoadingUpcoming}
          />
        )}
      </div>
    </div>
  );
};

export default Home;
