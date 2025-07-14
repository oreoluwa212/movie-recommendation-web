// store/slices/movie/baseSlice.js
import { toast } from 'react-toastify';
import { useAuthStore } from '../../authStore';

// Development flag - set to false in production
const isDevelopment = import.meta.env.NODE_ENV === 'development';

export const createBaseSlice = (set, get, movieApi) => {
    // Toast manager
    const toastManager = {
        success: (message) => toast.success(message),
        error: (message) => toast.error(message),
        info: (message) => toast.info(message),
        warning: (message) => toast.warning(message),
    };

    // Debug utilities
    const debugLog = (message, data = null) => {
        if (isDevelopment) {
            console.log(`[MovieStore] ${message}`, data);
        }
    };

    const debugError = (message, error = null) => {
        if (isDevelopment) {
            console.error(`[MovieStore] ${message}`, error);
        }
    };

    // Cache management
    const cache = new Map();
    const cacheManager = {
        get: (key) => cache.get(key),
        set: (key, value, ttl = 300000) => { // 5 minutes default TTL
            cache.set(key, {
                value,
                expires: Date.now() + ttl
            });
        },
        isValid: (key) => {
            const item = cache.get(key);
            return item && item.expires > Date.now();
        },
        clear: () => cache.clear(),
        delete: (key) => cache.delete(key)
    };

    // Response processor utility
    const processResponse = (response, debugLabel) => {
        debugLog(`${debugLabel} response:`, response);

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

        debugLog(`${debugLabel} processed:`, results);
        return results;
    };

    return {
        // Initial state
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

        // Utilities
        debugLog,
        debugError,
        toastManager,
        cacheManager,
        processResponse,

        // General loading/error management
        setLoading: (isLoading) => {
            set({ isLoading });
        },

        setError: (error) => {
            set({ error });
            if (error) {
                debugError('Movie Store Error:', error);
            }
        },

        clearError: () => {
            set({ error: null });
        },

        // Clear cache
        clearCache: () => {
            cacheManager.clear();
            debugLog('Cache cleared');
        },

        isAuthenticated: () => {
            return useAuthStore.getState().checkAuth();
        },

        getUserFriendlyError: (error, context = '') => {
            if (!error) return `An unknown error occurred while trying to ${context}`;
            if (error.response?.data?.message) return error.response.data.message;
            if (error.message) return error.message;
            return `An unexpected error occurred while trying to ${context}`;
        },

        makeApiCall: async (label, apiCall, {
            successMessage,
            errorMessage,
            onSuccess,
            onError
        } = {}) => {
            try {
                set({ isLoading: true, error: null });
                const response = await apiCall();
                set({ isLoading: false });

                if (successMessage) {
                    toastManager.success(successMessage);
                }

                if (onSuccess) {
                    onSuccess(response);
                }

                debugLog(`${label} successful`, response);

                return { success: true, data: response };
            } catch (error) {
                set({ isLoading: false });
                const message = `${errorMessage ? `Failed to ${errorMessage}` : 'An error occurred'}: ${error?.message ?? ''}`;
                toastManager.error(message);

                if (onError) {
                    onError(error);
                }

                debugError(`${label} failed`, error);

                return { success: false, error };
            }
        },

        movieApi,
    };
};