import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export interface PostHashtag {
  postId: ObjectId;
  hashtagId: ObjectId;
}

const PostHashtagSchema = new Schema<PostHashtag>(
  {
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    hashtagId: { type: Schema.Types.ObjectId, ref: "Hashtag", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

PostHashtagSchema.index({ postId: 1, hashtagId: 1 }, { unique: true });
PostHashtagSchema.index({ hashtagId: 1, createdAt: -1 });

export const PostHashtagModel =
  (mongoose.models.PostHashtag as mongoose.Model<PostHashtag>) ||
  mongoose.model<PostHashtag>("PostHashtag", PostHashtagSchema);
