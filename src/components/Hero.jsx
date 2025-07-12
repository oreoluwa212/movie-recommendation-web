import { useState, useEffect } from "react";
import { Star, Calendar, Film, Play, Info } from "lucide-react";
import AuthButtons from "./AuthButtons";
import { useAuthStore } from "../stores/authStore";
import Button from "./ui/Button";

// Hero Section Skeleton
const HeroSkeleton = () => (
  <div className="relative h-96 overflow-hidden bg-gray-800">
    <div className="animate-pulse absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-700" />

    <div className="relative z-10 absolute bottom-0 left-0 w-full p-8">
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

const Hero = ({ movies, isLoading = false, onMovieSelect }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const { isAuthenticated } = useAuthStore();

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
  }, [currentIndex]);

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
    const backdropUrl = movie.backdrop || movie.backdrop_path;
    const posterUrl = movie.poster || movie.poster_path;

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
    const date = movie.releaseDate || movie.release_date;
    if (!date) return null;
    return new Date(date).getFullYear();
  };

  const getRating = () => {
    const rating = movie.rating || movie.vote_average;
    return rating ? rating.toFixed(1) : null;
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleWatchNow = () => {
    if (onMovieSelect) onMovieSelect(movie);
  };

  const handleMoreInfo = () => {
    if (onMovieSelect) onMovieSelect(movie);
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 w-full z-10 px-10 pb-16">
        <div className="max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            {movie.title}
          </h1>

          {/* Movie Info */}
          <div className="flex items-center space-x-4 mb-4 text-gray-300">
            {getRating() && (
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span>{getRating()}</span>
              </div>
            )}
            {getReleaseYear() && (
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{getReleaseYear()}</span>
              </div>
            )}
          </div>

          {/* Overview */}
          <p className="text-lg text-gray-300 mb-8 line-clamp-3 max-w-2xl">
            {movie.overview}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mb-4">
            <Button
              onClick={handleWatchNow}
              variant="primary"
              size="large"
              leftIcon={<Play className="h-5 w-5" />}
              className="bg-red-600 hover:bg-red-700"
            >
              Watch Now
            </Button>
            <Button
              onClick={handleMoreInfo}
              variant="outline"
              size="large"
              leftIcon={<Info className="h-5 w-5" />}
            >
              More Info
            </Button>
          </div>

          {/* Auth Prompt for Non-Authenticated Users */}
          {!isAuthenticated && (
            <div className="mt-6 p-4 bg-black/60 rounded-lg border border-gray-700">
              <p className="text-gray-300 mb-3">
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
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? "bg-red-600" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Hero;
