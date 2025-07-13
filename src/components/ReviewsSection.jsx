import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuthStore } from "../stores/authStore"; // Import your user store
import {
  Star,
  Heart,
  Flag,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  MessageCircle,
  User,
  Calendar,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  Plus,
} from "lucide-react";
import Button from "./ui/Button";
import IconButton from "./ui/IconButton";
import { cn } from "../utils/cn";
import { reviewsApi } from "../utils/api";

// Star Rating Component
const StarRating = ({
  rating,
  maxRating = 5,
  size = "medium",
  interactive = false,
  onRatingChange,
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const sizes = {
    small: "w-4 h-4",
    medium: "w-5 h-5",
    large: "w-6 h-6",
  };

  const handleClick = (rating) => {
    if (interactive && onRatingChange) {
      onRatingChange(rating);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[...Array(maxRating)].map((_, index) => {
        const starRating = index + 1;
        const isActive = starRating <= (hoverRating || rating);

        return (
          <button
            key={index}
            className={cn(
              sizes[size],
              interactive
                ? "cursor-pointer hover:scale-110 transition-transform"
                : "cursor-default",
              "focus:outline-none"
            )}
            onClick={() => handleClick(starRating)}
            onMouseEnter={() => interactive && setHoverRating(starRating)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            disabled={!interactive}
          >
            <Star
              className={cn(
                "w-full h-full transition-colors",
                isActive ? "fill-yellow-400 text-yellow-400" : "text-gray-400"
              )}
            />
          </button>
        );
      })}
    </div>
  );
};

// User Avatar Component
const UserAvatar = ({ user, size = "medium" }) => {
  const sizes = {
    small: "w-8 h-8 text-sm",
    medium: "w-10 h-10 text-base",
    large: "w-12 h-12 text-lg",
  };

  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.username}
        className={cn(sizes[size], "rounded-full object-cover")}
      />
    );
  }

  return (
    <div
      className={cn(
        sizes[size],
        "bg-gray-600 rounded-full flex items-center justify-center text-white font-medium"
      )}
    >
      {user.username?.charAt(0).toUpperCase() || (
        <User className="w-1/2 h-1/2" />
      )}
    </div>
  );
};

