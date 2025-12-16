import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export interface ProductReview {
  productId: ObjectId;
  userId: ObjectId;
  orderId?: ObjectId;
  rating: number;
  comment?: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  deletedAt?: Date | null;
}

const ProductReviewSchema = new Schema<ProductReview>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
    images: [{ type: String }],
    isVerifiedPurchase: { type: Boolean, default: false },
    helpfulCount: { type: Number, default: 0, min: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ProductReviewSchema.index({ productId: 1, userId: 1 }, { unique: true });
ProductReviewSchema.index({ productId: 1, rating: 1 });
ProductReviewSchema.index({ deletedAt: 1 });

export const ProductReviewModel =
  (mongoose.models.ProductReview as mongoose.Model<ProductReview>) ||
  mongoose.model<ProductReview>("ProductReview", ProductReviewSchema);
