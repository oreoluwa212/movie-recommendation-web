import { ThemeManager } from "../../utils/themeManager";

export const createThemeSlice = (set, get, apiClient, baseSlice) => ({
    // Theme state
    theme: ThemeManager.getStoredTheme(),
    isThemeLoading: false,

    // Theme actions
    getTheme: () => get().theme,

    setTheme: (theme) => {
        set({ theme });
        ThemeManager.applyTheme(theme);
    },

    updateTheme: async (newTheme) => {
        const { makeApiCall, isAuthenticated } = baseSlice;

        if (!isAuthenticated()) {
            set({ theme: newTheme });
            ThemeManager.applyTheme(newTheme);
            return { success: true };
        }

        return await makeApiCall(
            'updateTheme',
            () => apiClient.put('/users/profile', {
                preferences: { theme: newTheme }
            }),
            {
                loadingState: 'isThemeLoading',
                errorMessage: 'update theme',
                showToast: false,
                onSuccess: () => {
                    // Update theme in store and DOM
                    set({ theme: newTheme });
                    ThemeManager.applyTheme(newTheme);

                    // Also update profile data
                    const currentState = get();
                    ['profile', 'minimalProfile'].forEach(profileKey => {
                        if (currentState[profileKey]) {
                            set({
                                [profileKey]: {
                                    ...currentState[profileKey],
                                    preferences: {
                                        ...currentState[profileKey].preferences,
                                        theme: newTheme
                                    }
                                }
                            });
                        }
                    });
                }
            }
        );
    },

    initializeTheme: () => {
        const currentState = get();
        let themeToApply = currentState.theme;

        if (baseSlice.isAuthenticated() && currentState.profile?.preferences?.theme) {
            themeToApply = currentState.profile.preferences.theme;
            set({ theme: themeToApply });
        }

        ThemeManager.applyTheme(themeToApply);
    }
});
