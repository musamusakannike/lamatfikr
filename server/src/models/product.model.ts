import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export const ProductCategory = {
  electronics: "Electronics",
  clothing: "Clothing",
  accessories: "Accessories",
  homeGarden: "Home & Garden",
  sports: "Sports",
  books: "Books",
  beauty: "Beauty",
  toys: "Toys",
  automotive: "Automotive",
  foodBeverages: "Food & Beverages",
  other: "Other",
} as const;
export type ProductCategory = (typeof ProductCategory)[keyof typeof ProductCategory];

export const ProductCondition = {
  new: "new",
  likeNew: "like_new",
  good: "good",
  fair: "fair",
  poor: "poor",
} as const;
export type ProductCondition = (typeof ProductCondition)[keyof typeof ProductCondition];

export const ProductStatus = {
  active: "active",
  sold: "sold",
  reserved: "reserved",
  inactive: "inactive",
} as const;
export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];

export const ProductType = {
  physical: "physical",
  digital: "digital",
} as const;
export type ProductType = (typeof ProductType)[keyof typeof ProductType];

export interface Product {
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  images: string[];
  category: string;
  condition: ProductCondition;
  status: ProductStatus;
  sellerId: ObjectId;
  location?: {
    city?: string;
    country?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  quantity: number;
  viewCount: number;
  favoriteCount: number;
  isFeatured: boolean;
  isNegotiable: boolean;
  tags?: string[];
  deletedAt?: Date | null;
  type: ProductType;
  digitalFile?: {
    url: string;
    name: string;
    size: number;
    type: string;
  };
  digitalInstructions?: string;
}

const ProductSchema = new Schema<Product>(
  {
    title: { type: String, required: true, trim: true, index: "text" },
    description: { type: String, required: true, index: "text" },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    currency: { type: String, default: "OMR", enum: ["SAR", "OMR", "USD"] },
    images: [{ type: String }],
    category: { type: String, required: true, index: true },
    condition: {
      type: String,
      enum: Object.values(ProductCondition),
      default: ProductCondition.new,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ProductStatus),
      default: ProductStatus.active,
      required: true,
      index: true,
    },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    location: {
      city: { type: String },
      country: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    quantity: { type: Number, default: 1, min: 0 },
    viewCount: { type: Number, default: 0, min: 0 },
    favoriteCount: { type: Number, default: 0, min: 0 },
    isFeatured: { type: Boolean, default: false },
    isNegotiable: { type: Boolean, default: false },
    tags: [{ type: String }],
    deletedAt: { type: Date, default: null },
    type: {
      type: String,
      enum: Object.values(ProductType),
      default: ProductType.physical,
      required: true,
    },
    digitalFile: {
      url: { type: String },
      name: { type: String },
      size: { type: Number },
      type: { type: String },
    },
    digitalInstructions: { type: String },
  },
  { timestamps: true }
);

ProductSchema.index({ sellerId: 1, status: 1 });
ProductSchema.index({ category: 1, status: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ deletedAt: 1 });

export const ProductModel =
  (mongoose.models.Product as mongoose.Model<Product>) ||
  mongoose.model<Product>("Product", ProductSchema);
