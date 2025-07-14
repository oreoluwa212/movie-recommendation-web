export const createProfileSlice = (set, get, apiClient, baseSlice) => ({
    // Profile state
    profile: null,
    minimalProfile: null,
    isMinimalProfileLoaded: false,
    isMinimalProfileLoading: false,
    isInitialized: false,
    initializationError: null,
    isAvatarLoading: false,
    avatarError: null,
    isProfileUpdateLoading: false,
    profileUpdateError: null,

    // Profile actions
    initialize: async () => {
        const { makeApiCall, isAuthenticated } = baseSlice;
        const currentState = get();

        if (currentState.isInitialized) {
            return { success: true, data: currentState.minimalProfile };
        }

        if (!isAuthenticated()) {
            set({ isInitialized: true });
            return { success: false, error: 'Not authenticated' };
        }

        return await makeApiCall(
            'initialize',
            () => apiClient.get('/users/profile/minimal'),
            {
                loadingState: 'isMinimalProfileLoading',
                errorState: 'initializationError',
                errorMessage: 'initialize your profile',
                showToast: false,
                onSuccess: (response) => {
                    if (response.data.success && response.data.user) {
                        set({
                            minimalProfile: response.data.user,
                            isMinimalProfileLoaded: true,
                            isInitialized: true
                        });
                    }
                }
            }
        );
    },

    loadMinimalProfile: async (forceRefresh = false) => {
        const { makeApiCall, isAuthenticated } = baseSlice;
        const currentState = get();

        if (!isAuthenticated()) {
            return { success: false, error: 'Not authenticated' };
        }

        if (!forceRefresh && currentState.isMinimalProfileLoaded && currentState.minimalProfile) {
            return { success: true, data: currentState.minimalProfile };
        }

        if (!currentState.isInitialized) {
            return await get().initialize();
        }

        return await makeApiCall(
            'loadMinimalProfile',
            () => apiClient.get('/users/profile/minimal'),
            {
                loadingState: 'isMinimalProfileLoading',
                errorMessage: 'load your profile',
                showToast: false,
                onSuccess: (response) => {
                    if (response.data.success && response.data.user) {
                        set({
                            minimalProfile: response.data.user,
                            isMinimalProfileLoaded: true
                        });
                    }
                }
            }
        );
    },

    loadProfile: async (forceRefresh = false) => {
        const { makeApiCall, isAuthenticated } = baseSlice;
        const currentState = get();

        if (!isAuthenticated()) {
            return { success: false, error: 'Not authenticated' };
        }

        if (!forceRefresh && currentState.profile) {
            return { success: true, data: currentState.profile };
        }

        return await makeApiCall(
            'loadProfile',
            () => apiClient.get('/users/profile'),
            {
                errorMessage: 'load your profile',
                showToast: false,
                onSuccess: (response) => {
                    if (response.data.success && response.data.user) {
                        const profile = {
                            ...response.data.user,
                            stats: response.data.user.stats || {}
                        };

                        const favorites = response.data.user.favoriteMovies?.map(fav => ({
                            movieId: fav.movieId,
                            title: fav.title,
                            poster: fav.poster,
                            addedAt: fav.addedAt,
                            _id: fav._id
                        })) || [];

                        const watchedMovies = response.data.user.watchedMovies?.map(watched => ({
                            movieId: watched.movieId,
                            title: watched.title,
                            poster: watched.poster,
                            rating: watched.rating,
                            watchedAt: watched.watchedAt,
                            _id: watched._id
                        })) || [];

                        set({
                            profile,
                            favorites,
                            watchedMovies,
                            minimalProfile: {
                                _id: response.data.user._id,
                                username: response.data.user.username,
                                avatar: response.data.user.avatar,
                                isEmailVerified: response.data.user.isEmailVerified,
                                preferences: response.data.user.preferences
                            },
                            isMinimalProfileLoaded: true,
                            isInitialized: true,
                            lastSync: new Date().toISOString()
                        });
                    }
                }
            }
        );
    },

    updateProfile: async (profileData) => {
        const { makeApiCall, isAuthenticated } = baseSlice;

        if (!isAuthenticated()) {
            throw new Error('Please sign in to update profile');
        }

        return await makeApiCall(
            'updateProfile',
            () => apiClient.put('/users/profile', profileData),
            {
                loadingState: 'isProfileUpdateLoading',
                errorState: 'profileUpdateError',
                errorMessage: 'update profile',
                showToast: false,
                onSuccess: (response) => {
                    if (response.data.success) {
                        const updatedUser = response.data.user;
                        const currentState = get();

                        // Update both profiles
                        if (currentState.profile) {
                            set({
                                profile: {
                                    ...currentState.profile,
                                    ...updatedUser
                                }
                            });
                        }

                        if (currentState.minimalProfile) {
                            set({
                                minimalProfile: {
                                    ...currentState.minimalProfile,
                                    username: updatedUser.username,
                                    email: updatedUser.email,
                                    avatar: updatedUser.avatar,
                                    preferences: updatedUser.preferences
                                }
                            });
                        }
                    }
                }
            }
        );
    },

    uploadAvatar: async (formData) => {
        const { makeApiCall, isAuthenticated } = baseSlice;

        if (!isAuthenticated()) {
            throw new Error('Please sign in to upload avatar');
        }

        return await makeApiCall(
            'uploadAvatar',
            () => apiClient.post('/users/avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }),
            {
                loadingState: 'isAvatarLoading',
                errorState: 'avatarError',
                errorMessage: 'upload avatar',
                showToast: false,
                onSuccess: (response) => {
                    if (response.data.success) {
                        const avatarUrl = response.data.avatar || response.data.user?.avatar;
                        const currentState = get();

                        // Update avatar in both profiles
                        ['profile', 'minimalProfile'].forEach(profileKey => {
                            if (currentState[profileKey]) {
                                set({
                                    [profileKey]: {
                                        ...currentState[profileKey],
                                        avatar: avatarUrl
                                    }
                                });
                            }
                        });
                    }
                }
            }
        );
    },

    deleteAvatar: async () => {
        const { makeApiCall, isAuthenticated } = baseSlice;

        if (!isAuthenticated()) {
            throw new Error('Please sign in to delete avatar');
        }

        return await makeApiCall(
            'deleteAvatar',
            () => apiClient.delete('/users/avatar'),
            {
                loadingState: 'isAvatarLoading',
                errorState: 'avatarError',
                errorMessage: 'delete avatar',
                showToast: false,
                onSuccess: () => {
                    const currentState = get();

                    // Remove avatar from both profiles
                    ['profile', 'minimalProfile'].forEach(profileKey => {
                        if (currentState[profileKey]) {
                            set({
                                [profileKey]: {
                                    ...currentState[profileKey],
                                    avatar: null
                                }
                            });
                        }
                    });
                }
            }
        );
    },

    // Helper methods
    hasMinimalProfile: () => {
        const currentState = get();
        return currentState.isMinimalProfileLoaded && currentState.minimalProfile;
    },

    isReady: () => {
        const currentState = get();
        return currentState.isInitialized && !currentState.isMinimalProfileLoading;
    },

    refreshMinimalProfile: async () => {
        return await get().loadMinimalProfile(true);
    }
});