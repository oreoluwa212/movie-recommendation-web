import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, Filter, Grid, List, Star, Calendar, X } from "lucide-react";
import { movieApi } from "../utils/api";
import MovieCard from "../components/MovieCard";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { MovieSectionSkeleton } from "../components/loaders/SkeletonLoaders";

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [searchState, setSearchState] = useState({
    query: searchParams.get("query") || "",
    results: [],
    isLoading: false,
    error: null,
    totalResults: 0,
    totalPages: 0,
    currentPage: 1,
    hasSearched: false,
  });

  const [filters, setFilters] = useState({
    sortBy: "popularity.desc",
    year: "",
    minRating: "",
  });

  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);

  const searchMovies = useCallback(
    async (query, page = 1) => {
      if (!query.trim()) return;

      setSearchState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await movieApi.searchMovies(query, page);

        // Handle the API response format with data wrapper
        const movieData = response.data || response;

        setSearchState((prev) => ({
          ...prev,
          results: movieData.results || [],
          totalResults: movieData.total_results || 0,
          totalPages: movieData.total_pages || 0,
          currentPage: page,
          isLoading: false,
          hasSearched: true,
        }));

        // Update URL params
        setSearchParams({ query, page: page.toString() });
      } catch (error) {
        console.error("Search error:", error);
        setSearchState((prev) => ({
          ...prev,
          error: error.message || "Search failed",
          isLoading: false,
          hasSearched: true,
        }));
      }
    },
    [setSearchParams]
  );

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchState.query.trim()) {
      searchMovies(searchState.query, 1);
    }
  };

  const handlePageChange = (page) => {
    searchMovies(searchState.query, page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearSearch = () => {
    setSearchState((prev) => ({
      ...prev,
      query: "",
      results: [],
      hasSearched: false,
      error: null,
      totalResults: 0,
    }));
    setSearchParams({});
  };

  const applyFilters = (movies) => {
    let filtered = [...movies];

    // Filter by year
    if (filters.year) {
      filtered = filtered.filter(
        (movie) =>
          movie.releaseDate && movie.releaseDate.startsWith(filters.year)
      );
    }

    // Filter by minimum rating
    if (filters.minRating) {
      filtered = filtered.filter(
        (movie) => movie.rating >= parseFloat(filters.minRating)
      );
    }

    // Sort movies
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case "popularity.desc":
          return b.popularity - a.popularity;
        case "popularity.asc":
          return a.popularity - b.popularity;
        case "rating.desc":
          return b.rating - a.rating;
        case "rating.asc":
          return a.rating - b.rating;
        case "date.desc":
          return new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0);
        case "date.asc":
          return new Date(a.releaseDate || 0) - new Date(b.releaseDate || 0);
        case "title.asc":
          return a.title.localeCompare(b.title);
        case "title.desc":
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredResults = applyFilters(searchState.results);

  // Search on component mount if query exists
  useEffect(() => {
    const query = searchParams.get("query");
    const page = parseInt(searchParams.get("page")) || 1;

    if (query) {
      setSearchState((prev) => ({ ...prev, query }));
      searchMovies(query, page);
    }
  }, [searchParams, searchMovies]);

  const renderPagination = () => {
    if (searchState.totalPages <= 1) return null;

    const pages = [];
    const currentPage = searchState.currentPage;
    const totalPages = Math.min(searchState.totalPages, 500);

    // Always show first page
    pages.push(1);

    // Add ellipsis if needed
    if (currentPage > 4) {
      pages.push("...");
    }

    // Add pages around current page
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }

    // Add ellipsis if needed
    if (currentPage < totalPages - 3) {
      pages.push("...");
    }

    // Always show last page (if not already included)
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return (
      <div className="flex justify-center items-center space-x-2 mt-8">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
        >
          Previous
        </button>

        {pages.map((page, index) => (
          <button
            key={index}
            onClick={() => page !== "..." && handlePageChange(page)}
            disabled={page === "..."}
            className={`px-3 py-2 rounded-lg transition-colors ${
              page === currentPage
                ? "bg-red-600 text-white"
                : page === "..."
                ? "text-gray-400 cursor-default"
                : "bg-gray-800 text-white hover:bg-gray-700"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Search Movies</h1>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for movies..."
                value={searchState.query}
                onChange={(e) =>
                  setSearchState((prev) => ({ ...prev, query: e.target.value }))
                }
                className="w-full pl-10 pr-12 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-red-500 focus:outline-none text-lg"
              />
              {searchState.query && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </form>

          {/* Search Results Info */}
          {searchState.hasSearched && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
              <div className="mb-4 sm:mb-0">
                {searchState.query && (
                  <p className="text-gray-300">
                    {searchState.totalResults > 0 ? (
                      <>
                        Found{" "}
                        <span className="text-white font-semibold">
                          {searchState.totalResults.toLocaleString()}
                        </span>{" "}
                        results for
                        <span className="text-red-400 font-semibold">
                          {" "}
                          "{searchState.query}"
                        </span>
                      </>
                    ) : (
                      <>
                        No results found for{" "}
                        <span className="text-red-400 font-semibold">
                          "{searchState.query}"
                        </span>
                      </>
                    )}
                  </p>
                )}
              </div>

              {filteredResults.length > 0 && (
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
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Filter className="h-4 w-4" />
                    <span>Filters</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        sortBy: e.target.value,
                      }))
                    }
                    className="w-full p-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
                  >
                    <option value="popularity.desc">
                      Popularity (High to Low)
                    </option>
                    <option value="popularity.asc">
                      Popularity (Low to High)
                    </option>
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
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, year: e.target.value }))
                    }
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
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        minRating: e.target.value,
                      }))
                    }
                    className="w-full p-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
                  >
                    <option value="">Any Rating</option>
                    <option value="7">7.0+</option>
                    <option value="8">8.0+</option>
                    <option value="9">9.0+</option>
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              <div className="mt-4">
                <button
                  onClick={() =>
                    setFilters({
                      sortBy: "popularity.desc",
                      year: "",
                      minRating: "",
                    })
                  }
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {searchState.isLoading && (
          <MovieSectionSkeleton cardCount={12} cardSize="medium" />
        )}

        {/* Error State */}
        {searchState.error && (
          <ErrorMessage
            message={searchState.error}
            onRetry={() =>
              searchMovies(searchState.query, searchState.currentPage)
            }
          />
        )}

        {/* Results */}
        {!searchState.isLoading &&
          !searchState.error &&
          searchState.hasSearched && (
            <>
              {filteredResults.length > 0 ? (
                <>
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 mb-8">
                      {filteredResults.map((movie) => (
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
                      {filteredResults.map((movie) => (
                        <div
                          key={movie.id}
                          className="bg-gray-800 rounded-lg p-4 flex items-center space-x-4 hover:bg-gray-700 transition-colors cursor-pointer"
                          onClick={() => navigate(`/movie/${movie.id}`)}
                        >
                          <img
                            src={movie.poster || "/placeholder-movie.jpg"}
                            alt={movie.title}
                            className="w-16 h-24 object-cover rounded-lg flex-shrink-0"
                          />
                          <div className="flex-1">
                            <h3 className="text-white font-semibold text-lg mb-1">
                              {movie.title}
                            </h3>
                            <p className="text-gray-300 text-sm mb-2">
                              {movie.releaseDate &&
                                new Date(movie.releaseDate).getFullYear()}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-400">
                              <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                <span>{movie.rating?.toFixed(1) || "N/A"}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>{movie.releaseDate || "TBA"}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {renderPagination()}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-lg mb-4">
                    <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    No movies found matching your search.
                  </div>
                  <p className="text-gray-500 mb-6">
                    Try adjusting your search terms or filters.
                  </p>
                  <button
                    onClick={clearSearch}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Clear Search
                  </button>
                </div>
              )}
            </>
          )}

        {/* Initial State */}
        {!searchState.hasSearched && (
          <div className="text-center py-16">
            <Search className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Search for Movies
            </h2>
            <p className="text-gray-400 max-w-md mx-auto">
              Enter a movie title, actor, or director to find your next favorite
              film.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
