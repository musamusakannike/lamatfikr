import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export const RoomMemberRole = {
  owner: "owner",
  admin: "admin",
  member: "member",
} as const;
export type RoomMemberRole = (typeof RoomMemberRole)[keyof typeof RoomMemberRole];

export const RoomMemberStatus = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
  awaitingPayment: "awaiting_payment", // For paid private rooms - approved but needs to pay
} as const;
export type RoomMemberStatus = (typeof RoomMemberStatus)[keyof typeof RoomMemberStatus];

export interface RoomMember {
  roomId: ObjectId;
  userId: ObjectId;
  role: RoomMemberRole;
  status: RoomMemberStatus;
  paidAt?: Date;
  paymentId?: string;
  deletedAt?: Date | null;
}

const RoomMemberSchema = new Schema<RoomMember>(
  {
    roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: {
      type: String,
      enum: Object.values(RoomMemberRole),
      default: RoomMemberRole.member,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(RoomMemberStatus),
      default: RoomMemberStatus.approved,
      required: true,
    },
    paidAt: { type: Date },
    paymentId: { type: String },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

RoomMemberSchema.index({ roomId: 1, userId: 1 }, { unique: true });
RoomMemberSchema.index({ roomId: 1, status: 1 });
RoomMemberSchema.index({ deletedAt: 1 });

export const RoomMemberModel =
  (mongoose.models.RoomMember as mongoose.Model<RoomMember>) ||
  mongoose.model<RoomMember>("RoomMember", RoomMemberSchema);
