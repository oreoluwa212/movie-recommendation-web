// stores/watchlist/watchlistSlice.js
import { watchlistsApi } from '../../utils/api';
import { requestCache } from '../../stores/requestCache';
import { toastManager } from '../../utils/toastManager';
import { getUserFriendlyError } from '../../utils/errorHandler';

export const isAuthenticated = () =>
    !!(localStorage.getItem('authToken') || sessionStorage.getItem('authToken'));

export const getWatchlistId = (watchlist) =>
    watchlist?._id || watchlist?.id;

export const isMovieInWatchlist = (watchlist, movieId) => {
    if (!watchlist?.movies || !Array.isArray(watchlist.movies)) return false;
    return watchlist.movies.some(m => Number(m.movieId) === Number(movieId));
};

export const createWatchlistSlice = (set, get) => ({
    // --- STATE ---
    watchlists: [],
    currentWatchlist: null,
    publicWatchlists: [],
    isLoading: false,
    isLoadingPublic: false,
    error: null,
    lastSync: null,
    optimisticUpdates: new Set(),

    // --- MUTATORS ---
    setLoading: (isLoading) => set({ isLoading }),
    setLoadingPublic: (isLoadingPublic) => set({ isLoadingPublic }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),

    // --- CRUD actions exactly as you have them ---
    loadWatchlists: async (forceRefresh = false) => {
        const cacheKey = 'loadWatchlists';
        if (!isAuthenticated()) return { success: false, error: 'Not authenticated' };

        const current = get();
        if (!forceRefresh && current.watchlists.length > 0) {
            return { success: true, data: current.watchlists };
        }

        if (requestCache.has(cacheKey)) {
            return await requestCache.get(cacheKey);
        }

        const loadPromise = (async () => {
            try {
                set({ isLoading: true, error: null });
                const response = await watchlistsApi.getUserWatchlists();
                const watchlists = response.data || response.watchlists || response || [];
                set({ watchlists, isLoading: false, lastSync: new Date().toISOString() });
                return { success: true, data: watchlists };
            } catch (error) {
                const msg = getUserFriendlyError(error, 'load your watchlists');
                set({ isLoading: false, error: msg });
                return { success: false, error: msg };
            } finally {
                requestCache.delete(cacheKey);
            }
        })();

        requestCache.set(cacheKey, loadPromise);
        return await loadPromise;
    },


    // Load specific watchlist
    loadWatchlist: async (watchlistId, forceRefresh = false) => {
        const cacheKey = `loadWatchlist-${watchlistId}`;
        const currentState = get();

        if (!isAuthenticated()) {
            return { success: false, error: 'Not authenticated' };
        }

        // Return cached data if available
        if (!forceRefresh && currentState.currentWatchlist &&
            getWatchlistId(currentState.currentWatchlist) === watchlistId) {
            return { success: true, data: currentState.currentWatchlist };
        }

        // Check for existing request
        if (requestCache.has(cacheKey)) {
            return await requestCache.get(cacheKey);
        }

        const loadPromise = (async () => {
            try {
                set({ isLoading: true, error: null });

                const response = await watchlistsApi.getWatchlistById(watchlistId);
                const watchlist = response.data || response;

                set({
                    currentWatchlist: watchlist,
                    isLoading: false
                });

                return { success: true, data: watchlist };
            } catch (error) {
                const errorMessage = getUserFriendlyError(error, 'load watchlist');
                set({ isLoading: false, error: errorMessage });
                return { success: false, error: errorMessage };
            } finally {
                requestCache.delete(cacheKey);
            }
        })();

        requestCache.set(cacheKey, loadPromise);
        return await loadPromise;
    },

    // Load public watchlists
    loadPublicWatchlists: async (page = 1, limit = 10, forceRefresh = false) => {
        const cacheKey = `loadPublicWatchlists-${page}-${limit}`;
        const currentState = get();

        // Return cached data if available
        if (!forceRefresh && currentState.publicWatchlists.length > 0 && page === 1) {
            return { success: true, data: currentState.publicWatchlists };
        }

        // Check for existing request
        if (requestCache.has(cacheKey)) {
            return await requestCache.get(cacheKey);
        }

        const loadPromise = (async () => {
            try {
                set({ isLoadingPublic: true, error: null });

                const response = await watchlistsApi.getPublicWatchlists(page, limit);
                const publicWatchlists = response.data || response.watchlists || response || [];

                set({
                    publicWatchlists: page === 1 ? publicWatchlists : [...currentState.publicWatchlists, ...publicWatchlists],
                    isLoadingPublic: false
                });

                return { success: true, data: publicWatchlists };
            } catch (error) {
                const errorMessage = getUserFriendlyError(error, 'load public watchlists');
                set({ isLoadingPublic: false, error: errorMessage });
                return { success: false, error: errorMessage };
            } finally {
                requestCache.delete(cacheKey);
            }
        })();

        requestCache.set(cacheKey, loadPromise);
        return await loadPromise;
    },

    // Create watchlist
    createWatchlist: async (watchlistData) => {
        if (!isAuthenticated()) {
            toastManager.error('Please sign in to create a watchlist');
            return { success: false, error: 'Not authenticated' };
        }

        try {
            set({ isLoading: true, error: null });

            const response = await watchlistsApi.createWatchlist(watchlistData);
            const newWatchlist = response.data || response;

            // Update state
            set((state) => ({
                watchlists: [...state.watchlists, newWatchlist],
                isLoading: false
            }));

            toastManager.success('Watchlist created successfully!');
            return { success: true, data: newWatchlist };
        } catch (error) {
            const errorMessage = getUserFriendlyError(error, 'create watchlist');
            set({ isLoading: false, error: errorMessage });
            toastManager.error(errorMessage);
            return { success: false, error: errorMessage };
        }
    },

    // Update watchlist
    updateWatchlist: async (watchlistId, updateData) => {
        if (!isAuthenticated()) {
            toastManager.error('Please sign in to update watchlist');
            return { success: false, error: 'Not authenticated' };
        }

        try {
            set({ isLoading: true, error: null });

            const response = await watchlistsApi.updateWatchlist(watchlistId, updateData);
            const updatedWatchlist = response.data || response;

            // Update state
            set((state) => ({
                watchlists: state.watchlists.map(w =>
                    getWatchlistId(w) === watchlistId ? updatedWatchlist : w
                ),
                currentWatchlist: state.currentWatchlist &&
                    getWatchlistId(state.currentWatchlist) === watchlistId ?
                    updatedWatchlist : state.currentWatchlist,
                isLoading: false
            }));

            toastManager.success('Watchlist updated successfully!');
            return { success: true, data: updatedWatchlist };
        } catch (error) {
            const errorMessage = getUserFriendlyError(error, 'update watchlist');
            set({ isLoading: false, error: errorMessage });
            toastManager.error(errorMessage);
            return { success: false, error: errorMessage };
        }
    },

    // Delete watchlist
    // Delete watchlist
    deleteWatchlist: async (watchlistId) => {
        if (!isAuthenticated()) {
            toastManager.error('Please sign in to delete watchlist');
            return { success: false, error: 'Not authenticated' };
        }

        // Store the watchlist for potential rollback BEFORE optimistic update
        const currentState = get();
        const watchlistToDelete = currentState.watchlists.find(w => getWatchlistId(w) === watchlistId);

        if (!watchlistToDelete) {
            toastManager.error('Watchlist not found');
            return { success: false, error: 'Watchlist not found' };
        }

        try {
            // Optimistic update - remove from state immediately
            set((state) => ({
                watchlists: state.watchlists.filter(w => getWatchlistId(w) !== watchlistId),
                currentWatchlist: state.currentWatchlist &&
                    getWatchlistId(state.currentWatchlist) === watchlistId ?
                    null : state.currentWatchlist,
                isLoading: true,
                error: null
            }));

            // Make the API call
            await watchlistsApi.deleteWatchlist(watchlistId);

            set({ isLoading: false });
            toastManager.success('Watchlist deleted successfully');
            return { success: true };
        } catch (error) {
            // Revert optimistic update by restoring the deleted watchlist
            set((state) => ({
                watchlists: [...state.watchlists, watchlistToDelete].sort((a, b) =>
                    new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0)
                ),
                isLoading: false
            }));

            const errorMessage = getUserFriendlyError(error, 'delete watchlist');
            set({ error: errorMessage });
            toastManager.error(errorMessage);
            return { success: false, error: errorMessage };
        }
    },

    // Add movie to watchlist
    addMovieToWatchlist: async (watchlistId, movieData) => {
        if (!isAuthenticated()) {
            toastManager.error('Please sign in to add movies to watchlist');
            return { success: false, error: 'Not authenticated' };
        }

        const optimisticKey = `${watchlistId}-${movieData.movieId}`;

        try {
            // Check if movie already exists
            const currentState = get();
            const watchlist = currentState.watchlists.find(w => getWatchlistId(w) === watchlistId);

            if (watchlist && isMovieInWatchlist(watchlist, movieData.movieId)) {
                toastManager.error('Movie is already in this watchlist');
                return { success: false, error: 'Movie already exists' };
            }

            // Optimistic update
            set((state) => ({
                watchlists: state.watchlists.map(w => {
                    if (getWatchlistId(w) === watchlistId) {
                        return {
                            ...w,
                            movies: [...(w.movies || []), movieData],
                            movieCount: (w.movieCount || w.movies?.length || 0) + 1
                        };
                    }
                    return w;
                }),
                optimisticUpdates: new Set(state.optimisticUpdates).add(optimisticKey)
            }));

            await watchlistsApi.addMovieToWatchlist(watchlistId, movieData);

            // Remove from optimistic updates
            set((state) => {
                const newOptimisticUpdates = new Set(state.optimisticUpdates);
                newOptimisticUpdates.delete(optimisticKey);
                return { optimisticUpdates: newOptimisticUpdates };
            });

            toastManager.success(`Added "${movieData.title}" to watchlist`);
            return { success: true };
        } catch (error) {
            // Revert optimistic update
            set((state) => ({
                watchlists: state.watchlists.map(w => {
                    if (getWatchlistId(w) === watchlistId) {
                        return {
                            ...w,
                            movies: (w.movies || []).filter(m => Number(m.movieId) !== Number(movieData.movieId)),
                            movieCount: Math.max(0, (w.movieCount || w.movies?.length || 0) - 1)
                        };
                    }
                    return w;
                }),
                optimisticUpdates: (() => {
                    const newOptimisticUpdates = new Set(state.optimisticUpdates);
                    newOptimisticUpdates.delete(optimisticKey);
                    return newOptimisticUpdates;
                })()
            }));

            const errorMessage = getUserFriendlyError(error, 'add movie to watchlist');
            toastManager.error(errorMessage);
            return { success: false, error: errorMessage };
        }
    },

    // Remove movie from watchlist
    removeMovieFromWatchlist: async (watchlistId, movieId) => {
        if (!isAuthenticated()) {
            toastManager.error('Please sign in to remove movies from watchlist');
            return { success: false, error: 'Not authenticated' };
        }

        // Store movie data for potential revert BEFORE the try block
        const currentState = get();
        const watchlist = currentState.watchlists.find(w => getWatchlistId(w) === watchlistId);
        const movieToRemove = watchlist?.movies?.find(m => Number(m.movieId) === Number(movieId));

        if (!movieToRemove) {
            toastManager.error('Movie not found in watchlist');
            return { success: false, error: 'Movie not found' };
        }

        try {
            // Optimistic update - remove movie from state immediately
            set((state) => ({
                watchlists: state.watchlists.map(w => {
                    if (getWatchlistId(w) === watchlistId) {
                        return {
                            ...w,
                            movies: (w.movies || []).filter(m => Number(m.movieId) !== Number(movieId)),
                            movieCount: Math.max(0, (w.movieCount || w.movies?.length || 0) - 1)
                        };
                    }
                    return w;
                })
            }));

            // Make the API call
            await watchlistsApi.removeMovieFromWatchlist(watchlistId, movieId);

            toastManager.success(`Removed "${movieToRemove.title}" from watchlist`);
            return { success: true };
        } catch (error) {
            // Revert optimistic update by restoring the removed movie
            set((state) => ({
                watchlists: state.watchlists.map(w => {
                    if (getWatchlistId(w) === watchlistId) {
                        return {
                            ...w,
                            movies: [...(w.movies || []), movieToRemove],
                            movieCount: (w.movieCount || w.movies?.length || 0) + 1
                        };
                    }
                    return w;
                })
            }));

            const errorMessage = getUserFriendlyError(error, 'remove movie from watchlist');
            toastManager.error(errorMessage);
            return { success: false, error: errorMessage };
        }
    },

    // Helper methods
    getWatchlistById: (watchlistId) => {
        const watchlists = get().watchlists;
        return watchlists.find(w => getWatchlistId(w) === watchlistId);
    },

    getWatchlistsContainingMovie: (movieId) => {
        const watchlists = get().watchlists;
        return watchlists.filter(w => isMovieInWatchlist(w, movieId));
    },

    isMovieInAnyWatchlist: (movieId) => {
        const watchlists = get().watchlists;
        return watchlists.some(w => isMovieInWatchlist(w, movieId));
    },

    getMovieWatchlistStatus: (movieId) => {
        const watchlists = get().watchlists;
        const containingWatchlists = watchlists.filter(w => isMovieInWatchlist(w, movieId));

        return {
            isInWatchlist: containingWatchlists.length > 0,
            watchlistCount: containingWatchlists.length,
            watchlists: containingWatchlists
        };
    },

    // Sync with server
    syncWithServer: async (forceRefresh = false) => {
        if (!isAuthenticated()) {
            return { success: false, error: 'Not authenticated' };
        }

        try {
            const result = await get().loadWatchlists(forceRefresh);
            return result;
        } catch (error) {
            const errorMessage = getUserFriendlyError(error, 'sync watchlists');
            return { success: false, error: errorMessage };
        }
    },

    // Reset store
    reset: () => {
        set({
            watchlists: [],
            currentWatchlist: null,
            publicWatchlists: [],
            isLoading: false,
            isLoadingPublic: false,
            error: null,
            lastSync: null,
            optimisticUpdates: new Set()
        });
        requestCache.clear();
    },

    // Clear all data
    clearAllData: () => {
        get().reset();
        toastManager.info('Watchlist data cleared');
    }
});
