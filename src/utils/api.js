// utils/api.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

import axios from 'axios';

// Cache implementation
class APICache {
    constructor() {
        this.cache = new Map();
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    }

    get(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
            return cached.data;
        }
        return null;
    }

    set(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    clear() {
        this.cache.clear();
    }

    // New method to delete specific keys
    delete(key) {
        this.cache.delete(key);
    }

    // New method to get all keys
    keys() {
        return this.cache.keys();
    }
}

// Request queue for rate limiting
class RequestQueue {
    constructor(maxConcurrent = 2, delay = 1000) {
        this.queue = [];
        this.running = [];
        this.maxConcurrent = maxConcurrent;
        this.delay = delay;
    }

    async add(requestFunction) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                request: requestFunction,
                resolve,
                reject
            });
            this.process();
        });
    }

    async process() {
        if (this.running.length >= this.maxConcurrent || this.queue.length === 0) {
            return;
        }

        const { request, resolve, reject } = this.queue.shift();
        const promise = request()
            .then(resolve)
            .catch(reject)
            .finally(() => {
                this.running.splice(this.running.indexOf(promise), 1);
                if (this.delay > 0) {
                    setTimeout(() => this.process(), this.delay);
                } else {
                    setTimeout(() => this.process(), 0);
                }
            });

        this.running.push(promise);
    }
}

// Initialize cache and request queues
const apiCache = new APICache();
const requestQueue = new RequestQueue(5, 100);
const heavyQueue = new RequestQueue(2, 500);
const ongoingRequests = new Map();

// Enhanced axios instance with increased timeout
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

// Enhanced request interceptor
api.interceptors.request.use(
    (config) => {
        // Get token from localStorage (most up-to-date)
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log('🚀 Making API request:', config.method?.toUpperCase(), config.url);
        console.log('🚀 Request data:', config.data);
        return config;
    },
    (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Enhanced response interceptor
api.interceptors.response.use(
    (response) => {
        console.log('✅ API response received:', response.config.url, response.status);
        console.log('✅ Response data:', response.data);
        return response;
    },
    async (error) => {
        console.error('❌ API error:', error.config?.url, error.response?.status, error.message);
        console.error('❌ Error response data:', error.response?.data);

        const originalRequest = error.config;

        // Handle 429 errors with exponential backoff
        if (error.response?.status === 429 && !originalRequest._retry) {
            originalRequest._retry = true;
            originalRequest._retryCount = originalRequest._retryCount || 0;

            if (originalRequest._retryCount < 3) {
                originalRequest._retryCount++;
                const delay = Math.pow(2, originalRequest._retryCount) * 1000 + Math.random() * 1000;

                console.log(`🔄 Rate limited. Retrying in ${delay}ms... (Attempt ${originalRequest._retryCount}/3)`);

                await new Promise(resolve => setTimeout(resolve, delay));
                return api(originalRequest);
            }
        }

        // Handle 401 errors (unauthorized)
        if (error.response?.status === 401) {
            console.log('🔒 Unauthorized request - clearing auth data');
            localStorage.removeItem('authToken');
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('auth-logout'));
            }
        }

        return Promise.reject(error);
    }
);

// Enhanced request function with caching and selective queuing
const makeRequest = async (requestFn, cacheKey = null, queueType = 'none') => {
    // Check cache first
    if (cacheKey) {
        const cachedData = apiCache.get(cacheKey);
        if (cachedData) {
            console.log(`📦 Using cached data for ${cacheKey}`);
            return cachedData;
        }
    }

    // Check for ongoing requests
    if (cacheKey && ongoingRequests.has(cacheKey)) {
        console.log(`⏳ Waiting for ongoing request: ${cacheKey}`);
        return ongoingRequests.get(cacheKey);
    }

    // Create the request promise with selective queuing
    let requestPromise;
    switch (queueType) {
        case 'heavy':
            requestPromise = heavyQueue.add(requestFn);
            break;
        case 'light':
            requestPromise = requestQueue.add(requestFn);
            break;
        case 'none':
        default:
            requestPromise = requestFn();
            break;
    }

    // Store ongoing request
    if (cacheKey) {
        ongoingRequests.set(cacheKey, requestPromise);
    }

    try {
        const result = await requestPromise;

        // Cache the result
        if (cacheKey) {
            apiCache.set(cacheKey, result);
        }

        return result;
    } finally {
        // Clean up ongoing request
        if (cacheKey) {
            ongoingRequests.delete(cacheKey);
        }
    }
};

// Enhanced Auth API functions
export const authApi = {
    register: async (userData) => {
        try {
            console.log('🔐 AuthAPI: Starting registration for:', { ...userData, password: '[HIDDEN]' });
            const response = await api.post('/auth/register', userData);
            console.log('🔐 AuthAPI: Registration response:', response.data);
            return response.data;
        } catch (error) {
            console.error('🔐 AuthAPI: Registration failed:', error);
            console.error('🔐 AuthAPI: Error details:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });

            let errorMessage = 'Registration failed';

            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.response?.data) {
                errorMessage = typeof error.response.data === 'string'
                    ? error.response.data
                    : 'Registration failed';
            } else if (error.message) {
                errorMessage = error.message;
            }

            const finalError = new Error(errorMessage);
            finalError.response = error.response;
            finalError.status = error.response?.status;

            throw finalError;
        }
    },

    login: async (credentials) => {
        try {
            console.log('🔐 AuthAPI: Starting login for:', { ...credentials, password: '[HIDDEN]' });
            const response = await api.post('/auth/login', credentials);
            console.log('🔐 AuthAPI: Login response:', { ...response.data, password: '[HIDDEN]' });

            if (response.data.token) {
                localStorage.setItem('authToken', response.data.token);
            }

            return response.data;
        } catch (error) {
            console.error('🔐 AuthAPI: Login failed:', error.response?.data || error.message);
            const errorMessage = error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                'Login failed';
            throw new Error(errorMessage);
        }
    },

    verifyEmail: async (verificationData) => {
        try {
            console.log('🔐 AuthAPI: Starting email verification for:', { ...verificationData, verificationCode: '[HIDDEN]' });
            const response = await api.post('/auth/verify-email', verificationData);
            console.log('🔐 AuthAPI: Email verification response:', response.data);

            if (response.data.token) {
                localStorage.setItem('authToken', response.data.token);
            }

            return response.data;
        } catch (error) {
            console.error('🔐 AuthAPI: Email verification failed:', error.response?.data || error.message);
            const errorMessage = error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                'Email verification failed';
            throw new Error(errorMessage);
        }
    },

    resendVerificationCode: async (emailData) => {
        try {
            console.log('🔐 AuthAPI: Resending verification code for:', emailData);
            const response = await api.post('/auth/resend-verification-code', emailData);
            console.log('🔐 AuthAPI: Resend verification response:', response.data);
            return response.data;
        } catch (error) {
            console.error('🔐 AuthAPI: Resend verification failed:', error.response?.data || error.message);
            const errorMessage = error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                'Failed to resend verification code';
            throw new Error(errorMessage);
        }
    },

    getCurrentUser: async () => {
        try {
            const response = await api.get('/auth/me');
            console.log('🔐 AuthAPI: Current user retrieved:', response.data);
            return response.data;
        } catch (error) {
            console.error('🔐 AuthAPI: Get current user failed:', error.response?.data || error.message);
            const errorMessage = error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                'Failed to get current user';
            throw new Error(errorMessage);
        }
    },

    updateProfile: async (userData) => {
        try {
            console.log('🔐 AuthAPI: Updating profile:', userData);
            const response = await api.put('/auth/profile', userData);
            console.log('🔐 AuthAPI: Profile updated:', response.data);
            return response.data;
        } catch (error) {
            console.error('🔐 AuthAPI: Profile update failed:', error.response?.data || error.message);
            const errorMessage = error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                'Profile update failed';
            throw new Error(errorMessage);
        }
    },

    refreshToken: async () => {
        try {
            const response = await api.post('/auth/refresh');
            console.log('🔐 AuthAPI: Token refreshed successfully');

            if (response.data.token) {
                localStorage.setItem('authToken', response.data.token);
            }

            return response.data;
        } catch (error) {
            console.error('🔐 AuthAPI: Token refresh failed:', error.response?.data || error.message);
            const errorMessage = error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                'Token refresh failed';
            throw new Error(errorMessage);
        }
    },

    logout: async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('🔐 AuthAPI: Logout endpoint failed:', error.message);
        } finally {
            localStorage.removeItem('authToken');
            apiCache.clear();
        }
    },

    isAuthenticated: () => {
        const token = localStorage.getItem('authToken');
        return !!token;
    },

    getToken: () => {
        return localStorage.getItem('authToken');
    }
};

