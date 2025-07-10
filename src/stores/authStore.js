// stores/authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'react-toastify';
import { authApi } from '../utils/api';

export const useAuthStore = create(
    persist(
        (set, get) => ({
            // State
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            currentView: 'home',

            // Actions
            setCurrentView: (view) => {
                set({ currentView: view, error: null });
            },

            setError: (error) => {
                set({ error });
            },

            clearError: () => {
                set({ error: null });
            },

            login: async (email, password) => {
                set({ isLoading: true, error: null });
                
                try {
                    const response = await authApi.login(email, password);
                    
                    // API returns user data directly or nested in data
                    const userData = response.user || response.data?.user || response;
                    const token = response.token || response.data?.token || response.accessToken;

                    if (!userData || !token) {
                        throw new Error('Invalid response format');
                    }

                    set({
                        user: userData,
                        token,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null,
                        currentView: 'home'
                    });

                    toast.success(`Welcome back, ${userData.username}!`);
                    return { success: true, user: userData, token };
                } catch (error) {
                    const errorMessage = error.message || 'Login failed';
                    set({ 
                        isLoading: false, 
                        error: errorMessage,
                        isAuthenticated: false,
                        user: null,
                        token: null
                    });
                    toast.error(errorMessage);
                    return { success: false, error: errorMessage };
                }
            },

            register: async (username, email, password) => {
                set({ isLoading: true, error: null });
                
                try {
                    const response = await authApi.register(username, email, password);
                    
                    // API returns user data directly or nested in data
                    const userData = response.user || response.data?.user || response;
                    const token = response.token || response.data?.token || response.accessToken;

                    if (!userData || !token) {
                        throw new Error('Invalid response format');
                    }

                    set({
                        user: userData,
                        token,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null,
                        currentView: 'home'
                    });

                    toast.success(`Welcome to MovieApp, ${userData.username}!`);
                    return { success: true, user: userData, token };
                } catch (error) {
                    const errorMessage = error.message || 'Registration failed';
                    set({ 
                        isLoading: false, 
                        error: errorMessage,
                        isAuthenticated: false,
                        user: null,
                        token: null
                    });
                    toast.error(errorMessage);
                    return { success: false, error: errorMessage };
                }
            },

            logout: () => {
                const currentUser = get().user;
                
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error: null,
                    currentView: 'home'
                });

                // Clear user data from other stores
                if (typeof window !== 'undefined') {
                    // Clear user store data
                    localStorage.removeItem('user-storage');
                    localStorage.removeItem('movie-storage');
                    localStorage.removeItem('watchlist-storage');
                }

                toast.success(`Goodbye, ${currentUser?.username || 'User'}!`);
            },

            getCurrentUser: async () => {
                const { token } = get();
                
                if (!token) {
                    return null;
                }

                try {
                    set({ isLoading: true });
                    const response = await authApi.getCurrentUser();
                    const userData = response.user || response.data?.user || response;
                    
                    set({ user: userData, isLoading: false });
                    return userData;
                } catch (error) {
                    console.error('Get current user failed:', error);
                    set({ 
                        isLoading: false,
                        error: error.message,
                        isAuthenticated: false,
                        user: null,
                        token: null
                    });
                    return null;
                }
            },

            updateProfile: async (userData) => {
                const { token } = get();
                
                if (!token) {
                    toast.error('Please login first');
                    return { success: false, error: 'Not authenticated' };
                }

                try {
                    set({ isLoading: true, error: null });
                    const response = await authApi.updateProfile(userData);
                    const updatedUser = response.user || response.data?.user || response;
                    
                    set({ 
                        user: updatedUser, 
                        isLoading: false 
                    });
                    
                    toast.success('Profile updated successfully!');
                    return { success: true, user: updatedUser };
                } catch (error) {
                    const errorMessage = error.message || 'Profile update failed';
                    set({ 
                        isLoading: false, 
                        error: errorMessage 
                    });
                    toast.error(errorMessage);
                    return { success: false, error: errorMessage };
                }
            },

            // Initialize auth state on app load
            initializeAuth: async () => {
                const { token } = get();
                
                if (token) {
                    try {
                        const user = await get().getCurrentUser();
                        if (user) {
                            set({ isAuthenticated: true });
                        }
                    } catch (error) {
                        console.error('Auth initialization failed:', error);
                        get().logout();
                    }
                }
            },

            // Utility methods
            isTokenExpired: () => {
                const { token } = get();
                if (!token) return true;
                
                try {
                    // Decode JWT token to check expiration
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    const currentTime = Date.now() / 1000;
                    return payload.exp < currentTime;
                } catch (error) {
                    console.error('Token parsing failed:', error);
                    return true;
                }
            },

            refreshToken: async () => {
                // Note: Your API doesn't seem to have a refresh endpoint
                // This is a placeholder for future implementation
                const { token } = get();
                if (!token) return false;
                
                try {
                    // In a real app, call refresh endpoint here
                    // const response = await authApi.refreshToken();
                    // const newToken = response.token;
                    // set({ token: newToken });
                    return true;
                // eslint-disable-next-line no-unreachable
                } catch (error) {
                    console.error('Token refresh failed:', error);
                    get().logout();
                    return false;
                }
            }
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated
            }),
            onRehydrateStorage: () => (state) => {
                if (state?.token) {
                    // Check if token is expired
                    if (!state.isTokenExpired?.()) {
                        state.initializeAuth?.();
                    } else {
                        // Token is expired, logout
                        state.logout?.();
                    }
                }
            }
        }
    )
);