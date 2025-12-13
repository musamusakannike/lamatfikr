import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export interface Share {
  userId: ObjectId;
  originalPostId: ObjectId;
  message?: string;
  deletedAt?: Date | null;
}

const ShareSchema = new Schema<Share>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    originalPostId: { type: Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    message: { type: String },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ShareSchema.index({ originalPostId: 1, createdAt: -1 });
ShareSchema.index({ userId: 1, originalPostId: 1 }, { unique: true });
ShareSchema.index({ deletedAt: 1 });

export const ShareModel =
  (mongoose.models.Share as mongoose.Model<Share>) || mongoose.model<Share>("Share", ShareSchema);
