import mongoose, { Schema } from "mongoose";

import { PostMediaType, type PostMediaType as PostMediaTypeType } from "./common";
import type { ObjectId } from "./common";

export interface PostMedia {
  postId: ObjectId;
  type: PostMediaTypeType;
  url: string;
  thumbnail?: string;
  size?: number;
  duration?: number;
  deletedAt?: Date | null;
}

const PostMediaSchema = new Schema<PostMedia>(
  {
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    type: { type: String, enum: Object.values(PostMediaType), required: true },
    url: { type: String, required: true },
    thumbnail: { type: String },
    size: { type: Number },
    duration: { type: Number },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

PostMediaSchema.index({ postId: 1, url: 1 }, { unique: true });
PostMediaSchema.index({ postId: 1, deletedAt: 1 });

export const PostMediaModel =
  (mongoose.models.PostMedia as mongoose.Model<PostMedia>) ||
  mongoose.model<PostMedia>("PostMedia", PostMediaSchema);
