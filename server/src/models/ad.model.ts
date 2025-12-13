import mongoose, { Schema } from "mongoose";

import { AdStatus, type AdStatus as AdStatusType } from "./common";
import type { ObjectId } from "./common";

export interface Ad {
  advertiserId: ObjectId;
  media?: string[];
  budget?: number;
  targetAudience?: Record<string, unknown>;
  status: AdStatusType;
  deletedAt?: Date | null;
}

const AdSchema = new Schema<Ad>(
  {
    advertiserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    media: { type: [String], default: [] },
    budget: { type: Number, min: 0 },
    targetAudience: { type: Schema.Types.Mixed },
    status: {
      type: String,
      enum: Object.values(AdStatus),
      default: AdStatus.draft,
      required: true,
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

AdSchema.index({ advertiserId: 1, status: 1 });
AdSchema.index({ deletedAt: 1, createdAt: -1 });

export const AdModel =
  (mongoose.models.Ad as mongoose.Model<Ad>) || mongoose.model<Ad>("Ad", AdSchema);
