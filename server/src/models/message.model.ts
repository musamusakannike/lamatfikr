import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export interface Message {
  conversationId: ObjectId;
  senderId: ObjectId;
  content?: string;
  media?: string[];
  deletedAt?: Date | null;
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
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index({ deletedAt: 1 });

export const MessageModel =
  (mongoose.models.Message as mongoose.Model<Message>) || mongoose.model<Message>("Message", MessageSchema);
