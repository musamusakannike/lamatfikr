import mongoose, { Schema } from "mongoose";

export interface SubscriptionPlan {
  name: string;
  price: number;
  duration: number;
  features: string[];
}

const SubscriptionPlanSchema = new Schema<SubscriptionPlan>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    duration: { type: Number, required: true, min: 1 },
    features: { type: [String], default: [] },
  },
  { timestamps: true }
);

SubscriptionPlanSchema.index({ name: 1 }, { unique: true });

export const SubscriptionPlanModel =
  (mongoose.models.SubscriptionPlan as mongoose.Model<SubscriptionPlan>) ||
  mongoose.model<SubscriptionPlan>("SubscriptionPlan", SubscriptionPlanSchema);
