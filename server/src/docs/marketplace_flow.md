# Marketplace Flow Documentation

## Overview

The LamatFikr Marketplace is a Facebook Marketplace-style feature that allows users to buy and sell products within the platform. It integrates with Tap Payments for secure online transactions.

## Key Features

- **Product Listings**: Users can create, edit, and delete product listings
- **Product Discovery**: Browse, search, and filter products by category, price, etc.
- **Favorites**: Save products to favorites for later
- **Shopping Cart**: Add products to cart and checkout
- **Orders**: Create and manage orders with multiple statuses
- **Reviews**: Leave reviews for purchased products
- **Tap Payments**: Secure online payment integration

---

## User Flows

### 1. Seller Flow - Listing a Product

```
┌─────────────────┐
│  User clicks    │
│ "Add Product"   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Fill product   │
│  details form   │
│  - Title        │
│  - Description  │
│  - Price        │
│  - Category     │
│  - Images       │
│  - Quantity     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  POST /api/     │
│  marketplace/   │
│  products       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Product listed │
│  (status:active)│
└─────────────────┘
```

### 2. Buyer Flow - Purchasing a Product

```
┌─────────────────┐
│  Browse/Search  │
│    Products     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  View Product   │
│    Details      │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────────┐
│ Add to│ │Buy Now    │
│ Cart  │ │(Direct)   │
└───┬───┘ └─────┬─────┘
    │           │
    ▼           │
┌───────────┐   │
│ View Cart │   │
│ Checkout  │   │
└─────┬─────┘   │
      │         │
      └────┬────┘
           │
           ▼
┌─────────────────┐
│  Create Order   │
│  POST /api/     │
│  marketplace/   │
│  orders         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Select Payment  │
│    Method       │
│ - Tap (Online)  │
│ - Cash          │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────────┐
│  Tap  │ │   Cash    │
│Payment│ │ on Delivery│
└───┬───┘ └─────┬─────┘
    │           │
    ▼           │
┌───────────┐   │
│Redirect to│   │
│Tap Payment│   │
│   Page    │   │
└─────┬─────┘   │
      │         │
      ▼         │
┌───────────┐   │
│  Payment  │   │
│ Callback  │   │
│  /verify  │   │
└─────┬─────┘   │
      │         │
      └────┬────┘
           │
           ▼
┌─────────────────┐
│  Order Created  │
│  (status: paid  │
│   or pending)   │
└─────────────────┘
```

### 3. Order Status Flow

```
┌─────────────────┐
│    PENDING      │ ◄── Cash orders start here
│ (awaiting_payment)│ ◄── Tap orders start here
└────────┬────────┘
         │ Payment verified
         ▼
┌─────────────────┐
│      PAID       │
└────────┬────────┘
         │ Seller starts processing
         ▼
┌─────────────────┐
│   PROCESSING    │
└────────┬────────┘
         │ Seller ships order
         ▼
┌─────────────────┐
│    SHIPPED      │
│ (tracking added)│
└────────┬────────┘
         │ Buyer receives
         ▼
┌─────────────────┐
│   DELIVERED     │
└────────┬────────┘
         │ Buyer confirms
         ▼
┌─────────────────┐
│   COMPLETED     │
└─────────────────┘

Alternative flows:
- CANCELLED: Can happen from pending, awaiting_payment, paid, or processing
- REFUNDED: After payment, if dispute resolved in buyer's favor
- DISPUTED: If buyer raises an issue
```

---

## API Endpoints

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/marketplace/products` | Create a new product |
| GET | `/api/marketplace/products` | List all products (with filters) |
| GET | `/api/marketplace/products/:id` | Get product details |
| PATCH | `/api/marketplace/products/:id` | Update product |
| DELETE | `/api/marketplace/products/:id` | Delete product |
| GET | `/api/marketplace/products/mine` | Get seller's products |

### Favorites

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/marketplace/products/:id/favorite` | Toggle favorite |
| GET | `/api/marketplace/favorites` | Get user's favorites |

