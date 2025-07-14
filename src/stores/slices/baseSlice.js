// store/slices/baseSlice.js
import { RequestCache } from '../requestCache';
import { ToastManager } from '../../utils/toastManager';
import { getUserFriendlyError } from '../../utils/errorHandler';
import { isAuthenticated } from '../../utils/authHelpers';

export const createBaseSlice = (set, get, apiClient) => {
  const requestCache = new RequestCache();
  const toastManager = new ToastManager();

  return {
    // Base state
    isLoading: false,
    error: null,

    // Base actions
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),

    // Helper methods
    requestCache,
    toastManager,
    getUserFriendlyError,
    isAuthenticated,

    // Generic API call wrapper
    makeApiCall: async (key, apiFunction, options = {}) => {
      const {
        useCache = true,
        showToast = true,
        loadingState = 'isLoading',
        errorState = 'error',
        successMessage,
        errorMessage,
        onSuccess,
        onError
      } = options;

      // Check cache first
      if (useCache && requestCache.has(key)) {
        return await requestCache.get(key);
      }

      const apiPromise = (async () => {
        try {
          // Set loading state
          if (loadingState) {
            set({ [loadingState]: true, [errorState]: null });
          }

          const result = await apiFunction(apiClient);

          // Handle success
          if (onSuccess) {
            onSuccess(result);
          }

          if (showToast && successMessage) {
            toastManager.success(successMessage);
          }

          return { success: true, data: result };
        } catch (error) {
          const errorMsg = getUserFriendlyError(error, errorMessage || 'complete this action');
          
          // Handle error
          if (onError) {
            onError(error);
          }

          if (showToast) {
            toastManager.error(errorMsg);
          }

          return { success: false, error: errorMsg };
        } finally {
          // Clear loading state
          if (loadingState) {
            set({ [loadingState]: false });
          }
          requestCache.delete(key);
        }
      })();

      if (useCache) {
        requestCache.set(key, apiPromise);
      }

      return await apiPromise;
    },

    // Cleanup
    clearCache: () => {
      requestCache.clear();
    }
  };
};
