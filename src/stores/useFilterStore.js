import { create } from 'zustand';
import { movieApi } from '../utils/api';

export const useFilterStore = create((set, get) => ({
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

  setActiveFilters: (filters) => {
    set({ activeFilters: { ...filters } });
  },

  toggleFilters: () => {
    set((state) => ({ showFilters: !state.showFilters }));
  },

  hideFilters: () => {
    set({ showFilters: false });
  },

  resetFilters: () => {
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
    set({
      isFilterLoading: true,
      filterError: null,
      activeFilters: { ...filters }
    });

    try {
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

      const response = await movieApi.filterMovies(queryParams.toString());

      let movies = [];
      let pagination = {
        page: page,
        totalPages: 1,
        totalResults: 0,
      };

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

      set({
        filteredMovies: movies,
        filterPagination: pagination,
        isFilterLoading: false,
      });

      return { movies, pagination };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to filter movies';

      set({
        filterError: errorMessage,
        filteredMovies: [],
        isFilterLoading: false,
      });

      throw err;
    }
  },

  changePage: async (page) => {
    const { activeFilters } = get();

    if (get().hasActiveFilters()) {
      await get().applyFilters(activeFilters, page);
    }
  },
}));