import { Router } from "express";

import { requireAuth } from "../middleware/auth";
import {
  // Products
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
  // Favorites
  toggleFavorite,
  getFavorites,
  // Reviews
  createReview,
  getProductReviews,
  // Cart
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  // Orders
  createOrder,
  createOrderFromCart,
  initiateOrderPayment,
  verifyOrderPayment,
  getMyOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  // Stats
  getMarketplaceStats,
  getSellerStats,
} from "../controllers/marketplace.controller";

export const marketplaceRouter = Router();

// Public routes (still need auth for user context)
marketplaceRouter.use(requireAuth);

// Stats
marketplaceRouter.get("/stats", getMarketplaceStats);
marketplaceRouter.get("/seller/stats", getSellerStats);

// Products
marketplaceRouter.post("/products", createProduct);
marketplaceRouter.get("/products", getProducts);
marketplaceRouter.get("/products/mine", getMyProducts);
marketplaceRouter.get("/products/:productId", getProduct);
marketplaceRouter.patch("/products/:productId", updateProduct);
marketplaceRouter.delete("/products/:productId", deleteProduct);

// Favorites
marketplaceRouter.post("/products/:productId/favorite", toggleFavorite);
marketplaceRouter.get("/favorites", getFavorites);

// Reviews
marketplaceRouter.post("/products/:productId/reviews", createReview);
marketplaceRouter.get("/products/:productId/reviews", getProductReviews);

// Cart
marketplaceRouter.get("/cart", getCart);
marketplaceRouter.post("/cart", addToCart);
marketplaceRouter.patch("/cart/:productId", updateCartItem);
marketplaceRouter.delete("/cart/:productId", removeFromCart);
marketplaceRouter.delete("/cart", clearCart);

// Orders
marketplaceRouter.post("/orders", createOrder);
marketplaceRouter.post("/orders/from-cart", createOrderFromCart);
marketplaceRouter.get("/orders", getMyOrders);
marketplaceRouter.get("/orders/:orderId", getOrder);
marketplaceRouter.post("/orders/:orderId/pay", initiateOrderPayment);
marketplaceRouter.get("/orders/:orderId/verify", verifyOrderPayment);
marketplaceRouter.patch("/orders/:orderId/status", updateOrderStatus);
marketplaceRouter.post("/orders/:orderId/cancel", cancelOrder);
