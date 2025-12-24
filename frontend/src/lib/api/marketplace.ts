import { apiClient } from "../api";

// Types
export interface Seller {
  _id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  isVerified?: boolean;
  bio?: string;
}

export interface Buyer {
  _id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  email?: string;
}

export interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  images: string[];
  category: string;
  condition: "new" | "like_new" | "good" | "fair" | "poor";
  status: "active" | "sold" | "reserved" | "inactive";
  seller: Seller;
  sellerId: string;
  location?: {
    city?: string;
    country?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  quantity: number;
  viewCount: number;
  favoriteCount: number;
  isFeatured: boolean;
  isNegotiable: boolean;
  tags?: string[];
  rating: number;
  reviewCount: number;
  isFavorited?: boolean;
  createdAt: string;
  updatedAt: string;
  type: "physical" | "digital";
  digitalFile?: {
    url: string;
    name: string;
    size: number;
    type: string;
  };
  digitalInstructions?: string;
}

export interface ProductFormData {
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency?: string;
  images: string[];
  category: string;
  condition?: string;
  location?: {
    city?: string;
    country?: string;
  };
  quantity?: number;
  isNegotiable?: boolean;
  tags?: string[];
  type: "physical" | "digital";
  digitalFile?: {
    url: string;
    name: string;
    size: number;
    type: string;
  };
  digitalInstructions?: string;
}

export interface Review {
  _id: string;
  productId: string;
  userId: {
    _id: string;
    username: string;
    displayName?: string;
    avatar?: string;
  };
  rating: number;
  comment?: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  title: string;
  price: number;
  currency?: string;
  image?: string;
  quantity: number;
  seller: Seller;
  inStock: boolean;
  type?: "physical" | "digital";
}

export interface Cart {
  items: CartItem[];
  itemsBySeller: Record<string, CartItem[]>;
  subtotal: number;
  itemCount: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  type?: "physical" | "digital";
}

export interface Order {
  _id: string;
  orderNumber: string;
  buyerId: Buyer;
  sellerId: Buyer;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  serviceFee: number;
  total: number;
  currency: string;
  status: "pending" | "awaiting_payment" | "paid" | "processing" | "shipped" | "delivered" | "completed" | "cancelled" | "refunded" | "disputed";
  paymentMethod: "tap" | "cash";
  tapChargeId?: string;
  paidAt?: string;
  shippingAddress?: ShippingAddress;
  trackingNumber?: string;
  notes?: string;
  buyerNotes?: string;
  sellerNotes?: string;
  cancelReason?: string;
  cancelledAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductResponse {
  product: Product;
}

export interface ReviewsResponse {
  reviews: Review[];
  stats: {
    avgRating: number;
    count1: number;
    count2: number;
    count3: number;
    count4: number;
    count5: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CartResponse {
  cart: Cart;
}

export interface OrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface OrderResponse {
  order: Order;
}

export interface PaymentInitResponse {
  message: string;
  redirectUrl: string;
  chargeId: string;
}

export interface MarketplaceStats {
  totalProducts: number;
  inStock: number;
  featured: number;
  avgPrice: string;
  categories: Array<{ _id: string; count: number }>;
}

export interface SellerStats {
  products: {
    active: number;
    sold: number;
    inactive: number;
    total: number;
  };
  orders: Record<string, { count: number; total: number }>;
  revenue: {
    total: number;
    completedOrders: number;
  };
}

// API Functions
export const marketplaceApi = {
  // Stats
  getStats: () => {
    return apiClient.get<{ stats: MarketplaceStats }>("/marketplace/stats");
  },

  getSellerStats: () => {
    return apiClient.get<{ stats: SellerStats }>("/marketplace/seller/stats");
  },

  // Products
  createProduct: (data: ProductFormData) => {
    return apiClient.post<{ message: string; product: Product }>("/marketplace/products", data);
  },

  getProducts: (params?: {
    page?: number;
    limit?: number;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    condition?: string;
    search?: string;
    sellerId?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    status?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.category) searchParams.set("category", params.category);
    if (params?.minPrice) searchParams.set("minPrice", params.minPrice.toString());
    if (params?.maxPrice) searchParams.set("maxPrice", params.maxPrice.toString());
    if (params?.condition) searchParams.set("condition", params.condition);
    if (params?.search) searchParams.set("search", params.search);
    if (params?.sellerId) searchParams.set("sellerId", params.sellerId);
    if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
    if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);
    if (params?.status) searchParams.set("status", params.status);

    const query = searchParams.toString();
    return apiClient.get<ProductsResponse>(`/marketplace/products${query ? `?${query}` : ""}`);
  },

  getProduct: (productId: string) => {
    return apiClient.get<ProductResponse>(`/marketplace/products/${productId}`);
  },

  getMyProducts: (params?: { page?: number; limit?: number; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.status) searchParams.set("status", params.status);

    const query = searchParams.toString();
    return apiClient.get<ProductsResponse>(`/marketplace/products/mine${query ? `?${query}` : ""}`);
  },

  updateProduct: (productId: string, data: Partial<ProductFormData>) => {
    return apiClient.patch<{ message: string; product: Product }>(`/marketplace/products/${productId}`, data);
  },

  deleteProduct: (productId: string) => {
    return apiClient.delete<{ message: string }>(`/marketplace/products/${productId}`);
  },

  // Favorites
  toggleFavorite: (productId: string) => {
    return apiClient.post<{ message: string; isFavorited: boolean }>(`/marketplace/products/${productId}/favorite`);
  },

  getFavorites: (params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());

    const query = searchParams.toString();
    return apiClient.get<ProductsResponse>(`/marketplace/favorites${query ? `?${query}` : ""}`);
  },

