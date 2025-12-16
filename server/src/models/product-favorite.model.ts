import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export interface ProductFavorite {
  productId: ObjectId;
  userId: ObjectId;
}

const ProductFavoriteSchema = new Schema<ProductFavorite>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ProductFavoriteSchema.index({ productId: 1, userId: 1 }, { unique: true });

export const ProductFavoriteModel =
  (mongoose.models.ProductFavorite as mongoose.Model<ProductFavorite>) ||
  mongoose.model<ProductFavorite>("ProductFavorite", ProductFavoriteSchema);
