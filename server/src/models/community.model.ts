import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export const CommunityCategory = {
  technology: "Technology",
  finance: "Finance",
  artDesign: "Art & Design",
  business: "Business",
  healthFitness: "Health & Fitness",
  photography: "Photography",
  music: "Music",
  gaming: "Gaming",
  education: "Education",
  lifestyle: "Lifestyle",
  sports: "Sports",
  travel: "Travel",
  food: "Food",
  entertainment: "Entertainment",
  science: "Science",
} as const;
export type CommunityCategory = (typeof CommunityCategory)[keyof typeof CommunityCategory];

export interface Community {
  name: string;
  description: string;
  image?: string;
  category: string;
  ownerId: ObjectId;
  memberCount: number;
  deletedAt?: Date | null;
}

const CommunitySchema = new Schema<Community>(
  {
    name: { type: String, required: true, trim: true, index: "text" },
    description: { type: String, required: true, index: "text" },
    image: { type: String },
    category: { type: String, required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    memberCount: { type: Number, default: 0, min: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

CommunitySchema.index({ deletedAt: 1, createdAt: -1 });
CommunitySchema.index({ name: "text", description: "text" });

export const CommunityModel =
  (mongoose.models.Community as mongoose.Model<Community>) || mongoose.model<Community>("Community", CommunitySchema);