  // Reviews
  createReview: (productId: string, data: { rating: number; comment?: string; images?: string[] }) => {
    return apiClient.post<{ message: string; review: Review }>(`/marketplace/products/${productId}/reviews`, data);
  },

  getProductReviews: (productId: string, params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());

    const query = searchParams.toString();
    return apiClient.get<ReviewsResponse>(`/marketplace/products/${productId}/reviews${query ? `?${query}` : ""}`);
  },

  // Cart
  getCart: () => {
    return apiClient.get<CartResponse>("/marketplace/cart");
  },

  addToCart: (productId: string, quantity?: number) => {
    return apiClient.post<{ message: string; itemCount: number }>("/marketplace/cart", { productId, quantity });
  },

  updateCartItem: (productId: string, quantity: number) => {
    return apiClient.patch<{ message: string }>(`/marketplace/cart/${productId}`, { quantity });
  },

  removeFromCart: (productId: string) => {
    return apiClient.delete<{ message: string; itemCount: number }>(`/marketplace/cart/${productId}`);
  },

  clearCart: () => {
    return apiClient.delete<{ message: string }>("/marketplace/cart");
  },

  // Orders
  createOrder: (data: {
    productId: string;
    quantity?: number;
    shippingAddress?: ShippingAddress;
    paymentMethod?: "tap";
    buyerNotes?: string;
  }) => {
    return apiClient.post<{ message: string; order: Order }>("/marketplace/orders", data);
  },

  createOrderFromCart: (data: {
    shippingAddress?: ShippingAddress;
    paymentMethod?: "tap";
    buyerNotes?: string;
  }) => {
    return apiClient.post<{ message: string; orders: Order[] }>("/marketplace/orders/from-cart", data);
  },

  getMyOrders: (params?: { page?: number; limit?: number; type?: "bought" | "sold"; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.type) searchParams.set("type", params.type);
    if (params?.status) searchParams.set("status", params.status);

    const query = searchParams.toString();
    return apiClient.get<OrdersResponse>(`/marketplace/orders${query ? `?${query}` : ""}`);
  },

  getOrder: (orderId: string) => {
    return apiClient.get<OrderResponse>(`/marketplace/orders/${orderId}`);
  },

  initiatePayment: (orderId: string) => {
    return apiClient.post<PaymentInitResponse>(`/marketplace/orders/${orderId}/pay`);
  },

  verifyPayment: (orderId: string, tapId: string) => {
    return apiClient.get<{ message: string; order: Order }>(`/marketplace/orders/${orderId}/verify?tap_id=${tapId}`);
  },

  updateOrderStatus: (orderId: string, data: { status?: string; trackingNumber?: string; sellerNotes?: string }) => {
    return apiClient.patch<{ message: string; order: Order }>(`/marketplace/orders/${orderId}/status`, data);
  },

  cancelOrder: (orderId: string, reason?: string) => {
    return apiClient.post<{ message: string }>(`/marketplace/orders/${orderId}/cancel`, { reason });
  },

  downloadProduct: (orderId: string, productId: string) => {
    return apiClient.get<{ file: { url: string; name: string; size: number; type: string }; instructions?: string }>(
      `/marketplace/orders/${orderId}/items/${productId}/download`
    );
  },
};

export default marketplaceApi;
