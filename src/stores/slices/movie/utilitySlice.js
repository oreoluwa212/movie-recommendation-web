export const createUtilitySlice = (set, get, movieApi, baseSlice) => {
    const { debugLog, toastManager } = baseSlice;

    return {
        formatPosterUrl: (path, size = 'w500') =>
            path ? `https://image.tmdb.org/t/p/${size}${path}` : '/placeholder-movie.jpg',

        formatBackdropUrl: (path, size = 'w1280') =>
            path ? `https://image.tmdb.org/t/p/${size}${path}` : '/placeholder-backdrop.jpg',

        getGenreNames: (genreIds) => {
            const { genres } = get();
            if (!Array.isArray(genreIds)) return [];
            return genreIds
                .map(id => genres.find(g => g.id === id)?.name)
                .filter(Boolean);
        },

        debugState: () => {
            const state = get();
            const debugInfo = {
                popularMovies: state.popularMovies?.length,
                topRatedMovies: state.topRatedMovies?.length,
                nowPlayingMovies: state.nowPlayingMovies?.length,
                upcomingMovies: state.upcomingMovies?.length,
                featuredMovies: state.featuredMovies?.length,
                genres: state.genres?.length,
                searchResults: state.searchResults?.length,
                isLoading: state.isLoading,
                error: state.error
            };
            debugLog('🔍 Movie Store Debug State:', debugInfo);
            return debugInfo;
        },

        initializeAppData: async () => {
            try {
                debugLog('🎬 Initializing app data...');
                set({ isLoading: true });

                await get().getGenres();

                await Promise.all([
                    get().getPopularMovies(),
                    get().getTopRatedMovies(),
                    get().getNowPlayingMovies(),
                    get().getUpcomingMovies()
                ]);

                await get().initializeFeaturedMovies();

                set({ isLoading: false });
                debugLog('✅ App data initialized successfully');
            } catch (error) {
                get().setError(error.message);
                set({ isLoading: false });
                toastManager.error('Failed to load movie data. Please refresh the page.');
            }
        }
    };
};
