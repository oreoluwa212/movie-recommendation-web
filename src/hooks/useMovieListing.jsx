import { useState, useEffect, useCallback } from "react";
import { useMovieStore } from "../stores/movieStore";

const useMovieListing = (category, initialFilters = {}) => {
  const {
    popularMovies,
    topRatedMovies,
    nowPlayingMovies,
    upcomingMovies,
    getPopularMovies,
    getTopRatedMovies,
    getNowPlayingMovies,
    getUpcomingMovies,
    getTrendingMovies,
    isLoadingPopular,
    isLoadingTopRated,
    isLoadingNowPlaying,
    isLoadingUpcoming,
    isLoadingTrending,
    // error: movieError,
  } = useMovieStore();

  const [state, setState] = useState({
    movies: [],
    isLoading: false,
    error: null,
    totalResults: 0,
    currentPage: 1,
    hasMore: true,
    initialized: false,
  });

  const [filters, setFilters] = useState({
    sortBy: "popularity.desc",
    year: "",
    minRating: "",
    genre: "",
    ...initialFilters,
  });

  // Category configurations
  const categoryConfig = {
    popular: {
      title: "Popular Movies",
      fetchFunction: getPopularMovies,
      storeMovies: popularMovies,
      isLoading: isLoadingPopular,
      description: "Discover the most popular movies trending right now",
    },
    "top-rated": {
      title: "Top Rated Movies",
      fetchFunction: getTopRatedMovies,
      storeMovies: topRatedMovies,
      isLoading: isLoadingTopRated,
      description: "Explore the highest-rated movies of all time",
    },
    "now-playing": {
      title: "Now Playing in Theaters",
      fetchFunction: getNowPlayingMovies,
      storeMovies: nowPlayingMovies,
      isLoading: isLoadingNowPlaying,
      description: "Movies currently playing in theaters near you",
    },
    upcoming: {
      title: "Coming Soon",
      fetchFunction: getUpcomingMovies,
      storeMovies: upcomingMovies,
      isLoading: isLoadingUpcoming,
      description: "Get ready for these upcoming movie releases",
    },
    trending: {
      title: "Trending Now",
      fetchFunction: getTrendingMovies,
      storeMovies: [],
      isLoading: isLoadingTrending,
      description: "Movies that are trending across all platforms",
    },
    recommendations: {
      title: "Recommended for You",
      fetchFunction: null,
      storeMovies: [],
      isLoading: false,
      description: "Personalized movie recommendations based on your preferences",
    },
  };

  const currentConfig = categoryConfig[category] || categoryConfig.popular;

  // Debug logging
  useEffect(() => {
    console.log('useMovieListing - Category:', category);
    console.log('useMovieListing - Config:', currentConfig);
    console.log('useMovieListing - Available categories:', Object.keys(categoryConfig));
  }, [category, currentConfig]);

  // Fetch movies based on category
  const fetchMovies = useCallback(
    async (page = 1, append = false) => {
      if (!currentConfig.fetchFunction) {
        // Handle special cases like recommendations
        setState(prev => ({
          ...prev,
          initialized: true,
          isLoading: false,
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        const response = await currentConfig.fetchFunction(page);
        const movieData = response.data || response;

        setState(prev => ({
          ...prev,
          movies: append 
            ? [...prev.movies, ...movieData.results]
            : movieData.results,
          totalResults: movieData.total_results || movieData.results?.length || 0,
          currentPage: page,
          hasMore: page < (movieData.total_pages || 1),
          isLoading: false,
          initialized: true,
        }));
      } catch (error) {
        console.error(`Error fetching ${category} movies:`, error);
        setState(prev => ({
          ...prev,
          error: error.message || "Failed to load movies",
          isLoading: false,
          initialized: true,
        }));
      }
    },
    [currentConfig.fetchFunction, category]
  );

  // Load more movies (pagination)
  const loadMore = useCallback(() => {
    if (state.hasMore && !state.isLoading) {
      fetchMovies(state.currentPage + 1, true);
    }
  }, [state.hasMore, state.isLoading, state.currentPage, fetchMovies]);

  // Apply filters and sorting
  const applyFilters = useCallback((movies) => {
    let filtered = [...movies];

    // Filter by year
    if (filters.year) {
      filtered = filtered.filter(
        movie =>
          movie.release_date && movie.release_date.startsWith(filters.year)
      );
    }

    // Filter by minimum rating
    if (filters.minRating) {
      filtered = filtered.filter(
        movie => movie.vote_average >= parseFloat(filters.minRating)
      );
    }

    // Filter by genre
    if (filters.genre) {
      filtered = filtered.filter(
        movie => movie.genre_ids && movie.genre_ids.includes(parseInt(filters.genre))
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
          return b.vote_average - a.vote_average;
        case "rating.asc":
          return a.vote_average - b.vote_average;
        case "date.desc":
          return new Date(b.release_date || 0) - new Date(a.release_date || 0);
        case "date.asc":
          return new Date(a.release_date || 0) - new Date(b.release_date || 0);
        case "title.asc":
          return a.title.localeCompare(b.title);
        case "title.desc":
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [filters]);

  // Refresh movies
  const refresh = useCallback(() => {
    setState(prev => ({ ...prev, movies: [], currentPage: 1, hasMore: true }));
    fetchMovies(1);
  }, [fetchMovies]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({
      sortBy: "popularity.desc",
      year: "",
      minRating: "",
      genre: "",
    });
  }, []);

  // Update specific filter
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Initialize movies
  useEffect(() => {
    // Reset state when category changes
    setState(prev => ({
      ...prev,
      movies: [],
      initialized: false,
      currentPage: 1,
      hasMore: true,
      error: null,
    }));
  }, [category]);

  useEffect(() => {
    if (currentConfig.storeMovies.length > 0 && !state.initialized) {
      setState(prev => ({
        ...prev,
        movies: currentConfig.storeMovies,
        isLoading: false,
        initialized: true,
      }));
    } else if (!state.initialized) {
      fetchMovies(1);
    }
  }, [category, currentConfig.storeMovies, state.initialized, fetchMovies]);

  // Get filtered movies
  const filteredMovies = applyFilters(state.movies);

  return {
    // State
    movies: state.movies,
    filteredMovies,
    isLoading: state.isLoading,
    error: state.error,
    totalResults: state.totalResults,
    currentPage: state.currentPage,
    hasMore: state.hasMore,
    initialized: state.initialized,
    config: currentConfig,
    
    // Filters
    filters,
    setFilters,
    
    // Actions
    fetchMovies,
    loadMore,
    refresh,
    clearFilters,
    updateFilter,
    
    // Computed values
    isEmpty: !state.isLoading && !state.error && filteredMovies.length === 0,
    isFiltered: Object.values(filters).some(value => value !== "" && value !== "popularity.desc"),
    hasResults: filteredMovies.length > 0,
    isInitialLoading: state.isLoading && !state.initialized,
  };
};

export default useMovieListing;