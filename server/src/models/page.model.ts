import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export interface Page {
  ownerId: ObjectId;
  name: string;
  username: string;
  category?: string;
  description?: string;
  avatar?: string;
  coverPhoto?: string;
  verified: boolean;
  followerCount: number;
  deletedAt?: Date | null;
}

const PageSchema = new Schema<Page>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, trim: true },
    category: { type: String },
    description: { type: String },
    avatar: { type: String },
    coverPhoto: { type: String },
    verified: { type: Boolean, default: false },
    followerCount: { type: Number, default: 0, min: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

PageSchema.index({ username: 1 }, { unique: true });
PageSchema.index({ deletedAt: 1, createdAt: -1 });

export const PageModel =
  (mongoose.models.Page as mongoose.Model<Page>) || mongoose.model<Page>("Page", PageSchema);
