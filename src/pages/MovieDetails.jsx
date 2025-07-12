import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Star,
  Calendar,
  Clock,
  Heart,
  Plus,
  Eye,
  Play,
  ArrowLeft,
  Users,
  Globe,
  DollarSign,
  Check,
  X,
} from "lucide-react";
import { movieApi } from "../utils/api";
import MovieSection from "../components/MovieSection";
import Button from "../components/ui/Button";
import { useUserStore } from "../stores/userStore";

const MovieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [similarMoviesLoading, setSimilarMoviesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [actionLoading, setActionLoading] = useState(null); // Track which action is loading

  // Get user store methods and state
  const {
    addToFavorites,
    removeFromFavorites,
    addToWatched,
    removeFromWatched,
    isFavorite,
    isWatched,
    isLoading: userStoreLoading,
  } = useUserStore();

  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch movie details
        const movieResponse = await movieApi.getMovieDetails(id);
        // Handle the nested data structure from your API
        const movieData = movieResponse.data || movieResponse;
        setMovie(movieData);

        // Fetch recommendations and similar movies
        await Promise.all([fetchRecommendations(id), fetchSimilarMovies(id)]);
      } catch (err) {
        setError(err.message || "Failed to load movie details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMovieData();
    }
  }, [id]);

  const fetchRecommendations = async (movieId) => {
    try {
      setRecommendationsLoading(true);
      const response = await movieApi.getMovieRecommendations(movieId);
      const data = response.data || response;
      setRecommendations(data.results || []);
    } catch (err) {
      console.log("Error fetching recommendations:", err);
      setRecommendations([]);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const fetchSimilarMovies = async (movieId) => {
    try {
      setSimilarMoviesLoading(true);
      const response = await movieApi.getSimilarMovies(movieId);
      const data = response.data || response;
      setSimilarMovies(data.results || []);
    } catch (err) {
      console.log("Error fetching similar movies:", err);
      setSimilarMovies([]);
    } finally {
      setSimilarMoviesLoading(false);
    }
  };

  const handleToggleFavorites = async () => {
    if (!movie) return;

    setActionLoading("favorites");
    try {
      const isMovieFavorite = isFavorite(movie.id);
      
      if (isMovieFavorite) {
        await removeFromFavorites(movie.id);
      } else {
        await addToFavorites(movie);
      }
    } catch (err) {
      console.error("Error toggling favorites:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddToWatchlist = async () => {
    // Note: This would be for a separate watchlist functionality
    // if you have it in your store. For now, I'll keep the console.log
    try {
      console.log("Adding to watchlist:", movie.title);
      // Implement API call here if you have watchlist functionality
    } catch (err) {
      console.error("Error adding to watchlist:", err);
    }
  };

  const handleToggleWatched = async () => {
    if (!movie) return;

    setActionLoading("watched");
    try {
      const isMovieWatched = isWatched(movie.id);
      
      if (isMovieWatched) {
        await removeFromWatched(movie.id);
      } else {
        await addToWatched(movie);
      }
    } catch (err) {
      console.error("Error toggling watched status:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMovieClick = (clickedMovie) => {
    navigate(`/movie/${clickedMovie.id}`);
  };

  const handleWatchTrailer = () => {
    if (movie.trailer) {
      window.open(movie.trailer, "_blank");
    }
  };

  const retryRecommendations = () => {
    fetchRecommendations(id);
  };

  const retrySimilarMovies = () => {
    fetchSimilarMovies(id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl">Loading movie details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Error Loading Movie</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <Button variant="primary" size="medium" onClick={() => navigate("/")}>
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-xl">Movie not found</p>
      </div>
    );
  }

  // Handle the new API response format
  const backdropUrl = movie.backdrop || null;
  const posterUrl =
    movie.poster ||
    "https://via.placeholder.com/500x750/1f2937/9ca3af?text=No+Image";
  const releaseYear = movie.releaseDate
    ? new Date(movie.releaseDate).getFullYear()
    : null;
  const rating = movie.rating;
  const runtime = movie.runtime;
  const genres = movie.genres || [];

  // Check if movie is already in favorites or watched
  const isMovieFavorite = isFavorite(movie.id);
  const isMovieWatched = isWatched(movie.id);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <div className="relative">
        {/* Backdrop */}
        {backdropUrl && (
          <div className="absolute inset-0 z-0">
            <img
              src={backdropUrl}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/70"></div>
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 pt-20 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="medium"
              leftIcon={<ArrowLeft className="h-5 w-5" />}
              onClick={() => navigate(-1)}
              className="mb-8"
            >
              Back
            </Button>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Movie Poster */}
              <div className="flex-shrink-0">
                <img
                  src={posterUrl}
                  alt={movie.title}
                  className="w-80 h-auto rounded-lg shadow-2xl mx-auto lg:mx-0"
                />
              </div>

              {/* Movie Info */}
              <div className="flex-1">
                <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                  {movie.title}
                </h1>

                {movie.tagline && (
                  <p className="text-xl text-gray-300 italic mb-6">
                    {movie.tagline}
                  </p>
                )}

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-6 mb-6">
                  {rating && (
                    <div className="flex items-center space-x-2">
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      <span className="text-lg font-semibold">
                        {rating.toFixed(1)}
                      </span>
                    </div>
                  )}

                  {releaseYear && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <span>{releaseYear}</span>
                    </div>
                  )}

                  {runtime && (
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <span>{runtime} min</span>
                    </div>
                  )}
                </div>

                {/* Genres */}
                {genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {genres.map((genre) => (
                      <span
                        key={genre.id}
                        className="bg-red-600/20 text-red-400 px-3 py-1 rounded-full text-sm"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4 mb-8">
                  {movie.trailer && (
                    <Button
                      variant="primary"
                      size="medium"
                      leftIcon={<Play className="h-5 w-5" />}
                      onClick={handleWatchTrailer}
                    >
                      Watch Trailer
                    </Button>
                  )}

                  <Button
                    variant={isMovieFavorite ? "primary" : "secondary"}
                    size="medium"
                    leftIcon={
                      actionLoading === "favorites" ? null : (
                        isMovieFavorite ? (
                          <X className="h-5 w-5" />
                        ) : (
                          <Heart className="h-5 w-5" />
                        )
                      )
                    }
                    onClick={handleToggleFavorites}
                    disabled={actionLoading === "favorites" || userStoreLoading}
                    className={
                      isMovieFavorite 
                        ? "bg-red-600 hover:bg-red-700 text-white" 
                        : "hover:bg-red-600/20 hover:text-red-400 hover:border-red-400"
                    }
                  >
                    {actionLoading === "favorites" ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        {isMovieFavorite ? "Removing..." : "Adding..."}
                      </>
                    ) : isMovieFavorite ? (
                      "Remove from Favorites"
                    ) : (
                      "Add to Favorites"
                    )}
                  </Button>

                  <Button
                    variant="secondary"
                    size="medium"
                    leftIcon={<Plus className="h-5 w-5" />}
                    onClick={handleAddToWatchlist}
                  >
                    Add to Watchlist
                  </Button>

                  <Button
                    variant={isMovieWatched ? "primary" : "secondary"}
                    size="medium"
                    leftIcon={
                      actionLoading === "watched" ? null : (
                        isMovieWatched ? (
                          <X className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )
                      )
                    }
                    onClick={handleToggleWatched}
                    disabled={actionLoading === "watched" || userStoreLoading}
                    className={
                      isMovieWatched 
                        ? "bg-green-600 hover:bg-green-700 text-white" 
                        : "hover:bg-green-600/20 hover:text-green-400 hover:border-green-400"
                    }
                  >
                    {actionLoading === "watched" ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        {isMovieWatched ? "Removing..." : "Adding..."}
                      </>
                    ) : isMovieWatched ? (
                      "Remove from Watched"
                    ) : (
                      "Mark as Watched"
                    )}
                  </Button>
                </div>

                {/* Overview */}
                {movie.overview && (
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Overview</h3>
                    <p className="text-gray-300 leading-relaxed text-lg">
                      {movie.overview}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tabs */}
        <div className="border-b border-gray-800 mb-8">
          <nav className="flex space-x-8">
            {[
              { id: "overview", label: "Details" },
              { id: "cast", label: "Cast & Crew" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-red-600 text-red-600"
                    : "border-transparent text-gray-400 hover:text-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Production Info */}
              <div>
                <h3 className="text-xl font-semibold mb-4">
                  Production Details
                </h3>
                <div className="space-y-3">
                  {movie.budget && (
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-300">
                        Budget: ${movie.budget.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {movie.revenue && (
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-300">
                        Revenue: ${movie.revenue.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {movie.originalLanguage && (
                    <div className="flex items-center space-x-3">
                      <Globe className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-300">
                        Language: {movie.originalLanguage.toUpperCase()}
                      </span>
                    </div>
                  )}

                  {movie.voteCount && (
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-300">
                        Votes: {movie.voteCount.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Info */}
              <div>
                <h3 className="text-xl font-semibold mb-4">
                  Additional Information
                </h3>
                <div className="space-y-3">
                  {movie.status && (
                    <div>
                      <span className="text-gray-400">Status: </span>
                      <span className="text-gray-300">{movie.status}</span>
                    </div>
                  )}

                  {movie.originalTitle &&
                    movie.originalTitle !== movie.title && (
                      <div>
                        <span className="text-gray-400">Original Title: </span>
                        <span className="text-gray-300">
                          {movie.originalTitle}
                        </span>
                      </div>
                    )}

                  {movie.productionCompanies &&
                    movie.productionCompanies.length > 0 && (
                      <div>
                        <span className="text-gray-400">
                          Production Companies:{" "}
                        </span>
                        <span className="text-gray-300">
                          {movie.productionCompanies
                            .map((company) => company.name)
                            .join(", ")}
                        </span>
                      </div>
                    )}

                  {movie.director && (
                    <div>
                      <span className="text-gray-400">Director: </span>
                      <span className="text-gray-300">{movie.director}</span>
                    </div>
                  )}

                  {movie.producer && (
                    <div>
                      <span className="text-gray-400">Producer: </span>
                      <span className="text-gray-300">{movie.producer}</span>
                    </div>
                  )}

                  {movie.writer && (
                    <div>
                      <span className="text-gray-400">Writer: </span>
                      <span className="text-gray-300">{movie.writer}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "cast" && (
            <div>
              <h3 className="text-xl font-semibold mb-6">Cast & Crew</h3>

              {/* Cast */}
              {movie.cast && movie.cast.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-lg font-medium mb-4">Main Cast</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {movie.cast.slice(0, 10).map((actor) => (
                      <div key={actor.id} className="text-center">
                        <img
                          src={
                            actor.profilePath ||
                            "https://via.placeholder.com/150x200/1f2937/9ca3af?text=No+Image"
                          }
                          alt={actor.name}
                          className="w-full h-32 object-cover rounded-lg mb-2"
                        />
                        <p className="text-sm font-medium text-white">
                          {actor.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {actor.character}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Crew */}
              {movie.crew && movie.crew.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium mb-4">Key Crew</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {movie.crew.slice(0, 8).map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center space-x-3"
                      >
                        <img
                          src={
                            member.profilePath ||
                            "https://via.placeholder.com/60x80/1f2937/9ca3af?text=No+Image"
                          }
                          alt={member.name}
                          className="w-12 h-16 object-cover rounded"
                        />
                        <div>
                          <p className="text-sm font-medium text-white">
                            {member.name}
                          </p>
                          <p className="text-xs text-gray-400">{member.job}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Sections - Always Show */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Recommendations Section */}
        <MovieSection
          title="You Might Also Like"
          movies={recommendations}
          loading={recommendationsLoading}
          error={null}
          showViewAll={false}
          cardSize="medium"
          onMovieClick={handleMovieClick}
          onRetry={retryRecommendations}
        />

        {/* Similar Movies Section */}
        <MovieSection
          title="More Like This"
          movies={similarMovies}
          loading={similarMoviesLoading}
          error={null}
          showViewAll={false}
          cardSize="medium"
          onMovieClick={handleMovieClick}
          onRetry={retrySimilarMovies}
        />
      </div>
    </div>
  );
};

export default MovieDetails;