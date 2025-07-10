// utils/api.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance with base configuration
import axios from 'axios';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized access
            localStorage.removeItem('authToken');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API functions
export const authApi = {
    // User registration
    register: async (userData) => {
        try {
            const response = await api.post('/auth/register', userData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Registration failed');
        }
    },

    // User login
    login: async (credentials) => {
        try {
            const response = await api.post('/auth/login', credentials);
            if (response.data.token) {
                localStorage.setItem('authToken', response.data.token);
            }
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Login failed');
        }
    },

    // Get current user
    getCurrentUser: async () => {
        try {
            const response = await api.get('/auth/me');
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to get current user');
        }
    },

    // Logout
    logout: () => {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
    }
};

// Movie API functions
export const movieApi = {
    // Get popular movies
    getPopularMovies: async (page = 1) => {
        try {
            const response = await api.get(`/movies/discover/popular?page=${page}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch popular movies');
        }
    },

    // Get top rated movies
    getTopRatedMovies: async (page = 1) => {
        try {
            const response = await api.get(`/movies/discover/top-rated?page=${page}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch top rated movies');
        }
    },

    // Get now playing movies
    getNowPlayingMovies: async (page = 1) => {
        try {
            const response = await api.get(`/movies/discover/now-playing?page=${page}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch now playing movies');
        }
    },

    // Get upcoming movies
    getUpcomingMovies: async (page = 1) => {
        try {
            const response = await api.get(`/movies/discover/upcoming?page=${page}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch upcoming movies');
        }
    },

    // Search movies
    searchMovies: async (query, page = 1) => {
        try {
            const response = await api.get(`/movies/search?query=${encodeURIComponent(query)}&page=${page}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to search movies');
        }
    },

    // Get movie details
    getMovieDetails: async (id) => {
        try {
            const response = await api.get(`/movies/${id}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch movie details');
        }
    },

    // Get genres
    getGenres: async () => {
        try {
            const response = await api.get('/movies/data/genres');
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch genres');
        }
    },

    // Get movies by genre
    getMoviesByGenre: async (genreId, page = 1) => {
        try {
            const response = await api.get(`/movies/genre/${genreId}?page=${page}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch movies by genre');
        }
    },

    // Get movie recommendations
    getMovieRecommendations: async (movieId, page = 1) => {
        try {
            const response = await api.get(`/movies/${movieId}/recommendations?page=${page}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch movie recommendations');
        }
    },

    // Get similar movies
    getSimilarMovies: async (movieId, page = 1) => {
        try {
            const response = await api.get(`/movies/${movieId}/similar?page=${page}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch similar movies');
        }
    },

    // Get personalized recommendations
    getPersonalizedRecommendations: async () => {
        try {
            const response = await api.get('/movies/recommendations/personalized');
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch personalized recommendations');
        }
    }
};

// User API functions
export const userApi = {
    // Update user profile
    updateProfile: async (profileData) => {
        try {
            const response = await api.put('/users/profile', profileData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to update profile');
        }
    },

    // Add favorite movie
    addFavorite: async (movieData) => {
        try {
            const response = await api.post('/users/favorites', movieData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to add favorite');
        }
    },

    // Get user's favorites
    getFavorites: async () => {
        try {
            const response = await api.get('/users/favorites');
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch favorites');
        }
    },

    // Remove favorite movie
    removeFavorite: async (movieId) => {
        try {
            const response = await api.delete(`/users/favorites/${movieId}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to remove favorite');
        }
    },

    // Add movie to watched list
    addToWatched: async (movieData) => {
        try {
            const response = await api.post('/users/watched', movieData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to add to watched');
        }
    },

    // Get user's watched movies
    getWatched: async () => {
        try {
            const response = await api.get('/users/watched');
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch watched movies');
        }
    }
};

// Reviews API functions
export const reviewsApi = {
    // Create or update review
    createOrUpdateReview: async (reviewData) => {
        try {
            const response = await api.post('/reviews', reviewData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to create/update review');
        }
    },

    // Get reviews for a movie
    getMovieReviews: async (movieId, page = 1, limit = 5) => {
        try {
            const response = await api.get(`/reviews/movie/${movieId}?page=${page}&limit=${limit}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch movie reviews');
        }
    },

    // Get review by ID
    getReviewById: async (reviewId) => {
        try {
            const response = await api.get(`/reviews/${reviewId}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch review');
        }
    },

    // Delete review by ID
    deleteReview: async (reviewId) => {
        try {
            const response = await api.delete(`/reviews/${reviewId}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to delete review');
        }
    },

    // Get logged in user's reviews
    getUserReviews: async () => {
        try {
            const response = await api.get('/reviews/user/me');
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch user reviews');
        }
    },

    // Get user's review for specific movie
    getUserReviewForMovie: async (movieId) => {
        try {
            const response = await api.get(`/reviews/user/movie/${movieId}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch user review for movie');
        }
    }
};

// Watchlists API functions
export const watchlistsApi = {
    // Create a watchlist
    createWatchlist: async (watchlistData) => {
        try {
            const response = await api.post('/watchlists', watchlistData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to create watchlist');
        }
    },

    // Get all user's watchlists
    getUserWatchlists: async () => {
        try {
            const response = await api.get('/watchlists');
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch watchlists');
        }
    },

    // Get watchlist by ID
    getWatchlistById: async (watchlistId) => {
        try {
            const response = await api.get(`/watchlists/${watchlistId}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch watchlist');
        }
    },

    // Update a watchlist
    updateWatchlist: async (watchlistId, watchlistData) => {
        try {
            const response = await api.put(`/watchlists/${watchlistId}`, watchlistData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to update watchlist');
        }
    },

    // Delete a watchlist
    deleteWatchlist: async (watchlistId) => {
        try {
            const response = await api.delete(`/watchlists/${watchlistId}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to delete watchlist');
        }
    },

    // Add a movie to watchlist
    addMovieToWatchlist: async (watchlistId, movieData) => {
        try {
            const response = await api.post(`/watchlists/${watchlistId}/movies`, movieData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to add movie to watchlist');
        }
    },

    // Remove a movie from watchlist
    removeMovieFromWatchlist: async (watchlistId, movieId) => {
        try {
            const response = await api.delete(`/watchlists/${watchlistId}/movies/${movieId}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to remove movie from watchlist');
        }
    },

    // Get public watchlists
    getPublicWatchlists: async (page = 1, limit = 10) => {
        try {
            const response = await api.get(`/watchlists/public/all?page=${page}&limit=${limit}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch public watchlists');
        }
    }
};

// Export the configured axios instance for custom requests
export default api;