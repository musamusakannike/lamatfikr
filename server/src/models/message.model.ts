import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export type MessageAttachmentType = "image" | "video" | "audio";

export interface MessageAttachment {
  url: string;
  type: MessageAttachmentType;
  name?: string;
  size?: number;
}

export interface MessageLocation {
  lat: number;
  lng: number;
  label?: string;
}

export interface MessageReaction {
  emoji: string;
  userId: ObjectId;
}

export interface Message {
  conversationId: ObjectId;
  senderId: ObjectId;
  content?: string;
  media?: string[];
  attachments?: MessageAttachment[];
  location?: MessageLocation;
  reactions?: MessageReaction[];
  deletedAt?: Date | null;
  expiresAt?: Date | null;
}

const MessageSchema = new Schema<Message>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
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
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index({ deletedAt: 1 });
MessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const MessageModel =
  (mongoose.models.Message as mongoose.Model<Message>) || mongoose.model<Message>("Message", MessageSchema);
