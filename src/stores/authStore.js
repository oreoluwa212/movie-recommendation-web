import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'react-toastify';
import { authApi } from '../utils/api';

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            setError: (error) => {
                set({ error });
            },

            clearError: () => {
                set({ error: null });
            },

            login: async (email, password) => {
                set({ isLoading: true, error: null });

                try {
                    const response = await authApi.login({ email, password });

                    const userData = response.user || response.data?.user || response;
                    const token = response.token || response.data?.token || response.accessToken;

                    if (!userData) {
                        throw new Error('Invalid response: missing user data');
                    }

                    const isEmailVerified = userData.isEmailVerified || userData.emailVerified || false;

                    if (token && isEmailVerified) {
                        localStorage.setItem('authToken', token);
                    }

                    set({
                        user: userData,
                        token: isEmailVerified ? token : null,
                        isAuthenticated: isEmailVerified,
                        isLoading: false,
                        error: null
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
                } catch (err) {
                    const errorMessage = err.response?.data?.message || err.message || 'Login failed';
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
                    const response = await authApi.register({ username, email, password });

                    const userData = response.user || response.data?.user || response;
                    const token = response.token || response.data?.token || response.accessToken;
                    const emailVerificationRequired = response.emailVerificationRequired ||
                        response.data?.emailVerificationRequired ||
                        false;

                    if (!userData) {
                        throw new Error('Invalid response: missing user data');
                    }

                    const isEmailVerified = userData.isEmailVerified || userData.emailVerified || false;
                    const needsVerification = emailVerificationRequired || !isEmailVerified;

                    if (token && !needsVerification) {
                        localStorage.setItem('authToken', token);
                    }

                    set({
                        user: userData,
                        token: needsVerification ? null : token,
                        isAuthenticated: !needsVerification,
                        isLoading: false,
                        error: null
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
                } catch (err) {
                    let errorMessage = 'Registration failed';

                    if (err.response?.data?.message) {
                        errorMessage = err.response.data.message;
                    } else if (err.response?.data?.error) {
                        errorMessage = err.response.data.error;
                    } else if (err.message) {
                        errorMessage = err.message;
                    }

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

            verifyEmail: async (email, verificationCode) => {
                set({ isLoading: true, error: null });

                try {
                    const response = await authApi.verifyEmail({
                        email,
                        code: verificationCode
                    });

                    const userData = response.user || response.data?.user || response;
                    const token = response.token || response.data?.token || response.accessToken;

                    if (!userData) {
                        throw new Error('Invalid response: missing user data');
                    }

                    const verifiedUser = {
                        ...get().user,
                        ...userData,
                        isEmailVerified: true,
                        emailVerified: true
                    };

                    set({
                        user: verifiedUser,
                        token: null,
                        isAuthenticated: false,
                        isLoading: false
                    });

                    toast.success('Email verified successfully! Please login to continue.');
                    return {
                        success: true,
                        user: verifiedUser,
                        token,
                        redirectToLogin: true
                    };
                } catch (err) {
                    const errorMessage = err.response?.data?.message || err.message || 'Email verification failed';
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
                } catch (err) {
                    const errorMessage = err.response?.data?.message || err.message || 'Failed to resend verification code';
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

                localStorage.removeItem('authToken');

                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error: null
                });

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
                } catch (err) {
                    set({
                        isLoading: false,
                        error: err.message,
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
                } catch (err) {
                    const errorMessage = err.response?.data?.message || err.message || 'Profile update failed';
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
                            set({ isAuthenticated: false });
                        }
                    } catch {
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
                } catch {
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
                } catch {
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

                    if (state.user && (state.user.isEmailVerified || state.user.emailVerified)) {
                        if (!state.isTokenExpired?.()) {
                            setTimeout(() => {
                                state.initializeAuth?.();
                            }, 100);
                        } else {
                            state.logout?.();
                        }
                    } else {
                        state.logout?.();
                    }
                }
            }
        }
    )
);