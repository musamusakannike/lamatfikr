import mongoose, { Schema } from "mongoose";

import { SubscriptionStatus, type SubscriptionStatus as SubscriptionStatusType } from "./common";
import type { ObjectId } from "./common";

export interface UserSubscription {
  userId: ObjectId;
  planId: ObjectId;
  startsAt: Date;
  endsAt: Date;
  status: SubscriptionStatusType;
}

const UserSubscriptionSchema = new Schema<UserSubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    planId: {
      type: Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
      index: true,
    },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(SubscriptionStatus),
      default: SubscriptionStatus.active,
      required: true,
    },
  },
  { timestamps: true }
);

UserSubscriptionSchema.index({ userId: 1, status: 1 });
UserSubscriptionSchema.index({ userId: 1, planId: 1, startsAt: 1 });

export const UserSubscriptionModel =
  (mongoose.models.UserSubscription as mongoose.Model<UserSubscription>) ||
  mongoose.model<UserSubscription>("UserSubscription", UserSubscriptionSchema);
