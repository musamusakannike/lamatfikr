import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export interface PollVote {
  pollId: ObjectId;
  userId: ObjectId;
  optionId: ObjectId;
}

const PollVoteSchema = new Schema<PollVote>(
  {
    pollId: { type: Schema.Types.ObjectId, ref: "Poll", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    optionId: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

PollVoteSchema.index({ pollId: 1, userId: 1, optionId: 1 }, { unique: true });
PollVoteSchema.index({ pollId: 1, optionId: 1 });
PollVoteSchema.index({ userId: 1 });

export const PollVoteModel =
  (mongoose.models.PollVote as mongoose.Model<PollVote>) ||
  mongoose.model<PollVote>("PollVote", PollVoteSchema);
