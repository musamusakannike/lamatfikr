import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export interface Block {
  blockerId: ObjectId;
  blockedId: ObjectId;
  reason?: string;
}

const BlockSchema = new Schema<Block>(
  {
    blockerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    blockedId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, maxlength: 500 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

BlockSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });
BlockSchema.index({ blockedId: 1 });

export const BlockModel =
  (mongoose.models.Block as mongoose.Model<Block>) || mongoose.model<Block>("Block", BlockSchema);
