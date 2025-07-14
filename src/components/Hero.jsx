import { useState, useEffect } from "react";
import { Star, Calendar, Film, Play, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AuthButtons from "./AuthButtons";
import { useAuthStore } from "../stores/authStore";
import { movieApi } from "../utils/api";
import Button from "./ui/Button";

// Hero Section Skeleton
const HeroSkeleton = () => (
  <div className="relative h-96 overflow-hidden bg-gray-800">
    <div className="animate-pulse absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-700" />

    <div className="relative z-10 bottom-0 left-0 w-full p-8">
      <div className="max-w-2xl space-y-4">
        <div className="animate-pulse h-12 bg-gray-700 rounded-lg w-3/4" />
        <div className="flex items-center space-x-4">
          <div className="animate-pulse h-4 bg-gray-700 rounded w-16" />
          <div className="animate-pulse h-4 bg-gray-700 rounded w-12" />
        </div>
        <div className="space-y-2">
          <div className="animate-pulse h-4 bg-gray-700 rounded w-full" />
          <div className="animate-pulse h-4 bg-gray-700 rounded w-5/6" />
          <div className="animate-pulse h-4 bg-gray-700 rounded w-4/6" />
        </div>
        <div className="flex space-x-4 pt-4">
          <div className="animate-pulse h-12 bg-gray-700 rounded-lg w-32" />
          <div className="animate-pulse h-12 bg-gray-700 rounded-lg w-32" />
        </div>
      </div>
    </div>
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="animate-pulse w-2 h-2 bg-gray-600 rounded-full"
        />
      ))}
    </div>
  </div>
);

const Hero = ({ movies, isLoading = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [detailedMovie, setDetailedMovie] = useState(null);
  const [loadingTrailer, setLoadingTrailer] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (movies && movies.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % movies.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [movies]);

  useEffect(() => {
    setImageError(false);
    setDetailedMovie(null);
  }, [currentIndex]);

  // Fetch detailed movie data when needed for trailer
  const fetchMovieDetails = async (movieId) => {
    try {
      setLoadingTrailer(true);
      const response = await movieApi.getMovieDetails(movieId);
      const movieData = response.data || response;
      setDetailedMovie(movieData);
      return movieData;
    } catch (error) {
      console.error("Error fetching movie details:", error);
      return null;
    } finally {
      setLoadingTrailer(false);
    }
  };

  if (isLoading) {
    return <HeroSkeleton />;
  }

  if (!movies || movies.length === 0) {
    return (
      <div className="relative h-96 bg-gradient-to-r from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Welcome to StreamVibe
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Discover amazing movies and shows
          </p>
          {!isAuthenticated && (
            <AuthButtons
              size="large"
              variant="primary"
              showIcons={true}
              className="justify-center"
            />
          )}
        </div>
      </div>
    );
  }

  const movie = movies[currentIndex];

  const getImageUrl = () => {
    const backdropUrl = movie.backdrop_path || movie.backdrop;
    const posterUrl = movie.poster_path || movie.poster;

    if (backdropUrl) {
      if (backdropUrl.startsWith("http")) return backdropUrl;
      return `https://image.tmdb.org/t/p/w1280${backdropUrl}`;
    }

    if (posterUrl) {
      if (posterUrl.startsWith("http")) return posterUrl;
      return `https://image.tmdb.org/t/p/w1280${posterUrl}`;
    }

    return "https://via.placeholder.com/1920x1080/1f2937/9ca3af?text=No+Image";
  };

  const getReleaseYear = () => {
    const date = movie.release_date || movie.releaseDate;
    if (!date) return null;
    return new Date(date).getFullYear();
  };

  const getRating = () => {
    const rating = movie.vote_average || movie.rating;
    return rating ? rating.toFixed(1) : null;
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleWatchTrailer = async () => {
    // First check if we already have detailed movie data with trailer
    if (detailedMovie && detailedMovie.trailer) {
      window.open(detailedMovie.trailer, "_blank");
      return;
    }

    // If no detailed data, fetch it
    const movieDetails = await fetchMovieDetails(movie.id);
    if (movieDetails && movieDetails.trailer) {
      window.open(movieDetails.trailer, "_blank");
    } else {
      // Fallback: search for trailer on YouTube
      const searchQuery = `${movie.title} ${getReleaseYear()} trailer`;
      const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
        searchQuery
      )}`;
      window.open(youtubeUrl, "_blank");
    }
  };

  const handleMoreInfo = () => {
    // Navigate to movie details page
    navigate(`/movie/${movie.id}`);
  };

  return (
    <div className="relative w-full h-[80vh] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        {!imageError ? (
          <img
            src={getImageUrl()}
            alt={movie.title}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-gray-900 to-black flex items-center justify-center">
            <Film className="h-24 w-24 text-gray-600" />
          </div>
        )}

        {/* Enhanced Black Overlay for Better Text Visibility */}
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent"></div>
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 w-full z-10 px-10 pb-16">
        <div className="max-w-4xl">
          {/* Title with additional text shadow for extra visibility */}
          <h1
            className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-2xl"
            style={{
              textShadow:
                "2px 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6)",
            }}
          >
            {movie.title}
          </h1>

          {/* Movie Info */}
          <div className="flex items-center space-x-4 mb-4 text-gray-300">
            {getRating() && (
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current drop-shadow-lg" />
                <span className="drop-shadow-lg">{getRating()}</span>
              </div>
            )}
            {getReleaseYear() && (
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4 drop-shadow-lg" />
                <span className="drop-shadow-lg">{getReleaseYear()}</span>
              </div>
            )}
          </div>

          {/* Overview with text shadow */}
          <p
            className="text-lg text-gray-300 mb-8 line-clamp-3 max-w-2xl drop-shadow-lg"
            style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}
          >
            {movie.overview}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mb-4">
            {/* Watch Trailer Button - Always show */}
            <Button
              onClick={handleWatchTrailer}
              variant="primary"
              size="large"
              leftIcon={
                loadingTrailer ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Play className="h-5 w-5" />
                )
              }
              disabled={loadingTrailer}
              className="bg-red-600 hover:bg-red-700 shadow-lg"
            >
              {loadingTrailer ? "Loading..." : "Watch Trailer"}
            </Button>

            <Button
              onClick={handleMoreInfo}
              variant="outline"
              size="large"
              leftIcon={<Info className="h-5 w-5" />}
              className="shadow-lg"
            >
              More Info
            </Button>
          </div>

          {/* Auth Prompt for Non-Authenticated Users */}
          {!isAuthenticated && (
            <div className="mt-6 p-4 bg-black/80 rounded-lg border border-gray-700 backdrop-blur-sm">
              <p className="text-gray-300 mb-3 drop-shadow-lg">
                Sign in to access your personalized movie experience
              </p>
              <AuthButtons
                size="small"
                variant="secondary"
                showIcons={false}
                className="justify-start"
              />
            </div>
          )}
        </div>
      </div>

      {/* Carousel Indicators */}
      {movies.length > 1 && (
        <div className="absolute bottom-4 right-8 flex space-x-2">
          {movies.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all shadow-lg ${
                index === currentIndex ? "bg-red-600" : "bg-white/70"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Hero;
