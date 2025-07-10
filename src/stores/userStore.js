// stores/userStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'react-toastify';
import { userApi } from '../utils/api';

export const useUserStore = create(
    persist(
        (set, get) => ({
            // State
            favorites: [],
            watchedMovies: [],
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
                    
                    const [favoritesResponse, watchedResponse] = await Promise.all([
                        userApi.getFavorites(),
                        userApi.getWatched()
                    ]);
                    
                    const favorites = favoritesResponse.favorites || favoritesResponse.data || favoritesResponse || [];
                    const watched = watchedResponse.watched || watchedResponse.data || watchedResponse || [];
                    
                    set({
                        favorites,
                        watchedMovies: watched,
                        lastSync: new Date().toISOString(),
                        isLoading: false
                    });
                    
                    return { favorites, watched };
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
                    await userApi.addToFavorites(
                        movieData.id,
                        movieData.title,
                        movieData.poster_path
                    );
                    
                    // Create favorite object with expected structure
                    const favoriteMovie = {
                        movieId: movieData.id,
                        title: movieData.title,
                        poster: movieData.poster_path,
                        addedAt: new Date().toISOString(),
                        ...movieData
                    };
                    
                    const updatedFavorites = [...currentFavorites, favoriteMovie];
                    
                    set({ 
                        favorites: updatedFavorites, 
                        isLoading: false 
                    });
                    
                    toast.success(`Added "${movieData.title}" to favorites!`);
                    return { success: true, data: favoriteMovie };
                } catch (error) {
                    const errorMessage = error.message || 'Failed to add to favorites';
                    set({ isLoading: false, error: errorMessage });
                    toast.error(errorMessage);
                    console.error('Add to favorites failed:', error);
                    return { success: false, error: errorMessage };
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
                    await userApi.removeFromFavorites(movieId);
                    
                    const updatedFavorites = currentFavorites.filter(fav => fav.movieId !== movieId);
                    
                    set({ 
                        favorites: updatedFavorites, 
                        isLoading: false 
                    });
                    
                    toast.success(`Removed "${movieToRemove.title}" from favorites!`);
                    return { success: true };
                } catch (error) {
                    const errorMessage = error.message || 'Failed to remove from favorites';
                    set({ isLoading: false, error: errorMessage });
                    toast.error(errorMessage);
                    console.error('Remove from favorites failed:', error);
                    return { success: false, error: errorMessage };
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
                    await userApi.addToWatched(
                        movieData.id,
                        movieData.title,
                        movieData.poster_path,
                        userRating
                    );
                    
                    // Create watched object with expected structure
                    const watchedMovie = {
                        movieId: movieData.id,
                        title: movieData.title,
                        poster: movieData.poster_path,
                        rating: userRating,
                        watchedAt: new Date().toISOString(),
                        ...movieData
                    };
                    
                    const updatedWatched = [...currentWatched, watchedMovie];
                    
                    set({ 
                        watchedMovies: updatedWatched, 
                        isLoading: false 
                    });
                    
                    toast.success(`Added "${movieData.title}" to watched list!`);
                    return { success: true, data: watchedMovie };
                } catch (error) {
                    const errorMessage = error.message || 'Failed to add to watched list';
                    set({ isLoading: false, error: errorMessage });
                    toast.error(errorMessage);
                    console.error('Add to watched failed:', error);
                    return { success: false, error: errorMessage };
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
                    await userApi.removeFromWatched(movieId);
                    
                    const updatedWatched = currentWatched.filter(watched => watched.movieId !== movieId);
                    
                    set({ 
                        watchedMovies: updatedWatched, 
                        isLoading: false 
                    });
                    
                    toast.success(`Removed "${movieToRemove.title}" from watched list!`);
                    return { success: true };
                } catch (error) {
                    const errorMessage = error.message || 'Failed to remove from watched list';
                    set({ isLoading: false, error: errorMessage });
                    toast.error(errorMessage);
                    console.error('Remove from watched failed:', error);
                    return { success: false, error: errorMessage };
                }
            },
            
            // Update watched movie rating
            updateWatchedRating: async (movieId, newRating) => {
                const currentWatched = get().watchedMovies;
                const movieIndex = currentWatched.findIndex(watched => watched.movieId === movieId);
                
                if (movieIndex === -1) {
                    toast.error('Movie not found in watched list');
                    return { success: false, error: 'Movie not found' };
                }
                
                set({ isLoading: true, error: null });
                
                try {
                    const movieData = currentWatched[movieIndex];
                    await userApi.addToWatched(
                        movieData.movieId,
                        movieData.title,
                        movieData.poster,
                        newRating
                    );
                    
                    const updatedWatched = [...currentWatched];
                    updatedWatched[movieIndex] = { ...movieData, rating: newRating };
                    
                    set({ 
                        watchedMovies: updatedWatched, 
                        isLoading: false 
                    });
                    
                    toast.success(`Updated rating for "${movieData.title}"!`);
                    return { success: true };
                } catch (error) {
                    const errorMessage = error.message || 'Failed to update rating';
                    set({ isLoading: false, error: errorMessage });
                    toast.error(errorMessage);
                    console.error('Update rating failed:', error);
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
            
            // Batch operations
            addMultipleToFavorites: async (moviesData) => {
                const results = [];
                
                for (const movieData of moviesData) {
                    const result = await get().addToFavorites(movieData);
                    results.push({ movieId: movieData.id, ...result });
                }
                
                return results;
            },
            
            addMultipleToWatched: async (moviesData) => {
                const results = [];
                
                for (const movieData of moviesData) {
                    const result = await get().addToWatched(movieData);
                    results.push({ movieId: movieData.id, ...result });
                }
                
                return results;
            },
            
            // Stats
            getStats: () => {
                const favorites = get().favorites;
                const watched = get().watchedMovies;
                
                return {
                    totalFavorites: favorites.length,
                    totalWatched: watched.length,
                    averageRating: watched.length > 0 
                        ? watched.reduce((sum, movie) => sum + (movie.rating || 0), 0) / watched.length 
                        : 0,
                    ratedMovies: watched.filter(movie => movie.rating).length
                };
            },
            
            // Clear all data
            clearAllData: () => {
                set({
                    favorites: [],
                    watchedMovies: [],
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
                lastSync: state.lastSync
            })
        }
    )
);