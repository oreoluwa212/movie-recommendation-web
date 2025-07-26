import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'react-toastify';
import axios from 'axios';
import { userApi, reviewsApi, watchlistsApi } from '../utils/api';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

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

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('authToken');
        }
        return Promise.reject(error);
    }
);

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

const isAuthenticated = () => {
    return !!(localStorage.getItem('authToken') || sessionStorage.getItem('authToken'));
};

const getUserFriendlyError = (error, operation = 'perform this action') => {
    if (error.response?.status === 401 ||
        error.message?.toLowerCase().includes('auth') ||
        error.message?.toLowerCase().includes('token') ||
        error.message?.toLowerCase().includes('unauthorized')) {
        return `Please sign in to ${operation}`;
    }

    if (error.code === 'NETWORK_ERROR' || !error.response) {
        return 'Connection error. Please check your internet and try again';
    }

    if (error.response?.status >= 500) {
        return 'Server error. Please try again later';
    }

    if (error.response?.data?.message) {
        const backendMessage = error.response.data.message.toLowerCase();

        if (backendMessage.includes('duplicate') || backendMessage.includes('already exists')) {
            return 'This item already exists';
        }

        if (backendMessage.includes('not found')) {
            return 'Item not found';
        }

        if (backendMessage.includes('validation')) {
            return 'Please check your input and try again';
        }

        return error.response.data.message;
    }

    return `Failed to ${operation}. Please try again`;
};

class ToastManager {
    constructor() {
        this.activeToasts = new Set();
        this.toastTimeout = 100;
    }

