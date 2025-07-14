export const createFeaturedSlice = (set, get) => {
    return {
        featuredMovies: [],

        initializeFeaturedMovies: async () => {
            const { debugLog, debugError } = get();

            try {
                debugLog('Initializing featured movies...');
                const { popularMovies } = get();

                if (popularMovies?.length) {
                    set({ featuredMovies: popularMovies.slice(0, 5) });
                    return;
                }

                const movies = await get().getPopularMovies();
                if (movies?.length) {
                    set({ featuredMovies: movies.slice(0, 5) });
                }
            } catch (error) {
                debugError('Featured movies initialization error:', error);
                set({ featuredMovies: [] });
            }
        }
    };
};
