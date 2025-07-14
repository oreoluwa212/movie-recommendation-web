export const createMovieCategorySlice = (set, get, movieApi, base) => {
    const { debugLog, debugError, toastManager, processResponse, cacheManager } = base;

    // Helper function
    const fetchCategory = async (
        apiMethod,
        stateKey,
        loadingKey,
        cacheKey,
        errorMessage,
        page = 1
    ) => {
        const cached = cacheManager.get(cacheKey);
        if (cacheManager.isValid(cacheKey)) {
            debugLog(`Using cached data for ${cacheKey}`);
            set({ [stateKey]: cached.value });
            return cached.value;
        }

        set({ [loadingKey]: true, error: null });
        debugLog(`Fetching ${stateKey}...`);

        try {
            const response = await apiMethod(page);
            const results = processResponse(response, stateKey);
            cacheManager.set(cacheKey, results);

            set({ [stateKey]: results, [loadingKey]: false });
            return results;
        } catch (error) {
            debugError(`${stateKey} error:`, error);
            set({ [loadingKey]: false, error: error.message });
            toastManager.error(error.message || errorMessage);
            throw error;
        }
    };

    return {
        // State
        popularMovies: [],
        topRatedMovies: [],
        nowPlayingMovies: [],
        upcomingMovies: [],
        isLoadingPopular: false,
        isLoadingTopRated: false,
        isLoadingNowPlaying: false,
        isLoadingUpcoming: false,

        // Actions
        getPopularMovies: (page = 1) =>
            fetchCategory(
                movieApi.getPopularMovies,
                'popularMovies',
                'isLoadingPopular',
                `popular_${page}`,
                'Failed to fetch popular movies',
                page
            ),

        getTopRatedMovies: (page = 1) =>
            fetchCategory(
                movieApi.getTopRatedMovies,
                'topRatedMovies',
                'isLoadingTopRated',
                `topRated_${page}`,
                'Failed to fetch top rated movies',
                page
            ),

        getNowPlayingMovies: (page = 1) =>
            fetchCategory(
                movieApi.getNowPlayingMovies,
                'nowPlayingMovies',
                'isLoadingNowPlaying',
                `nowPlaying_${page}`,
                'Failed to fetch now playing movies',
                page
            ),

        getUpcomingMovies: (page = 1) =>
            fetchCategory(
                movieApi.getUpcomingMovies,
                'upcomingMovies',
                'isLoadingUpcoming',
                `upcoming_${page}`,
                'Failed to fetch upcoming movies',
                page
            )
    };
};
