// components/ReviewsSection.jsx - Enhanced version with all API features
import React, { useState, useEffect } from "react";
import {
  Star,
  MessageCircle,
  Trash2,
  Edit3,
  Send,
  X,
  AlertTriangle,
  Heart,
  Flag,
  TrendingUp,
  User,
  Calendar,
  BarChart3,
  ThumbsUp,
  Clock,
  Filter,
  SortAsc,
  SortDesc,
  Eye,
  EyeOff,
} from "lucide-react";
import { reviewsApi } from "../utils/api";
import { useUserStore } from "../stores/userStore";
import Button from "./ui/Button";

const ReviewsSection = ({ movieId, movieTitle }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewStats, setReviewStats] = useState(null);

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [editingReview, setEditingReview] = useState(null);
  const [spoiler, setSpoiler] = useState(false);

  // New state for additional features
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showStats, setShowStats] = useState(false);
  const [likedReviews, setLikedReviews] = useState(new Set());
  const [reportingReview, setReportingReview] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [showSpoilers, setShowSpoilers] = useState(false);

  // Get current user
  const { user } = useUserStore();

  useEffect(() => {
    if (movieId) {
      fetchReviews();
      fetchReviewStats();
      if (user) {
        fetchUserReview();
      }
    }
  }, [movieId, user, sortBy, sortOrder]);

  const fetchReviews = async (pageNum = 1, reset = true) => {
    try {
      setLoading(true);
      setError(null);

      const response = await reviewsApi.getMovieReviews(movieId, pageNum, 5);
      const data = response.data || response;

      if (reset) {
        setReviews(data.reviews || []);
      } else {
        setReviews((prev) => [...prev, ...(data.reviews || [])]);
      }

      // Update metadata
      setAverageRating(data.averageRating || 0);
      setTotalReviews(data.totalReviews || 0);

      // Handle pagination
      const pagination = data.pagination || {};
      setPage(pageNum);
      const totalPages = pagination.pages || 1;
      setHasMore(pageNum < totalPages);
    } catch (err) {
      setError("Failed to load reviews");
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewStats = async () => {
    try {
      const response = await reviewsApi.getMovieReviewStats(movieId);
      setReviewStats(response.data || response);
    } catch (err) {
      console.error("Error fetching review stats:", err);
    }
  };

  const fetchUserReview = async () => {
    try {
      const response = await reviewsApi.getUserReviewForMovie(movieId);
      setUserReview(response.data || response);
    } catch {
      setUserReview(null);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewText.trim() || rating === 0) return;

    try {
      setSubmitting(true);

      const reviewData = {
        movieId: parseInt(movieId),
        rating,
        review: reviewText.trim(),
        spoiler,
      };

      const response = await reviewsApi.createOrUpdateReview(reviewData);

      setUserReview(response.data || response);

      setReviewText("");
      setRating(0);
      setHoverRating(0);
      setSpoiler(false);
      setShowReviewForm(false);
      setEditingReview(null);

      await fetchReviews(1, true);
      await fetchReviewStats();
    } catch (err) {
      console.error("Error submitting review:", err);
      setError("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;

    try {
      await reviewsApi.deleteReview(reviewId);

      if (userReview && userReview._id === reviewId) {
        setUserReview(null);
      }

      await fetchReviews(1, true);
      await fetchReviewStats();
    } catch (err) {
      console.error("Error deleting review:", err);
      setError("Failed to delete review");
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setReviewText(review.review);
    setRating(review.rating);
    setSpoiler(review.spoiler || false);
    setShowReviewForm(true);
  };

  const handleCancelEdit = () => {
    setEditingReview(null);
    setReviewText("");
    setRating(0);
    setHoverRating(0);
    setSpoiler(false);
    setShowReviewForm(false);
  };

  const handleLikeReview = async (reviewId) => {
    if (!user) {
      setError("Please login to like reviews");
      return;
    }

    try {
      await reviewsApi.toggleLikeReview(reviewId);
      
      // Update liked reviews state
      setLikedReviews(prev => {
        const newLiked = new Set(prev);
        if (newLiked.has(reviewId)) {
          newLiked.delete(reviewId);
        } else {
          newLiked.add(reviewId);
        }
        return newLiked;
      });

      // Refresh reviews to get updated like count
      await fetchReviews(1, true);
    } catch (err) {
      console.error("Error liking review:", err);
      setError("Failed to like review");
    }
  };

  const handleReportReview = async (reviewId) => {
    if (!reportReason.trim()) {
      setError("Please provide a reason for reporting");
      return;
    }

    try {
      await reviewsApi.reportReview(reviewId, reportReason);
      setReportingReview(null);
      setReportReason('');
      setError(null);
      // Show success message
      alert("Review reported successfully. Thank you for helping keep our community safe.");
    } catch (err) {
      console.error("Error reporting review:", err);
      setError("Failed to report review");
    }
  };

  const loadMoreReviews = () => {
    if (hasMore && !loading) {
      fetchReviews(page + 1, false);
    }
  };

  const renderStars = (currentRating, interactive = false, size = "w-5 h-5") => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              interactive ? "cursor-pointer" : ""
            } transition-colors ${
              star <= (interactive ? hoverRating || rating : currentRating)
                ? "text-yellow-400 fill-current"
                : "text-gray-400"
            }`}
            onClick={interactive ? () => setRating(star) : undefined}
            onMouseEnter={interactive ? () => setHoverRating(star) : undefined}
            onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderReviewStats = () => {
    if (!reviewStats) return null;

    const { ratingDistribution, averageRating, totalReviews } = reviewStats;

    return (
      <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4 mb-6">
        <h4 className="font-medium mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-red-600" />
          Review Statistics
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-400 mb-2">Rating Distribution</p>
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = ratingDistribution?.[rating] || 0;
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center space-x-2 mb-1">
                  <div className="flex items-center space-x-1 w-12">
                    <span className="text-sm">{rating}</span>
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                  </div>
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-400 w-12">{count}</span>
                </div>
              );
            })}
          </div>
          
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {averageRating?.toFixed(1) || '0.0'}
              </div>
              <div className="flex justify-center mb-1">
                {renderStars(averageRating)}
              </div>
              <p className="text-sm text-gray-400">
                Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSortControls = () => {
    return (
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="createdAt">Date</option>
            <option value="rating">Rating</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>
        
        <button
          onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
          className="flex items-center space-x-1 text-sm text-gray-400 hover:text-white transition-colors"
        >
          {sortOrder === 'desc' ? (
            <SortDesc className="h-4 w-4" />
          ) : (
            <SortAsc className="h-4 w-4" />
          )}
          <span>{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
        </button>

        <button
          onClick={() => setShowSpoilers(!showSpoilers)}
          className="flex items-center space-x-1 text-sm text-gray-400 hover:text-white transition-colors"
        >
          {showSpoilers ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
          <span>{showSpoilers ? 'Hide' : 'Show'} Spoilers</span>
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <MessageCircle className="h-6 w-6 text-red-600" />
            <h3 className="text-xl font-semibold">Reviews</h3>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <span>
              {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
            </span>
            {averageRating > 0 && (
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span>{averageRating.toFixed(1)} average</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="small"
            onClick={() => setShowStats(!showStats)}
            leftIcon={<BarChart3 className="h-4 w-4" />}
          >
            {showStats ? 'Hide' : 'Show'} Stats
          </Button>
          
          {user && !userReview && (
            <Button
              variant="primary"
              size="small"
              onClick={() => setShowReviewForm(true)}
              leftIcon={<Edit3 className="h-4 w-4" />}
            >
              Write Review
            </Button>
          )}
        </div>
      </div>

      {/* Review Statistics */}
      {showStats && renderReviewStats()}

      {/* User's existing review */}
      {userReview && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user.username?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <div>
                <p className="font-medium text-white">Your Review</p>
                <div className="flex items-center space-x-2">
                  {renderStars(userReview.rating)}
                  <span className="text-sm text-gray-400">
                    {formatDate(userReview.createdAt)}
                  </span>
                  {userReview.spoiler && (
                    <span className="text-xs bg-yellow-600 text-yellow-100 px-2 py-1 rounded">
                      SPOILER
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="small"
                onClick={() => handleEditReview(userReview)}
                leftIcon={<Edit3 className="h-4 w-4" />}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="small"
                onClick={() => handleDeleteReview(userReview._id)}
                leftIcon={<Trash2 className="h-4 w-4" />}
                className="text-red-400 hover:text-red-300"
              >
                Delete
              </Button>
            </div>
          </div>
          <p className="text-gray-300">{userReview.review}</p>
        </div>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h4 className="font-medium mb-4">
            {editingReview
              ? "Edit Your Review"
              : `Write a review for ${movieTitle}`}
          </h4>

          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Rating *
              </label>
              {renderStars(rating, true, "w-6 h-6")}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Review *
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your thoughts about this movie..."
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent resize-none"
                rows="4"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="spoiler"
                checked={spoiler}
                onChange={(e) => setSpoiler(e.target.checked)}
                className="w-4 h-4 text-red-600 bg-gray-900 border-gray-600 rounded focus:ring-red-600 focus:ring-2"
              />
              <label
                htmlFor="spoiler"
                className="text-sm text-gray-300 flex items-center space-x-1"
              >
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <span>This review contains spoilers</span>
              </label>
            </div>

            <div className="flex space-x-3">
              <Button
                type="submit"
                variant="primary"
                size="medium"
                disabled={submitting || !reviewText.trim() || rating === 0}
                leftIcon={submitting ? null : <Send className="h-4 w-4" />}
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    {editingReview ? "Updating..." : "Submitting..."}
                  </>
                ) : editingReview ? (
                  "Update Review"
                ) : (
                  "Submit Review"
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="medium"
                onClick={handleCancelEdit}
                leftIcon={<X className="h-4 w-4" />}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-600/20 border border-red-600 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Sort Controls */}
      {reviews.length > 0 && renderSortControls()}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review._id}
            className="bg-gray-800/30 border border-gray-700 rounded-lg p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {review.user?.username?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-white">
                    {review.user?.username || "Anonymous"}
                  </p>
                  <div className="flex items-center space-x-2">
                    {renderStars(review.rating)}
                    <span className="text-sm text-gray-400">
                      {formatDate(review.createdAt)}
                    </span>
                    {review.spoiler && (
                      <span className="text-xs bg-yellow-600 text-yellow-100 px-2 py-1 rounded">
                        SPOILER
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Like button */}
                {user && (
                  <button
                    onClick={() => handleLikeReview(review._id)}
                    className={`flex items-center space-x-1 text-sm px-2 py-1 rounded transition-colors ${
                      likedReviews.has(review._id)
                        ? 'text-red-400 bg-red-600/20'
                        : 'text-gray-400 hover:text-red-400'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${likedReviews.has(review._id) ? 'fill-current' : ''}`} />
                    <span>{review.likes || 0}</span>
                  </button>
                )}

                {/* Report button */}
                {user && review.user?._id !== user._id && (
                  <button
                    onClick={() => setReportingReview(review._id)}
                    className="text-gray-400 hover:text-yellow-400 transition-colors"
                  >
                    <Flag className="h-4 w-4" />
                  </button>
                )}

                {/* Delete button for own reviews */}
                {user && review.user?._id === user._id && (
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => handleDeleteReview(review._id)}
                    leftIcon={<Trash2 className="h-4 w-4" />}
                    className="text-red-400 hover:text-red-300"
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>

            {/* Review content with spoiler handling */}
            <div className="text-gray-300 leading-relaxed">
              {review.spoiler && !showSpoilers ? (
                <div className="bg-yellow-600/20 border border-yellow-600 rounded p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm text-yellow-400">Spoiler Warning</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">
                    This review contains spoilers. Click to reveal.
                  </p>
                  <button
                    onClick={() => setShowSpoilers(true)}
                    className="text-sm text-yellow-400 hover:text-yellow-300 underline"
                  >
                    Show Spoiler
                  </button>
                </div>
              ) : (
                <p>{review.review}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Report Modal */}
      {reportingReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Report Review</h3>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Please explain why you're reporting this review..."
              className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent resize-none"
              rows="4"
            />
            <div className="flex justify-end space-x-3 mt-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setReportingReview(null);
                  setReportReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => handleReportReview(reportingReview)}
                disabled={!reportReason.trim()}
              >
                Submit Report
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Load More Button */}
      {hasMore && reviews.length > 0 && (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            size="medium"
            onClick={loadMoreReviews}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Loading...
              </>
            ) : (
              "Load More Reviews"
            )}
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && reviews.length === 0 && (
        <div className="text-center py-8">
          <MessageCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">No reviews yet</p>
          {user && !userReview && (
            <Button
              variant="primary"
              size="medium"
              onClick={() => setShowReviewForm(true)}
              leftIcon={<Edit3 className="h-4 w-4" />}
            >
              Be the first to review
            </Button>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && reviews.length === 0 && (
        <div className="flex justify-center py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading reviews...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsSection;