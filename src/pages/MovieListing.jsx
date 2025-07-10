import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Filter, Grid, List, Star, Calendar, ChevronDown } from "lucide-react";
import MovieCard from "../components/MovieCard";
import ErrorMessage from "../components/ErrorMessage";
import { MovieSectionSkeleton } from "../components/loaders/SkeletonLoaders";
import useMovieListing from "../hooks/useMovieListing";
import MovieNavigation from "../components/MovieNavigation";

const MovieListingPage = () => {
  const { category: urlCategory } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Use a default category if none is provided
  const category = urlCategory || 'popular';
  
  // Debug logging
  console.log('MovieListingPage - Category from URL:', urlCategory);
  console.log('MovieListingPage - Using category:', category);
  console.log('MovieListingPage - Search params:', Object.fromEntries(searchParams.entries()));
  
  // Initialize filters from URL params
  const initialFilters = {
    sortBy: searchParams.get("sortBy") || "popularity.desc",
    year: searchParams.get("year") || "",
    minRating: searchParams.get("minRating") || "",
    genre: searchParams.get("genre") || "",
  };

  // Use the custom hook
  const {
    filteredMovies,
    isLoading,
    error,
    totalResults,
    hasMore,
    config,
    filters,
    // setFilters,
    loadMore,
    refresh,
    clearFilters,
    updateFilter,
    isEmpty,
    isFiltered,
    hasResults,
    isInitialLoading,
  } = useMovieListing(category, initialFilters);

  const [viewMode, setViewMode] = useState(
    searchParams.get("view") || "grid"
  );
  const [showFilters, setShowFilters] = useState(false);

  // Update URL params when filters or view mode change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.sortBy !== "popularity.desc") params.set("sortBy", filters.sortBy);
    if (filters.year) params.set("year", filters.year);
    if (filters.minRating) params.set("minRating", filters.minRating);
    if (filters.genre) params.set("genre", filters.genre);
    if (viewMode !== "grid") params.set("view", viewMode);

    setSearchParams(params);
  }, [filters, viewMode, setSearchParams]);

  const handleFilterChange = (key, value) => {
    updateFilter(key, value);
  };

  const handleClearFilters = () => {
    clearFilters();
    setShowFilters(false);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <MovieNavigation />
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {config.title}
          </h1>
          <p className="text-gray-400 mb-6">
            {config.description}
          </p>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div className="mb-4 sm:mb-0">
              <p className="text-gray-300">
                {totalResults > 0 && (
                  <span className="text-white font-semibold">
                    {totalResults.toLocaleString()}
                  </span>
                )}
                {totalResults > 0 && " movies"}
                {isFiltered && filteredMovies.length !== totalResults && (
                  <span className="text-gray-400 ml-2">
                    ({filteredMovies.length.toLocaleString()} filtered)
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "grid"
                      ? "bg-red-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "list"
                      ? "bg-red-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {/* Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  showFilters || isFiltered
                    ? "bg-red-600 text-white"
                    : "bg-gray-800 text-white hover:bg-gray-700"
                }`}
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {isFiltered && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {Object.values(filters).filter(v => v !== "" && v !== "popularity.desc").length}
                  </span>
                )}
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    showFilters ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                    className="w-full p-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
                  >
                    <option value="popularity.desc">Popularity (High to Low)</option>
                    <option value="popularity.asc">Popularity (Low to High)</option>
                    <option value="rating.desc">Rating (High to Low)</option>
                    <option value="rating.asc">Rating (Low to High)</option>
                    <option value="date.desc">Release Date (Newest)</option>
                    <option value="date.asc">Release Date (Oldest)</option>
                    <option value="title.asc">Title (A-Z)</option>
                    <option value="title.desc">Title (Z-A)</option>
                  </select>
                </div>

                {/* Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Year
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 2024"
                    value={filters.year}
                    onChange={(e) => handleFilterChange("year", e.target.value)}
                    className="w-full p-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
                    min="1900"
                    max="2030"
                  />
                </div>

                {/* Minimum Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Min Rating
                  </label>
                  <select
                    value={filters.minRating}
                    onChange={(e) => handleFilterChange("minRating", e.target.value)}
                    className="w-full p-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
                  >
                    <option value="">Any Rating</option>
                    <option value="7">7.0+</option>
                    <option value="8">8.0+</option>
                    <option value="9">9.0+</option>
                  </select>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={handleClearFilters}
                    disabled={!isFiltered}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isInitialLoading && (
          <MovieSectionSkeleton cardCount={12} cardSize="medium" />
        )}

        {/* Error State */}
        {error && (
          <ErrorMessage
            message={error}
            onRetry={refresh}
          />
        )}

        {/* Results */}
        {!isLoading && !error && hasResults && (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 mb-8">
                {filteredMovies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    size="medium"
                    showActions={true}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4 mb-8">
                {filteredMovies.map((movie) => (
                  <div
                    key={movie.id}
                    className="bg-gray-800 rounded-lg p-4 flex items-center space-x-4 hover:bg-gray-700 transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/movie/${movie.id}`}
                  >
                    <img
                      src={
                        movie.poster_path
                          ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
                          : "/placeholder-movie.jpg"
                      }
                      alt={movie.title}
                      className="w-16 h-24 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg mb-1">
                        {movie.title}
                      </h3>
                      <p className="text-gray-300 text-sm mb-2">
                        {movie.release_date &&
                          new Date(movie.release_date).getFullYear()}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span>{movie.vote_average?.toFixed(1) || "N/A"}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{movie.release_date || "TBA"}</span>
                        </div>
                      </div>
                      {movie.overview && (
                        <p className="text-gray-400 text-sm mt-2 line-clamp-2">
                          {movie.overview}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center">
                <button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Loading..." : "Load More Movies"}
                </button>
              </div>
            )}
          </>
        )}

        {/* No Results */}
        {!isLoading && !error && isEmpty && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">
              {isFiltered 
                ? "No movies found matching your filters."
                : "No movies available in this category."
              }
            </div>
            {isFiltered && (
              <button
                onClick={handleClearFilters}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieListingPage;