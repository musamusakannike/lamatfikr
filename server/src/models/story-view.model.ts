import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export interface StoryView {
  storyId: ObjectId;
  viewerId: ObjectId;
  viewedAt: Date;
}

const StoryViewSchema = new Schema<StoryView>(
  {
    storyId: { type: Schema.Types.ObjectId, ref: "Story", required: true },
    viewerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    viewedAt: { type: Date, default: () => new Date(), required: true },
  },
  { timestamps: false }
);

StoryViewSchema.index({ storyId: 1, viewerId: 1 }, { unique: true });
StoryViewSchema.index({ storyId: 1, viewedAt: -1 });

export const StoryViewModel =
  (mongoose.models.StoryView as mongoose.Model<StoryView>) ||
  mongoose.model<StoryView>("StoryView", StoryViewSchema);
