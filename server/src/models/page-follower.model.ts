import mongoose, { Schema } from "mongoose";

import { PageFollowerRole, type PageFollowerRole as PageFollowerRoleType } from "./common";
import type { ObjectId } from "./common";

export interface PageFollower {
  pageId: ObjectId;
  userId: ObjectId;
  role: PageFollowerRoleType;
  deletedAt?: Date | null;
}

const PageFollowerSchema = new Schema<PageFollower>(
  {
    pageId: { type: Schema.Types.ObjectId, ref: "Page", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: {
      type: String,
      enum: Object.values(PageFollowerRole),
      default: PageFollowerRole.follower,
      required: true,
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

PageFollowerSchema.index({ pageId: 1, userId: 1 }, { unique: true });
PageFollowerSchema.index({ userId: 1, createdAt: -1 });
PageFollowerSchema.index({ deletedAt: 1 });

export const PageFollowerModel =
  (mongoose.models.PageFollower as mongoose.Model<PageFollower>) ||
  mongoose.model<PageFollower>("PageFollower", PageFollowerSchema);
