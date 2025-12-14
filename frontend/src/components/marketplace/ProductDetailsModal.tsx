"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Product } from "./ProductCard";
import {
  Star,
  Heart,
  ShoppingCart,
  Share2,
  Truck,
  Shield,
  RefreshCw,
  Minus,
  Plus,
  MessageCircle,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export function ProductDetailsModal({
  isOpen,
  onClose,
  product,
}: ProductDetailsModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "reviews">("description");

  if (!product) return null;

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const dummyReviews = [
    {
      id: "1",
      user: { name: "Sarah Ahmed", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
      rating: 5,
      date: "2 days ago",
      comment: "Excellent product! Exactly as described. Fast shipping and great quality.",
    },
    {
      id: "2",
      user: { name: "Mohammed Ali", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      rating: 4,
      date: "1 week ago",
      comment: "Good quality for the price. Would recommend to others.",
    },
    {
      id: "3",
      user: { name: "Fatima Hassan", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" },
      rating: 5,
      date: "2 weeks ago",
      comment: "Love it! Will definitely buy again. The seller was very helpful.",
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title="">
      <div className="p-6">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
              <img
                src={product.image}
                alt={product.title}
                className="w-full h-full object-cover"
              />
              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                {product.isNew && <Badge variant="primary">New</Badge>}
                {discount > 0 && <Badge variant="danger">-{discount}%</Badge>}
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-5">
            {/* Category & Title */}
            <div>
              <span className="text-sm text-(--text-muted) uppercase tracking-wide">
                {product.category}
              </span>
              <h2 className="text-2xl font-bold text-(--text) mt-1">
                {product.title}
              </h2>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className={cn(
                      i < Math.floor(product.rating)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300 dark:text-gray-600"
                    )}
                  />
                ))}
              </div>
              <span className="text-sm text-(--text-muted)">
                {product.rating} ({product.reviews} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-primary-600">
                ${product.price.toFixed(2)}
              </span>
              {product.originalPrice && (
                <span className="text-lg text-(--text-muted) line-through">
                  ${product.originalPrice.toFixed(2)}
                </span>
              )}
              {discount > 0 && (
                <Badge variant="success">Save ${(product.originalPrice! - product.price).toFixed(2)}</Badge>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {product.inStock ? (
                <>
                  <CheckCircle size={18} className="text-green-500" />
                  <span className="text-green-600 dark:text-green-400 font-medium">In Stock</span>
                </>
              ) : (
                <>
                  <span className="text-red-600 dark:text-red-400 font-medium">Out of Stock</span>
                </>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-(--text)">Quantity:</span>
              <div className="flex items-center border border-(--border) rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                >
                  <Minus size={18} />
                </button>
                <span className="px-4 py-2 font-medium min-w-[50px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                disabled={!product.inStock}
              >
                <ShoppingCart size={20} className="mr-2" />
                Add to Cart
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsLiked(!isLiked)}
                className={cn(isLiked && "text-red-500 border-red-500")}
              >
                <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
              </Button>
              <Button variant="outline" size="icon">
                <Share2 size={20} />
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-(--border)">
              <div className="flex flex-col items-center text-center p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                <Truck size={24} className="text-primary-600 mb-1" />
                <span className="text-xs font-medium">Free Shipping</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                <Shield size={24} className="text-primary-600 mb-1" />
                <span className="text-xs font-medium">Secure Payment</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                <RefreshCw size={24} className="text-primary-600 mb-1" />
                <span className="text-xs font-medium">Easy Returns</span>
              </div>
            </div>

            {/* Seller Info */}
            <div className="flex items-center gap-3 p-3 rounded-lg border border-(--border)">
              <img
                src={product.seller.avatar}
                alt={product.seller.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-(--text)">{product.seller.name}</span>
                  {product.seller.verified && (
                    <Badge variant="success" size="sm">Verified</Badge>
                  )}
                </div>
                <span className="text-sm text-(--text-muted)">Seller</span>
              </div>
              <Button variant="outline" size="sm">
                <MessageCircle size={16} className="mr-1" />
                Contact
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 border-t border-(--border) pt-6">
          <div className="flex gap-4 border-b border-(--border)">
            <button
              onClick={() => setActiveTab("description")}
              className={cn(
                "pb-3 px-1 font-medium transition-colors relative",
                activeTab === "description"
                  ? "text-primary-600"
                  : "text-(--text-muted) hover:text-(--text)"
              )}
            >
              Description
              {activeTab === "description" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={cn(
                "pb-3 px-1 font-medium transition-colors relative",
                activeTab === "reviews"
                  ? "text-primary-600"
                  : "text-(--text-muted) hover:text-(--text)"
              )}
            >
              Reviews ({product.reviews})
              {activeTab === "reviews" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
              )}
            </button>
          </div>

          <div className="py-4">
            {activeTab === "description" ? (
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-(--text-muted)">{product.description}</p>
                <p className="text-(--text-muted) mt-4">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
                  incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
                  exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {dummyReviews.map((review) => (
                  <div key={review.id} className="flex gap-4 p-4 rounded-lg bg-primary-50/50 dark:bg-primary-900/10">
                    <img
                      src={review.user.avatar}
                      alt={review.user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-(--text)">{review.user.name}</span>
                        <span className="text-xs text-(--text-muted)">{review.date}</span>
                      </div>
                      <div className="flex items-center mt-1">
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
                      <p className="text-sm text-(--text-muted) mt-2">{review.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
