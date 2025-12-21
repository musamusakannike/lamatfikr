import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export interface ReelView {
  userId?: ObjectId;
  reelId: ObjectId;
  watchDuration: number;
}

const ReelViewSchema = new Schema<ReelView>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    reelId: { type: Schema.Types.ObjectId, ref: "Reel", required: true },
    watchDuration: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ReelViewSchema.index({ reelId: 1, userId: 1 });
ReelViewSchema.index({ reelId: 1, createdAt: -1 });

export const ReelViewModel =
  (mongoose.models.ReelView as mongoose.Model<ReelView>) ||
  mongoose.model<ReelView>("ReelView", ReelViewSchema);
