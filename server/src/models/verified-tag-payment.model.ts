import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export const VerifiedTagPaymentStatus = {
  pending: "pending",
  captured: "captured",
  failed: "failed",
  refunded: "refunded",
} as const;
export type VerifiedTagPaymentStatus =
  (typeof VerifiedTagPaymentStatus)[keyof typeof VerifiedTagPaymentStatus];

export interface VerifiedTagPayment {
  userId: ObjectId;
  amount: number;
  currency: string;
  tapChargeId: string;
  status: VerifiedTagPaymentStatus;
  paidAt?: Date;
  durationDays: number;
  startsAt: Date;
  endsAt: Date;
  metadata?: Record<string, unknown>;
}

const VerifiedTagPaymentSchema = new Schema<VerifiedTagPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: "SAR", enum: ["SAR", "OMR", "USD"] },
    tapChargeId: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: Object.values(VerifiedTagPaymentStatus),
      default: VerifiedTagPaymentStatus.pending,
      required: true,
      index: true,
    },
    paidAt: { type: Date },
    durationDays: { type: Number, required: true, min: 1 },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true, index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

VerifiedTagPaymentSchema.index({ userId: 1, createdAt: -1 });

export const VerifiedTagPaymentModel =
  (mongoose.models.VerifiedTagPayment as mongoose.Model<VerifiedTagPayment>) ||
  mongoose.model<VerifiedTagPayment>("VerifiedTagPayment", VerifiedTagPaymentSchema);
