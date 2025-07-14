// store/slices/movie/searchSlice.js
export const createSearchSlice = (set, get, movieApi, baseSlice) => {
    const { debugLog, debugError, toastManager, cacheManager, processResponse } = baseSlice;

    // Search debouncing
    let searchTimeout;
    const debounceSearch = (fn, delay = 300) => {
        return (...args) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => fn(...args), delay);
        };
    };

    return {
        // Search movies
        searchMovies: async (query, page = 1) => {
            if (!query.trim()) {
                set({ searchResults: [], searchQuery: '' });
                return [];
            }

            const cacheKey = `search_${query}_${page}`;
            const cachedResults = cacheManager.get(cacheKey);

            if (cacheManager.isValid(cacheKey)) {
                debugLog(`Using cached search results for: ${query}`);
                set({
                    searchResults: cachedResults.value,
                    searchQuery: query
                });
                return cachedResults.value;
            }

            set({ isLoadingSearch: true, error: null, searchQuery: query });
            debugLog('Searching for:', query);

            try {
                const response = await movieApi.searchMovies(query, page);
                const results = processResponse(response, 'Search');

                // Cache the search results
                cacheManager.set(cacheKey, results, 180000); // 3 minutes for search results

                set({
                    searchResults: results,
                    isLoadingSearch: false
                });

                debugLog(`Search completed for "${query}":`, results);
                return results;
            } catch (error) {
                debugError('Search error:', error);
                set({ isLoadingSearch: false, error: error.message || 'Search failed' });
                toastManager.error(error.message || 'Search failed');
                throw error;
            }
        },

        // Debounced search for real-time search
        debouncedSearchMovies: debounceSearch(async (query, page = 1) => {
            return await get().searchMovies(query, page);
        }),

        // Clear search results
        clearSearchResults: () => {
            set({ searchResults: [], searchQuery: '' });
            debugLog('Search results cleared');
        },

        // Get search suggestions (for autocomplete)
        getSearchSuggestions: async (query) => {
            if (!query.trim() || query.length < 2) {
                return [];
            }

            const cacheKey = `suggestions_${query}`;
            const cachedSuggestions = cacheManager.get(cacheKey);

            if (cacheManager.isValid(cacheKey)) {
                debugLog(`Using cached suggestions for: ${query}`);
                return cachedSuggestions.value;
            }

            try {
                // Get limited search results for suggestions
                const response = await movieApi.searchMovies(query, 1);
                const results = processResponse(response, 'Suggestions');

                // Take only first 5 results for suggestions
                const suggestions = results.slice(0, 5).map(movie => ({
                    id: movie.id,
                    title: movie.title,
                    year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
                    poster: movie.poster_path
                }));

                // Cache suggestions for shorter time
                cacheManager.set(cacheKey, suggestions, 120000); // 2 minutes

                debugLog(`Suggestions for "${query}":`, suggestions);
                return suggestions;
            } catch (error) {
                debugError('Suggestions error:', error);
                return [];
            }
        },

        // Advanced search with filters
        advancedSearch: async (searchParams) => {
            const {
                query,
                genre,
                year,
                rating,
                sortBy = 'popularity.desc',
                page = 1
            } = searchParams;

            const cacheKey = `advanced_search_${JSON.stringify(searchParams)}`;
            const cachedResults = cacheManager.get(cacheKey);

            if (cacheManager.isValid(cacheKey)) {
                debugLog(`Using cached advanced search results`);
                return cachedResults.value;
            }

            set({ isLoadingSearch: true, error: null });
            debugLog('Advanced search with params:', searchParams);

            try {
                let response;

                if (query) {
                    // If there's a query, use search endpoint
                    response = await movieApi.searchMovies(query, page);
                } else {
                    // Otherwise use discover endpoint with filters
                    response = await movieApi.discoverMovies({
                        with_genres: genre,
                        year,
                        'vote_average.gte': rating,
                        sort_by: sortBy,
                        page
                    });
                }

                const results = processResponse(response, 'Advanced Search');

                // Additional client-side filtering if needed
                let filteredResults = results;

                if (genre && query) {
                    filteredResults = results.filter(movie =>
                        movie.genre_ids?.includes(parseInt(genre))
                    );
                }

                if (year && query) {
                    filteredResults = filteredResults.filter(movie =>
                        movie.release_date?.startsWith(year.toString())
                    );
                }

                if (rating && query) {
                    filteredResults = filteredResults.filter(movie =>
                        movie.vote_average >= parseFloat(rating)
                    );
                }

                // Cache the results
                cacheManager.set(cacheKey, filteredResults, 300000); // 5 minutes

                set({
                    searchResults: filteredResults,
                    isLoadingSearch: false
                });

                debugLog('Advanced search completed:', filteredResults);
                return filteredResults;
            } catch (error) {
                debugError('Advanced search error:', error);
                set({ isLoadingSearch: false, error: error.message || 'Advanced search failed' });
                toastManager.error(error.message || 'Advanced search failed');
                throw error;
            }
        },

        // Get recent searches (from cache)
        getRecentSearches: () => {
            const recentSearches = [];
            for (const [key] of cacheManager.cache) {
                if (key.startsWith('search_') && cacheManager.isValid(key)) {
                    const query = key.split('_')[1];
                    if (query && !recentSearches.includes(query)) {
                        recentSearches.push(query);
                    }
                }
            }
            return recentSearches.slice(0, 10);
        },

        // Clear search cache
        clearSearchCache: () => {
            for (const key of cacheManager.cache.keys()) {
                if (key.startsWith('search_') || key.startsWith('suggestions_') || key.startsWith('advanced_search_')) {
                    cacheManager.delete(key);
                }
            }
            debugLog('Search cache cleared');
        }
    };
};