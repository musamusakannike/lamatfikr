import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export interface CommunityMessage {
  communityId: ObjectId;
  senderId: ObjectId;
  content?: string;
  media?: string[];
  deletedAt?: Date | null;
}

const CommunityMessageSchema = new Schema<CommunityMessage>(
  {
    communityId: {
      type: Schema.Types.ObjectId,
      ref: "Community",
      required: true,
      index: true,
    },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    content: { type: String },
    media: { type: [String], default: [] },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

CommunityMessageSchema.index({ communityId: 1, createdAt: -1 });
CommunityMessageSchema.index({ senderId: 1, createdAt: -1 });
CommunityMessageSchema.index({ deletedAt: 1 });

export const CommunityMessageModel =
  (mongoose.models.CommunityMessage as mongoose.Model<CommunityMessage>) ||
  mongoose.model<CommunityMessage>("CommunityMessage", CommunityMessageSchema);
