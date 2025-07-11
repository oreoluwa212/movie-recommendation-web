// stores/useFilterStore.js
import { create } from 'zustand';
import { movieApi } from '../utils/api';

export const useFilterStore = create((set, get) => ({
  // State
  activeFilters: {
    genres: [],
    minRating: '',
    maxRating: '',
    releaseYear: '',
    sortBy: '',
    sortOrder: 'desc',
  },
  filteredMovies: [],
  isFilterLoading: false,
  filterError: null,
  filterPagination: {
    page: 1,
    totalPages: 1,
    totalResults: 0,
  },
  showFilters: false,

  // Computed properties
  hasActiveFilters: () => {
    const { activeFilters } = get();
    return (
      activeFilters.genres.length > 0 ||
      activeFilters.minRating !== '' ||
      activeFilters.maxRating !== '' ||
      activeFilters.releaseYear !== '' ||
      activeFilters.sortBy !== ''
    );
  },

  getActiveFilterCount: () => {
    const { activeFilters } = get();
    let count = 0;
    if (activeFilters.genres.length > 0) count++;
    if (activeFilters.minRating !== '') count++;
    if (activeFilters.maxRating !== '') count++;
    if (activeFilters.releaseYear !== '') count++;
    if (activeFilters.sortBy !== '') count++;
    return count;
  },

  // Actions
  setActiveFilters: (filters) => {
    console.log('Setting active filters:', filters);
    set({ activeFilters: { ...filters } });
  },

  toggleFilters: () => {
    set((state) => ({ showFilters: !state.showFilters }));
  },

  hideFilters: () => {
    set({ showFilters: false });
  },

  resetFilters: () => {
    console.log('Resetting filters');
    set({
      activeFilters: {
        genres: [],
        minRating: '',
        maxRating: '',
        releaseYear: '',
        sortBy: '',
        sortOrder: 'desc',
      },
      filteredMovies: [],
      filterPagination: {
        page: 1,
        totalPages: 1,
        totalResults: 0,
      },
      filterError: null,
    });
  },

  applyFilters: async (filters, page = 1) => {
    console.log('Applying filters:', filters, 'Page:', page);

    set({
      isFilterLoading: true,
      filterError: null,
      activeFilters: { ...filters }
    });

    try {
      // Build query parameters
      const queryParams = new URLSearchParams();

      if (page) queryParams.append('page', page.toString());
      if (filters.minRating) queryParams.append('minRating', filters.minRating);
      if (filters.maxRating) queryParams.append('maxRating', filters.maxRating);
      if (filters.releaseYear) queryParams.append('releaseYear', filters.releaseYear);
      if (filters.genres && filters.genres.length > 0) {
        queryParams.append('genres', filters.genres.join(','));
      }
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);

      console.log('Filter query params:', queryParams.toString());

      const response = await movieApi.filterMovies(queryParams.toString());
      console.log('Filter response:', response);

      let movies = [];
      let pagination = {
        page: page,
        totalPages: 1,
        totalResults: 0,
      };

      // Handle different response structures
      if (response.data) {
        movies = response.data.results || response.data.movies || [];
        pagination = {
          page: response.data.page || page,
          totalPages: response.data.totalPages || response.data.total_pages || 1,
          totalResults: response.data.totalResults || response.data.total_results || 0,
        };
      } else if (response.results) {
        movies = response.results;
        pagination = {
          page: response.page || page,
          totalPages: response.totalPages || response.total_pages || 1,
          totalResults: response.totalResults || response.total_results || 0,
        };
      } else if (Array.isArray(response)) {
        movies = response;
      }

      console.log('Processed filter results:', { movies: movies.length, pagination });

      set({
        filteredMovies: movies,
        filterPagination: pagination,
        isFilterLoading: false,
      });

      return { movies, pagination };
    } catch (error) {
      console.error('Filter error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to filter movies';

      set({
        filterError: errorMessage,
        filteredMovies: [],
        isFilterLoading: false,
      });

      throw error;
    }
  },

  changePage: async (page) => {
    const { activeFilters } = get();
    console.log('Changing page to:', page);

    if (get().hasActiveFilters()) {
      await get().applyFilters(activeFilters, page);
    }
  },
}));