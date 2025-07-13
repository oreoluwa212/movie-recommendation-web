// CreateReviewModal.jsx
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { X, AlertTriangle, Star } from "lucide-react";
import Button from "./ui/Button";
import { reviewsApi } from "../utils/api";

// Updated to accept editData prop
export const CreateReviewModal = ({
  isOpen,
  onClose,
  movieId,
  movieTitle,
  onReviewCreated,
  editData = null, // Add editData prop
}) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [spoiler, setSpoiler] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if we're in edit mode
  const isEditing = editData && editData.isEditing;

  // Populate form when editData is provided
  useEffect(() => {
    if (editData && editData.isEditing) {
      setRating(editData.rating || 0);
      setReview(editData.review || "");
      setSpoiler(editData.spoiler || false);
    } else {
      // Reset form for new review
      setRating(0);
      setReview("");
      setSpoiler(false);
    }
  }, [editData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!rating || !review.trim()) {
      toast.error("Please provide both a rating and review text");
      return;
    }

    setIsSubmitting(true);
    try {
      let response;

      if (isEditing) {
        // Update existing review - use same payload structure as create
        response = await reviewsApi.updateReview(editData.reviewId, {
          movieId: editData.movieId,
          title: editData.title || movieTitle,
          rating,
          review: review.trim(),
          spoiler,
        });
      } else {
        // Create new review
        response = await reviewsApi.createOrUpdateReview({
          movieId,
          title: movieTitle,
          rating,
          review: review.trim(),
          spoiler,
        });
      }

      if (response.success) {
        onReviewCreated();
        onClose();
        // Form will be reset by useEffect when modal closes
      } else {
        toast.error(
          response.message ||
            `Failed to ${isEditing ? "update" : "create"} review`
        );
      }
    } catch (error) {
      console.error(
        `Error ${isEditing ? "updating" : "creating"} review:`,
        error
      );
      toast.error(
        `Failed to ${isEditing ? "update" : "create"} review. Please try again.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      // Form will be reset by useEffect when editData changes
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-xl font-semibold">
            {isEditing
              ? `Edit Review for ${editData.title || movieTitle}`
              : `Write a Review for ${movieTitle}`}
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-white text-sm font-medium mb-3">
              Rating *
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-400 hover:text-yellow-400"
                    }`}
                  />
                </button>
              ))}
              <span className="text-white ml-2">
                {rating > 0 ? `${rating}/5` : "Click to rate"}
              </span>
            </div>
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Review *
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              rows="6"
              placeholder="Share your thoughts about this movie..."
              required
            />
            <p className="text-gray-400 text-sm mt-1">
              {review.length}/1000 characters
            </p>
          </div>

          {/* Spoiler Warning */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="spoiler"
              checked={spoiler}
              onChange={(e) => setSpoiler(e.target.checked)}
              className="mt-1"
            />
            <div>
              <label
                htmlFor="spoiler"
                className="text-white text-sm font-medium cursor-pointer"
              >
                Contains Spoilers
              </label>
              <div className="flex items-center gap-2 mt-1">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <p className="text-gray-400 text-sm">
                  Check this if your review reveals plot details
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={!rating || !review.trim()}
            >
              {isSubmitting
                ? isEditing
                  ? "Updating Review..."
                  : "Creating Review..."
                : isEditing
                ? "Update Review"
                : "Create Review"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
