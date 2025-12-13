import mongoose, { Schema } from "mongoose";

import { FriendshipStatus, type FriendshipStatus as FriendshipStatusType } from "./common";
import type { ObjectId } from "./common";

export interface Friendship {
  requesterId: ObjectId;
  addresseeId: ObjectId;
  status: FriendshipStatusType;
  respondedAt?: Date;
}

const FriendshipSchema = new Schema<Friendship>(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    addresseeId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: Object.values(FriendshipStatus),
      default: FriendshipStatus.pending,
      required: true,
    },
    respondedAt: { type: Date },
  },
  { timestamps: true }
);

FriendshipSchema.index({ requesterId: 1, addresseeId: 1 }, { unique: true });
FriendshipSchema.index({ addresseeId: 1, status: 1 });
FriendshipSchema.index({ requesterId: 1, status: 1 });

export const FriendshipModel =
  (mongoose.models.Friendship as mongoose.Model<Friendship>) ||
  mongoose.model<Friendship>("Friendship", FriendshipSchema);
