import mongoose, { Schema } from "mongoose";

import { PostPrivacy, type PostPrivacy as PostPrivacyType } from "./common";
import type { ObjectId } from "./common";

export interface Post {
  userId: ObjectId;
  contentText?: string;
  privacy: PostPrivacyType;
  location?: string;
  feeling?: string;
  isEdited: boolean;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  deletedAt?: Date | null;
}

const PostSchema = new Schema<Post>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    contentText: { type: String },
    privacy: {
      type: String,
      enum: Object.values(PostPrivacy),
      default: PostPrivacy.public,
      required: true,
    },
    location: { type: String },
    feeling: { type: String },
    isEdited: { type: Boolean, default: false },
    likeCount: { type: Number, default: 0, min: 0 },
    commentCount: { type: Number, default: 0, min: 0 },
    shareCount: { type: Number, default: 0, min: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

PostSchema.index({ userId: 1, createdAt: -1 });
PostSchema.index({ deletedAt: 1, createdAt: -1 });

export const PostModel =
  (mongoose.models.Post as mongoose.Model<Post>) || mongoose.model<Post>("Post", PostSchema);
