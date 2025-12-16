import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export interface RoomMessage {
  roomId: ObjectId;
  senderId: ObjectId;
  content?: string;
  media?: string[];
  deletedAt?: Date | null;
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
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

RoomMessageSchema.index({ roomId: 1, createdAt: -1 });
RoomMessageSchema.index({ senderId: 1, createdAt: -1 });
RoomMessageSchema.index({ deletedAt: 1 });

export const RoomMessageModel =
  (mongoose.models.RoomMessage as mongoose.Model<RoomMessage>) ||
  mongoose.model<RoomMessage>("RoomMessage", RoomMessageSchema);
