import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export const FeaturedRoomStatus = {
  pending: "pending",
  active: "active",
  expired: "expired",
  cancelled: "cancelled",
} as const;
export type FeaturedRoomStatus = (typeof FeaturedRoomStatus)[keyof typeof FeaturedRoomStatus];

export interface FeaturedRoom {
  roomId: ObjectId;
  userId: ObjectId;
  startDate: Date;
  endDate: Date;
  days: number;
  amount: number;
  currency: string;
  status: FeaturedRoomStatus;
  tapChargeId?: string;
  metadata?: Record<string, unknown>;
}

const FeaturedRoomSchema = new Schema<FeaturedRoom>(
  {
    roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true, index: true },
    days: { type: Number, required: true, min: 1 },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "OMR", enum: ["SAR", "OMR", "USD"], required: true },
    status: {
      type: String,
      enum: Object.values(FeaturedRoomStatus),
      default: FeaturedRoomStatus.pending,
      required: true,
      index: true,
    },
    tapChargeId: { type: String, sparse: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

FeaturedRoomSchema.index({ status: 1, endDate: -1 });
FeaturedRoomSchema.index({ roomId: 1, status: 1 });

export const FeaturedRoomModel =
  (mongoose.models.FeaturedRoom as mongoose.Model<FeaturedRoom>) ||
  mongoose.model<FeaturedRoom>("FeaturedRoom", FeaturedRoomSchema);
