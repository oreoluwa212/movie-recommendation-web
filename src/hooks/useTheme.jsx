// hooks/useTheme.js
import { useEffect } from "react";
import { useUserStore } from "../stores/userStore";

export const useTheme = () => {
  const theme = useUserStore((state) => state.theme);
  const updateTheme = useUserStore((state) => state.updateTheme);
  const isThemeLoading = useUserStore((state) => state.isThemeLoading);
  const initializeTheme = useUserStore((state) => state.initializeTheme);
  const isInitialized = useUserStore((state) => state.isInitialized);

  // Initialize theme on mount
  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  // Apply theme to document when theme changes
  useEffect(() => {
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove("light", "dark");

    // Add current theme class
    root.classList.add(theme);

    // Also update data attribute for CSS variables
    root.setAttribute("data-theme", theme);

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        "content",
        theme === "dark" ? "#1f2937" : "#ffffff"
      );
    }
  }, [theme]);

  const toggleTheme = async () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    return await updateTheme(newTheme);
  };

  const setTheme = async (newTheme) => {
    if (newTheme !== theme) {
      return await updateTheme(newTheme);
    }
    return { success: true };
  };

  return {
    theme,
    isThemeLoading,
    toggleTheme,
    setTheme,
    isDark: theme === "dark",
    isLight: theme === "light",
    isInitialized,
  };
};