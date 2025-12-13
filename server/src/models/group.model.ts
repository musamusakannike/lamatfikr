import mongoose, { Schema } from "mongoose";

import { GroupPrivacy, type GroupPrivacy as GroupPrivacyType } from "./common";
import type { ObjectId } from "./common";

export interface Group {
  name: string;
  description?: string;
  privacy: GroupPrivacyType;
  ownerId: ObjectId;
  coverPhoto?: string;
  memberCount: number;
  deletedAt?: Date | null;
}

const GroupSchema = new Schema<Group>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    privacy: {
      type: String,
      enum: Object.values(GroupPrivacy),
      default: GroupPrivacy.public,
      required: true,
    },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    coverPhoto: { type: String },
    memberCount: { type: Number, default: 0, min: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

GroupSchema.index({ deletedAt: 1, createdAt: -1 });

export const GroupModel =
  (mongoose.models.Group as mongoose.Model<Group>) || mongoose.model<Group>("Group", GroupSchema);
