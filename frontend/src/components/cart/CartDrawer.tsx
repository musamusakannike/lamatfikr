"use client";

import { Fragment, useState } from "react";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/Button";
import {
  X,
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  ShoppingBag,
  Loader2,
  ArrowRight,
  Package,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";
import Image from "next/image";

export function CartDrawer() {
  const {
    cart,
    isLoading,
    isCartOpen,
    closeCart,
    itemCount,
    subtotal,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());
  const [isClearing, setIsClearing] = useState(false);

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setUpdatingItems((prev) => new Set(prev).add(productId));
    await updateQuantity(productId, newQuantity);
    setUpdatingItems((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  };

  const handleRemoveItem = async (productId: string) => {
    setRemovingItems((prev) => new Set(prev).add(productId));
    await removeFromCart(productId);
    setRemovingItems((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  };

  const handleClearCart = async () => {
    setIsClearing(true);
    await clearCart();
    setIsClearing(false);
  };

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          isCartOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={closeCart}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] bg-(--bg-card) shadow-2xl",
          "transform transition-transform duration-300 ease-out",
          "flex flex-col",
          isCartOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-(--border)">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
              <ShoppingCart size={20} className="text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-(--text)">Shopping Cart</h2>
              <p className="text-sm text-(--text-muted)">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeCart}
            className="hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={32} className="animate-spin text-primary-600" />
            </div>
          ) : !cart || cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="w-24 h-24 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-4">
                <ShoppingBag size={40} className="text-primary-400" />
              </div>
              <h3 className="text-lg font-semibold text-(--text) mb-2">
                Your cart is empty
              </h3>
              <p className="text-sm text-(--text-muted) mb-6 max-w-[250px]">
                Looks like you haven&apos;t added any items to your cart yet.
              </p>
              <Link href="/marketplace" onClick={closeCart}>
                <Button variant="primary" className="w-full">
                  <ShoppingBag size={18} className="mr-2" />
                  Browse Products
                </Button>
              </Link>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Clear Cart Button */}
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearCart}
                  disabled={isClearing}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  {isClearing ? (
                    <Loader2 size={16} className="mr-2 animate-spin" />
                  ) : (
                    <Trash2 size={16} className="mr-2" />
                  )}
                  Clear Cart
                </Button>
              </div>

              {/* Cart Items */}
              <div className="space-y-3">
                {cart.items.map((item) => {
                  const isUpdating = updatingItems.has(item.productId);
                  const isRemoving = removingItems.has(item.productId);

                  return (
                    <div
                      key={item.productId}
                      className={cn(
                        "flex gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 transition-opacity duration-200",
                        isRemoving && "opacity-50"
                      )}
                    >
                      {/* Product Image */}
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.title}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={24} className="text-gray-400" />
                          </div>
                        )}
                        {!item.inStock && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-xs text-white font-medium">
                              Out of Stock
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-(--text) text-sm line-clamp-2 mb-1">
                          {item.title}
                        </h4>
                        {item.seller && (
                          <div className="flex items-center gap-1 text-xs text-(--text-muted) mb-2">
                            <span>by {item.seller.displayName || item.seller.username}</span>
                            {item.seller.isVerified && (
                              <VerifiedBadge size={12} />
                            )}
                          </div>
                        )}
                        <p className="text-primary-600 font-semibold">
                          {formatCurrency(item.price, item.currency)}
                        </p>
                      </div>

                      {/* Quantity & Actions */}
                      <div className="flex flex-col items-end justify-between">
                        <button
                          onClick={() => handleRemoveItem(item.productId)}
                          disabled={isRemoving}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          {isRemoving ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <X size={16} />
                          )}
                        </button>

                        <div className="flex items-center gap-1 bg-white dark:bg-gray-700 rounded-lg border border-(--border)">
                          <button
                            onClick={() =>
                              handleUpdateQuantity(item.productId, item.quantity - 1)
                            }
                            disabled={isUpdating || item.quantity <= 1}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-l-lg transition-colors disabled:opacity-50"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">
                            {isUpdating ? (
                              <Loader2 size={14} className="animate-spin mx-auto" />
                            ) : (
                              item.quantity
                            )}
                          </span>
                          <button
                            onClick={() =>
                              handleUpdateQuantity(item.productId, item.quantity + 1)
                            }
                            disabled={isUpdating}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-r-lg transition-colors disabled:opacity-50"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {cart && cart.items.length > 0 && (
          <div className="border-t border-(--border) p-4 space-y-4 bg-(--bg-card)">
            {/* Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-(--text-muted)">Subtotal</span>
                <span className="text-(--text)">{formatCurrency(subtotal, cart.items[0]?.currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-(--text-muted)">Shipping</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-(--text-muted)">Service Fee (5%)</span>
                <span className="text-(--text)">
                  {formatCurrency(subtotal * 0.05, cart.items[0]?.currency)}
                </span>
              </div>
              <div className="h-px bg-(--border) my-2" />
              <div className="flex justify-between">
                <span className="font-semibold text-(--text)">Total</span>
                <span className="font-bold text-lg text-primary-600">
                  {formatCurrency(subtotal + subtotal * 0.05, cart.items[0]?.currency)}
                </span>
              </div>
            </div>

            {/* Checkout Button */}
            <Link href="/marketplace/checkout" onClick={closeCart}>
              <Button variant="primary" size="lg" className="w-full">
                Proceed to Checkout
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>

            {/* Continue Shopping */}
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={closeCart}
            >
              Continue Shopping
            </Button>
          </div>
        )}
      </div>
    </Fragment>
  );
}
