import mongoose, { Schema } from "mongoose";

import { ReactionTargetType, type ReactionTargetType as ReactionTargetTypeType } from "./common";
import type { ObjectId } from "./common";

export interface Reaction {
  userId: ObjectId;
  targetType: ReactionTargetTypeType;
  targetId: ObjectId;
  reactionType: string;
  deletedAt?: Date | null;
}

const ReactionSchema = new Schema<Reaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetType: { type: String, enum: Object.values(ReactionTargetType), required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    reactionType: { type: String, required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ReactionSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });
ReactionSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
ReactionSchema.index({ deletedAt: 1 });

export const ReactionModel =
  (mongoose.models.Reaction as mongoose.Model<Reaction>) ||
  mongoose.model<Reaction>("Reaction", ReactionSchema);
