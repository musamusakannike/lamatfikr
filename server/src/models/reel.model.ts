import mongoose, { Schema } from "mongoose";

import { PostPrivacy, type PostPrivacy as PostPrivacyType } from "./common";
import type { ObjectId } from "./common";

export interface Reel {
  userId: ObjectId;
  videoUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  duration: number;
  privacy: PostPrivacyType;
  location?: string;
  feeling?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  deletedAt?: Date | null;
}

const ReelSchema = new Schema<Reel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String },
    caption: { type: String },
    duration: { type: Number, required: true },
    privacy: {
      type: String,
      enum: Object.values(PostPrivacy),
      default: PostPrivacy.public,
      required: true,
    },
    location: { type: String },
    feeling: { type: String },
    viewCount: { type: Number, default: 0, min: 0 },
    likeCount: { type: Number, default: 0, min: 0 },
    commentCount: { type: Number, default: 0, min: 0 },
    shareCount: { type: Number, default: 0, min: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ReelSchema.index({ userId: 1, createdAt: -1 });
ReelSchema.index({ deletedAt: 1, createdAt: -1 });
ReelSchema.index({ privacy: 1, createdAt: -1 });

export const ReelModel =
  (mongoose.models.Reel as mongoose.Model<Reel>) || mongoose.model<Reel>("Reel", ReelSchema);
