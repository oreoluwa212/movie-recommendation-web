// stores/userStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'react-toastify';
import axios from 'axios';
import { userApi, reviewsApi, watchlistsApi } from '../utils/api';

// Create axios instance with default config
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add response interceptor to handle auth errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear invalid tokens
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('authToken');
            // Don't show toast here - let individual operations handle it
        }
        return Promise.reject(error);
    }
);

// IMPROVED: Single global promise cache with better cleanup
class RequestCache {
    constructor() {
        this.cache = new Map();
        this.timeouts = new Map();
    }

    get(key) {
        return this.cache.get(key);
    }

    set(key, promise) {
        this.cache.set(key, promise);

        // Auto-cleanup after 30 seconds to prevent memory leaks
        const timeout = setTimeout(() => {
            this.delete(key);
        }, 30000);

        this.timeouts.set(key, timeout);
    }

    delete(key) {
        this.cache.delete(key);
        const timeout = this.timeouts.get(key);
        if (timeout) {
            clearTimeout(timeout);
            this.timeouts.delete(key);
        }
    }

    clear() {
        this.cache.clear();
        this.timeouts.forEach(timeout => clearTimeout(timeout));
        this.timeouts.clear();
    }

    has(key) {
        return this.cache.has(key);
    }
}

const requestCache = new RequestCache();

// IMPROVED: Authentication check helper
const isAuthenticated = () => {
    return !!(localStorage.getItem('authToken') || sessionStorage.getItem('authToken'));
};

// IMPROVED: User-friendly error message helper
const getUserFriendlyError = (error, operation = 'perform this action') => {
    // Check if it's an authentication error
    if (error.response?.status === 401 ||
        error.message?.toLowerCase().includes('auth') ||
        error.message?.toLowerCase().includes('token') ||
        error.message?.toLowerCase().includes('unauthorized')) {
        return `Please sign in to ${operation}`;
    }

    // Check for network errors
    if (error.code === 'NETWORK_ERROR' || !error.response) {
        return 'Connection error. Please check your internet and try again';
    }

    // Check for server errors
    if (error.response?.status >= 500) {
        return 'Server error. Please try again later';
    }

    // Check for specific error messages from backend
    if (error.response?.data?.message) {
        const backendMessage = error.response.data.message.toLowerCase();

        // Transform common backend messages to user-friendly ones
        if (backendMessage.includes('duplicate') || backendMessage.includes('already exists')) {
            return 'This item already exists';
        }

        if (backendMessage.includes('not found')) {
            return 'Item not found';
        }

        if (backendMessage.includes('validation')) {
            return 'Please check your input and try again';
        }

        // Return the backend message if it's already user-friendly
        return error.response.data.message;
    }

    // Default fallback
    return `Failed to ${operation}. Please try again`;
};

// IMPROVED: Toast management to prevent duplicates
class ToastManager {
    constructor() {
        this.activeToasts = new Set();
        this.toastTimeout = 100; // Prevent duplicate toasts within 100ms
    }

    show(type, message, options = {}) {
        const key = `${type}-${message}`;

        if (this.activeToasts.has(key)) {
            return;
        }

        this.activeToasts.add(key);

        // Remove from active toasts after a short delay
        setTimeout(() => {
            this.activeToasts.delete(key);
        }, this.toastTimeout);

        // Show the toast
        switch (type) {
            case 'success':
                return toast.success(message, options);
            case 'error':
                return toast.error(message, options);
            case 'info':
                return toast.info(message, options);
            case 'warning':
                return toast.warning(message, options);
            default:
                return toast(message, options);
        }
    }

    success(message, options = {}) {
        return this.show('success', message, options);
    }

    error(message, options = {}) {
        return this.show('error', message, options);
    }

    info(message, options = {}) {
        return this.show('info', message, options);
    }

    warning(message, options = {}) {
        return this.show('warning', message, options);
    }
}

const toastManager = new ToastManager();

