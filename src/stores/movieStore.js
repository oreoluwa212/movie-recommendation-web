import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'react-toastify';
import { movieApi } from '../utils/api';

export const useMovieStore = create(
  persist(
    (set, get) => ({
      // State
      movies: [],
      featuredMovies: [],
      popularMovies: [],
      topRatedMovies: [],
      nowPlayingMovies: [],
      upcomingMovies: [],
      searchResults: [],
      currentMovie: null,
      genres: [],
      searchQuery: '',
      isLoading: false,
      error: null,

      // Individual loading states
      isLoadingPopular: false,
      isLoadingTopRated: false,
      isLoadingNowPlaying: false,
      isLoadingUpcoming: false,
      isLoadingGenres: false,
      isLoadingSearch: false,

      // General loading/error setters
      setLoading: (isLoading) => {
        set({ isLoading });
      },
      setError: (error) => {
        set({ error });
        if (error) {
          console.error('Movie Store Error:', error);
        }
      },
      clearError: () => {
        set({ error: null });
      },

      // Search movies
      searchMovies: async (query, page = 1) => {
        if (!query.trim()) {
          set({ searchResults: [], searchQuery: '' });
          return [];
        }

        set({ isLoadingSearch: true, error: null, searchQuery: query });
        console.log('Searching for:', query);

        try {
          const response = await movieApi.searchMovies(query, page);
          console.log('Search response:', response);

          // Handle different response structures
          let results = [];
          if (response.results) {
            results = response.results;
          } else if (response.movies) {
            results = response.movies;
          } else if (Array.isArray(response)) {
            results = response;
          } else if (response.data) {
            results = response.data.results || response.data.movies || response.data;
          }

          console.log('Search results:', results);
          set({
            searchResults: results,
            isLoadingSearch: false
          });
          return results;
        } catch (error) {
          console.error('Search error:', error);
          set({ isLoadingSearch: false, error: error.message || 'Search failed' });
          toast.error(error.message || 'Search failed');
          throw error;
        }
      },

      // Genres
      getGenres: async () => {
        set({ isLoadingGenres: true, error: null });
        console.log('Fetching genres...');

        try {
          const response = await movieApi.getGenres();
          console.log('Genres response:', response);

          let genres = [];
          if (response.genres) {
            genres = response.genres;
          } else if (Array.isArray(response)) {
            genres = response;
          } else if (response.data) {
            genres = response.data.genres || response.data;
          }

          console.log('Processed genres:', genres);
          set({ genres, isLoadingGenres: false });
          return genres;
        } catch (error) {
          console.error('Genres error:', error);
          set({ isLoadingGenres: false, error: error.message });
          toast.error(error.message || 'Failed to fetch genres');
          throw error;
        }
      },

      // Popular movies
      getPopularMovies: async (page = 1) => {
        set({ isLoadingPopular: true, error: null });
        console.log('Fetching popular movies...');

        try {
          const response = await movieApi.getPopularMovies(page);
          console.log('Popular movies response:', response);

          // Handle different response structures
          let results = [];
          if (response.results) {
            results = response.results;
          } else if (response.movies) {
            results = response.movies;
          } else if (Array.isArray(response)) {
            results = response;
          } else if (response.data) {
            results = response.data.results || response.data.movies || response.data;
          }

          console.log('Popular movies processed:', results);
          set({
            popularMovies: results,
            isLoadingPopular: false
          });
          return results;
        } catch (error) {
          console.error('Popular movies error:', error);
          set({ isLoadingPopular: false, error: error.message });
          toast.error(error.message || 'Failed to fetch popular movies');
          throw error;
        }
      },

      // Now playing movies
      getNowPlayingMovies: async (page = 2) => {
        set({ isLoadingNowPlaying: true, error: null });
        console.log('Fetching now playing movies...');

        try {
          const response = await movieApi.getNowPlayingMovies(page);
          console.log('Now playing movies response:', response);

          let results = [];
          if (response.results) {
            results = response.results;
          } else if (response.movies) {
            results = response.movies;
          } else if (Array.isArray(response)) {
            results = response;
          } else if (response.data) {
            results = response.data.results || response.data.movies || response.data;
          }

          console.log('Now playing movies processed:', results);
          set({
            nowPlayingMovies: results,
            isLoadingNowPlaying: false
          });
          return results;
        } catch (error) {
          console.error('Now playing movies error:', error);
          set({ isLoadingNowPlaying: false, error: error.message });
          toast.error(error.message || 'Failed to fetch now playing movies');
          throw error;
        }
      },

      // Top rated movies
      getTopRatedMovies: async (page = 1) => {
        set({ isLoadingTopRated: true, error: null });
        console.log('Fetching top rated movies...');

        try {
          const response = await movieApi.getTopRatedMovies(page);
          console.log('Top rated movies response:', response);

          let results = [];
          if (response.results) {
            results = response.results;
          } else if (response.movies) {
            results = response.movies;
          } else if (Array.isArray(response)) {
            results = response;
          } else if (response.data) {
            results = response.data.results || response.data.movies || response.data;
          }

          console.log('Top rated movies processed:', results);
          set({
            topRatedMovies: results,
            isLoadingTopRated: false
          });
          return results;
        } catch (error) {
          console.error('Top rated movies error:', error);
          set({ isLoadingTopRated: false, error: error.message });
          toast.error(error.message || 'Failed to fetch top rated movies');
          throw error;
        }
      },

      // Upcoming movies
      getUpcomingMovies: async (page = 1) => {
        set({ isLoadingUpcoming: true, error: null });
        console.log('Fetching upcoming movies...');

        try {
          const response = await movieApi.getUpcomingMovies(page);
          console.log('Upcoming movies response:', response);

          let results = [];
          if (response.results) {
            results = response.results;
          } else if (response.movies) {
            results = response.movies;
          } else if (Array.isArray(response)) {
            results = response;
          } else if (response.data) {
            results = response.data.results || response.data.movies || response.data;
          }

          console.log('Upcoming movies processed:', results);
          set({
            upcomingMovies: results,
            isLoadingUpcoming: false
          });
          return results;
        } catch (error) {
          console.error('Upcoming movies error:', error);
          set({ isLoadingUpcoming: false, error: error.message });
          toast.error(error.message || 'Failed to fetch upcoming movies');
          throw error;
        }
      },

      // Initialize featured movies
      initializeFeaturedMovies: async () => {
        try {
          console.log('Initializing featured movies...');
          const { popularMovies } = get();

          if (popularMovies && popularMovies.length > 0) {
            console.log('Using existing popular movies for featured');
            set({ featuredMovies: popularMovies.slice(0, 5) });
            return;
          }

          console.log('Fetching popular movies for featured');
          const movies = await get().getPopularMovies();
          if (movies && movies.length > 0) {
            set({ featuredMovies: movies.slice(0, 5) });
            console.log('Featured movies set:', movies.slice(0, 5));
          }
        } catch (error) {
          console.error('Featured movies initialization error:', error);
          set({ featuredMovies: [] });
        }
      },

      // Initialize app data
      initializeAppData: async () => {
        try {
          console.log('🎬 Initializing app data...');
          set({ isLoading: true });

          // First get genres
          await get().getGenres();

          // Then get all movie categories in parallel
          const promises = [
            get().getPopularMovies(),
            get().getTopRatedMovies(),
            get().getNowPlayingMovies(),
            get().getUpcomingMovies()
          ];

          await Promise.all(promises);

          // Initialize featured movies after popular movies are loaded
          await get().initializeFeaturedMovies();

          set({ isLoading: false });
          console.log('✅ App data initialized successfully');

          // Log current state for debugging
          const state = get();
          console.log('Current state:', {
            popularMovies: state.popularMovies.length,
            topRatedMovies: state.topRatedMovies.length,
            nowPlayingMovies: state.nowPlayingMovies.length,
            upcomingMovies: state.upcomingMovies.length,
            featuredMovies: state.featuredMovies.length,
            genres: state.genres.length
          });

        } catch (error) {
          console.error('❌ Failed to initialize app data:', error);
          set({ error: error.message, isLoading: false });
          toast.error('Failed to load movie data. Please refresh the page.');
        }
      },

      // Utility methods
      clearSearchResults: () => {
        set({ searchResults: [], searchQuery: '' });
      },

      setCurrentMovie: (movie) => {
        set({ currentMovie: movie });
      },

      clearCurrentMovie: () => {
        set({ currentMovie: null });
      },

      // Get movie by ID from all available sources
      getMovieById: (id) => {
        const {
          movies,
          popularMovies,
          topRatedMovies,
          nowPlayingMovies,
          upcomingMovies,
          searchResults
        } = get();

        const allMovies = [
          ...movies,
          ...popularMovies,
          ...topRatedMovies,
          ...nowPlayingMovies,
          ...upcomingMovies,
          ...searchResults
        ];

        return allMovies.find(m => m.id === parseInt(id));
      },

      // Image URL formatters
      formatPosterUrl: (path, size = 'w500') =>
        path ? `https://image.tmdb.org/t/p/${size}${path}` : '/placeholder-movie.jpg',

      formatBackdropUrl: (path, size = 'w1280') =>
        path ? `https://image.tmdb.org/t/p/${size}${path}` : '/placeholder-backdrop.jpg',

      // Get genre names from IDs
      getGenreNames: (genreIds) => {
        const { genres } = get();
        if (!genreIds || !Array.isArray(genreIds)) return [];

        return genreIds
          .map(id => genres.find(g => g.id === id)?.name)
          .filter(Boolean);
      },

      // Debug method to check current state
      debugState: () => {
        const state = get();
        console.log('🔍 Movie Store Debug State:', {
          popularMovies: state.popularMovies.length,
          topRatedMovies: state.topRatedMovies.length,
          nowPlayingMovies: state.nowPlayingMovies.length,
          upcomingMovies: state.upcomingMovies.length,
          featuredMovies: state.featuredMovies.length,
          genres: state.genres.length,
          searchResults: state.searchResults.length,
          isLoading: state.isLoading,
          error: state.error,
          loadingStates: {
            popular: state.isLoadingPopular,
            topRated: state.isLoadingTopRated,
            nowPlaying: state.isLoadingNowPlaying,
            upcoming: state.isLoadingUpcoming,
            genres: state.isLoadingGenres,
            search: state.isLoadingSearch
          }
        });
        return state;
      }
    }),
    {
      name: 'movie-storage',
      partialize: (state) => ({
        genres: state.genres,
        // Optional: persist movies for better UX
        popularMovies: state.popularMovies,
        topRatedMovies: state.topRatedMovies,
        nowPlayingMovies: state.nowPlayingMovies,
        upcomingMovies: state.upcomingMovies,
        featuredMovies: state.featuredMovies
      }),
      onRehydrateStorage: () => (state) => {
        console.log('🔄 Rehydrating movie store...');
        if (state) {
          // Always initialize app data on rehydration to ensure fresh data
          setTimeout(() => {
            state.initializeAppData?.();
          }, 100);
        }
      }
    }
  )
);

export const useMovieStoreWithFilters = () => {
  const store = useMovieStore();

  const filterMovies = async (filters) => {
    store.setLoading(true);
    store.setError(null);

    try {
      const params = new URLSearchParams();

      // Build query parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          if (Array.isArray(value) && value.length > 0) {
            params.append(key, value.join(','));
          } else if (!Array.isArray(value)) {
            params.append(key, value);
          }
        }
      });

      const response = await movieApi.filterMovies(params.toString());

      return {
        movies: response.data.results || [],
        pagination: {
          page: response.data.page || 1,
          totalPages: response.data.totalPages || 1,
          totalResults: response.data.totalResults || 0
        }
      };
    } catch (error) {
      store.setError(error.message);
      throw error;
    } finally {
      store.setLoading(false);
    }
  };

  return {
    ...store,
    filterMovies
  };
};