// store/slices/dataSlice.js
export const createDataSlice = (set, get, apiClient, watchlistsApi, reviewsApi, baseSlice) => ({
    // Data state
    watchlists: [],
    reviews: [],
    lastSync: null,

    // Data actions
    syncWithServer: async (forceRefresh = false) => {
        const { makeApiCall, isAuthenticated } = baseSlice;

        if (!isAuthenticated()) {
            return { success: false, error: 'Not authenticated' };
        }

        return await makeApiCall(
            'syncWithServer',
            async () => {
                // Ensure profile is initialized
                if (!get().isInitialized) {
                    await get().initialize();
                }

                if (!get().profile || forceRefresh) {
                    await get().loadProfile(forceRefresh);
                }

                // Load additional data
                const [watchlistsResponse, reviewsResponse] = await Promise.all([
                    watchlistsApi.getUserWatchlists(),
                    reviewsApi.getUserReviews()
                ]);

                const watchlists = watchlistsResponse?.watchlists ?? watchlistsResponse?.data ?? watchlistsResponse ?? [];
                const reviews = reviewsResponse?.reviews ?? reviewsResponse?.data ?? reviewsResponse ?? [];

                set({
                    watchlists,
                    reviews,
                    lastSync: new Date().toISOString()
                });

                return {
                    favorites: get().favorites,
                    watched: get().watchedMovies,
                    watchlists,
                    reviews,
                    profile: get().profile
                };
            },
            {
                errorMessage: 'sync your data',
                showToast: false
            }
        );
    },

    // Helper methods
    getUserReviewForMovie: (movieId) => {
        return get().reviews.find(r => r.movieId === movieId);
    },

    getWatchlistsContainingMovie: (movieId) => {
        return get().watchlists.filter(w =>
            w.movies.some(m => m.id === movieId)
        );
    }
});
