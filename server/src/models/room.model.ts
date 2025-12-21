import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export const RoomMembershipType = {
  free: "free",
  paid: "paid",
} as const;
export type RoomMembershipType = (typeof RoomMembershipType)[keyof typeof RoomMembershipType];

export const RoomCategory = {
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
} as const;
export type RoomCategory = (typeof RoomCategory)[keyof typeof RoomCategory];

export interface Room {
  name: string;
  description: string;
  image?: string;
  category: string;
  membershipType: RoomMembershipType;
  price?: number;
  currency?: string;
  isPrivate: boolean;
  ownerId: ObjectId;
  memberCount: number;
  deletedAt?: Date | null;
}

const RoomSchema = new Schema<Room>(
  {
    name: { type: String, required: true, trim: true, index: "text" },
    description: { type: String, required: true, index: "text" },
    image: { type: String },
    category: { type: String, required: true, index: true },
    membershipType: {
      type: String,
      enum: Object.values(RoomMembershipType),
      default: RoomMembershipType.free,
      required: true,
    },
    price: { type: Number, min: 0 },
    currency: { type: String, default: "OMR", enum: ["SAR", "OMR", "USD"] },
    isPrivate: { type: Boolean, default: false },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    memberCount: { type: Number, default: 0, min: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

RoomSchema.index({ deletedAt: 1, createdAt: -1 });
RoomSchema.index({ name: "text", description: "text" });

export const RoomModel =
  (mongoose.models.Room as mongoose.Model<Room>) || mongoose.model<Room>("Room", RoomSchema);