// Review Card Component
const ReviewCard = ({ review, onLike, onEdit, onDelete }) => {
  // Get current user from store
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const currentUserId = currentUser?.id || currentUser?._id;

  // Fix: Use 'user' field instead of 'userId' for reports
  const isReported = review.reports?.some(
    (r) => String(r.user) === String(currentUserId)
  );

  const [showSpoiler, setShowSpoiler] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Ensure both IDs are strings for comparison
  const isOwner = String(review.user._id) === String(currentUserId);

  // Fix: likes array contains user IDs directly, not objects with userId
  const isLiked = review.likes?.some(
    (likeUserId) => String(likeUserId) === String(currentUserId)
  );
  const likeCount = review.likes?.length || 0;

  const handleLike = async () => {
    // Check if user is authenticated
    if (!isAuthenticated || !currentUser) {
      toast.error("Please sign in to like reviews");
      return;
    }

    if (isLiking) return;
    setIsLiking(true);
    try {
      await onLike(review._id);
    } finally {
      setIsLiking(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleReport = async (reviewId, reason, additionalInfo) => {
    setIsReporting(true);
    try {
      const res = await reviewsApi.reportReview(
        reviewId,
        reason,
        additionalInfo
      );

      if (!res.success) {
        toast.error(res.message || "Failed to report review");
        throw new Error(res.message || "Failed to report review");
      }

      toast.success("Report submitted successfully!");
      setShowReportModal(false);
    } catch (err) {
      console.error("Error reporting review:", err);
      toast.error(err.message || "Error reporting review.");
    } finally {
      setIsReporting(false);
    }
  };

  const handleReportClick = () => {
    // Check if user is authenticated
    if (!isAuthenticated || !currentUser) {
      toast.error("Please sign in to report reviews");
      return;
    }

    if (isOwner) {
      toast.info("You cannot report your own review.");
      return;
    }

    if (isReported) {
      toast.info("You have already reported this review.");
      return;
    }

    setShowReportModal(true);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-4">
      {/* User Info and Actions */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <UserAvatar user={review.user} />
          <div>
            <h4 className="text-white font-medium">{review.user.username}</h4>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Calendar className="w-4 h-4" />
              {formatDate(review.createdAt)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StarRating rating={review.rating} size="small" />
          <span className="text-white font-medium">{review.rating}/5</span>
        </div>
      </div>

      {/* Review Content */}
      <div className="space-y-3">
        {review.spoiler && (
          <div className="flex items-center gap-2 text-yellow-400 text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Contains Spoilers</span>
          </div>
        )}

        <div className="text-gray-300 leading-relaxed">
          {review.spoiler && !showSpoiler ? (
            <div className="space-y-2">
              <p className="text-gray-500 italic">
                This review contains spoilers.
              </p>
              <Button
                variant="outline"
                size="small"
                onClick={() => setShowSpoiler(true)}
                leftIcon={<Eye className="w-4 h-4" />}
              >
                Show Spoiler
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p>{review.review}</p>
              {review.spoiler && showSpoiler && (
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => setShowSpoiler(false)}
                  leftIcon={<EyeOff className="w-4 h-4" />}
                >
                  Hide Spoiler
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
        <div className="flex items-center gap-4">
          {/* Like button - different behavior for owners vs non-owners */}
          {!isOwner ? (
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-lg transition-all",
                isLiked
                  ? "text-red-400 hover:text-red-300"
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              )}
            >
              <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
              <span className="text-sm">{likeCount}</span>
            </button>
          ) : (
            likeCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 text-gray-400">
                <Heart className="w-4 h-4" />
                <span className="text-sm">{likeCount}</span>
              </div>
            )
          )}

          {/* Report button for non-owners, Delete button for owners */}
          {!isOwner ? (
            <IconButton
              variant={isReported ? "danger" : "ghost"}
              size="small"
              tooltip={
                isReported
                  ? "You already reported this review"
                  : "Report Review"
              }
              onClick={handleReportClick}
            >
              <Flag
                className={cn(
                  "w-4 h-4",
                  isReported && "fill-current text-red-400"
                )}
              />
            </IconButton>
          ) : (
            <IconButton
              variant="danger"
              size="small"
              tooltip="Delete Review"
              onClick={() => onDelete(review._id)}
            >
              <Trash2 className="w-4 h-4" />
            </IconButton>
          )}
        </div>

        {/* Edit button only for owners */}
        {isOwner && (
          <IconButton
            variant="ghost"
            size="small"
            tooltip="Edit Review"
            onClick={() => onEdit(review)}
          >
            <Edit className="w-4 h-4" />
          </IconButton>
        )}
      </div>

      {/* Report Modal - Only for non-owners */}
      {showReportModal && !isOwner && (
        <ReportModal
          reviewId={review._id}
          onClose={() => setShowReportModal(false)}
          onReport={handleReport}
          isLoading={isReporting}
        />
      )}
    </div>
  );
};

// Report Modal Component
const ReportModal = ({ onClose, onReport, isLoading }) => {
  const [reason, setReason] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");

  const reportReasons = [
    "Spam",
    "Inappropriate Content",
    "Spoilers not marked",
    "Harassment",
    "False Information",
    "Other",
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (reason) {
      onReport(reason, additionalInfo);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-white text-lg font-semibold mb-4">Report Review</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Reason for reporting
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            >
              <option value="">Select a reason</option>
              {reportReasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Additional Information (Optional)
            </label>
            <textarea
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              rows="3"
              placeholder="Provide more details..."
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              loading={isLoading}
              disabled={!reason}
            >
              Report
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Review Summary Component
const ReviewSummary = ({ averageRating, totalReviews }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white text-lg font-semibold mb-2">Reviews</h3>
          <p className="text-gray-400">
            {totalReviews} review{totalReviews !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 mb-1">
            <StarRating rating={averageRating} size="medium" />
            <span className="text-white text-xl font-bold">
              {averageRating.toFixed(1)}
            </span>
          </div>
          <p className="text-gray-400 text-sm">Average Rating</p>
        </div>
      </div>
    </div>
  );
};

// Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className="flex justify-center items-center gap-2 mt-6">
      <Button
        variant="ghost"
        size="small"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Previous
      </Button>

      {pages.map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? "primary" : "ghost"}
          size="small"
          onClick={() => onPageChange(page)}
        >
          {page}
        </Button>
      ))}

      <Button
        variant="ghost"
        size="small"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </Button>
    </div>
  );
};

// Main Reviews Section Component
export const ReviewsSection = ({ movieId, onCreateReview }) => {
  // Get current user from store
  const { user: currentUser, isAuthenticated } = useAuthStore();
  
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    pages: 1,
  });

  const loadReviews = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await reviewsApi.getMovieReviews(
        movieId,
        page,
        pagination.limit
      );

      if (response.success) {
        setReviews(response.data.reviews);
        setAverageRating(response.data.averageRating);
        setTotalReviews(response.data.totalReviews);
        setPagination(response.data.pagination);
      } else {
        setError("Failed to load reviews");
      }
    } catch (err) {
      setError("Failed to load reviews");
      console.error("Error loading reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [movieId]);

  const handleLike = async (reviewId) => {
    try {
      const res = await reviewsApi.toggleLikeReview(reviewId);
      await loadReviews(pagination.page);

      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error("Something went wrong while liking.");
      }
    } catch (err) {
      console.error("Error toggling like:", err);
      toast.error("Failed to toggle like.");
    }
  };

  const handleEdit = (review) => {
    console.log("Edit review:", review);

    const editData = {
      reviewId: review._id,
      movieId: review.movie.movieId,
      title: review.movie.title,
      rating: review.rating,
      review: review.review,
      spoiler: review.spoiler,
      isEditing: true,
    };

    onCreateReview(editData);
  };

  const handleDelete = async (reviewId) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      try {
        await reviewsApi.deleteReview(reviewId);
        loadReviews(pagination.page);
        toast.success("Review deleted successfully!");
      } catch (err) {
        console.error("Error deleting review:", err);
        toast.error("Failed to delete review.");
      }
    }
  };

  const handlePageChange = (page) => {
    loadReviews(page);
  };

  // Handle create review with authentication check
  const handleCreateReview = (editData = null) => {
    if (!isAuthenticated || !currentUser) {
      toast.error("Please sign in to write a review");
      return;
    }
    
    onCreateReview(editData);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-white text-2xl font-bold">Reviews</h2>
        <Button
          variant="primary"
          onClick={() => handleCreateReview()}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Write Review
        </Button>
      </div>

      {totalReviews > 0 && (
        <ReviewSummary
          averageRating={averageRating}
          totalReviews={totalReviews}
        />
      )}

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-white text-lg font-medium mb-2">
              No reviews yet
            </h3>
            <p className="text-gray-400 mb-4">
              Be the first to share your thoughts!
            </p>
            <Button
              variant="primary"
              onClick={() => handleCreateReview()}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Write the First Review
            </Button>
          </div>
        ) : (
          reviews.map((review) => (
            <ReviewCard
              key={review._id}
              review={review}
              onLike={handleLike}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.pages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};