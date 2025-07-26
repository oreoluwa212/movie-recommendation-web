const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

import axios from 'axios';

class APICache {
    constructor(maxSize = 100) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.CACHE_DURATION = 5 * 60 * 1000;
    }

    get(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
            return cached.data;
        }
        if (cached) {
            this.cache.delete(key);
        }
        return null;
    }

    set(key, data) {
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    delete(key) {
        this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
    }

    keys() {
        return this.cache.keys();
    }

    cleanup() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp >= this.CACHE_DURATION) {
                this.cache.delete(key);
            }
        }
    }
}

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
                setTimeout(() => this.process(), this.delay);
            });

        this.running.push(promise);
    }
}

const apiCache = new APICache();
const requestQueue = new RequestQueue(5, 100);
const heavyQueue = new RequestQueue(2, 500);
const ongoingRequests = new Map();

let memoryStorage = {};

const storage = {
    getItem: (key) => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                return localStorage.getItem(key);
            }
            return memoryStorage[key] || null;
        } catch {
            return memoryStorage[key] || null;
        }
    },
    setItem: (key, value) => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem(key, value);
            }
            memoryStorage[key] = value;
        } catch {
            memoryStorage[key] = value;
        }
    },
    removeItem: (key) => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.removeItem(key);
            }
            delete memoryStorage[key];
        } catch {
            delete memoryStorage[key];
        }
    }
};

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

api.interceptors.request.use(
    (config) => {
        const token = storage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 429 && !originalRequest._retry) {
            originalRequest._retry = true;
            originalRequest._retryCount = originalRequest._retryCount || 0;

            if (originalRequest._retryCount < 3) {
                originalRequest._retryCount++;
                const delay = Math.pow(2, originalRequest._retryCount) * 1000 + Math.random() * 1000;

                await new Promise(resolve => setTimeout(resolve, delay));
                return api(originalRequest);
            }
        }

        if (error.response?.status === 401) {
            storage.removeItem('authToken');
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('auth-logout'));
            }
        }

        return Promise.reject(error);
    }
);

function handleApiError(error, context = '') {
    console.error(`API Error in ${context}:`, error);

    if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        switch (status) {
            case 400:
                throw new Error(data?.message || 'Bad request');
            case 401:
                throw new Error('Unauthorized - please log in again');
            case 403:
                throw new Error('Forbidden - you don\'t have permission');
            case 404:
                throw new Error('Not found');
            case 429:
                throw new Error('Too many requests - please try again later');
            case 500:
                throw new Error('Server error - please try again later');
            default:
                throw new Error(data?.message || `Request failed with status ${status}`);
        }
    } else if (error.request) {
        throw new Error('Network error - please check your connection');
    } else {
        throw new Error(error.message || 'An unexpected error occurred');
    }
}

const makeRequest = async (requestFn, cacheKey = null, queueType = 'none') => {
    if (cacheKey) {
        const cachedData = apiCache.get(cacheKey);
        if (cachedData) {
            return cachedData;
        }
    }

    if (cacheKey && ongoingRequests.has(cacheKey)) {
        return ongoingRequests.get(cacheKey);
    }

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

    if (cacheKey) {
        ongoingRequests.set(cacheKey, requestPromise);
    }

    try {
        const result = await requestPromise;

        if (cacheKey) {
            apiCache.set(cacheKey, result);
        }

        return result;
    } catch (error) {
        handleApiError(error, cacheKey);
    } finally {
        if (cacheKey) {
            ongoingRequests.delete(cacheKey);
        }
    }
};

