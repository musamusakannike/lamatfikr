import mongoose, { Schema } from "mongoose";

import { AdEventType } from "./common";
import type { ObjectId } from "./common";

export interface AdImpression {
  adId: ObjectId;
  userId?: ObjectId;
  type: "view";
}

const AdImpressionSchema = new Schema<AdImpression>(
  {
    adId: { type: Schema.Types.ObjectId, ref: "Ad", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    type: { type: String, enum: [AdEventType.view], default: AdEventType.view, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AdImpressionSchema.index({ adId: 1, createdAt: -1 });

export const AdImpressionModel =
  (mongoose.models.AdImpression as mongoose.Model<AdImpression>) ||
  mongoose.model<AdImpression>("AdImpression", AdImpressionSchema);