export const useUserStore = create(
    persist(
        (set, get) => ({
            // State
            favorites: [],
            watchedMovies: [],
            watchlists: [],
            reviews: [],
            profile: null,
            minimalProfile: null,
            isLoading: false,
            error: null,
            lastSync: null,
            isMinimalProfileLoaded: false,
            isMinimalProfileLoading: false,

            // NEW: Add initialization state
            isInitialized: false,
            initializationError: null,

            // Utility methods
            setLoading: (isLoading) => {
                set({ isLoading });
            },

            setError: (error) => {
                set({ error });
            },

            clearError: () => {
                set({ error: null });
            },

            // NEW: Single initialization method that should be called once
            initialize: async () => {
                const cacheKey = 'initialize';
                const currentState = get();

                // Skip if already initialized
                if (currentState.isInitialized) {
                    return { success: true, data: currentState.minimalProfile };
                }

                // Check for existing promise
                if (requestCache.has(cacheKey)) {
                    console.log('⏳ Initialization already in progress, waiting...');
                    return await requestCache.get(cacheKey);
                }

                // Only initialize if authenticated
                if (!isAuthenticated()) {
                    set({ isInitialized: true });
                    return { success: false, error: 'Not authenticated' };
                }

                const initPromise = (async () => {
                    try {
                        set({
                            isMinimalProfileLoading: true,
                            isLoading: true,
                            error: null,
                            initializationError: null
                        });

                        console.log('🚀 Initializing user store...');

                        // Load minimal profile first
                        const response = await apiClient.get('/users/profile/minimal');

                        if (response.data.success && response.data.user) {
                            set({
                                minimalProfile: response.data.user,
                                isMinimalProfileLoaded: true,
                                isMinimalProfileLoading: false,
                                isInitialized: true,
                                isLoading: false,
                                error: null
                            });

                            console.log('✅ User store initialized successfully');
                            return { success: true, data: response.data.user };
                        } else {
                            throw new Error(response.data.message || 'Invalid response from server');
                        }
                    } catch (error) {
                        console.error('❌ User store initialization failed:', error);
                        const errorMessage = getUserFriendlyError(error, 'initialize your profile');

                        set({
                            error: errorMessage,
                            initializationError: errorMessage,
                            isMinimalProfileLoading: false,
                            isLoading: false,
                            isInitialized: true, // Mark as initialized even if failed
                            isMinimalProfileLoaded: false
                        });

                        return { success: false, error: errorMessage };
                    } finally {
                        requestCache.delete(cacheKey);
                    }
                })();

                requestCache.set(cacheKey, initPromise);
                return await initPromise;
            },

            // IMPROVED: Simplified minimal profile loading
            loadMinimalProfile: async (forceRefresh = false) => {
                const currentState = get();

                // If not authenticated, don't load
                if (!isAuthenticated()) {
                    return { success: false, error: 'Not authenticated' };
                }

                // Use cached data if available and not forcing refresh
                if (!forceRefresh && currentState.isMinimalProfileLoaded && currentState.minimalProfile) {
                    return { success: true, data: currentState.minimalProfile };
                }

                // If not initialized, call initialize instead
                if (!currentState.isInitialized) {
                    return await get().initialize();
                }

                // Force refresh logic
                const cacheKey = 'loadMinimalProfile';

                if (requestCache.has(cacheKey)) {
                    return await requestCache.get(cacheKey);
                }

                const loadPromise = (async () => {
                    try {
                        set({ isMinimalProfileLoading: true, isLoading: true, error: null });

                        const response = await apiClient.get('/users/profile/minimal');

                        if (response.data.success && response.data.user) {
                            set({
                                minimalProfile: response.data.user,
                                isMinimalProfileLoaded: true,
                                isMinimalProfileLoading: false,
                                isLoading: false,
                                error: null
                            });

                            return { success: true, data: response.data.user };
                        } else {
                            throw new Error(response.data.message || 'Invalid response from server');
                        }
                    } catch (error) {
                        const errorMessage = getUserFriendlyError(error, 'load your profile');
                        set({
                            error: errorMessage,
                            isMinimalProfileLoading: false,
                            isLoading: false,
                            isMinimalProfileLoaded: false
                        });

                        return { success: false, error: errorMessage };
                    } finally {
                        requestCache.delete(cacheKey);
                    }
                })();

                requestCache.set(cacheKey, loadPromise);
                return await loadPromise;
            },

            // IMPROVED: Load full profile with better caching
            loadProfile: async (forceRefresh = false) => {
                const cacheKey = 'loadProfile';
                const currentState = get();

                if (!isAuthenticated()) {
                    return { success: false, error: 'Not authenticated' };
                }

                // Return cached data if available and not forcing refresh
                if (!forceRefresh && currentState.profile) {
                    return { success: true, data: currentState.profile };
                }

                // Check for existing request
                if (requestCache.has(cacheKey)) {
                    return await requestCache.get(cacheKey);
                }

                const loadPromise = (async () => {
                    try {
                        set({ isLoading: true, error: null });

                        const response = await apiClient.get('/users/profile');

                        if (response.data.success && response.data.user) {
                            // Map API response to store structure
                            const profile = {
                                ...response.data.user,
                                stats: response.data.user.stats || {}
                            };

                            // Extract and map user data
                            const favorites = response.data.user.favoriteMovies?.map(fav => ({
                                movieId: fav.movieId,
                                title: fav.title,
                                poster: fav.poster,
                                addedAt: fav.addedAt,
                                _id: fav._id
                            })) || [];

                            const watchedMovies = response.data.user.watchedMovies?.map(watched => ({
                                movieId: watched.movieId,
                                title: watched.title,
                                poster: watched.poster,
                                rating: watched.rating,
                                watchedAt: watched.watchedAt,
                                _id: watched._id
                            })) || [];

                            set({
                                profile,
                                favorites,
                                watchedMovies,
                                minimalProfile: {
                                    _id: response.data.user._id,
                                    username: response.data.user.username,
                                    avatar: response.data.user.avatar,
                                    isEmailVerified: response.data.user.isEmailVerified,
                                    preferences: response.data.user.preferences
                                },
                                isMinimalProfileLoaded: true,
                                isInitialized: true,
                                isLoading: false,
                                lastSync: new Date().toISOString()
                            });

                            return { success: true, data: profile };
                        } else {
                            throw new Error(response.data.message || 'Invalid response from server');
                        }
                    } catch (error) {
                        const errorMessage = getUserFriendlyError(error, 'load your profile');
                        set({ isLoading: false, error: errorMessage });
                        console.error('Load profile failed:', errorMessage);
                        throw error;
                    } finally {
                        requestCache.delete(cacheKey);
                    }
                })();

                requestCache.set(cacheKey, loadPromise);
                return await loadPromise;
            },

            // IMPROVED: Better sync management
            syncWithServer: async (forceRefresh = false) => {
                const cacheKey = 'syncWithServer';

                if (!isAuthenticated()) {
                    return { success: false, error: 'Not authenticated' };
                }

                // Check for existing sync
                if (requestCache.has(cacheKey)) {
                    return await requestCache.get(cacheKey);
                }

                const syncPromise = (async () => {
                    try {
                        set({ isLoading: true, error: null });

                        // Initialize if not done
                        if (!get().isInitialized) {
                            await get().initialize();
                        }

                        // Load profile if not loaded or force refresh
                        if (!get().profile || forceRefresh) {
                            await get().loadProfile(forceRefresh);
                        }

                        // Load additional data
                        const [watchlistsResponse, reviewsResponse] = await Promise.all([
                            watchlistsApi.getUserWatchlists(),
                            reviewsApi.getUserReviews()
                        ]);

                        const watchlists = watchlistsResponse.watchlists || watchlistsResponse.data || watchlistsResponse || [];
                        const reviews = reviewsResponse.reviews || reviewsResponse.data || reviewsResponse || [];

                        set({
                            watchlists,
                            reviews,
                            lastSync: new Date().toISOString(),
                            isLoading: false
                        });

                        const currentState = get();
                        return {
                            favorites: currentState.favorites,
                            watched: currentState.watchedMovies,
                            watchlists,
                            reviews,
                            profile: currentState.profile
                        };
                    } catch (error) {
                        const errorMessage = getUserFriendlyError(error, 'sync your data');
                        set({ isLoading: false, error: errorMessage });
                        console.error('Sync failed:', errorMessage);
                        throw error;
                    } finally {
                        requestCache.delete(cacheKey);
                    }
                })();

                requestCache.set(cacheKey, syncPromise);
                return await syncPromise;
            },

            // IMPROVED: Better cleanup
            resetLoadingStates: () => {
                set({
                    isMinimalProfileLoaded: false,
                    isMinimalProfileLoading: false,
                    isLoading: false,
                    isInitialized: false,
                    initializationError: null
                });
                requestCache.clear();
            },

            clearAllData: () => {
                set({
                    favorites: [],
                    watchedMovies: [],
                    watchlists: [],
                    reviews: [],
                    profile: null,
                    minimalProfile: null,
                    isLoading: false,
                    isMinimalProfileLoading: false,
                    error: null,
                    lastSync: null,
                    isMinimalProfileLoaded: false,
                    isInitialized: false,
                    initializationError: null
                });
                requestCache.clear();
                toastManager.info('All data cleared');
            },

            reset: () => {
                set({
                    favorites: [],
                    watchedMovies: [],
                    watchlists: [],
                    reviews: [],
                    profile: null,
                    minimalProfile: null,
                    isLoading: false,
                    isMinimalProfileLoading: false,
                    error: null,
                    lastSync: null,
                    isMinimalProfileLoaded: false,
                    isInitialized: false,
                    initializationError: null
                });
                requestCache.clear();
            },

            // Helper methods
            hasMinimalProfile: () => {
                const currentState = get();
                return currentState.isMinimalProfileLoaded && currentState.minimalProfile;
            },

            isReady: () => {
                const currentState = get();
                return currentState.isInitialized && !currentState.isMinimalProfileLoading;
            },

            refreshMinimalProfile: async () => {
                return await get().loadMinimalProfile(true);
            },

            // ... rest of your existing methods remain the same
            getWatchedRating: (movieId) => {
                const watched = get().watchedMovies;
                const watchedMovie = watched.find(w => w.movieId === movieId);
                return watchedMovie ? watchedMovie.rating : null;
            },

            getUserReviewForMovie: (movieId) => {
                const reviews = get().reviews;
                return reviews.find(r => r.movieId === movieId);
            },

            getWatchlistsContainingMovie: (movieId) => {
                const watchlists = get().watchlists;
                return watchlists.filter(w => w.movies.some(m => m.id === movieId));
            },

            getNavbarData: () => {
                const minimalProfile = get().minimalProfile;
                const favorites = get().favorites;
                const watchedMovies = get().watchedMovies;

                return {
                    user: minimalProfile,
                    quickStats: {
                        favorites: favorites.length,
                        watched: watchedMovies.length
                    }
                };
            },

            // IMPROVED: Favorites management with better error handling
            addToFavorites: async (movieData) => {
                // Check authentication first
                if (!isAuthenticated()) {
                    toastManager.error('Please sign in to add movies to your favorites');
                    return { success: false, error: 'Not authenticated' };
                }

                const currentFavorites = get().favorites;
                const isAlreadyFavorite = currentFavorites.some(fav => fav.movieId === movieData.id);

                if (isAlreadyFavorite) {
                    toastManager.info('Movie is already in your favorites!');
                    return { success: false, error: 'Already in favorites' };
                }

                set({ isLoading: true, error: null });

                try {
                    const favoriteMovie = {
                        movieId: movieData.id,
                        title: movieData.title,
                        poster: movieData.poster_path,
                        addedAt: new Date().toISOString(),
                        ...movieData
                    };

                    // First update local state for immediate UI response
                    const updatedFavorites = [...currentFavorites, favoriteMovie];
                    set({ favorites: updatedFavorites });

                    // Update profile stats
                    const currentProfile = get().profile;
                    if (currentProfile) {
                        set({
                            profile: {
                                ...currentProfile,
                                stats: {
                                    ...currentProfile.stats,
                                    totalFavorites: updatedFavorites.length
                                }
                            }
                        });
                    }

                    // Then sync with server
                    await userApi.addFavorite(favoriteMovie);

                    set({ isLoading: false });
                    toastManager.success(`Added "${movieData.title}" to favorites!`);
                    return { success: true, data: favoriteMovie };
                } catch (error) {
                    // Rollback on error
                    set({
                        favorites: currentFavorites,
                        isLoading: false,
                        error: getUserFriendlyError(error, 'add to favorites')
                    });

                    const errorMessage = getUserFriendlyError(error, 'add to favorites');
                    toastManager.error(errorMessage);
                    console.error('Add to favorites failed:', error);
                    return { success: false, error: errorMessage };
                }
            },

            removeFromFavorites: async (movieId) => {
                // Check authentication first
                if (!isAuthenticated()) {
                    toastManager.error('Please sign in to remove movies from your favorites');
                    return { success: false, error: 'Not authenticated' };
                }

                const currentFavorites = get().favorites;
                const movieToRemove = currentFavorites.find(fav => fav.movieId === movieId);

                if (!movieToRemove) {
                    toastManager.info('Movie not found in favorites');
                    return { success: false, error: 'Movie not in favorites' };
                }

                set({ isLoading: true, error: null });

                try {
                    // First update local state
                    const updatedFavorites = currentFavorites.filter(fav => fav.movieId !== movieId);
                    set({ favorites: updatedFavorites });

                    // Update profile stats
                    const currentProfile = get().profile;
                    if (currentProfile) {
                        set({
                            profile: {
                                ...currentProfile,
                                stats: {
                                    ...currentProfile.stats,
                                    totalFavorites: updatedFavorites.length
                                }
                            }
                        });
                    }

                    // Then sync with server
                    await userApi.removeFavorite(movieId);

                    set({ isLoading: false });
                    toastManager.success(`Removed "${movieToRemove.title}" from favorites!`);
                    return { success: true };
                } catch (error) {
                    // Rollback on error
                    set({
                        favorites: currentFavorites,
                        isLoading: false,
                        error: getUserFriendlyError(error, 'remove from favorites')
                    });

                    const errorMessage = getUserFriendlyError(error, 'remove from favorites');
                    toastManager.error(errorMessage);
                    console.error('Remove from favorites failed:', error);
                    return { success: false, error: errorMessage };
                }
            },

            // IMPROVED: Watched movies management with better error handling
            addToWatched: async (movieData, userRating = null) => {
                // Check authentication first
                if (!isAuthenticated()) {
                    toastManager.error('Please sign in to add movies to your watched list');
                    return { success: false, error: 'Not authenticated' };
                }

                const currentWatched = get().watchedMovies;
                const isAlreadyWatched = currentWatched.some(watched => watched.movieId === movieData.id);

                if (isAlreadyWatched) {
                    toastManager.info('Movie is already in your watched list!');
                    return { success: false, error: 'Already watched' };
                }

                set({ isLoading: true, error: null });

                try {
                    const watchedMovie = {
                        movieId: movieData.id,
                        title: movieData.title,
                        poster: movieData.poster_path,
                        rating: userRating,
                        watchedAt: new Date().toISOString(),
                        ...movieData
                    };

                    // First update local state
                    const updatedWatched = [...currentWatched, watchedMovie];
                    set({ watchedMovies: updatedWatched });

                    // Update profile stats
                    const currentProfile = get().profile;
                    if (currentProfile) {
                        const ratedMovies = updatedWatched.filter(movie => movie.rating);
                        const averageRating = ratedMovies.length > 0
                            ? (ratedMovies.reduce((sum, movie) => sum + movie.rating, 0) / ratedMovies.length).toFixed(1)
                            : "0";

                        set({
                            profile: {
                                ...currentProfile,
                                stats: {
                                    ...currentProfile.stats,
                                    totalWatched: updatedWatched.length,
                                    averageRating
                                }
                            }
                        });
                    }

                    // Then sync with server
                    await userApi.addToWatched(watchedMovie);

                    set({ isLoading: false });
                    toastManager.success(`Added "${movieData.title}" to watched list!`);
                    return { success: true, data: watchedMovie };
                } catch (error) {
                    // Rollback on error
                    set({
                        watchedMovies: currentWatched,
                        isLoading: false,
                        error: getUserFriendlyError(error, 'add to watched list')
                    });

                    const errorMessage = getUserFriendlyError(error, 'add to watched list');
                    toastManager.error(errorMessage);
                    console.error('Add to watched failed:', error);
                    return { success: false, error: errorMessage };
                }
            },

            removeFromWatched: async (movieId) => {
                // Check authentication first
                if (!isAuthenticated()) {
                    toastManager.error('Please sign in to remove movies from your watched list');
                    return { success: false, error: 'Not authenticated' };
                }

                const currentWatched = get().watchedMovies;
                const movieToRemove = currentWatched.find(watched => watched.movieId === movieId);

                if (!movieToRemove) {
                    toastManager.info('Movie not found in watched list');
                    return { success: false, error: 'Movie not in watched list' };
                }

                set({ isLoading: true, error: null });

                try {
                    // First update local state
                    const updatedWatched = currentWatched.filter(watched => watched.movieId !== movieId);
                    set({ watchedMovies: updatedWatched });

                    // Update profile stats
                    const currentProfile = get().profile;
                    if (currentProfile) {
                        const ratedMovies = updatedWatched.filter(movie => movie.rating);
                        const averageRating = ratedMovies.length > 0
                            ? (ratedMovies.reduce((sum, movie) => sum + movie.rating, 0) / ratedMovies.length).toFixed(1)
                            : "0";

                        set({
                            profile: {
                                ...currentProfile,
                                stats: {
                                    ...currentProfile.stats,
                                    totalWatched: updatedWatched.length,
                                    averageRating
                                }
                            }
                        });
                    }

                    // Then sync with server
                    await userApi.removeFromWatched(movieId);

                    set({ isLoading: false });
                    toastManager.success(`Removed "${movieToRemove.title}" from watched list!`);
                    return { success: true };
                } catch (error) {
                    // Rollback on error
                    set({
                        watchedMovies: currentWatched,
                        isLoading: false,
                        error: getUserFriendlyError(error, 'remove from watched list')
                    });

                    const errorMessage = getUserFriendlyError(error, 'remove from watched list');
                    toastManager.error(errorMessage);
                    console.error('Remove from watched failed:', error);
                    return { success: false, error: errorMessage };
                }
            },

            // Helper methods
            isFavorite: (movieId) => {
                const favorites = get().favorites;
                return favorites.some(fav => fav.movieId === movieId);
            },

            isWatched: (movieId) => {
                const watched = get().watchedMovies;
                return watched.some(w => w.movieId === movieId);
            },

            // Stats
            getStats: () => {
                const favorites = get().favorites;
                const watched = get().watchedMovies;
                const watchlists = get().watchlists;
                const reviews = get().reviews;

                const ratedMovies = watched.filter(movie => movie.rating);
                const averageRating = ratedMovies.length > 0
                    ? ratedMovies.reduce((sum, movie) => sum + movie.rating, 0) / ratedMovies.length
                    : 0;

                return {
                    totalFavorites: favorites.length,
                    totalWatched: watched.length,
                    totalWatchlists: watchlists.length,
                    totalReviews: reviews.length,
                    averageRating,
                    ratedMovies: ratedMovies.length,
                    publicWatchlists: watchlists.filter(w => w.isPublic).length,
                    averageReviewRating: reviews.length > 0
                        ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length
                        : 0
                };
            }
        }),
        {
            name: 'user-store',
            partialize: (state) => ({
                favorites: state.favorites,
                watchedMovies: state.watchedMovies,
                watchlists: state.watchlists,
                reviews: state.reviews,
                profile: state.profile,
                minimalProfile: state.minimalProfile,
                lastSync: state.lastSync,
                isMinimalProfileLoaded: state.isMinimalProfileLoaded,
                isInitialized: state.isInitialized
                // Don't persist loading states
            })
        }
    )
);