// hooks/useAppInitialization.js - Improved version
import { useEffect, useRef } from "react";
import { useAuthStore } from "../stores/authStore";
import { useUserStore } from "../stores/userStore";

export const useAppInitialization = () => {
  const { isAuthenticated, user } = useAuthStore();
  const {
    isInitialized,
    isMinimalProfileLoading,
    initializationError,
    minimalProfile,
    initialize,
    reset: resetUserStore,
  } = useUserStore();

  const hasRunRef = useRef(false);
  const lastUserIdRef = useRef(null);

  useEffect(() => {
    // Only run initialization logic once per app lifecycle
    if (!hasRunRef.current) {
      hasRunRef.current = true;
      console.log("🚀 App initialization started");

      // If user is already authenticated on app start, initialize immediately
      if (isAuthenticated && user?._id) {
        console.log("🔄 User already authenticated, initializing...");
        lastUserIdRef.current = user._id;

        initialize()
          .then((result) => {
            if (result.success) {
              console.log("✅ App initialization completed successfully");
            } else {
              console.log(
                "⚠️ App initialization completed with issues:",
                result.error
              );
            }
          })
          .catch((error) => {
            console.error("❌ App initialization failed:", error);
          });
      } else {
        console.log("ℹ️ No authenticated user found, skipping initialization");
      }
    }
  }, []); // Empty dependency array - only run once

  // Handle user changes (login/logout)
  useEffect(() => {
    const currentUserId = user?._id || null;

    // User logged out
    if (!isAuthenticated || !currentUserId) {
      if (lastUserIdRef.current !== null) {
        console.log("🔄 User logged out, resetting store");
        resetUserStore();
        lastUserIdRef.current = null;
      }
      return;
    }

    // User changed (different user logged in)
    if (currentUserId !== lastUserIdRef.current) {
      console.log("🔄 User changed, reinitializing...");
      lastUserIdRef.current = currentUserId;

      initialize()
        .then((result) => {
          if (result.success) {
            console.log("✅ User change initialization completed");
          } else {
            console.log(
              "⚠️ User change initialization had issues:",
              result.error
            );
          }
        })
        .catch((error) => {
          console.error("❌ User change initialization failed:", error);
        });
    }
  }, [isAuthenticated, user?._id, initialize, resetUserStore]);

  return {
    isInitialized,
    isLoading: isMinimalProfileLoading,
    error: initializationError,
    user: minimalProfile || user,
    isAuthenticated,
  };
};
