import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export interface PollOption {
  text: string;
  voteCount: number;
}

export interface Poll {
  postId: ObjectId;
  question: string;
  options: PollOption[];
  allowMultipleVotes: boolean;
  endsAt?: Date;
}

const PollOptionSchema = new Schema<PollOption>(
  {
    text: { type: String, required: true, maxlength: 200 },
    voteCount: { type: Number, default: 0, min: 0 },
  },
  { _id: true }
);

const PollSchema = new Schema<Poll>(
  {
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true, unique: true },
    question: { type: String, required: true, maxlength: 500 },
    options: {
      type: [PollOptionSchema],
      required: true,
      validate: {
        validator: (v: PollOption[]) => v.length >= 2 && v.length <= 10,
        message: "Poll must have between 2 and 10 options",
      },
    },
    allowMultipleVotes: { type: Boolean, default: false },
    endsAt: { type: Date },
  },
  { timestamps: true }
);

PollSchema.index({ postId: 1 }, { unique: true });
PollSchema.index({ endsAt: 1 });

export const PollModel =
  (mongoose.models.Poll as mongoose.Model<Poll>) || mongoose.model<Poll>("Poll", PollSchema);