export const userApi = {
    updateProfile: async (profileData) => {
        try {
            const response = await api.put('/users/profile', profileData);
            apiCache.delete('user-profile');
            apiCache.delete('current-user');
            return response.data;
        } catch (error) {
            handleApiError(error, 'updateProfile');
        }
    },

    uploadAvatar: async (formData) => {
        try {
            const response = await api.post('/users/avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            apiCache.delete('user-profile');
            apiCache.delete('current-user');
            return response.data;
        } catch (error) {
            handleApiError(error, 'uploadAvatar');
        }
    },

    deleteAvatar: async () => {
        try {
            const response = await api.delete('/users/avatar');
            apiCache.delete('user-profile');
            apiCache.delete('current-user');
            return response.data;
        } catch (error) {
            handleApiError(error, 'deleteAvatar');
        }
    },

    updateTheme: async (theme) => {
        try {
            const response = await api.put('/users/profile', {
                preferences: { theme }
            });
            apiCache.delete('user-profile');
            apiCache.delete('current-user');
            return response.data;
        } catch (error) {
            handleApiError(error, 'updateTheme');
        }
    },

    getProfile: async () => {
        const cacheKey = 'user-profile';
        return makeRequest(
            async () => {
                const response = await api.get('/users/profile');
                return response.data;
            },
            cacheKey,
            'none'
        );
    },

    addFavorite: async (movieData) => {
        try {
            const response = await api.post('/users/favorites', movieData);
            apiCache.delete('user-favorites');
            apiCache.delete('user-profile');
            return response.data;
        } catch (error) {
            handleApiError(error, 'addFavorite');
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
            apiCache.delete('user-favorites');
            apiCache.delete('user-profile');
            return response.data;
        } catch (error) {
            handleApiError(error, 'removeFavorite');
        }
    },

    addToWatched: async (movieData) => {
        try {
            const response = await api.post('/users/watched', movieData);
            apiCache.delete('user-watched');
            apiCache.delete('user-profile');
            return response.data;
        } catch (error) {
            handleApiError(error, 'addToWatched');
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
            apiCache.delete('user-watched');
            apiCache.delete('user-profile');
            return response.data;
        } catch (error) {
            handleApiError(error, 'removeFromWatched');
        }
    },

    validateImageFile: (file) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const maxSize = 5 * 1024 * 1024;

        if (!allowedTypes.includes(file.type)) {
            throw new Error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
        }

        if (file.size > maxSize) {
            throw new Error('File size too large. Please upload an image smaller than 5MB.');
        }

        return true;
    },

    compressImage: async (file, maxWidth = 800, quality = 0.8) => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
                const newWidth = img.width * ratio;
                const newHeight = img.height * ratio;

                canvas.width = newWidth;
                canvas.height = newHeight;

                ctx.drawImage(img, 0, 0, newWidth, newHeight);

                canvas.toBlob(resolve, file.type, quality);
            };

            img.src = URL.createObjectURL(file);
        });
    }
};

export const authApi = {
    register: async (userData) => {
        try {
            const response = await api.post('/auth/register', userData);
            return response.data;
        } catch (error) {
            handleApiError(error, 'register');
        }
    },

    login: async (credentials) => {
        try {
            const response = await api.post('/auth/login', credentials);

            if (response.data.token) {
                storage.setItem('authToken', response.data.token);
            }

            return response.data;
        } catch (error) {
            handleApiError(error, 'login');
        }
    },

    verifyEmail: async (verificationData) => {
        try {
            const response = await api.post('/auth/verify-email', verificationData);

            if (response.data.token) {
                storage.setItem('authToken', response.data.token);
            }

            return response.data;
        } catch (error) {
            handleApiError(error, 'verifyEmail');
        }
    },

    resendVerificationCode: async (emailData) => {
        try {
            const response = await api.post('/auth/resend-verification-code', emailData);
            return response.data;
        } catch (error) {
            handleApiError(error, 'resendVerificationCode');
        }
    },

    getCurrentUser: async () => {
        const cacheKey = 'current-user';
        return makeRequest(
            async () => {
                const response = await api.get('/auth/me');
                return response.data;
            },
            cacheKey,
            'none'
        );
    },

    updateProfile: async (userData) => {
        try {
            const response = await api.put('/auth/profile', userData);
            apiCache.delete('current-user');
            apiCache.delete('user-profile');
            return response.data;
        } catch (error) {
            handleApiError(error, 'updateProfile');
        }
    },

    refreshToken: async () => {
        try {
            const response = await api.post('/auth/refresh');

            if (response.data.token) {
                storage.setItem('authToken', response.data.token);
            }

            return response.data;
        } catch (error) {
            handleApiError(error, 'refreshToken');
        }
    },

    logout: async () => {
        try {
            await api.post('/auth/logout');
        } finally {
            storage.removeItem('authToken');
            apiCache.clear();
        }
    },

    isAuthenticated: () => {
        const token = storage.getItem('authToken');
        return !!token;
    },

    getToken: () => {
        return storage.getItem('authToken');
    }
};

export const themeUtils = {
    applyTheme: (theme) => {
        const root = document.documentElement;

        if (theme === 'light') {
            root.classList.remove('dark');
            root.classList.add('light');
        } else {
            root.classList.remove('light');
            root.classList.add('dark');
        }

        localStorage.setItem('theme', theme);
    },

    getStoredTheme: () => {
        return localStorage.getItem('theme') || 'dark';
    },

    initializeTheme: (userTheme) => {
        const storedTheme = themeUtils.getStoredTheme();
        const theme = userTheme || storedTheme;
        themeUtils.applyTheme(theme);
        return theme;
    }
};

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

    filterMovies: async (queryParams) => {
        const url = `/movies/filter${queryParams ? `?${queryParams}` : ''}`;

        try {
            const response = await api.get(url);
            return response.data;
        } catch (error) {
            handleApiError(error, 'filterMovies');
        }
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

function validateReviewData(reviewData) {
    if (!reviewData) {
        throw new Error('Review data is required');
    }

    if (!reviewData.movieId) {
        throw new Error('Movie ID is required');
    }

    if (!reviewData.title || reviewData.title.trim() === '') {
        throw new Error('Review title is required');
    }

    if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 10) {
        throw new Error('Rating must be between 1 and 10');
    }

    const reviewText = reviewData.review || reviewData.reviewText || '';
    if (reviewText.length > 2000) {
        throw new Error('Review text cannot exceed 2000 characters');
    }

    return true;
}

