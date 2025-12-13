import mongoose, { Schema } from "mongoose";

import { FollowStatus, type FollowStatus as FollowStatusType } from "./common";
import type { ObjectId } from "./common";

export interface Follow {
  followerId: ObjectId;
  followingId: ObjectId;
  status: FollowStatusType;
}

const FollowSchema = new Schema<Follow>(
  {
    followerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    followingId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: Object.values(FollowStatus),
      default: FollowStatus.pending,
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
FollowSchema.index({ followingId: 1, status: 1 });

export const FollowModel =
  (mongoose.models.Follow as mongoose.Model<Follow>) || mongoose.model<Follow>("Follow", FollowSchema);
