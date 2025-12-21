import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export interface ReelLike {
  userId: ObjectId;
  reelId: ObjectId;
}

const ReelLikeSchema = new Schema<ReelLike>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reelId: { type: Schema.Types.ObjectId, ref: "Reel", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ReelLikeSchema.index({ userId: 1, reelId: 1 }, { unique: true });
ReelLikeSchema.index({ reelId: 1 });

export const ReelLikeModel =
  (mongoose.models.ReelLike as mongoose.Model<ReelLike>) ||
  mongoose.model<ReelLike>("ReelLike", ReelLikeSchema);
