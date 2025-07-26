import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'react-toastify';
import { movieApi } from '../utils/api';

export const useMovieStore = create(
  persist(
    (set, get) => ({
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
      isLoadingPopular: false,
      isLoadingTopRated: false,
      isLoadingNowPlaying: false,
      isLoadingUpcoming: false,
      isLoadingGenres: false,
      isLoadingSearch: false,

      setLoading: (isLoading) => {
        set({ isLoading });
      },
      setError: (error) => {
        set({ error });
      },
      clearError: () => {
        set({ error: null });
      },

      searchMovies: async (query, page = 1) => {
        if (!query.trim()) {
          set({ searchResults: [], searchQuery: '' });
          return [];
        }

        set({ isLoadingSearch: true, error: null, searchQuery: query });

        try {
          const response = await movieApi.searchMovies(query, page);

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

          set({
            searchResults: results,
            isLoadingSearch: false
          });
          return results;
        } catch (err) {
          set({ isLoadingSearch: false, error: err.message || 'Search failed' });
          toast.error(err.message || 'Search failed');
          throw err;
        }
      },

      getGenres: async () => {
        set({ isLoadingGenres: true, error: null });

        try {
          const response = await movieApi.getGenres();

          let genres = [];
          if (response.genres) {
            genres = response.genres;
          } else if (Array.isArray(response)) {
            genres = response;
          } else if (response.data) {
            genres = response.data.genres || response.data;
          }

          set({ genres, isLoadingGenres: false });
          return genres;
        } catch (err) {
          set({ isLoadingGenres: false, error: err.message });
          toast.error(err.message || 'Failed to fetch genres');
          throw err;
        }
      },

      getPopularMovies: async (page = 1) => {
        set({ isLoadingPopular: true, error: null });

        try {
          const response = await movieApi.getPopularMovies(page);

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

          set({
            popularMovies: results,
            isLoadingPopular: false
          });
          return results;
        } catch (err) {
          set({ isLoadingPopular: false, error: err.message });
          toast.error(err.message || 'Failed to fetch popular movies');
          throw err;
        }
      },

      getNowPlayingMovies: async (page = 1) => {
        set({ isLoadingNowPlaying: true, error: null });

        try {
          const response = await movieApi.getNowPlayingMovies(page);

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

          set({
            nowPlayingMovies: results,
            isLoadingNowPlaying: false
          });
          return results;
        } catch (err) {
          set({ isLoadingNowPlaying: false, error: err.message });
          toast.error(err.message || 'Failed to fetch now playing movies');
          throw err;
        }
      },

      getTopRatedMovies: async (page = 1) => {
        set({ isLoadingTopRated: true, error: null });

        try {
          const response = await movieApi.getTopRatedMovies(page);

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

          set({
            topRatedMovies: results,
            isLoadingTopRated: false
          });
          return results;
        } catch (err) {
          set({ isLoadingTopRated: false, error: err.message });
          toast.error(err.message || 'Failed to fetch top rated movies');
          throw err;
        }
      },

      getUpcomingMovies: async (page = 1) => {
        set({ isLoadingUpcoming: true, error: null });

        try {
          const response = await movieApi.getUpcomingMovies(page);

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

          set({
            upcomingMovies: results,
            isLoadingUpcoming: false
          });
          return results;
        } catch (err) {
          set({ isLoadingUpcoming: false, error: err.message });
          toast.error(err.message || 'Failed to fetch upcoming movies');
          throw err;
        }
      },

      initializeFeaturedMovies: async () => {
        try {
          const { popularMovies } = get();

          if (popularMovies && popularMovies.length > 0) {
            set({ featuredMovies: popularMovies.slice(0, 5) });
            return;
          }

          const movies = await get().getPopularMovies();
          if (movies && movies.length > 0) {
            set({ featuredMovies: movies.slice(0, 5) });
          }
        } catch {
          set({ featuredMovies: [] });
        }
      },

      initializeAppData: async () => {
        try {
          set({ isLoading: true });

          await get().getGenres();

          const promises = [
            get().getPopularMovies(),
            get().getTopRatedMovies(),
            get().getNowPlayingMovies(),
            get().getUpcomingMovies()
          ];

          await Promise.all(promises);
          await get().initializeFeaturedMovies();

          set({ isLoading: false });
        } catch (err) {
          set({ error: err.message, isLoading: false });
          toast.error('Failed to load movie data. Please refresh the page.');
        }
      },

      clearSearchResults: () => {
        set({ searchResults: [], searchQuery: '' });
      },

      setCurrentMovie: (movie) => {
        set({ currentMovie: movie });
      },

      clearCurrentMovie: () => {
        set({ currentMovie: null });
      },

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

      formatPosterUrl: (path, size = 'w500') =>
        path ? `https://image.tmdb.org/t/p/${size}${path}` : '/placeholder-movie.jpg',

      formatBackdropUrl: (path, size = 'w1280') =>
        path ? `https://image.tmdb.org/t/p/${size}${path}` : '/placeholder-backdrop.jpg',

      getGenreNames: (genreIds) => {
        const { genres } = get();
        if (!genreIds || !Array.isArray(genreIds)) return [];

        return genreIds
          .map(id => genres.find(g => g.id === id)?.name)
          .filter(Boolean);
      }
    }),
    {
      name: 'movie-storage',
      partialize: (state) => ({
        genres: state.genres,
        popularMovies: state.popularMovies,
        topRatedMovies: state.topRatedMovies,
        nowPlayingMovies: state.nowPlayingMovies,
        upcomingMovies: state.upcomingMovies,
        featuredMovies: state.featuredMovies
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
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
    } catch (err) {
      store.setError(err.message);
      throw err;
    } finally {
      store.setLoading(false);
    }
  };

  return {
    ...store,
    filterMovies
  };
};