### Reviews

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/marketplace/products/:id/reviews` | Create review |
| GET | `/api/marketplace/products/:id/reviews` | Get product reviews |

### Cart

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/marketplace/cart` | Get user's cart |
| POST | `/api/marketplace/cart` | Add item to cart |
| PATCH | `/api/marketplace/cart/:productId` | Update cart item quantity |
| DELETE | `/api/marketplace/cart/:productId` | Remove item from cart |
| DELETE | `/api/marketplace/cart` | Clear cart |

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/marketplace/orders` | Create order (single product) |
| POST | `/api/marketplace/orders/from-cart` | Create orders from cart |
| GET | `/api/marketplace/orders` | Get user's orders |
| GET | `/api/marketplace/orders/:id` | Get order details |
| POST | `/api/marketplace/orders/:id/pay` | Initiate Tap payment |
| GET | `/api/marketplace/orders/:id/verify` | Verify payment |
| PATCH | `/api/marketplace/orders/:id/status` | Update order status (seller) |
| POST | `/api/marketplace/orders/:id/cancel` | Cancel order |

### Stats

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/marketplace/stats` | Get marketplace stats |
| GET | `/api/marketplace/seller/stats` | Get seller's stats |

---

## Tap Payments Integration

### Payment Flow

1. **Initiate Payment**
   - Frontend calls `POST /api/marketplace/orders/:orderId/pay`
   - Backend creates a Tap charge with order details
   - Backend returns `redirectUrl` to Tap's payment page

2. **User Completes Payment**
   - User is redirected to Tap's secure payment page
   - User enters card details and completes payment
   - Tap redirects user to callback URL with `tap_id`

3. **Verify Payment**
   - Frontend callback page calls `GET /api/marketplace/orders/:orderId/verify?tap_id=xxx`
   - Backend verifies payment status with Tap API
   - If successful (status: CAPTURED):
     - Order status updated to `paid`
     - Product quantities decremented
     - Success response returned
   - If failed:
     - Order status updated to `cancelled`
     - Error response returned

### Tap API Configuration

Required environment variables:
```
TAP_SECRET_KEY=sk_test_xxx  # or sk_live_xxx for production
TAP_PUBLIC_KEY=pk_test_xxx  # optional, for frontend
```

---

## Data Models

### Product
```typescript
{
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  images: string[];
  category: string;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  status: 'active' | 'sold' | 'reserved' | 'inactive';
  sellerId: ObjectId;
  location?: { city, country, coordinates };
  quantity: number;
  viewCount: number;
  favoriteCount: number;
  isFeatured: boolean;
  isNegotiable: boolean;
  tags?: string[];
}
```

### Order
```typescript
{
  orderNumber: string;
  buyerId: ObjectId;
  sellerId: ObjectId;
  items: [{
    productId: ObjectId;
    title: string;
    price: number;
    quantity: number;
    image?: string;
  }];
  subtotal: number;
  shippingFee: number;
  serviceFee: number;  // 5% platform fee
  total: number;
  currency: string;
  status: OrderStatus;
  paymentMethod: 'tap' | 'cash';
  tapChargeId?: string;
  paidAt?: Date;
  shippingAddress?: ShippingAddress;
  trackingNumber?: string;
}
```

---

## Categories

- Electronics
- Clothing
- Accessories
- Home & Garden
- Sports
- Books
- Beauty
- Toys
- Automotive
- Food & Beverages
- Other

---

## Fees

- **Service Fee**: 5% of subtotal (charged to buyer)
- **Shipping Fee**: Currently free (can be configured per seller)

---

## Security Considerations

1. **Authentication**: All marketplace endpoints require authentication
2. **Authorization**: 
   - Only sellers can edit/delete their own products
   - Only buyers/sellers of an order can view order details
   - Only sellers can update order status
3. **Payment Security**: All payments processed through Tap's secure payment page
4. **Input Validation**: All inputs validated on backend
5. **Rate Limiting**: API rate limiting applied to prevent abuse
