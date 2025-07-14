// store/slices/movieSlice.js
export const createMovieSlice = (set, get, apiClient, baseSlice) => ({
    // Movie state
    favorites: [],
    watchedMovies: [],
    isLoading: false,
    error: null,

    // Add to Favorites
    addToFavorites: async (movieData) => {
        const { makeApiCall, isAuthenticated, toastManager } = baseSlice;

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

        const favoriteMovie = {
            movieId: movieData.id,
            title: movieData.title,
            poster: movieData.poster_path,
            addedAt: new Date().toISOString(),
            ...movieData
        };

        const updatedFavorites = [...currentFavorites, favoriteMovie];
        set({ favorites: updatedFavorites });

        return await makeApiCall(
            'addToFavorites',
            () => apiClient.addFavorite(favoriteMovie),
            {
                successMessage: `Added "${movieData.title}" to favorites!`,
                errorMessage: 'add to favorites',
                onError: () => {
                    set({ favorites: currentFavorites });
                },
                onSuccess: () => {
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
                }
            }
        );
    },

    // Remove from Favorites
    removeFromFavorites: async (movieId) => {
        const { makeApiCall, isAuthenticated, toastManager } = baseSlice;

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

        const updatedFavorites = currentFavorites.filter(fav => fav.movieId !== movieId);
        set({ favorites: updatedFavorites });

        return await makeApiCall(
            'removeFromFavorites',
            () => apiClient.removeFavorite(movieId),
            {
                successMessage: `Removed "${movieToRemove.title}" from favorites!`,
                errorMessage: 'remove from favorites',
                onError: () => {
                    set({ favorites: currentFavorites });
                },
                onSuccess: () => {
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
                }
            }
        );
    },

    // Add to Watched
    addToWatched: async (movieData, userRating = null) => {
        const { isAuthenticated, toastManager, getUserFriendlyError } = baseSlice;

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

            const updatedWatched = [...currentWatched, watchedMovie];
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

            await apiClient.addToWatched(watchedMovie);

            set({ isLoading: false });
            toastManager.success(`Added "${movieData.title}" to watched list!`);
            return { success: true, data: watchedMovie };
        } catch (error) {
            const errorMessage = getUserFriendlyError(error, 'add to watched list');

            set({
                watchedMovies: currentWatched,
                isLoading: false,
                error: errorMessage
            });

            toastManager.error(errorMessage);
            return { success: false, error: errorMessage };
        }
    },

    // Remove from Watched
    removeFromWatched: async (movieId) => {
        const { isAuthenticated, toastManager, getUserFriendlyError } = baseSlice;

        if (!isAuthenticated()) {
            toastManager.error('Please sign in to remove movies from your watched list');
            return { success: false, error: 'Not authenticated' };
        }

        const currentWatched = get().watchedMovies;
        const movieToRemove = currentWatched.find(w => w.movieId === movieId);

        if (!movieToRemove) {
            toastManager.info('Movie not found in watched list');
            return { success: false, error: 'Movie not in watched list' };
        }

        set({ isLoading: true, error: null });

        try {
            const updatedWatched = currentWatched.filter(w => w.movieId !== movieId);
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

            await apiClient.removeFromWatched(movieId);

            set({ isLoading: false });
            toastManager.success(`Removed "${movieToRemove.title}" from watched list!`);
            return { success: true };
        } catch (error) {
            const errorMessage = getUserFriendlyError(error, 'remove from watched list');

            set({
                watchedMovies: currentWatched,
                isLoading: false,
                error: errorMessage
            });

            toastManager.error(errorMessage);
            return { success: false, error: errorMessage };
        }
    },

    // Helpers
    isFavorite: (movieId) => {
        return get().favorites.some(fav => fav.movieId === movieId);
    },

    isWatched: (movieId) => {
        return get().watchedMovies.some(w => w.movieId === movieId);
    },

    getWatchedRating: (movieId) => {
        const movie = get().watchedMovies.find(w => w.movieId === movieId);
        return movie?.rating ?? null;
    }
});
