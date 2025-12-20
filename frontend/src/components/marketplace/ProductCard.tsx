"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui";
import { Badge } from "@/components/ui/Badge";
import { Heart, ShoppingCart, Star, Eye, Loader2 } from "lucide-react";
import { useState } from "react";
import { marketplaceApi } from "@/lib/api/marketplace";
import toast from "react-hot-toast";
import { useCart } from "@/contexts/CartContext";
import { formatCurrency } from "@/lib/utils/formatCurrency";

export interface Product {
  _id: string;
  id?: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency?: string;
  images: string[];
  image?: string;
  category: string;
  condition?: string;
  status?: string;
  rating: number;
  reviewCount: number;
  reviews?: number;
  seller: {
    _id?: string;
    username?: string;
    displayName?: string;
    name?: string;
    avatar?: string;
    isVerified?: boolean;
    verified?: boolean;
  };
  quantity: number;
  inStock?: boolean;
  isFeatured?: boolean;
  isFavorited?: boolean;
  isNegotiable?: boolean;
  tags?: string[];
  viewCount?: number;
  favoriteCount?: number;
  deletedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
  onFavoriteChange?: (productId: string, isFavorited: boolean) => void;
  onAddToCart?: (productId: string) => void;
}

export function ProductCard({ product, onViewDetails, onFavoriteChange, onAddToCart }: ProductCardProps) {
  const [isLiked, setIsLiked] = useState(product.isFavorited || false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addToCart: cartAddToCart, openCart } = useCart();

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const productImage = product.image || product.images?.[0] || "https://via.placeholder.com/400";
  const sellerName = product.seller?.displayName || product.seller?.username || product.seller?.name || "Unknown Seller";
  const sellerAvatar = product.seller?.avatar || "https://via.placeholder.com/100";
  const isVerified = product.seller?.isVerified || product.seller?.verified || false;
  const reviewCount = product.reviewCount || product.reviews || 0;
  const inStock = product.inStock !== undefined ? product.inStock : product.quantity > 0;
  const isNew = product.createdAt ? (Date.now() - new Date(product.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000 : false;

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTogglingFavorite) return;

    setIsTogglingFavorite(true);
    try {
      const response = await marketplaceApi.toggleFavorite(product._id);
      setIsLiked(response.isFavorited);
      onFavoriteChange?.(product._id, response.isFavorited);
      toast.success(response.isFavorited ? "Added to favorites" : "Removed from favorites");
    } catch {
      toast.error("Failed to update favorites");
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAddingToCart || !inStock) return;

    setIsAddingToCart(true);
    try {
      const success = await cartAddToCart(product._id, 1);
      if (success) {
        onAddToCart?.(product._id);
        openCart();
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <Card hover className="overflow-hidden group">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img
          src={productImage}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isNew && (
            <Badge variant="primary" size="sm">New</Badge>
          )}
          {discount > 0 && (
            <Badge variant="danger" size="sm">-{discount}%</Badge>
          )}
          {product.isFeatured && (
            <Badge variant="warning" size="sm">Featured</Badge>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleToggleFavorite}
            disabled={isTogglingFavorite}
            className={cn(
              "p-2 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-md transition-colors",
              isLiked ? "text-red-500" : "text-gray-600 dark:text-gray-300 hover:text-red-500"
            )}
          >
            {isTogglingFavorite ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(product);
            }}
            className="p-2 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-md text-gray-600 dark:text-gray-300 hover:text-primary-500 transition-colors"
          >
            <Eye size={18} />
          </button>
        </div>

        {/* Out of Stock Overlay */}
        {!inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-semibold text-lg">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Category */}
        <span className="text-xs text-(--text-muted) uppercase tracking-wide">
          {product.category}
        </span>

        {/* Title */}
        <h3
          className="font-semibold text-(--text) line-clamp-2 cursor-pointer hover:text-primary-600 transition-colors"
          onClick={() => onViewDetails(product)}
        >
          {product.title}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                className={cn(
                  i < Math.floor(product.rating || 0)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300 dark:text-gray-600"
                )}
              />
            ))}
          </div>
          <span className="text-xs text-(--text-muted)">
            ({reviewCount})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary-600">
            {formatCurrency(product.price, product.currency)}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-(--text-muted) line-through">
              {formatCurrency(product.originalPrice, product.currency)}
            </span>
          )}
        </div>

        {/* Seller */}
        <div className="flex items-center gap-2 pt-2 border-t border-(--border)">
          <img
            src={sellerAvatar}
            alt={sellerName}
            className="w-6 h-6 rounded-full object-cover"
          />
          <span className="text-xs text-(--text-muted) truncate">
            {sellerName}
          </span>
          {isVerified && (
            <Badge variant="success" size="sm">Verified</Badge>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={!inStock || isAddingToCart}
          className={cn(
            "w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors",
            inStock && !isAddingToCart
              ? "bg-primary-600 text-white hover:bg-primary-700"
              : "bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
          )}
        >
          {isAddingToCart ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <ShoppingCart size={18} />
          )}
          {isAddingToCart ? "Adding..." : "Add to Cart"}
        </button>
      </div>
    </Card>
  );
}
