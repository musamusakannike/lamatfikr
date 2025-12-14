"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui";
import { Badge } from "@/components/ui/Badge";
import { Heart, ShoppingCart, Star, Eye } from "lucide-react";
import { useState } from "react";

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  reviews: number;
  seller: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  inStock: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
}

interface ProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
}

export function ProductCard({ product, onViewDetails }: ProductCardProps) {
  const [isLiked, setIsLiked] = useState(false);

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <Card hover className="overflow-hidden group">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isNew && (
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
            onClick={(e) => {
              e.stopPropagation();
              setIsLiked(!isLiked);
            }}
            className={cn(
              "p-2 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-md transition-colors",
              isLiked ? "text-red-500" : "text-gray-600 dark:text-gray-300 hover:text-red-500"
            )}
          >
            <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
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
        {!product.inStock && (
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
                  i < Math.floor(product.rating)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300 dark:text-gray-600"
                )}
              />
            ))}
          </div>
          <span className="text-xs text-(--text-muted)">
            ({product.reviews})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary-600">
            ${product.price.toFixed(2)}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-(--text-muted) line-through">
              ${product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Seller */}
        <div className="flex items-center gap-2 pt-2 border-t border-(--border)">
          <img
            src={product.seller.avatar}
            alt={product.seller.name}
            className="w-6 h-6 rounded-full object-cover"
          />
          <span className="text-xs text-(--text-muted) truncate">
            {product.seller.name}
          </span>
          {product.seller.verified && (
            <Badge variant="success" size="sm">Verified</Badge>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          disabled={!product.inStock}
          className={cn(
            "w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors",
            product.inStock
              ? "bg-primary-600 text-white hover:bg-primary-700"
              : "bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
          )}
        >
          <ShoppingCart size={18} />
          Add to Cart
        </button>
      </div>
    </Card>
  );
}
