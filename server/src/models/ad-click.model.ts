import mongoose, { Schema } from "mongoose";

import { AdEventType } from "./common";
import type { ObjectId } from "./common";

export interface AdClick {
  adId: ObjectId;
  userId?: ObjectId;
  type: "click";
}

const AdClickSchema = new Schema<AdClick>(
  {
    adId: { type: Schema.Types.ObjectId, ref: "Ad", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    type: { type: String, enum: [AdEventType.click], default: AdEventType.click, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AdClickSchema.index({ adId: 1, createdAt: -1 });

export const AdClickModel =
  (mongoose.models.AdClick as mongoose.Model<AdClick>) || mongoose.model<AdClick>("AdClick", AdClickSchema);