// Enhanced Movie API functions with selective queuing
export const movieApi = {
    getPopularMovies: async (page = 1) => {
        const cacheKey = `popular-movies-${page}`;
        return makeRequest(
            async () => {
                const response = await api.get(`/movies/discover/popular?page=${page}`);
                return response.data;
            },
            cacheKey,
            'light'
        );
    },

    getTopRatedMovies: async (page = 1) => {
        const cacheKey = `top-rated-movies-${page}`;
        return makeRequest(
            async () => {
                const response = await api.get(`/movies/discover/top-rated?page=${page}`);
                return response.data;
            },
            cacheKey,
            'light'
        );
    },

    getNowPlayingMovies: async (page = 1) => {
        const cacheKey = `now-playing-movies-${page}`;
        return makeRequest(
            async () => {
                const response = await api.get(`/movies/discover/now-playing?page=${page}`);
                return response.data;
            },
            cacheKey,
            'light'
        );
    },

    getUpcomingMovies: async (page = 1) => {
        const cacheKey = `upcoming-movies-${page}`;
        return makeRequest(
            async () => {
                const response = await api.get(`/movies/discover/upcoming?page=${page}`);
                return response.data;
            },
            cacheKey,
            'light'
        );
    },

    getGenres: async () => {
        const cacheKey = 'genres';
        return makeRequest(
            async () => {
                const response = await api.get('/movies/data/genres');
                return response.data;
            },
            cacheKey,
            'none'
        );
    },

    searchMovies: async (query, page = 1) => {
        const cacheKey = `search-${query}-${page}`;
        return makeRequest(
            async () => {
                const response = await api.get(`/movies/search?query=${encodeURIComponent(query)}&page=${page}`);
                return response.data;
            },
            cacheKey,
            'heavy'
        );
    },

    getMovieDetails: async (id) => {
        const cacheKey = `movie-details-${id}`;
        return makeRequest(
            async () => {
                const response = await api.get(`/movies/${id}`);
                return response.data;
            },
            cacheKey,
            'light'
        );
    },

    getMoviesByGenre: async (genreId, page = 1) => {
        const cacheKey = `movies-genre-${genreId}-${page}`;
        return makeRequest(
            async () => {
                const response = await api.get(`/movies/genre/${genreId}?page=${page}`);
                return response.data;
            },
            cacheKey,
            'light'
        );
    },

    getMovieRecommendations: async (movieId, page = 1) => {
        const cacheKey = `movie-recommendations-${movieId}-${page}`;
        return makeRequest(
            async () => {
                const response = await api.get(`/movies/${movieId}/recommendations?page=${page}`);
                return response.data;
            },
            cacheKey,
            'heavy'
        );
    },

    getSimilarMovies: async (movieId, page = 1) => {
        const cacheKey = `similar-movies-${movieId}-${page}`;
        return makeRequest(
            async () => {
                const response = await api.get(`/movies/${movieId}/similar?page=${page}`);
                return response.data;
            },
            cacheKey,
            'heavy'
        );
    },

    getPersonalizedRecommendations: async () => {
        const cacheKey = 'personalized-recommendations';
        return makeRequest(
            async () => {
                const response = await api.get('/movies/recommendations/personalized');
                return response.data;
            },
            cacheKey,
            'heavy'
        );
    },

    filterMovies: async (queryParams) => {
        const url = `/movies/filter${queryParams ? `?${queryParams}` : ''}`;
        console.log('Filtering movies with URL:', url);

        try {
            const response = await api.get(url);
            console.log('Filter response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Filter movies error:', error);
            throw error;
        }
    },

    buildFilterQuery: (filters) => {
        const params = new URLSearchParams();

        if (filters.page) params.append('page', filters.page);
        if (filters.minRating) params.append('minRating', filters.minRating);
        if (filters.maxRating) params.append('maxRating', filters.maxRating);
        if (filters.releaseYear) params.append('releaseYear', filters.releaseYear);
        if (filters.genres && filters.genres.length > 0) {
            params.append('genres', filters.genres.join(','));
        }
        if (filters.sortBy) params.append('sortBy', filters.sortBy);
        if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

        return params.toString();
    },

    filterByRating: async (minRating, maxRating, page = 1) => {
        const query = movieApi.buildFilterQuery({ minRating, maxRating, page });
        return movieApi.filterMovies(query);
    },

    filterByYear: async (releaseYear, page = 1) => {
        const query = movieApi.buildFilterQuery({ releaseYear, page });
        return movieApi.filterMovies(query);
    },

    filterByGenre: async (genreIds, page = 1) => {
        const genres = Array.isArray(genreIds) ? genreIds : [genreIds];
        const query = movieApi.buildFilterQuery({ genres, page });
        return movieApi.filterMovies(query);
    },

    sortMovies: async (sortBy, sortOrder = 'desc', page = 1) => {
        const query = movieApi.buildFilterQuery({ sortBy, sortOrder, page });
        return movieApi.filterMovies(query);
    },

    filterMoviesAdvanced: async (filters) => {
        const query = movieApi.buildFilterQuery(filters);
        return movieApi.filterMovies(query);
    }
};

