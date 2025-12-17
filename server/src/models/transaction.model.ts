import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export const TransactionType = {
  roomPayment: "room_payment",
  productPurchase: "product_purchase",
  withdrawal: "withdrawal",
  refund: "refund",
  platformFee: "platform_fee",
} as const;
export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

export const TransactionStatus = {
  pending: "pending",
  completed: "completed",
  failed: "failed",
  cancelled: "cancelled",
} as const;
export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus];

export interface Transaction {
  userId: ObjectId;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  description: string;
  referenceId?: ObjectId;
  referenceType?: string;
  metadata?: Record<string, unknown>;
  completedAt?: Date;
  failedReason?: string;
}

const TransactionSchema = new Schema<Transaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: true,
      index: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.pending,
      required: true,
      index: true,
    },
    description: { type: String, required: true },
    referenceId: { type: Schema.Types.ObjectId },
    referenceType: { type: String },
    metadata: { type: Schema.Types.Mixed },
    completedAt: { type: Date },
    failedReason: { type: String },
  },
  { timestamps: true }
);

TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ type: 1, status: 1 });
TransactionSchema.index({ referenceId: 1, referenceType: 1 });

export const TransactionModel =
  (mongoose.models.Transaction as mongoose.Model<Transaction>) ||
  mongoose.model<Transaction>("Transaction", TransactionSchema);
