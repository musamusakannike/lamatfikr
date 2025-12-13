import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export interface Mention {
  postId: ObjectId;
  mentionedUserId: ObjectId;
}

const MentionSchema = new Schema<Mention>(
  {
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    mentionedUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

MentionSchema.index({ postId: 1, mentionedUserId: 1 }, { unique: true });
MentionSchema.index({ mentionedUserId: 1, createdAt: -1 });

export const MentionModel =
  (mongoose.models.Mention as mongoose.Model<Mention>) ||
  mongoose.model<Mention>("Mention", MentionSchema);
