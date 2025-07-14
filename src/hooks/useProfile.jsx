// hooks/useProfile.js
import { useUserStore } from "../stores/userStore";
import { toast } from "react-toastify";

export const useProfile = () => {
  const profile = useUserStore((state) => state.profile);
  const minimalProfile = useUserStore((state) => state.minimalProfile);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const uploadAvatar = useUserStore((state) => state.uploadAvatar);
  const deleteAvatar = useUserStore((state) => state.deleteAvatar);
  const loadProfile = useUserStore((state) => state.loadProfile);
  const loadMinimalProfile = useUserStore((state) => state.loadMinimalProfile);

  // Loading states
  const isProfileUpdateLoading = useUserStore(
    (state) => state.isProfileUpdateLoading
  );
  const isAvatarLoading = useUserStore((state) => state.isAvatarLoading);
  const isLoading = useUserStore((state) => state.isLoading);

  // Error states
  const profileUpdateError = useUserStore((state) => state.profileUpdateError);
  const avatarError = useUserStore((state) => state.avatarError);
  const error = useUserStore((state) => state.error);

  // Profile update with toast notifications
  const handleUpdateProfile = async (profileData) => {
    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        toast.success("Profile updated successfully!");
        return result;
      } else {
        toast.error(result.error || "Failed to update profile");
        return result;
      }
    } catch (error) {
      const errorMessage = error.message || "Failed to update profile";
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Avatar upload with validation and toast notifications
  const handleAvatarUpload = async (file) => {
    // Validate file
    if (!file) {
      toast.error("Please select a file");
      return { success: false, error: "No file selected" };
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return { success: false, error: "Invalid file type" };
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      toast.error("File size must be less than 5MB");
      return { success: false, error: "File too large" };
    }

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const result = await uploadAvatar(formData);
      if (result.success) {
        toast.success("Avatar uploaded successfully!");
        return result;
      } else {
        toast.error(result.error || "Failed to upload avatar");
        return result;
      }
    } catch (error) {
      const errorMessage = error.message || "Failed to upload avatar";
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Avatar delete with confirmation and toast notifications
  const handleAvatarDelete = async () => {
    try {
      const result = await deleteAvatar();
      if (result.success) {
        toast.success("Avatar deleted successfully!");
        return result;
      } else {
        toast.error(result.error || "Failed to delete avatar");
        return result;
      }
    } catch (error) {
      const errorMessage = error.message || "Failed to delete avatar";
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Get current user data - FIXED: Prioritize full profile for avatar
  const getCurrentUser = () => {
    // If we have a full profile, use it (it has avatar and complete data)
    if (profile) {
      return profile;
    }
    // Only fallback to minimal profile if full profile is not available
    return minimalProfile;
  };

  // ADDED: Load full profile if we only have minimal profile
  const ensureFullProfile = async () => {
    if (!profile && minimalProfile) {
      try {
        await loadProfile(false);
      } catch (error) {
        console.error('Failed to load full profile:', error);
      }
    }
  };

  // Check if user has avatar - FIXED: Use full profile data
  const hasAvatar = () => {
    const user = getCurrentUser();
    return !!user?.avatar;
  };

  // Get user stats
  const getUserStats = () => {
    const user = getCurrentUser();
    return (
      user?.stats || {
        totalFavorites: 0,
        totalWatched: 0,
        averageRating: 0,
      }
    );
  };

  // Get user preferences
  const getUserPreferences = () => {
    const user = getCurrentUser();
    return (
      user?.preferences || {
        theme: "dark",
        genres: [],
      }
    );
  };

  // Refresh profile data
  const refreshProfile = async (forceRefresh = false) => {
    try {
      const result = await loadProfile(forceRefresh);
      return result;
    } catch (error) {
      const errorMessage = error.message || "Failed to refresh profile";
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Refresh minimal profile data
  const refreshMinimalProfile = async (forceRefresh = false) => {
    try {
      const result = await loadMinimalProfile(forceRefresh);
      return result;
    } catch (error) {
      const errorMessage = error.message || "Failed to refresh profile";
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  return {
    // Data
    profile,
    minimalProfile,
    currentUser: getCurrentUser(),
    userStats: getUserStats(),
    userPreferences: getUserPreferences(),

    // State
    isProfileUpdateLoading,
    isAvatarLoading,
    isLoading,
    hasAvatar: hasAvatar(),

    // Errors
    profileUpdateError,
    avatarError,
    error,

    // Actions
    updateProfile: handleUpdateProfile,
    uploadAvatar: handleAvatarUpload,
    deleteAvatar: handleAvatarDelete,
    refreshProfile,
    refreshMinimalProfile,
    ensureFullProfileLoaded: ensureFullProfile, // NEW: Helper to ensure full profile is loaded

    // Utilities
    getCurrentUser,
    getUserStats,
    getUserPreferences,
  };
};