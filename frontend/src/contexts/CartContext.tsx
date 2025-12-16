"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { marketplaceApi, Cart } from "@/lib/api/marketplace";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  isCartOpen: boolean;
  itemCount: number;
  subtotal: number;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (productId: string, quantity: number) => Promise<boolean>;
  removeFromCart: (productId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const itemCount = cart?.itemCount || 0;
  const subtotal = cart?.subtotal || 0;

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }

    setIsLoading(true);
    try {
      const response = await marketplaceApi.getCart();
      setCart(response.cart);
    } catch (error) {
      console.error("Failed to fetch cart:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const toggleCart = useCallback(() => setIsCartOpen((prev) => !prev), []);

  const addToCart = useCallback(
    async (productId: string, quantity: number = 1): Promise<boolean> => {
      if (!isAuthenticated) {
        toast.error("Please login to add items to cart");
        return false;
      }

      try {
        await marketplaceApi.addToCart(productId, quantity);
        await fetchCart();
        toast.success("Added to cart");
        return true;
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(err.response?.data?.message || "Failed to add to cart");
        return false;
      }
    },
    [isAuthenticated, fetchCart]
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number): Promise<boolean> => {
      if (!isAuthenticated) return false;

      try {
        await marketplaceApi.updateCartItem(productId, quantity);
        await fetchCart();
        return true;
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(err.response?.data?.message || "Failed to update quantity");
        return false;
      }
    },
    [isAuthenticated, fetchCart]
  );

  const removeFromCart = useCallback(
    async (productId: string): Promise<boolean> => {
      if (!isAuthenticated) return false;

      try {
        await marketplaceApi.removeFromCart(productId);
        await fetchCart();
        toast.success("Removed from cart");
        return true;
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(err.response?.data?.message || "Failed to remove item");
        return false;
      }
    },
    [isAuthenticated, fetchCart]
  );

  const clearCart = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      await marketplaceApi.clearCart();
      await fetchCart();
      toast.success("Cart cleared");
      return true;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to clear cart");
      return false;
    }
  }, [isAuthenticated, fetchCart]);

  const value: CartContextType = {
    cart,
    isLoading,
    isCartOpen,
    itemCount,
    subtotal,
    openCart,
    closeCart,
    toggleCart,
    fetchCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
