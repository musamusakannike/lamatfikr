import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export interface CartItem {
  productId: ObjectId;
  quantity: number;
  addedAt: Date;
}

export interface Cart {
  userId: ObjectId;
  items: CartItem[];
}

const CartItemSchema = new Schema<CartItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CartSchema = new Schema<Cart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: [CartItemSchema],
  },
  { timestamps: true }
);

export const CartModel =
  (mongoose.models.Cart as mongoose.Model<Cart>) ||
  mongoose.model<Cart>("Cart", CartSchema);
