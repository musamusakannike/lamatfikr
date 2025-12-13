import mongoose, { Schema } from "mongoose";

import { VoteType, type VoteType as VoteTypeType } from "./common";
import type { ObjectId } from "./common";

export interface Vote {
  userId: ObjectId;
  postId: ObjectId;
  voteType: VoteTypeType;
}

const VoteSchema = new Schema<Vote>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    voteType: {
      type: String,
      enum: Object.values(VoteType),
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

VoteSchema.index({ userId: 1, postId: 1 }, { unique: true });
VoteSchema.index({ postId: 1, voteType: 1 });

export const VoteModel =
  (mongoose.models.Vote as mongoose.Model<Vote>) || mongoose.model<Vote>("Vote", VoteSchema);
