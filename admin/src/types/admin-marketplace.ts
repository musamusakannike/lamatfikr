export type ProductStatus = "active" | "sold" | "reserved" | "inactive";

export interface AdminMarketplaceListing {
  _id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  images: string[];
  category: string;
  condition: string;
  status: ProductStatus;
  sellerId:
    | string
    | {
        _id: string;
        username?: string;
        firstName?: string;
        lastName?: string;
        avatar?: string;
        verified?: boolean;
      };
  quantity: number;
  viewCount: number;
  favoriteCount: number;
  isFeatured: boolean;
  isNegotiable: boolean;
  tags?: string[];
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminMarketplaceListingsResponse {
  success: boolean;
  products: AdminMarketplaceListing[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type OrderStatus =
  | "pending"
  | "awaiting_payment"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled"
  | "refunded"
  | "disputed";

export type PaymentMethod = "tap" | "cash";

export interface AdminMarketplaceOrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface AdminMarketplaceOrder {
  _id: string;
  orderNumber: string;
  buyerId:
    | string
    | {
        _id: string;
        username?: string;
        firstName?: string;
        lastName?: string;
        avatar?: string;
      };
  sellerId:
    | string
    | {
        _id: string;
        username?: string;
        firstName?: string;
        lastName?: string;
        avatar?: string;
      };
  items: AdminMarketplaceOrderItem[];
  subtotal: number;
  shippingFee: number;
  serviceFee: number;
  total: number;
  currency: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  trackingNumber?: string;
  sellerNotes?: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminMarketplaceOrdersResponse {
  success: boolean;
  orders: AdminMarketplaceOrder[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminMarketplaceUpdateOrderResponse {
  success: boolean;
  order: AdminMarketplaceOrder;
}

export interface AdminMarketplaceUpdateListingResponse {
  success: boolean;
  product: AdminMarketplaceListing;
}

export interface AdminMarketplaceConstantsResponse {
  success: boolean;
  productStatuses: string[];
  orderStatuses: string[];
  paymentMethods: string[];
}
