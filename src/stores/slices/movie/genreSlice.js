export const createGenreSlice = (set, get, movieApi) => {
    return {
        genres: [],
        isLoadingGenres: false,

        getGenres: async () => {
            const { debugLog, debugError, toastManager, processResponse } = get();

            set({ isLoadingGenres: true, error: null });
            debugLog('Fetching genres...');

            try {
                const response = await movieApi.getGenres();
                const results = processResponse(response, 'Genres');

                set({ genres: results, isLoadingGenres: false });
                return results;
            } catch (error) {
                debugError('Genres error:', error);
                set({ isLoadingGenres: false, error: error.message });
                toastManager.error(error.message || 'Failed to fetch genres');
                throw error;
            }
        }
    };
};
