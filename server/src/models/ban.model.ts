import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export interface Ban {
  userId: ObjectId;
  reason: string;
  expiresAt?: Date;
}

const BanSchema = new Schema<Ban>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reason: { type: String, required: true },
    expiresAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

BanSchema.index({ userId: 1 }, { unique: true });
BanSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

export const BanModel =
  (mongoose.models.Ban as mongoose.Model<Ban>) || mongoose.model<Ban>("Ban", BanSchema);
