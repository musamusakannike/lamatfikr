"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { marketplaceApi, Review } from "@/lib/api/marketplace";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import {
  Star,
  Loader2,
  ThumbsUp,
  CheckCircle,
  User,
  X,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductReviewsProps {
  productId: string;
  productTitle?: string;
}

interface ReviewStats {
  avgRating: number;
  count1: number;
  count2: number;
  count3: number;
  count4: number;
  count5: number;
}

export function ProductReviews({ productId, productTitle }: ProductReviewsProps) {
  const { isAuthenticated, user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Review form state
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await marketplaceApi.getProductReviews(productId, {
        page,
        limit: 5,
      });
      setReviews(response.reviews);
      setStats(response.stats);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setIsLoading(false);
    }
  }, [productId, page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to submit a review");
      return;
    }

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    try {
      await marketplaceApi.createReview(productId, {
        rating,
        comment: comment.trim() || undefined,
      });
      toast.success("Review submitted successfully!");
      setShowReviewForm(false);
      setRating(0);
      setComment("");
      setPage(1);
      fetchReviews();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalReviews = stats
    ? stats.count1 + stats.count2 + stats.count3 + stats.count4 + stats.count5
    : 0;

  const getRatingPercentage = (count: number) => {
    if (totalReviews === 0) return 0;
    return (count / totalReviews) * 100;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Check if user has already reviewed
  const hasUserReviewed = reviews.some(
    (review) => review.userId._id === user?.id
  );

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      {stats && (
        <div className="flex flex-col sm:flex-row gap-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          {/* Average Rating */}
          <div className="text-center sm:text-left">
            <div className="text-4xl font-bold text-(--text)">
              {stats.avgRating.toFixed(1)}
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-1 mt-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={18}
                  className={cn(
                    i < Math.round(stats.avgRating)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300"
                  )}
                />
              ))}
            </div>
            <p className="text-sm text-(--text-muted) mt-1">
              {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
            </p>
          </div>

          {/* Rating Breakdown */}
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats[`count${star}` as keyof ReviewStats] as number;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-sm text-(--text-muted) w-3">{star}</span>
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all"
                      style={{ width: `${getRatingPercentage(count)}%` }}
                    />
                  </div>
                  <span className="text-sm text-(--text-muted) w-8">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Write Review Button */}
      {isAuthenticated && !hasUserReviewed && !showReviewForm && (
        <Button
          variant="outline"
          onClick={() => setShowReviewForm(true)}
          className="w-full"
        >
          <Star size={18} className="mr-2" />
          Write a Review
        </Button>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <div className="p-4 rounded-xl border border-(--border) bg-(--bg-card)">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-(--text)">Write Your Review</h3>
            <button
              onClick={() => {
                setShowReviewForm(false);
                setRating(0);
                setComment("");
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              <X size={18} />
            </button>
          </div>

          {/* Star Rating */}
          <div className="mb-4">
            <p className="text-sm text-(--text-muted) mb-2">Your Rating</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    size={28}
                    className={cn(
                      "transition-colors",
                      (hoverRating || rating) >= star
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    )}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-primary-600 mt-1">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="mb-4">
            <p className="text-sm text-(--text-muted) mb-2">Your Review (Optional)</p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this product..."
              rows={4}
              className="w-full px-4 py-2.5 rounded-lg border border-(--border) bg-(--bg-card) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowReviewForm(false);
                setRating(0);
                setComment("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleSubmitReview}
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={18} className="mr-2" />
                  Submit Review
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-primary-600" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8">
          <Star size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-(--text-muted)">No reviews yet</p>
          <p className="text-sm text-(--text-muted)">Be the first to review this product!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review._id}
              className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50"
            >
              <div className="flex gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0">
                  {review.userId.avatar ? (
                    <img
                      src={review.userId.avatar}
                      alt={review.userId.displayName || review.userId.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User size={18} className="text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-(--text)">
                          {review.userId.displayName || review.userId.username}
                        </span>
                        {review.isVerifiedPurchase && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
                            <CheckCircle size={10} className="mr-1" />
                            Verified Purchase
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className={cn(
                                i < review.rating
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-gray-300"
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-(--text-muted)">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Comment */}
                  {review.comment && (
                    <p className="text-sm text-(--text) mt-3">{review.comment}</p>
                  )}

                  {/* Review Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {review.images.map((image, index) => (
                        <div
                          key={index}
                          className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700"
                        >
                          <img
                            src={image}
                            alt={`Review image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Helpful */}
                  {review.helpfulCount > 0 && (
                    <div className="flex items-center gap-1 mt-3 text-xs text-(--text-muted)">
                      <ThumbsUp size={12} />
                      <span>{review.helpfulCount} found this helpful</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="px-4 py-2 text-sm text-(--text-muted)">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
