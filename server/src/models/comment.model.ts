import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export interface Comment {
  postId: ObjectId;
  userId: ObjectId;
  parentCommentId?: ObjectId | null;
  content: string;
  media?: string[];
  reactionCount: number;
  replyCount: number;
  deletedAt?: Date | null;
}

const CommentSchema = new Schema<Comment>(
  {
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    parentCommentId: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
    content: { type: String, required: true },
    media: { type: [String], default: [] },
    reactionCount: { type: Number, default: 0, min: 0 },
    replyCount: { type: Number, default: 0, min: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

CommentSchema.index({ postId: 1, createdAt: -1 });
CommentSchema.index({ parentCommentId: 1, createdAt: -1 });
CommentSchema.index({ deletedAt: 1, createdAt: -1 });

export const CommentModel =
  (mongoose.models.Comment as mongoose.Model<Comment>) ||
  mongoose.model<Comment>("Comment", CommentSchema);