// User API functions
export const userApi = {
    updateProfile: async (profileData) => {
        try {
            const response = await api.put('/users/profile', profileData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to update profile');
        }
    },

    addFavorite: async (movieData) => {
        try {
            const response = await api.post('/users/favorites', movieData);
            // Clear favorites cache when adding
            apiCache.delete('user-favorites');
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to add favorite');
        }
    },

    getFavorites: async () => {
        const cacheKey = 'user-favorites';
        return makeRequest(
            async () => {
                const response = await api.get('/users/favorites');
                return response.data;
            },
            cacheKey,
            'none'
        );
    },

    removeFavorite: async (movieId) => {
        try {
            const response = await api.delete(`/users/favorites/${movieId}`);
            // Clear favorites cache when removing
            apiCache.delete('user-favorites');
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to remove favorite');
        }
    },

    addToWatched: async (movieData) => {
        try {
            const response = await api.post('/users/watched', movieData);
            // Clear watched cache when adding
            apiCache.delete('user-watched');
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to add to watched');
        }
    },

    getWatched: async () => {
        const cacheKey = 'user-watched';
        return makeRequest(
            async () => {
                const response = await api.get('/users/watched');
                return response.data;
            },
            cacheKey,
            'none'
        );
    },

    removeFromWatched: async (movieId) => {
        try {
            const response = await api.delete(`/users/watched/${movieId}`);
            // Clear watched cache when removing
            apiCache.delete('user-watched');
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to remove from watched');
        }
    },
};

export const reviewsApi = {
    createOrUpdateReview: async (reviewData) => {
        try {
            const payload = {
                movieId: parseInt(reviewData.movieId),
                title: reviewData.title || 'Unknown Movie',
                rating: parseInt(reviewData.rating),
                review: reviewData.review || reviewData.reviewText,
                spoiler: reviewData.spoiler || false,
                ...(reviewData.genre && { genre: reviewData.genre }),
                ...(reviewData.releaseDate && { releaseDate: reviewData.releaseDate }),
                ...(reviewData.poster && { poster: reviewData.poster })
            };

            const response = await api.post('/reviews', payload);
            
            // Clear relevant caches
            apiCache.delete(`user-review-movie-${reviewData.movieId}`);
            apiCache.delete('user-reviews');
            // Clear movie reviews cache for all pages
            for (const key of apiCache.keys()) {
                if (key.startsWith(`movie-reviews-${reviewData.movieId}`)) {
                    apiCache.delete(key);
                }
            }
            
            return response.data;
        } catch (error) {
            console.error('Create/Update review error:', error);
            throw new Error(error.response?.data?.message || 'Failed to create/update review');
        }
    },

    getMovieReviews: async (movieId, page = 1, limit = 5) => {
        const cacheKey = `movie-reviews-${movieId}-${page}-${limit}`;
        return makeRequest(
            async () => {
                const response = await api.get(`/reviews/movie/${movieId}`, {
                    params: { page, limit }
                });
                return response.data;
            },
            cacheKey,
            'light'
        );
    },

    getReviewById: async (reviewId) => {
        const cacheKey = `review-${reviewId}`;
        return makeRequest(
            async () => {
                const response = await api.get(`/reviews/${reviewId}`);
                return response.data;
            },
            cacheKey,
            'light'
        );
    },

    deleteReview: async (reviewId) => {
        try {
            const response = await api.delete(`/reviews/${reviewId}`);
            
            // Clear all relevant caches
            apiCache.delete('user-reviews');
            apiCache.delete(`review-${reviewId}`);
            // Clear user-movie review caches
            for (const key of apiCache.keys()) {
                if (key.startsWith('user-review-movie-') || key.startsWith('movie-reviews-')) {
                    apiCache.delete(key);
                }
            }
            
            return response.data;
        } catch (error) {
            console.error('Delete review error:', error);
            throw new Error(error.response?.data?.message || 'Failed to delete review');
        }
    },

    getUserReviews: async (page = 1, limit = 10) => {
        const cacheKey = `user-reviews-${page}-${limit}`;
        return makeRequest(
            async () => {
                const response = await api.get('/reviews/user/me', {
                    params: { page, limit }
                });
                return response.data;
            },
            cacheKey,
            'none'
        );
    },

    getUserReviewForMovie: async (movieId) => {
        const cacheKey = `user-review-movie-${movieId}`;
        return makeRequest(
            async () => {
                const response = await api.get(`/reviews/user/movie/${movieId}`);
                return response.data;
            },
            cacheKey,
            'none'
        );
    },

    getMovieReviewStats: async (movieId) => {
        const cacheKey = `movie-review-stats-${movieId}`;
        return makeRequest(
            async () => {
                const response = await api.get(`/reviews/movie/${movieId}/stats`);
                return response.data;
            },
            cacheKey,
            'light'
        );
    },

    getRecentReviews: async (limit = 10) => {
        const cacheKey = `recent-reviews-${limit}`;
        return makeRequest(
            async () => {
                const response = await api.get('/reviews/recent', {
                    params: { limit }
                });
                return response.data;
            },
            cacheKey,
            'light'
        );
    },

    reportReview: async (reviewId, reason) => {
        try {
            const response = await api.post(`/reviews/${reviewId}/report`, {
                reason
            });
            return response.data;
        } catch (error) {
            console.error('Report review error:', error);
            throw new Error(error.response?.data?.message || 'Failed to report review');
        }
    },

    toggleLikeReview: async (reviewId) => {
        try {
            const response = await api.post(`/reviews/${reviewId}/like`);
            
            // Clear relevant caches
            apiCache.delete(`review-${reviewId}`);
            for (const key of apiCache.keys()) {
                if (key.startsWith('movie-reviews-')) {
                    apiCache.delete(key);
                }
            }
            
            return response.data;
        } catch (error) {
            console.error('Toggle like error:', error);
            throw new Error(error.response?.data?.message || 'Failed to toggle like');
        }
    },

    clearCache: () => {
        apiCache.clear();
    },

    clearMovieCache: (movieId) => {
        for (const key of apiCache.keys()) {
            if (key.includes(`movie-${movieId}`) || key.includes(`user-review-movie-${movieId}`)) {
                apiCache.delete(key);
            }
        }
    }
};

// Watchlists API functions with selective queuing
export const watchlistsApi = {
    createWatchlist: async (watchlistData) => {
        try {
            const response = await api.post('/watchlists', watchlistData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to create watchlist');
        }
    },

    getUserWatchlists: async () => {
        const cacheKey = 'user-watchlists';
        return makeRequest(
            async () => {
                const response = await api.get('/watchlists');
                return response.data;
            },
            cacheKey,
            'none'
        );
    },

    getWatchlistById: async (watchlistId) => {
        const cacheKey = `watchlist-${watchlistId}`;
        return makeRequest(
            async () => {
                const response = await api.get(`/watchlists/${watchlistId}`);
                return response.data;
            },
            cacheKey,
            'light'
        );
    },

    updateWatchlist: async (watchlistId, watchlistData) => {
        try {
            const response = await api.put(`/watchlists/${watchlistId}`, watchlistData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to update watchlist');
        }
    },

    deleteWatchlist: async (watchlistId) => {
        try {
            const response = await api.delete(`/watchlists/${watchlistId}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to delete watchlist');
        }
    },

    addMovieToWatchlist: async (watchlistId, movieData) => {
        try {
            const response = await api.post(`/watchlists/${watchlistId}/movies`, movieData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to add movie to watchlist');
        }
    },

    removeMovieFromWatchlist: async (watchlistId, movieId) => {
        try {
            const response = await api.delete(`/watchlists/${watchlistId}/movies/${movieId}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to remove movie from watchlist');
        }
    },

    getPublicWatchlists: async (page = 1, limit = 10) => {
        const cacheKey = `public-watchlists-${page}-${limit}`;
        return makeRequest(
            async () => {
                const response = await api.get(`/watchlists/public/all?page=${page}&limit=${limit}`);
                return response.data;
            },
            cacheKey,
            'light'
        );
    }
};

// Utility functions for cache and queue management
export const cacheUtils = {
    clearCache: () => {
        apiCache.clear();
        console.log('API cache cleared');
    },

    clearCacheByPattern: (pattern) => {
        const keys = Array.from(apiCache.cache.keys());
        keys.forEach(key => {
            if (key.includes(pattern)) {
                apiCache.cache.delete(key);
            }
        });
        console.log(`Cache cleared for pattern: ${pattern}`);
    },

    // New utility to check queue status
    getQueueStatus: () => {
        return {
            lightQueue: {
                pending: requestQueue.queue.length,
                running: requestQueue.running.length,
                maxConcurrent: requestQueue.maxConcurrent
            },
            heavyQueue: {
                pending: heavyQueue.queue.length,
                running: heavyQueue.running.length,
                maxConcurrent: heavyQueue.maxConcurrent
            }
        };
    }
};

export default api;