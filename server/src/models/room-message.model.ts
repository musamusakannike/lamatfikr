import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export type RoomMessageAttachmentType = "image" | "video" | "audio";

export interface RoomMessageAttachment {
  url: string;
  type: RoomMessageAttachmentType;
  name?: string;
  size?: number;
}

export interface RoomMessageLocation {
  lat: number;
  lng: number;
  label?: string;
}

export interface RoomMessageReaction {
  emoji: string;
  userId: ObjectId;
}

export interface RoomMessage {
  roomId: ObjectId;
  senderId: ObjectId;
  content?: string;
  media?: string[];
  attachments?: RoomMessageAttachment[];
  location?: RoomMessageLocation;
  reactions?: RoomMessageReaction[];
  deletedAt?: Date | null;
  editedAt?: Date | null;
  isViewOnce?: boolean;
  viewedBy?: ObjectId[];
}

const RoomMessageSchema = new Schema<RoomMessage>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
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
    isViewOnce: { type: Boolean, default: false },
    viewedBy: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], default: [] },
  },
  { timestamps: true }
);

RoomMessageSchema.index({ roomId: 1, createdAt: -1 });
RoomMessageSchema.index({ senderId: 1, createdAt: -1 });
RoomMessageSchema.index({ deletedAt: 1 });

export const RoomMessageModel =
  (mongoose.models.RoomMessage as mongoose.Model<RoomMessage>) ||
  mongoose.model<RoomMessage>("RoomMessage", RoomMessageSchema);
