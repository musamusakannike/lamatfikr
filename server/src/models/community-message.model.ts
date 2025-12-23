import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export type CommunityMessageAttachmentType = "image" | "video" | "audio";

export interface CommunityMessageAttachment {
  url: string;
  type: CommunityMessageAttachmentType;
  name?: string;
  size?: number;
}

export interface CommunityMessageLocation {
  lat: number;
  lng: number;
  label?: string;
}

export interface CommunityMessageReaction {
  emoji: string;
  userId: ObjectId;
}

export interface CommunityMessage {
  communityId: ObjectId;
  senderId: ObjectId;
  content?: string;
  media?: string[];
  attachments?: CommunityMessageAttachment[];
  location?: CommunityMessageLocation;
  reactions?: CommunityMessageReaction[];
  deletedAt?: Date | null;
  editedAt?: Date | null;
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
    attachments: {
      type: [
        {
          url: { type: String, required: true },
          type: { type: String, enum: ["image", "video", "audio"], required: true },
          name: { type: String },
          size: { type: Number },
        },
      ],
      default: [],
    },
    location: {
      type: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        label: { type: String },
      },
      required: false,
    },
    reactions: {
      type: [
        {
          emoji: { type: String, required: true },
          userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        },
      ],
      default: [],
    },
    deletedAt: { type: Date, default: null },
    editedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

CommunityMessageSchema.index({ communityId: 1, createdAt: -1 });
CommunityMessageSchema.index({ senderId: 1, createdAt: -1 });
CommunityMessageSchema.index({ deletedAt: 1 });

export const CommunityMessageModel =
  (mongoose.models.CommunityMessage as mongoose.Model<CommunityMessage>) ||
  mongoose.model<CommunityMessage>("CommunityMessage", CommunityMessageSchema);
