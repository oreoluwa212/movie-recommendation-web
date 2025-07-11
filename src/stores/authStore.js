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
                    console.log('Auth Store: Starting login process');
                    const response = await authApi.login({ email, password });
                    console.log('Auth Store: Login response received', response);

                    // Handle different response structures
                    const userData = response.user || response.data?.user || response;
                    const token = response.token || response.data?.token || response.accessToken;

                    if (!userData) {
                        throw new Error('Invalid response: missing user data');
                    }

                    // Check if email is verified before authenticating
                    const isEmailVerified = userData.isEmailVerified || userData.emailVerified || false;

                    // Store token in localStorage for axios interceptor (only if verified)
                    if (token && isEmailVerified) {
                        localStorage.setItem('authToken', token);
                    }

                    set({
                        user: userData,
                        token: isEmailVerified ? token : null,
                        isAuthenticated: isEmailVerified, // Only authenticate if email is verified
                        isLoading: false,
                        error: null,
                        currentView: isEmailVerified ? 'home' : 'verify-email'
                    });

                    if (isEmailVerified) {
                        toast.success(`Welcome back, ${userData.username || userData.name || 'User'}!`);
                    } else {
                        toast.info('Please verify your email to complete login');
                    }

                    return {
                        success: true,
                        user: userData,
                        token: isEmailVerified ? token : null,
                        emailVerificationRequired: !isEmailVerified
                    };
                } catch (error) {
                    console.error('Auth Store: Login error:', error);
                    const errorMessage = error.response?.data?.message || error.message || 'Login failed';
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
                console.log('Auth Store: Starting registration process', { username, email });
                set({ isLoading: true, error: null });

                try {
                    // Call the API
                    const response = await authApi.register({ username, email, password });
                    console.log('Auth Store: Registration response received', response);

                    // Handle different response structures
                    const userData = response.user || response.data?.user || response;
                    const token = response.token || response.data?.token || response.accessToken;
                    const emailVerificationRequired = response.emailVerificationRequired ||
                        response.data?.emailVerificationRequired ||
                        false;

                    console.log('Auth Store: Parsed user data:', userData);
                    console.log('Auth Store: Email verification required:', emailVerificationRequired);

                    if (!userData) {
                        throw new Error('Invalid response: missing user data');
                    }

                    // Check if email verification is required
                    const isEmailVerified = userData.isEmailVerified || userData.emailVerified || false;
                    const needsVerification = emailVerificationRequired || !isEmailVerified;

                    // Only store token and authenticate if email is verified
                    if (token && !needsVerification) {
                        localStorage.setItem('authToken', token);
                    }

                    set({
                        user: userData,
                        token: needsVerification ? null : token,
                        isAuthenticated: !needsVerification, // Only authenticate if no verification needed
                        isLoading: false,
                        error: null,
                        currentView: needsVerification ? 'verify-email' : 'home'
                    });

                    if (needsVerification) {
                        toast.success('Registration successful! Please check your email for verification code.');
                    } else {
                        toast.success(`Welcome to StreamVibe, ${userData.username || userData.name || 'User'}!`);
                    }

                    return {
                        success: true,
                        user: userData,
                        token: needsVerification ? null : token,
                        emailVerificationRequired: needsVerification
                    };
                } catch (error) {
                    console.error('Auth Store: Registration error:', error);

                    // Extract error message
                    let errorMessage = 'Registration failed';

                    if (error.response?.data?.message) {
                        errorMessage = error.response.data.message;
                    } else if (error.response?.data?.error) {
                        errorMessage = error.response.data.error;
                    } else if (error.message) {
                        errorMessage = error.message;
                    }

                    console.error('Auth Store: Error message:', errorMessage);

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

            // FIXED: Updated to send correct parameter names and redirect to login
            verifyEmail: async (email, verificationCode) => {
                set({ isLoading: true, error: null });

                try {
                    // Send with correct parameter name expected by backend
                    const response = await authApi.verifyEmail({
                        email,
                        code: verificationCode // Changed from verificationCode to code
                    });
                    console.log('Auth Store: Email verification response:', response);

                    const userData = response.user || response.data?.user || response;
                    const token = response.token || response.data?.token || response.accessToken;

                    if (!userData) {
                        throw new Error('Invalid response: missing user data');
                    }

                    // Update user data to mark email as verified, but don't authenticate yet
                    const verifiedUser = {
                        ...get().user,
                        ...userData,
                        isEmailVerified: true,
                        emailVerified: true
                    };

                    set({
                        user: verifiedUser,
                        token: null, // Don't store token yet - user needs to login
                        isAuthenticated: false, // Don't authenticate yet - redirect to login
                        isLoading: false,
                        currentView: 'login' // Set view to login instead of home
                    });

                    toast.success('Email verified successfully! Please login to continue.');
                    return {
                        success: true,
                        user: verifiedUser,
                        token,
                        redirectToLogin: true // Flag to indicate should redirect to login
                    };
                } catch (error) {
                    console.error('Auth Store: Email verification error:', error);
                    const errorMessage = error.response?.data?.message || error.message || 'Email verification failed';
                    set({
                        error: errorMessage,
                        isLoading: false
                    });
                    toast.error(errorMessage);
                    return { success: false, error: errorMessage };
                }
            },

            resendVerificationCode: async (email) => {
                set({ isLoading: true, error: null });

                try {
                    await authApi.resendVerificationCode({ email });
                    set({ isLoading: false });
                    toast.success('Verification code sent! Please check your email.');
                    return { success: true, message: 'Verification code sent successfully' };
                } catch (error) {
                    console.error('Auth Store: Resend verification error:', error);
                    const errorMessage = error.response?.data?.message || error.message || 'Failed to resend verification code';
                    set({
                        error: errorMessage,
                        isLoading: false
                    });
                    toast.error(errorMessage);
                    return { success: false, error: errorMessage };
                }
            },

            logout: () => {
                const currentUser = get().user;

                // Clear token from localStorage
                localStorage.removeItem('authToken');

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
                    localStorage.removeItem('user-storage');
                    localStorage.removeItem('movie-storage');
                    localStorage.removeItem('watchlist-storage');
                }

                toast.success(`Goodbye, ${currentUser?.username || currentUser?.name || 'User'}!`);
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
                    localStorage.removeItem('authToken');
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
                    const errorMessage = error.response?.data?.message || error.message || 'Profile update failed';
                    set({
                        isLoading: false,
                        error: errorMessage
                    });
                    toast.error(errorMessage);
                    return { success: false, error: errorMessage };
                }
            },

            initializeAuth: async () => {
                const { token } = get();

                if (token) {
                    try {
                        const user = await get().getCurrentUser();
                        if (user && (user.isEmailVerified || user.emailVerified)) {
                            set({ isAuthenticated: true });
                        } else {
                            // User exists but email not verified
                            set({ isAuthenticated: false });
                        }
                    } catch (error) {
                        console.error('Auth initialization failed:', error);
                        get().logout();
                    }
                }
            },

            isTokenExpired: () => {
                const { token } = get();
                if (!token) return true;

                try {
                    if (token.includes('.')) {
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        const currentTime = Date.now() / 1000;
                        return payload.exp < currentTime;
                    }
                    return false;
                } catch (error) {
                    console.error('Token parsing failed:', error);
                    return true;
                }
            },

            refreshToken: async () => {
                const { token } = get();
                if (!token) return false;

                try {
                    const response = await authApi.refreshToken?.();
                    if (response?.token) {
                        const newToken = response.token;
                        localStorage.setItem('authToken', newToken);
                        set({ token: newToken });
                        return true;
                    }
                    return false;
                } catch (error) {
                    console.error('Token refresh failed:', error);
                    get().logout();
                    return false;
                }
            },

            checkAuth: () => {
                const { isAuthenticated, token, user } = get();
                const storedToken = localStorage.getItem('authToken');

                if (storedToken && !token) {
                    set({ token: storedToken });
                }

                // Check if user exists and email is verified
                if (user && !(user.isEmailVerified || user.emailVerified)) {
                    return false;
                }

                if (token && get().isTokenExpired()) {
                    get().logout();
                    return false;
                }

                return isAuthenticated && !!token;
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
                    localStorage.setItem('authToken', state.token);

                    // Only initialize if email is verified
                    if (state.user && (state.user.isEmailVerified || state.user.emailVerified)) {
                        if (!state.isTokenExpired?.()) {
                            setTimeout(() => {
                                state.initializeAuth?.();
                            }, 100);
                        } else {
                            state.logout?.();
                        }
                    } else {
                        // User exists but email not verified
                        state.logout?.();
                    }
                }
            }
        }
    )
);