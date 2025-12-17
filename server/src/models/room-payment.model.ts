import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export const PaymentStatus = {
  pending: "pending",
  captured: "captured",
  failed: "failed",
  refunded: "refunded",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export interface RoomPayment {
  roomId: ObjectId;
  userId: ObjectId;
  amount: number;
  currency: string;
  tapChargeId: string;
  status: PaymentStatus;
  paidAt?: Date;
  metadata?: Record<string, unknown>;
}

const RoomPaymentSchema = new Schema<RoomPayment>(
  {
    roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: "SAR", enum: ["SAR", "OMR", "USD"] },
    tapChargeId: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.pending,
      required: true,
    },
    paidAt: { type: Date },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

RoomPaymentSchema.index({ roomId: 1, userId: 1 });
RoomPaymentSchema.index({ tapChargeId: 1 });
RoomPaymentSchema.index({ status: 1 });

export const RoomPaymentModel =
  (mongoose.models.RoomPayment as mongoose.Model<RoomPayment>) ||
  mongoose.model<RoomPayment>("RoomPayment", RoomPaymentSchema);
