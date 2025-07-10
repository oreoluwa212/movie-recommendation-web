import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MovieCard from "./MovieCard";
import { Link } from "react-router-dom";

const MovieSection = ({
  title,
  movies = [],
  loading = false,
  error = null,
  showViewAll = true,
  viewAllLink = null,
  cardSize = "medium",
  showActions = true,
  onRetry,
  onMovieClick, // Add this prop for custom handling
}) => {
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const navigate = useNavigate();

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollButtons();
  }, [movies]);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const cardWidth =
        cardSize === "small" ? 160 : cardSize === "medium" ? 192 : 224;
      const scrollAmount =
        direction === "left" ? -cardWidth * 2 : cardWidth * 2;

      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });

      // Update scroll buttons after animation
      setTimeout(checkScrollButtons, 300);
    }
  };

  // Handle movie click - either use custom handler or default navigation
  const handleMovieClick = (movie) => {
    if (onMovieClick) {
      onMovieClick(movie);
    } else {
      navigate(`/movie/${movie.id}`);
    }
  };

  if (loading) {
    return (
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
        </div>
        <div className="flex space-x-4 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`${
                cardSize === "small"
                  ? "w-40 h-60"
                  : cardSize === "medium"
                  ? "w-48 h-72"
                  : "w-56 h-80"
              } bg-gray-800 rounded-lg animate-pulse flex-shrink-0`}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
        </div>
        <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-8 text-center">
          <p className="text-red-400 mb-4">Failed to load movies</p>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!movies || movies.length === 0) {
    return (
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-8 text-center">
          <p className="text-gray-400">No movies found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <div className="flex items-center space-x-4">
          {showViewAll && viewAllLink && (
            <Link
              to={viewAllLink}
              className="text-red-500 hover:text-red-400 transition-colors font-medium"
            >
              View All
            </Link>
          )}

          {/* Scroll Buttons */}
          {movies.length > 3 && showActions && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                className={`p-2 rounded-full transition-colors ${
                  canScrollLeft
                    ? "bg-gray-800 hover:bg-gray-700 text-white"
                    : "bg-gray-800/50 text-gray-500 cursor-not-allowed"
                }`}
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                className={`p-2 rounded-full transition-colors ${
                  canScrollRight
                    ? "bg-gray-800 hover:bg-gray-700 text-white"
                    : "bg-gray-800/50 text-gray-500 cursor-not-allowed"
                }`}
                aria-label="Scroll right"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Movies Container */}
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4"
          onScroll={checkScrollButtons}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {movies.map((movie, index) => (
            <div
              key={`${movie.id}-${index}`}
              className={`flex-shrink-0 ${
                cardSize === "small"
                  ? "w-40"
                  : cardSize === "medium"
                  ? "w-48"
                  : "w-56"
              }`}
            >
              <MovieCard
                movie={movie}
                size={cardSize}
                showActions={showActions}
                onMovieClick={handleMovieClick}
              />
            </div>
          ))}
        </div>

        {/* Fade Gradients for Visual Polish */}
        {movies.length > 3 && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-900 to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-900 to-transparent pointer-events-none" />
          </>
        )}
      </div>
    </div>
  );
};

export default MovieSection;
