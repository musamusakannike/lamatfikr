import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export interface RoomInviteLink {
  roomId: ObjectId;
  createdBy: ObjectId;
  token: string;
  expiresAt?: Date | null;
  maxUses?: number | null;
  usedCount: number;
  isActive: boolean;
  deletedAt?: Date | null;
}

const RoomInviteLinkSchema = new Schema<RoomInviteLink>(
  {
    roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, default: null },
    maxUses: { type: Number, default: null },
    usedCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

RoomInviteLinkSchema.index({ roomId: 1, isActive: 1 });
RoomInviteLinkSchema.index({ token: 1, isActive: 1 });
RoomInviteLinkSchema.index({ expiresAt: 1 }, { sparse: true });

export const RoomInviteLinkModel =
  (mongoose.models.RoomInviteLink as mongoose.Model<RoomInviteLink>) ||
  mongoose.model<RoomInviteLink>("RoomInviteLink", RoomInviteLinkSchema);
