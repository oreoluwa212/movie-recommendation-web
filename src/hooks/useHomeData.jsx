import { useState, useEffect, useCallback } from "react";
import { useMovieStore } from "../stores/movieStore";
import { useUserStore } from "../stores/userStore";
import { useAuthStore } from "../stores/authStore";

export const useHomeData = () => {
  const {
    popularMovies,
    featuredMovies,
    topRatedMovies,
    nowPlayingMovies,
    upcomingMovies,
    getPopularMovies,
    getTopRatedMovies,
    getNowPlayingMovies,
    getUpcomingMovies,
    getTrendingMovies,
    initializeFeaturedMovies,
    getGenres,
    isLoadingPopular,
    isLoadingTopRated,
    isLoadingNowPlaying,
    isLoadingUpcoming,
    isLoadingTrending,
    error: movieError,
  } = useMovieStore();

  const { favorites, watchedMovies } = useUserStore();
  const { isAuthenticated } = useAuthStore();

  const [homeData, setHomeData] = useState({
    hero: [],
    popular: [],
    topRated: [],
    nowPlaying: [],
    upcoming: [],
    trending: [],
    personalized: [],
  });

  const [loadingStates, setLoadingStates] = useState({
    hero: true,
    popular: true,
    topRated: true,
    nowPlaying: true,
    upcoming: true,
    trending: true,
    personalized: true,
  });

  const [errors, setErrors] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);

  const updateLoadingState = useCallback((section, isLoading) => {
    setLoadingStates((prev) => ({ ...prev, [section]: isLoading }));
  }, []);

  const updateData = useCallback((section, data) => {
    setHomeData((prev) => ({ ...prev, [section]: data }));
  }, []);

  const updateError = useCallback((section, error) => {
    setErrors((prev) => ({ ...prev, [section]: error }));
  }, []);

  const fetchWithErrorHandling = useCallback(
    async (fetchFunction, section) => {
      try {
        updateLoadingState(section, true);
        updateError(section, null);

        const response = await fetchFunction();

        if (Array.isArray(response)) {
          updateData(section, response);
        } else if (response?.results) {
          updateData(section, response.results);
        } else if (response?.movies) {
          updateData(section, response.movies);
        } else {
          updateData(section, []);
        }
      } catch (error) {
        console.error(`Error fetching ${section}:`, error);

        let errorMessage = "Something went wrong.";
        if (error.message.includes("Rate limit")) {
          errorMessage = "Too many requests. Please try again later.";
        } else if (error.message.includes("Network")) {
          errorMessage = "Network error. Check your connection.";
        } else if (error.message.includes("500")) {
          errorMessage = "Server error. Please try again later.";
        } else if (error.message.includes("404")) {
          errorMessage = "Content not found.";
        }

        updateError(section, errorMessage);
        updateData(section, []);
      } finally {
        updateLoadingState(section, false);
      }
    },
    [updateData, updateError, updateLoadingState]
  );

  const generatePersonalizedRecommendations = useCallback(() => {
    if (!isAuthenticated) return [];

    const userMovies = [...favorites, ...watchedMovies];
    const userGenres = userMovies.flatMap((movie) => movie.genre_ids || []);
    const genreCount = userGenres.reduce((acc, genre) => {
      acc[genre] = (acc[genre] || 0) + 1;
      return acc;
    }, {});

    const topGenres = Object.entries(genreCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([genre]) => parseInt(genre));

    const allMovies = [
      ...popularMovies,
      ...topRatedMovies,
      ...nowPlayingMovies,
      ...upcomingMovies,
    ];

    const recommendations = allMovies
      .filter(
        (movie) =>
          !userMovies.some((m) => m.id === movie.id) &&
          movie.genre_ids?.some((g) => topGenres.includes(g))
      )
      .slice(0, 10);

    return recommendations.length > 0
      ? recommendations
      : allMovies.slice(0, 10);
  }, [
    isAuthenticated,
    favorites,
    watchedMovies,
    popularMovies,
    topRatedMovies,
    nowPlayingMovies,
    upcomingMovies,
  ]);

  const retryFailedRequests = useCallback(async () => {
    const failedSections = Object.keys(errors).filter(
      (section) => errors[section]
    );

    for (const section of failedSections) {
      switch (section) {
        case "popular":
          await fetchWithErrorHandling(getPopularMovies, section);
          break;
        case "topRated":
          await fetchWithErrorHandling(getTopRatedMovies, section);
          break;
        case "nowPlaying":
          await fetchWithErrorHandling(getNowPlayingMovies, section);
          break;
        case "upcoming":
          await fetchWithErrorHandling(getUpcomingMovies, section);
          break;
        case "trending":
          if (getTrendingMovies) {
            await fetchWithErrorHandling(getTrendingMovies, section);
          }
          break;
        case "personalized":
          if (isAuthenticated) {
            updateLoadingState(section, true);
            const personalized = generatePersonalizedRecommendations();
            updateData(section, personalized);
            updateLoadingState(section, false);
          }
          break;
        default:
          break;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }, [
    errors,
    fetchWithErrorHandling,
    getPopularMovies,
    getTopRatedMovies,
    getNowPlayingMovies,
    getUpcomingMovies,
    getTrendingMovies,
    isAuthenticated,
    generatePersonalizedRecommendations,
    updateData,
    updateLoadingState,
  ]);

  // Initialize data on component mount
  useEffect(() => {
    if (isInitialized) return;

    const initializeData = async () => {
      try {
        console.log("Initializing home data...");
        await getGenres();
        await initializeFeaturedMovies();

        await Promise.all([
          fetchWithErrorHandling(getPopularMovies, "popular"),
          fetchWithErrorHandling(getTopRatedMovies, "topRated"),
          fetchWithErrorHandling(getNowPlayingMovies, "nowPlaying"),
          fetchWithErrorHandling(getUpcomingMovies, "upcoming"),
          getTrendingMovies
            ? fetchWithErrorHandling(getTrendingMovies, "trending")
            : Promise.resolve(),
        ]);

        if (isAuthenticated) {
          updateLoadingState("personalized", true);
          const personalized = generatePersonalizedRecommendations();
          updateData("personalized", personalized);
          updateLoadingState("personalized", false);
        }

        setIsInitialized(true);
        console.log("Home data initialized successfully");
      } catch (error) {
        console.error("Error initializing home data:", error);
        setIsInitialized(true);
      }
    };

    initializeData();
  }, [
    isInitialized,
    initializeFeaturedMovies,
    getPopularMovies,
    getTopRatedMovies,
    getNowPlayingMovies,
    getUpcomingMovies,
    getTrendingMovies,
    fetchWithErrorHandling,
    isAuthenticated,
    generatePersonalizedRecommendations,
    updateLoadingState,
    updateData,
    getGenres,
  ]);

  // Update hero section when featured movies are loaded
  useEffect(() => {
    if (featuredMovies.length > 0) {
      updateData("hero", featuredMovies);
      updateLoadingState("hero", false);
    } else if (popularMovies.length > 0) {
      updateData("hero", popularMovies.slice(0, 3));
      updateLoadingState("hero", false);
    }
  }, [featuredMovies, popularMovies, updateData, updateLoadingState]);

  // Update section data when store data changes
  useEffect(() => {
    if (popularMovies.length > 0) {
      updateData("popular", popularMovies);
      updateLoadingState("popular", false);
    }
  }, [popularMovies, updateData, updateLoadingState]);

  useEffect(() => {
    if (topRatedMovies.length > 0) {
      updateData("topRated", topRatedMovies);
      updateLoadingState("topRated", false);
    }
  }, [topRatedMovies, updateData, updateLoadingState]);

  useEffect(() => {
    if (nowPlayingMovies.length > 0) {
      updateData("nowPlaying", nowPlayingMovies);
      updateLoadingState("nowPlaying", false);
    }
  }, [nowPlayingMovies, updateData, updateLoadingState]);

  useEffect(() => {
    if (upcomingMovies.length > 0) {
      updateData("upcoming", upcomingMovies);
      updateLoadingState("upcoming", false);
    }
  }, [upcomingMovies, updateData, updateLoadingState]);

  // Update personalized recommendations when user data changes
  useEffect(() => {
    if (isAuthenticated && isInitialized) {
      const personalized = generatePersonalizedRecommendations();
      updateData("personalized", personalized);
    }
  }, [
    isAuthenticated,
    isInitialized,
    generatePersonalizedRecommendations,
    updateData,
  ]);

  return {
    homeData,
    loadingStates,
    errors,
    isInitialized,
    fetchWithErrorHandling,
    retryFailedRequests,
    generatePersonalizedRecommendations,
    updateData,
    updateLoadingState,
    isLoadingPopular,
    isLoadingTopRated,
    isLoadingNowPlaying,
    isLoadingUpcoming,
    isLoadingTrending,
    movieError,
    getTrendingMovies,
    getPopularMovies,
    getTopRatedMovies,
    getNowPlayingMovies,
    getUpcomingMovies,
  };
};