export const createCurrentMovieSlice = (set, get, movieApi, baseSlice) => {
    const { debugLog } = baseSlice;

    return {
        currentMovie: null,

        setCurrentMovie: (movie) => {
            set({ currentMovie: movie });
            debugLog('Current movie set:', movie);
        },

        clearCurrentMovie: () => {
            set({ currentMovie: null });
            debugLog('Current movie cleared');
        },

        getMovieById: (id) => {
            const {
                movies,
                popularMovies,
                topRatedMovies,
                nowPlayingMovies,
                upcomingMovies,
                searchResults
            } = get();

            const allMovies = [
                ...movies,
                ...popularMovies,
                ...topRatedMovies,
                ...nowPlayingMovies,
                ...upcomingMovies,
                ...searchResults
            ];

            const found = allMovies.find(m => m.id === parseInt(id));
            debugLog(`Lookup for movie ID ${id}:`, found);
            return found;
        }
    };
};