    show(type, message, options = {}) {
        const key = `${type}-${message}`;

        if (this.activeToasts.has(key)) {
            return;
        }

        this.activeToasts.add(key);

        setTimeout(() => {
            this.activeToasts.delete(key);
        }, this.toastTimeout);

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
}

const toastManager = new ToastManager();

const normalizeMovieId = (id) => {
    if (id === null || id === undefined) return null;
    return String(id);
};

const normalizeMovieData = (movieData) => {
    if (!movieData) return null;

    const movieId = movieData.movieId || movieData.id;
    if (!movieId) {
        console.warn('Movie data missing ID:', movieData);
        return null;
    }

    return {
        movieId: normalizeMovieId(movieId),
        title: movieData.title || 'Unknown Title',
        poster: movieData.poster_path || movieData.poster || null,
        addedAt: movieData.addedAt || new Date().toISOString(),
        overview: movieData.overview,
        release_date: movieData.release_date || movieData.releaseDate,
        rating: movieData.rating,
        _id: movieData._id
    };
};

export const useUserStore = create(
    persist(
        (set, get) => ({
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
            isProfileUpdateLoading: false,
            profileUpdateError: null,
            isInitialized: false,
            initializationError: null,
            isDataValidated: false,
            isAvatarLoading: false,
            avatarError: null,

            setLoading: (isLoading) => {
                set({ isLoading });
            },

            setError: (error) => {
                set({ error });
            },

            clearError: () => {
                set({ error: null });
            },

            validateAndCleanData: () => {
                const currentState = get();

                const cleanFavorites = (currentState.favorites || [])
                    .map(normalizeMovieData)
                    .filter(Boolean)
                    .filter((movie, index, arr) =>
                        arr.findIndex(m => m.movieId === movie.movieId) === index
                    );

                const cleanWatchedMovies = (currentState.watchedMovies || [])
                    .map(normalizeMovieData)
                    .filter(Boolean)
                    .filter((movie, index, arr) =>
                        arr.findIndex(m => m.movieId === movie.movieId) === index
                    );

                const favoritesChanged = JSON.stringify(cleanFavorites) !== JSON.stringify(currentState.favorites);
                const watchedChanged = JSON.stringify(cleanWatchedMovies) !== JSON.stringify(currentState.watchedMovies);

                if (favoritesChanged || watchedChanged) {
                    console.log('Cleaning up invalid data:', {
                        favoritesBefore: currentState.favorites?.length || 0,
                        favoritesAfter: cleanFavorites.length,
                        watchedBefore: currentState.watchedMovies?.length || 0,
                        watchedAfter: cleanWatchedMovies.length
                    });

                    set({
                        favorites: cleanFavorites,
                        watchedMovies: cleanWatchedMovies,
                        isDataValidated: true
                    });
                } else {
                    set({ isDataValidated: true });
                }
            },

            clearCorruptedData: () => {
                console.log('Clearing potentially corrupted data...');
                set({
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
                    isInitialized: false,
                    isDataValidated: false
                });

                localStorage.removeItem('user-store');
                requestCache.clear();
                toastManager.info('Data cleared. Please refresh and sign in again.');
            },

            initialize: async () => {
                const cacheKey = 'initialize';
                const currentState = get();

                if (currentState.isInitialized) {
                    return { success: true, data: currentState.minimalProfile };
                }

                if (requestCache.has(cacheKey)) {
                    return await requestCache.get(cacheKey);
                }

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

                        get().validateAndCleanData();

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

                            return { success: true, data: response.data.user };
                        } else {
                            throw new Error(response.data.message || 'Invalid response from server');
                        }
                    } catch (error) {
                        const errorMessage = getUserFriendlyError(error, 'initialize your profile');

                        set({
                            error: errorMessage,
                            initializationError: errorMessage,
                            isMinimalProfileLoading: false,
                            isLoading: false,
                            isInitialized: true,
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

            loadProfile: async (forceRefresh = false) => {
                const cacheKey = 'loadProfile';
                const currentState = get();

                if (!isAuthenticated()) {
                    return { success: false, error: 'Not authenticated' };
                }

                if (!forceRefresh && currentState.profile) {
                    return { success: true, data: currentState.profile };
                }

                if (requestCache.has(cacheKey)) {
                    return await requestCache.get(cacheKey);
                }

                const loadPromise = (async () => {
                    try {
                        set({ isLoading: true, error: null });

                        const response = await apiClient.get('/users/profile');

                        if (response.data.success && response.data.user) {
                            const profile = {
                                ...response.data.user,
                                stats: response.data.user.stats || {}
                            };

                            const serverFavorites = (response.data.user.favoriteMovies || [])
                                .map(fav => normalizeMovieData({
                                    movieId: fav.movieId,
                                    title: fav.title,
                                    poster: fav.poster,
                                    addedAt: fav.addedAt,
                                    _id: fav._id
                                }))
                                .filter(Boolean);

                            const serverWatchedMovies = (response.data.user.watchedMovies || [])
                                .map(watched => normalizeMovieData({
                                    movieId: watched.movieId,
                                    title: watched.title,
                                    poster: watched.poster,
                                    rating: watched.rating,
                                    watchedAt: watched.watchedAt,
                                    _id: watched._id
                                }))
                                .filter(Boolean);

                            set({
                                profile,
                                favorites: serverFavorites,
                                watchedMovies: serverWatchedMovies,
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
                                isDataValidated: true,
                                lastSync: new Date().toISOString()
                            });

                            console.log('Profile loaded from server:', {
                                favorites: serverFavorites.length,
                                watched: serverWatchedMovies.length
                            });

                            return { success: true, data: profile };
                        } else {
                            throw new Error(response.data.message || 'Invalid response from server');
                        }
                    } catch (error) {
                        const errorMessage = getUserFriendlyError(error, 'load your profile');
                        set({ isLoading: false, error: errorMessage });
                        throw error;
                    } finally {
                        requestCache.delete(cacheKey);
                    }
                })();

                requestCache.set(cacheKey, loadPromise);
                return await loadPromise;
            },

            updateProfile: async (profileData) => {
                if (!isAuthenticated()) {
                    const errorMessage = 'Please sign in to update your profile';
                    set({ profileUpdateError: errorMessage });
                    return { success: false, error: errorMessage };
                }

                set({ isProfileUpdateLoading: true, profileUpdateError: null });

                try {
                    const response = await apiClient.put('/users/profile', profileData);

                    if (response.data.success) {
                        const updatedProfile = response.data.user;

                        set({
                            profile: {
                                ...get().profile,
                                ...updatedProfile
                            },
                            minimalProfile: {
                                ...get().minimalProfile,
                                username: updatedProfile.username,
                                email: updatedProfile.email,
                                bio: updatedProfile.bio,
                                avatar: updatedProfile.avatar
                            },
                            isProfileUpdateLoading: false,
                            profileUpdateError: null
                        });

                        return { success: true, data: updatedProfile };
                    } else {
                        throw new Error(response.data.message || 'Failed to update profile');
                    }
                } catch (error) {
                    const errorMessage = getUserFriendlyError(error, 'update your profile');
                    set({
                        isProfileUpdateLoading: false,
                        profileUpdateError: errorMessage
                    });
                    return { success: false, error: errorMessage };
                }
            },

            uploadAvatar: async (formData) => {
                if (!isAuthenticated()) {
                    const errorMessage = 'Please sign in to upload an avatar';
                    set({ avatarError: errorMessage });
                    return { success: false, error: errorMessage };
                }

                set({ isAvatarLoading: true, avatarError: null });

                try {
                    const response = await apiClient.post('/users/avatar', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    });

                    if (response.data.success) {
                        // The backend returns 'avatar' not 'avatarUrl'
                        const avatarUrl = response.data.avatar; // Changed from avatarUrl to avatar

                        // Update both profile and minimalProfile
                        const currentState = get();

                        set({
                            profile: {
                                ...currentState.profile,
                                avatar: avatarUrl
                            },
                            minimalProfile: {
                                ...currentState.minimalProfile,
                                avatar: avatarUrl
                            },
                            isAvatarLoading: false,
                            avatarError: null
                        });

                        return { success: true, data: { avatarUrl } };
                    } else {
                        throw new Error(response.data.message || 'Failed to upload avatar');
                    }
                } catch (error) {
                    const errorMessage = getUserFriendlyError(error, 'upload your avatar');
                    set({
                        isAvatarLoading: false,
                        avatarError: errorMessage
                    });
                    return { success: false, error: errorMessage };
                }
            },

            deleteAvatar: async () => {
                if (!isAuthenticated()) {
                    const errorMessage = 'Please sign in to delete your avatar';
                    set({ avatarError: errorMessage });
                    return { success: false, error: errorMessage };
                }

                set({ isAvatarLoading: true, avatarError: null });

                try {
                    const response = await apiClient.delete('/users/avatar');

                    if (response.data.success) {
                        set({
                            profile: {
                                ...get().profile,
                                avatar: null
                            },
                            minimalProfile: {
                                ...get().minimalProfile,
                                avatar: null
                            },
                            isAvatarLoading: false,
                            avatarError: null
                        });

                        return { success: true };
                    } else {
                        throw new Error(response.data.message || 'Failed to delete avatar');
                    }
                } catch (error) {
                    const errorMessage = getUserFriendlyError(error, 'delete your avatar');
                    set({
                        isAvatarLoading: false,
                        avatarError: errorMessage
                    });
                    return { success: false, error: errorMessage };
                }
            },

            syncWithServer: async () => {
                const cacheKey = 'syncWithServer';

                if (!isAuthenticated()) {
                    return { success: false, error: 'Not authenticated' };
                }

                if (requestCache.has(cacheKey)) {
                    return await requestCache.get(cacheKey);
                }

                const syncPromise = (async () => {
                    try {
                        set({ isLoading: true, error: null });

                        if (!get().isInitialized) {
                            await get().initialize();
                        }

                        await get().loadProfile(true);

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
                        console.log('Sync completed:', {
                            favorites: currentState.favorites.length,
                            watched: currentState.watchedMovies.length,
                            watchlists: watchlists.length,
                            reviews: reviews.length
                        });

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
                        throw error;
                    } finally {
                        requestCache.delete(cacheKey);
                    }
                })();

                requestCache.set(cacheKey, syncPromise);
                return await syncPromise;
            },

            resetLoadingStates: () => {
                set({
                    isMinimalProfileLoaded: false,
                    isMinimalProfileLoading: false,
                    isLoading: false,
                    isInitialized: false,
                    initializationError: null,
                    isDataValidated: false
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
                    initializationError: null,
                    isDataValidated: false
                });
                requestCache.clear();
                localStorage.removeItem('user-store');
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
                    initializationError: null,
                    isDataValidated: false
                });
                requestCache.clear();
            },

            addToFavorites: async (movieData) => {
                if (!isAuthenticated()) {
                    toastManager.error('Please sign in to add movies to your favorites');
                    return { success: false, error: 'Not authenticated' };
                }

                const normalizedMovie = normalizeMovieData(movieData);
                if (!normalizedMovie) {
                    toastManager.error('Invalid movie data');
                    return { success: false, error: 'Invalid movie data' };
                }

                const currentFavorites = get().favorites;
                const isAlreadyFavorite = currentFavorites.some(fav =>
                    normalizeMovieId(fav.movieId) === normalizeMovieId(normalizedMovie.movieId)
                );

                if (isAlreadyFavorite) {
                    toastManager.info('Movie is already in your favorites!');
                    return { success: false, error: 'Already in favorites' };
                }

                set({ isLoading: true, error: null });

                try {
                    await userApi.addFavorite(normalizedMovie);

                    const updatedFavorites = [...currentFavorites, normalizedMovie];
                    set({ favorites: updatedFavorites });

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

                    set({ isLoading: false });
                    toastManager.success(`Added "${normalizedMovie.title}" to favorites!`);
                    return { success: true, data: normalizedMovie };
                } catch (error) {
                    set({ isLoading: false, error: getUserFriendlyError(error, 'add to favorites') });

                    const errorMessage = getUserFriendlyError(error, 'add to favorites');
                    toastManager.error(errorMessage);
                    return { success: false, error: errorMessage };
                }
            },

            removeFromFavorites: async (movieId) => {
                if (!isAuthenticated()) {
                    toastManager.error('Please sign in to remove movies from your favorites');
                    return { success: false, error: 'Not authenticated' };
                }

                const normalizedId = normalizeMovieId(movieId);
                const currentFavorites = get().favorites;
                const movieToRemove = currentFavorites.find(fav =>
                    normalizeMovieId(fav.movieId) === normalizedId
                );

                if (!movieToRemove) {
                    toastManager.info('Movie not found in favorites');
                    return { success: false, error: 'Movie not in favorites' };
                }

                set({ isLoading: true, error: null });

                try {
                    await userApi.removeFavorite(normalizedId);

                    const updatedFavorites = currentFavorites.filter(fav =>
                        normalizeMovieId(fav.movieId) !== normalizedId
                    );
                    set({ favorites: updatedFavorites });

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

                    set({ isLoading: false });
                    toastManager.success(`Removed "${movieToRemove.title}" from favorites!`);
                    return { success: true };
                } catch (error) {
                    set({ isLoading: false, error: getUserFriendlyError(error, 'remove from favorites') });

                    const errorMessage = getUserFriendlyError(error, 'remove from favorites');
                    toastManager.error(errorMessage);
                    return { success: false, error: errorMessage };
                }
            },

            addToWatched: async (movieData, userRating = null) => {
                if (!isAuthenticated()) {
                    toastManager.error('Please sign in to add movies to your watched list');
                    return { success: false, error: 'Not authenticated' };
                }

                const normalizedMovie = normalizeMovieData({
                    ...movieData,
                    rating: userRating,
                    watchedAt: new Date().toISOString()
                });

                if (!normalizedMovie) {
                    toastManager.error('Invalid movie data');
                    return { success: false, error: 'Invalid movie data' };
                }

                const currentWatched = get().watchedMovies;
                const isAlreadyWatched = currentWatched.some(watched =>
                    normalizeMovieId(watched.movieId) === normalizeMovieId(normalizedMovie.movieId)
                );

                if (isAlreadyWatched) {
                    toastManager.info('Movie is already in your watched list!');
                    return { success: false, error: 'Already watched' };
                }

                set({ isLoading: true, error: null });

                try {
                    await userApi.addToWatched(normalizedMovie);

                    const updatedWatched = [...currentWatched, normalizedMovie];
                    set({ watchedMovies: updatedWatched });

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

                    set({ isLoading: false });
                    toastManager.success(`Added "${normalizedMovie.title}" to watched list!`);
                    return { success: true, data: normalizedMovie };
                } catch (error) {
                    set({ isLoading: false, error: getUserFriendlyError(error, 'add to watched list') });

                    const errorMessage = getUserFriendlyError(error, 'add to watched list');
                    toastManager.error(errorMessage);
                    return { success: false, error: errorMessage };
                }
            },

            removeFromWatched: async (movieId) => {
                if (!isAuthenticated()) {
                    toastManager.error('Please sign in to remove movies from your watched list');
                    return { success: false, error: 'Not authenticated' };
                }

                const normalizedId = normalizeMovieId(movieId);
                const currentWatched = get().watchedMovies;
                const movieToRemove = currentWatched.find(watched =>
                    normalizeMovieId(watched.movieId) === normalizedId
                );

                if (!movieToRemove) {
                    toastManager.info('Movie not found in watched list');
                    return { success: false, error: 'Movie not in watched list' };
                }

                set({ isLoading: true, error: null });

                try {
                    await userApi.removeFromWatched(normalizedId);

                    const updatedWatched = currentWatched.filter(watched =>
                        normalizeMovieId(watched.movieId) !== normalizedId
                    );
                    set({ watchedMovies: updatedWatched });

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

                    set({ isLoading: false });
                    toastManager.success(`Removed "${movieToRemove.title}" from watched list!`);
                    return { success: true };
                } catch (error) {
                    set({ isLoading: false, error: getUserFriendlyError(error, 'remove from watched list') });

                    const errorMessage = getUserFriendlyError(error, 'remove from watched list');
                    toastManager.error(errorMessage);
                    return { success: false, error: errorMessage };
                }
            },

            isFavorite: (movieId) => {
                const favorites = get().favorites;
                const normalizedId = normalizeMovieId(movieId);
                return favorites.some(fav => normalizeMovieId(fav.movieId) === normalizedId);
            },

            isWatched: (movieId) => {
                const watched = get().watchedMovies;
                const normalizedId = normalizeMovieId(movieId);
                return watched.some(w => normalizeMovieId(w.movieId) === normalizedId);
            },

            getWatchedRating: (movieId) => {
                const watched = get().watchedMovies;
                const normalizedId = normalizeMovieId(movieId);
                const watchedMovie = watched.find(w => normalizeMovieId(w.movieId) === normalizedId);
                return watchedMovie ? watchedMovie.rating : null;
            },

            getUserReviewForMovie: (movieId) => {
                const reviews = get().reviews;
                const normalizedId = normalizeMovieId(movieId);
                return reviews.find(r => normalizeMovieId(r.movieId) === normalizedId);
            },

            getWatchlistsContainingMovie: (movieId) => {
                const watchlists = get().watchlists;
                const normalizedId = normalizeMovieId(movieId);
                return watchlists.filter(w => w.movies.some(m => normalizeMovieId(m.id) === normalizedId));
            },

            hasMinimalProfile: () => {
                const currentState = get();
                return currentState.isMinimalProfileLoaded && currentState.minimalProfile;
            },

            isReady: () => {
                const currentState = get();
                return currentState.isInitialized && !currentState.isMinimalProfileLoading;
            },

            refreshMinimalProfile: async () => {
                return await get().loadProfile(true);
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
            },

            debugState: () => {
                const state = get();
                console.log('User Store Debug:', {
                    favorites: state.favorites.map(f => ({ id: f.movieId, title: f.title })),
                    watched: state.watchedMovies.map(w => ({ id: w.movieId, title: w.title })),
                    isInitialized: state.isInitialized,
                    isDataValidated: state.isDataValidated,
                    lastSync: state.lastSync
                });
                return state;
            },

            forceRefreshFromServer: async () => {
                console.log('Force refreshing from server...');

                requestCache.clear();

                set({
                    favorites: [],
                    watchedMovies: [],
                    profile: null,
                    isDataValidated: false,
                    lastSync: null
                });

                try {
                    const result = await get().loadProfile(true);
                    toastManager.success('Data refreshed from server');
                    return result;
                } catch (error) {
                    toastManager.error('Failed to refresh data');
                    throw error;
                }
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
                isInitialized: state.isInitialized,
                isDataValidated: state.isDataValidated
            }),
            migrate: (persistedState) => {
                if (persistedState && (
                    !Array.isArray(persistedState.favorites) ||
                    !Array.isArray(persistedState.watchedMovies) ||
                    persistedState.favorites.some(f => !f.movieId) ||
                    persistedState.watchedMovies.some(w => !w.movieId)
                )) {
                    console.log('Detected corrupted data, clearing...');
                    return {
                        favorites: [],
                        watchedMovies: [],
                        watchlists: [],
                        reviews: [],
                        profile: null,
                        minimalProfile: null,
                        lastSync: null,
                        isMinimalProfileLoaded: false,
                        isInitialized: false,
                        isDataValidated: false
                    };
                }
                return persistedState;
            }
        }
    )
);