function clearReviewCaches(movieId) {
    apiCache.delete('user-reviews');

    if (movieId) {
        apiCache.delete(`user-review-movie-${movieId}`);

        for (const key of apiCache.keys()) {
            if (key.startsWith(`movie-reviews-${movieId}`)) {
                apiCache.delete(key);
            }
        }

        apiCache.delete(`movie-review-stats-${movieId}`);
    }

    for (const key of apiCache.keys()) {
        if (key.startsWith('top-reviews-') || key.startsWith('recent-reviews-')) {
            apiCache.delete(key);
        }
    }
}

export const reviewsApi = {
    createOrUpdateReview: async (reviewData) => {
        try {
            validateReviewData(reviewData);

            const payload = {
                movieId: parseInt(reviewData.movieId),
                title: reviewData.title,
                rating: parseInt(reviewData.rating),
                review: reviewData.review || reviewData.reviewText || '',
                spoiler: Boolean(reviewData.spoiler),
                ...(reviewData.genre && { genre: reviewData.genre }),
                ...(reviewData.releaseDate && { releaseDate: reviewData.releaseDate }),
                ...(reviewData.poster && { poster: reviewData.poster })
            };

            const response = await api.post('/reviews', payload);
            clearReviewCaches(reviewData.movieId);
            return response.data;
        } catch (error) {
            handleApiError(error, 'createOrUpdateReview');
        }
    },

    updateReview: async (reviewId, reviewData) => {
        try {
            validateReviewData(reviewData);

            const payload = {
                movieId: parseInt(reviewData.movieId),
                title: reviewData.title,
                rating: parseInt(reviewData.rating),
                review: reviewData.review || reviewData.reviewText || '',
                spoiler: Boolean(reviewData.spoiler),
                ...(reviewData.genre && { genre: reviewData.genre }),
                ...(reviewData.releaseDate && { releaseDate: reviewData.releaseDate }),
                ...(reviewData.poster && { poster: reviewData.poster })
            };

            const response = await api.post(`/reviews`, payload);
            clearReviewCaches(reviewData.movieId);
            return response.data;
        } catch (error) {
            handleApiError(error, 'updateReview');
        }
    },

    getMovieReviews: async (movieId, page = 1, limit = 5, sortBy = 'createdAt', sortOrder = 'desc', filterSpoilers = false) => {
        const cacheKey = `movie-reviews-${movieId}-${page}-${limit}-${sortBy}-${sortOrder}-${filterSpoilers}`;
        return makeRequest(
            async () => {
                const response = await api.get(`/reviews/movie/${movieId}`, {
                    params: { page, limit, sortBy, sortOrder, filterSpoilers }
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

            apiCache.delete('user-reviews');
            apiCache.delete(`review-${reviewId}`);

            for (const key of apiCache.keys()) {
                if (key.startsWith('user-review-movie-') || key.startsWith('movie-reviews-')) {
                    apiCache.delete(key);
                }
            }

            return response.data;
        } catch (error) {
            handleApiError(error, 'deleteReview');
        }
    },

    getUserReviews: async (page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc') => {
        const cacheKey = `user-reviews-${page}-${limit}-${sortBy}-${sortOrder}`;
        return makeRequest(
            async () => {
                const response = await api.get('/reviews/user/me', {
                    params: { page, limit, sortBy, sortOrder }
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

    reportReview: async (reviewId, reason, additionalInfo = '') => {
        try {
            const response = await api.post(`/reviews/${reviewId}/report`, {
                reason,
                additionalInfo
            });
            return response.data;
        } catch (error) {
            handleApiError(error, 'reportReview');
        }
    },

    toggleLikeReview: async (reviewId) => {
        try {
            const response = await api.post(`/reviews/${reviewId}/like`);

            apiCache.delete(`review-${reviewId}`);
            for (const key of apiCache.keys()) {
                if (key.startsWith('movie-reviews-') || key.startsWith('top-reviews-') || key.startsWith('recent-reviews-')) {
                    apiCache.delete(key);
                }
            }

            return response.data;
        } catch (error) {
            handleApiError(error, 'toggleLikeReview');
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
    },

    clearUserCache: () => {
        for (const key of apiCache.keys()) {
            if (key.startsWith('user-reviews') || key.startsWith('user-bookmarks') || key.startsWith('following-reviews')) {
                apiCache.delete(key);
            }
        }
    }
};

export const cacheUtils = {
    clearCache: () => {
        apiCache.clear();
    },

    clearCacheByPattern: (pattern) => {
        const keys = Array.from(apiCache.cache.keys());
        keys.forEach(key => {
            if (key.includes(pattern)) {
                apiCache.cache.delete(key);
            }
        });
    },

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