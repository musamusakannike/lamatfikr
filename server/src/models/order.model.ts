import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export const OrderStatus = {
  pending: "pending",
  awaitingPayment: "awaiting_payment",
  paid: "paid",
  processing: "processing",
  shipped: "shipped",
  delivered: "delivered",
  completed: "completed",
  cancelled: "cancelled",
  refunded: "refunded",
  disputed: "disputed",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentMethod = {
  tap: "tap",
  cash: "cash",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export interface OrderItem {
  productId: ObjectId;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  type?: "physical" | "digital";
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

export interface Order {
  orderNumber: string;
  buyerId: ObjectId;
  sellerId: ObjectId;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  serviceFee: number;
  total: number;
  currency: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  tapChargeId?: string;
  paidAt?: Date;
  shippingAddress?: ShippingAddress;
  trackingNumber?: string;
  notes?: string;
  buyerNotes?: string;
  sellerNotes?: string;
  cancelReason?: string;
  cancelledBy?: ObjectId;
  cancelledAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  completedAt?: Date;
  metadata?: Record<string, unknown>;
}

const OrderItemSchema = new Schema<OrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String },
    type: { type: String, enum: ["physical", "digital"], default: "physical" },
  },
  { _id: false }
);

const ShippingAddressSchema = new Schema<ShippingAddress>(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String },
    postalCode: { type: String },
    country: { type: String, required: true },
  },
  { _id: false }
);

const OrderSchema = new Schema<Order>(
  {
    orderNumber: { type: String, required: true, unique: true },
    buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    serviceFee: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "OMR", enum: ["SAR", "OMR", "USD"] },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.pending,
      required: true,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      default: PaymentMethod.tap,
      required: true,
    },
    tapChargeId: { type: String, sparse: true },
    paidAt: { type: Date },
    shippingAddress: { type: ShippingAddressSchema, required: false },
    trackingNumber: { type: String },
    notes: { type: String },
    buyerNotes: { type: String },
    sellerNotes: { type: String },
    cancelReason: { type: String },
    cancelledBy: { type: Schema.Types.ObjectId, ref: "User" },
    cancelledAt: { type: Date },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
    completedAt: { type: Date },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

OrderSchema.index({ buyerId: 1, status: 1 });
OrderSchema.index({ sellerId: 1, status: 1 });
OrderSchema.index({ tapChargeId: 1 });
OrderSchema.index({ createdAt: -1 });

export const OrderModel =
  (mongoose.models.Order as mongoose.Model<Order>) ||
  mongoose.model<Order>("Order", OrderSchema);
