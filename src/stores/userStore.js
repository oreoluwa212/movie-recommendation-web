// stores/userStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'react-toastify';
import { userApi, reviewsApi, watchlistsApi } from '../utils/api';

export const useUserStore = create(
    persist(
        (set, get) => ({
            // State
            favorites: [],
            watchedMovies: [],
            watchlists: [],
            reviews: [],
            profile: null,
            isLoading: false,
            error: null,
            lastSync: null,

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

            // Sync data with server
            syncWithServer: async () => {
                try {
                    set({ isLoading: true, error: null });

                    const [favoritesResponse, watchedResponse, watchlistsResponse, reviewsResponse] = await Promise.all([
                        userApi.getFavorites(),
                        userApi.getWatched(),
                        watchlistsApi.getUserWatchlists(),
                        reviewsApi.getUserReviews()
                    ]);

                    const favorites = favoritesResponse.favorites || favoritesResponse.data || favoritesResponse || [];
                    const watched = watchedResponse.watched || watchedResponse.data || watchedResponse || [];
                    const watchlists = watchlistsResponse.watchlists || watchlistsResponse.data || watchlistsResponse || [];
                    const reviews = reviewsResponse.reviews || reviewsResponse.data || reviewsResponse || [];

                    set({
                        favorites,
                        watchedMovies: watched,
                        watchlists,
                        reviews,
                        lastSync: new Date().toISOString(),
                        isLoading: false
                    });

                    return { favorites, watched, watchlists, reviews };
                } catch (error) {
                    const errorMessage = error.message || 'Failed to sync with server';
                    set({ isLoading: false, error: errorMessage });
                    console.error('Sync failed:', errorMessage);
                    throw error;
                }
            },

            // Favorites management
            addToFavorites: async (movieData) => {
                const currentFavorites = get().favorites;
                const isAlreadyFavorite = currentFavorites.some(fav => fav.movieId === movieData.id);

                if (isAlreadyFavorite) {
                    toast.info('Movie is already in your favorites!');
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

                    // Then sync with server
                    await userApi.addFavorite(favoriteMovie);

                    set({ isLoading: false });
                    toast.success(`Added "${movieData.title}" to favorites!`);
                    return { success: true, data: favoriteMovie };
                } catch (error) {
                    // Rollback on error
                    set({
                        favorites: currentFavorites,
                        isLoading: false,
                        error: error.message || 'Failed to add to favorites'
                    });
                    toast.error(error.message || 'Failed to add to favorites');
                    console.error('Add to favorites failed:', error);
                    return { success: false, error: error.message || 'Failed to add to favorites' };
                }
            },

            removeFromFavorites: async (movieId) => {
                const currentFavorites = get().favorites;
                const movieToRemove = currentFavorites.find(fav => fav.movieId === movieId);

                if (!movieToRemove) {
                    toast.info('Movie not found in favorites');
                    return { success: false, error: 'Movie not in favorites' };
                }

                set({ isLoading: true, error: null });

                try {
                    // First update local state
                    const updatedFavorites = currentFavorites.filter(fav => fav.movieId !== movieId);
                    set({ favorites: updatedFavorites });

                    // Then sync with server
                    await userApi.removeFavorite(movieId);

                    set({ isLoading: false });
                    toast.success(`Removed "${movieToRemove.title}" from favorites!`);
                    return { success: true };
                } catch (error) {
                    // Rollback on error
                    set({
                        favorites: currentFavorites,
                        isLoading: false,
                        error: error.message || 'Failed to remove from favorites'
                    });
                    toast.error(error.message || 'Failed to remove from favorites');
                    console.error('Remove from favorites failed:', error);
                    return { success: false, error: error.message || 'Failed to remove from favorites' };
                }
            },

            // Watched movies management
            addToWatched: async (movieData, userRating = null) => {
                const currentWatched = get().watchedMovies;
                const isAlreadyWatched = currentWatched.some(watched => watched.movieId === movieData.id);

                if (isAlreadyWatched) {
                    toast.info('Movie is already in your watched list!');
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

                    // Then sync with server
                    await userApi.addToWatched(watchedMovie);

                    set({ isLoading: false });
                    toast.success(`Added "${movieData.title}" to watched list!`);
                    return { success: true, data: watchedMovie };
                } catch (error) {
                    // Rollback on error
                    set({
                        watchedMovies: currentWatched,
                        isLoading: false,
                        error: error.message || 'Failed to add to watched list'
                    });
                    toast.error(error.message || 'Failed to add to watched list');
                    console.error('Add to watched failed:', error);
                    return { success: false, error: error.message || 'Failed to add to watched list' };
                }
            },

            removeFromWatched: async (movieId) => {
                const currentWatched = get().watchedMovies;
                const movieToRemove = currentWatched.find(watched => watched.movieId === movieId);

                if (!movieToRemove) {
                    toast.info('Movie not found in watched list');
                    return { success: false, error: 'Movie not in watched list' };
                }

                set({ isLoading: true, error: null });

                try {
                    // First update local state
                    const updatedWatched = currentWatched.filter(watched => watched.movieId !== movieId);
                    set({ watchedMovies: updatedWatched });

                    // Then sync with server
                    await userApi.removeFromWatched(movieId);

                    set({ isLoading: false });
                    toast.success(`Removed "${movieToRemove.title}" from watched list!`);
                    return { success: true };
                } catch (error) {
                    // Rollback on error
                    set({
                        watchedMovies: currentWatched,
                        isLoading: false,
                        error: error.message || 'Failed to remove from watched list'
                    });
                    toast.error(error.message || 'Failed to remove from watched list');
                    console.error('Remove from watched failed:', error);
                    return { success: false, error: error.message || 'Failed to remove from watched list' };
                }
            },

            // Watchlists management
            createWatchlist: async (name, description = '', isPublic = false) => {
                set({ isLoading: true, error: null });

                try {
                    const response = await watchlistsApi.createWatchlist({
                        name,
                        description,
                        isPublic
                    });

                    const newWatchlist = {
                        id: response.id || Date.now().toString(),
                        name,
                        description,
                        isPublic,
                        movies: [],
                        createdAt: new Date().toISOString()
                    };

                    const updatedWatchlists = [...get().watchlists, newWatchlist];
                    set({
                        watchlists: updatedWatchlists,
                        isLoading: false
                    });

                    toast.success(`Created watchlist "${name}"!`);
                    return { success: true, data: newWatchlist };
                } catch (error) {
                    const errorMessage = error.message || 'Failed to create watchlist';
                    set({ isLoading: false, error: errorMessage });
                    toast.error(errorMessage);
                    console.error('Create watchlist failed:', error);
                    return { success: false, error: errorMessage };
                }
            },

            deleteWatchlist: async (watchlistId) => {
                const currentWatchlists = get().watchlists;
                const watchlistToDelete = currentWatchlists.find(w => w.id === watchlistId);

                if (!watchlistToDelete) {
                    toast.error('Watchlist not found');
                    return { success: false, error: 'Watchlist not found' };
                }

                set({ isLoading: true, error: null });

                try {
                    // First update local state
                    const updatedWatchlists = currentWatchlists.filter(w => w.id !== watchlistId);
                    set({ watchlists: updatedWatchlists });

                    // Then sync with server
                    await watchlistsApi.deleteWatchlist(watchlistId);

                    set({ isLoading: false });
                    toast.success(`Deleted watchlist "${watchlistToDelete.name}"!`);
                    return { success: true };
                } catch (error) {
                    // Rollback on error
                    set({
                        watchlists: currentWatchlists,
                        isLoading: false,
                        error: error.message || 'Failed to delete watchlist'
                    });
                    toast.error(error.message || 'Failed to delete watchlist');
                    console.error('Delete watchlist failed:', error);
                    return { success: false, error: error.message || 'Failed to delete watchlist' };
                }
            },

            updateWatchlist: async (watchlistId, updates) => {
                const currentWatchlists = get().watchlists;
                const watchlistIndex = currentWatchlists.findIndex(w => w.id === watchlistId);

                if (watchlistIndex === -1) {
                    toast.error('Watchlist not found');
                    return { success: false, error: 'Watchlist not found' };
                }

                set({ isLoading: true, error: null });

                try {
                    // First update local state
                    const updatedWatchlists = [...currentWatchlists];
                    updatedWatchlists[watchlistIndex] = {
                        ...updatedWatchlists[watchlistIndex],
                        ...updates
                    };
                    set({ watchlists: updatedWatchlists });

                    // Then sync with server
                    await watchlistsApi.updateWatchlist(watchlistId, updates);

                    set({ isLoading: false });
                    toast.success('Watchlist updated successfully!');
                    return { success: true, data: updatedWatchlists[watchlistIndex] };
                } catch (error) {
                    // Rollback on error
                    set({
                        watchlists: currentWatchlists,
                        isLoading: false,
                        error: error.message || 'Failed to update watchlist'
                    });
                    toast.error(error.message || 'Failed to update watchlist');
                    console.error('Update watchlist failed:', error);
                    return { success: false, error: error.message || 'Failed to update watchlist' };
                }
            },

            addMovieToWatchlist: async (watchlistId, movieData) => {
                const currentWatchlists = get().watchlists;
                const watchlistIndex = currentWatchlists.findIndex(w => w.id === watchlistId);

                if (watchlistIndex === -1) {
                    toast.error('Watchlist not found');
                    return { success: false, error: 'Watchlist not found' };
                }

                const watchlist = currentWatchlists[watchlistIndex];
                const isAlreadyInList = watchlist.movies.some(movie => movie.id === movieData.id);

                if (isAlreadyInList) {
                    toast.info('Movie is already in this watchlist!');
                    return { success: false, error: 'Already in watchlist' };
                }

                set({ isLoading: true, error: null });

                try {
                    // First update local state
                    const updatedWatchlists = [...currentWatchlists];
                    updatedWatchlists[watchlistIndex] = {
                        ...watchlist,
                        movies: [...watchlist.movies, movieData]
                    };
                    set({ watchlists: updatedWatchlists });

                    // Then sync with server
                    await watchlistsApi.addMovieToWatchlist(watchlistId, {
                        movieId: movieData.id,
                        title: movieData.title,
                        poster: movieData.poster_path
                    });

                    set({ isLoading: false });
                    toast.success(`Added "${movieData.title}" to "${watchlist.name}"!`);
                    return { success: true };
                } catch (error) {
                    // Rollback on error
                    set({
                        watchlists: currentWatchlists,
                        isLoading: false,
                        error: error.message || 'Failed to add movie to watchlist'
                    });
                    toast.error(error.message || 'Failed to add movie to watchlist');
                    console.error('Add to watchlist failed:', error);
                    return { success: false, error: error.message || 'Failed to add movie to watchlist' };
                }
            },

            removeMovieFromWatchlist: async (watchlistId, movieId) => {
                const currentWatchlists = get().watchlists;
                const watchlistIndex = currentWatchlists.findIndex(w => w.id === watchlistId);

                if (watchlistIndex === -1) {
                    toast.error('Watchlist not found');
                    return { success: false, error: 'Watchlist not found' };
                }

                set({ isLoading: true, error: null });

                try {
                    // First update local state
                    const updatedWatchlists = [...currentWatchlists];
                    const watchlist = updatedWatchlists[watchlistIndex];
                    const movieToRemove = watchlist.movies.find(movie => movie.id === movieId);

                    updatedWatchlists[watchlistIndex] = {
                        ...watchlist,
                        movies: watchlist.movies.filter(movie => movie.id !== movieId)
                    };
                    set({ watchlists: updatedWatchlists });

                    // Then sync with server
                    await watchlistsApi.removeMovieFromWatchlist(watchlistId, movieId);

                    set({ isLoading: false });
                    toast.success(`Removed "${movieToRemove?.title}" from "${watchlist.name}"!`);
                    return { success: true };
                } catch (error) {
                    // Rollback on error
                    set({
                        watchlists: currentWatchlists,
                        isLoading: false,
                        error: error.message || 'Failed to remove movie from watchlist'
                    });
                    toast.error(error.message || 'Failed to remove movie from watchlist');
                    console.error('Remove from watchlist failed:', error);
                    return { success: false, error: error.message || 'Failed to remove movie from watchlist' };
                }
            },

            // Reviews management
            createOrUpdateReview: async (movieId, reviewData) => {
                set({ isLoading: true, error: null });

                try {
                    const response = await reviewsApi.createOrUpdateReview({
                        movieId,
                        ...reviewData
                    });

                    const currentReviews = get().reviews;
                    const existingReviewIndex = currentReviews.findIndex(r => r.movieId === movieId);

                    const newReview = {
                        id: response.id || Date.now().toString(),
                        movieId,
                        ...reviewData,
                        createdAt: response.createdAt || new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };

                    let updatedReviews;
                    if (existingReviewIndex >= 0) {
                        updatedReviews = [...currentReviews];
                        updatedReviews[existingReviewIndex] = newReview;
                        toast.success('Review updated successfully!');
                    } else {
                        updatedReviews = [...currentReviews, newReview];
                        toast.success('Review created successfully!');
                    }

                    set({
                        reviews: updatedReviews,
                        isLoading: false
                    });

                    return { success: true, data: newReview };
                } catch (error) {
                    const errorMessage = error.message || 'Failed to save review';
                    set({ isLoading: false, error: errorMessage });
                    toast.error(errorMessage);
                    console.error('Save review failed:', error);
                    return { success: false, error: errorMessage };
                }
            },

            deleteReview: async (reviewId) => {
                const currentReviews = get().reviews;
                const reviewToDelete = currentReviews.find(r => r.id === reviewId);

                if (!reviewToDelete) {
                    toast.error('Review not found');
                    return { success: false, error: 'Review not found' };
                }

                set({ isLoading: true, error: null });

                try {
                    // First update local state
                    const updatedReviews = currentReviews.filter(r => r.id !== reviewId);
                    set({ reviews: updatedReviews });

                    // Then sync with server
                    await reviewsApi.deleteReview(reviewId);

                    set({ isLoading: false });
                    toast.success('Review deleted successfully!');
                    return { success: true };
                } catch (error) {
                    // Rollback on error
                    set({
                        reviews: currentReviews,
                        isLoading: false,
                        error: error.message || 'Failed to delete review'
                    });
                    toast.error(error.message || 'Failed to delete review');
                    console.error('Delete review failed:', error);
                    return { success: false, error: error.message || 'Failed to delete review' };
                }
            },

            // Profile management
            updateProfile: async (profileData) => {
                set({ isLoading: true, error: null });

                try {
                    const updatedProfile = {
                        ...get().profile,
                        ...profileData,
                        updatedAt: new Date().toISOString()
                    };

                    set({
                        profile: updatedProfile,
                        isLoading: false
                    });

                    toast.success('Profile updated successfully!');
                    return { success: true, data: updatedProfile };
                } catch (error) {
                    const errorMessage = error.message || 'Failed to update profile';
                    set({ isLoading: false, error: errorMessage });
                    toast.error(errorMessage);
                    console.error('Update profile failed:', error);
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
            },

            // Clear all data
            clearAllData: () => {
                set({
                    favorites: [],
                    watchedMovies: [],
                    watchlists: [],
                    reviews: [],
                    profile: null,
                    isLoading: false,
                    error: null,
                    lastSync: null
                });
                toast.info('All data cleared');
            },

            // Reset store to initial state
            reset: () => {
                set({
                    favorites: [],
                    watchedMovies: [],
                    watchlists: [],
                    reviews: [],
                    profile: null,
                    isLoading: false,
                    error: null,
                    lastSync: null
                });
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
                lastSync: state.lastSync
            })
        }
    )
);