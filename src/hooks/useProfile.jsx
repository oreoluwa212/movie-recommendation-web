import { useState, useEffect, useCallback, useRef } from 'react';
import { useUserStore } from '../stores/userStore';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'react-toastify';

export const useProfile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const initializationRef = useRef(false);
  const loadingRef = useRef(false);

  const { isAuthenticated } = useAuthStore();

  const {
    profile,
    minimalProfile,
    favorites,
    watchedMovies,
    reviews,
    watchlists,
    loadProfile,
    initialize,
    updateProfile: updateProfileStore,
    uploadAvatar: uploadAvatarStore,
    deleteAvatar: deleteAvatarStore,
    syncWithServer,
    getStats,
    isMinimalProfileLoaded,
    isMinimalProfileLoading,
    lastSync
  } = useUserStore();

  // Combined user data - prefer full profile over minimal
  const currentUser = profile || minimalProfile;

  // Stats calculation
  const userStats = getStats();

  // Initialize profile data on mount and when authentication changes
  const ensureInitialized = useCallback(async () => {
    if (!isAuthenticated) {
      setIsInitialized(false);
      setError(null);
      return;
    }

    if (initializationRef.current || isInitialized) {
      return;
    }

    initializationRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // First ensure minimal profile is loaded
      if (!isMinimalProfileLoaded) {
        await initialize();
      }

      // Then load full profile data
      const result = await loadProfile(false);

      if (result.success) {
        setIsInitialized(true);
        setError(null);
      } else {
        throw new Error(result.error || 'Failed to load profile');
      }
    } catch (err) {
      console.error('Profile initialization error:', err);
      setError(err.message || 'Failed to initialize profile');
      setIsInitialized(false);
    } finally {
      setIsLoading(false);
      initializationRef.current = false;
    }
  }, [isAuthenticated, initialize, loadProfile, isMinimalProfileLoaded, isInitialized]);

  // Ensure full profile is loaded (including favorites, watched movies, etc.)
  const ensureFullProfileLoaded = useCallback(async (forceRefresh = false) => {
    if (!isAuthenticated) {
      return { success: false, error: 'Not authenticated' };
    }

    if (loadingRef.current) {
      return { success: false, error: 'Already loading' };
    }

    // Check if we already have full profile data and it's recent
    const hasRecentData = profile && favorites && lastSync &&
      (Date.now() - new Date(lastSync).getTime() < 5 * 60 * 1000); // 5 minutes

    if (!forceRefresh && hasRecentData) {
      return { success: true, data: profile };
    }

    loadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // Sync all data from server
      const result = await syncWithServer();

      if (result) {
        setError(null);
        return { success: true, data: result };
      } else {
        throw new Error('Failed to sync profile data');
      }
    } catch (err) {
      console.error('Full profile loading error:', err);
      const errorMessage = err.message || 'Failed to load profile data';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [isAuthenticated, profile, favorites, lastSync, syncWithServer]);

  // Update profile
  const updateProfile = useCallback(async (profileData) => {
    if (!isAuthenticated) {
      const error = 'Please sign in to update your profile';
      toast.error(error);
      return { success: false, error };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await updateProfileStore(profileData);

      if (result.success) {
        toast.success('Profile updated successfully!');
        setError(null);
        return { success: true, data: result.data };
      } else {
        throw new Error(result.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      const errorMessage = err.message || 'Failed to update profile';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, updateProfileStore]);

  // Upload avatar
  const uploadAvatar = useCallback(async (file) => {
    if (!isAuthenticated) {
      const error = 'Please sign in to upload an avatar';
      toast.error(error);
      return { success: false, error };
    }

    if (!file) {
      const error = 'Please select a file to upload';
      toast.error(error);
      return { success: false, error };
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const result = await uploadAvatarStore(formData);

      if (result.success) {
        toast.success('Avatar uploaded successfully!');
        setError(null);
        return { success: true, data: result.data };
      } else {
        throw new Error(result.error || 'Failed to upload avatar');
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
      const errorMessage = err.message || 'Failed to upload avatar';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, uploadAvatarStore]);

  // Delete avatar
  const deleteAvatar = useCallback(async () => {
    if (!isAuthenticated) {
      const error = 'Please sign in to delete your avatar';
      toast.error(error);
      return { success: false, error };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await deleteAvatarStore();

      if (result.success) {
        toast.success('Avatar deleted successfully!');
        setError(null);
        return { success: true };
      } else {
        throw new Error(result.error || 'Failed to delete avatar');
      }
    } catch (err) {
      console.error('Avatar delete error:', err);
      const errorMessage = err.message || 'Failed to delete avatar';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, deleteAvatarStore]);

  // Force refresh all data
  const refreshProfile = useCallback(async () => {
    return await ensureFullProfileLoaded(true);
  }, [ensureFullProfileLoaded]);

  // Initialize on mount and auth changes
  useEffect(() => {
    if (isAuthenticated && !isInitialized) {
      ensureInitialized();
    } else if (!isAuthenticated) {
      setIsInitialized(false);
      setError(null);
      initializationRef.current = false;
      loadingRef.current = false;
    }
  }, [isAuthenticated, isInitialized, ensureInitialized]);

  // Auto-refresh stale data
  useEffect(() => {
    if (!isAuthenticated || !isInitialized) return;

    const checkAndRefreshData = async () => {
      const isStale = !lastSync || (Date.now() - new Date(lastSync).getTime() > 10 * 60 * 1000); // 10 minutes

      if (isStale && !loadingRef.current) {
        console.log('Data is stale, refreshing...');
        await ensureFullProfileLoaded(false);
      }
    };

    checkAndRefreshData();

    // Set up periodic refresh
    const interval = setInterval(checkAndRefreshData, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated, isInitialized, lastSync, ensureFullProfileLoaded]);

  return {
    // User data
    currentUser,
    profile,
    minimalProfile,
    favorites: favorites || [],
    watchedMovies: watchedMovies || [],
    reviews: reviews || [],
    watchlists: watchlists || [],
    userStats,

    // Loading states
    isLoading: isLoading || isMinimalProfileLoading,
    isInitialized,
    error,

    // Actions
    updateProfile,
    uploadAvatar,
    deleteAvatar,
    refreshProfile,
    ensureFullProfileLoaded,

    // Utilities
    hasData: !!(currentUser && isInitialized),
    isReady: !!(isInitialized && !isLoading && currentUser),
    lastSync
  };
};