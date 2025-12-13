import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export interface Story {
  userId: ObjectId;
  media: string[];
  viewCount: number;
  expiresAt: Date;
  deletedAt?: Date | null;
}

const StorySchema = new Schema<Story>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    media: { type: [String], default: [] },
    viewCount: { type: Number, default: 0, min: 0 },
    expiresAt: { type: Date, required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

StorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
StorySchema.index({ userId: 1, createdAt: -1 });
StorySchema.index({ deletedAt: 1 });

export const StoryModel =
  (mongoose.models.Story as mongoose.Model<Story>) || mongoose.model<Story>("Story", StorySchema);
