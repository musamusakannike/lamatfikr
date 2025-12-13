import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export interface MessageRead {
  messageId: ObjectId;
  userId: ObjectId;
  readAt: Date;
}

const MessageReadSchema = new Schema<MessageRead>(
  {
    messageId: { type: Schema.Types.ObjectId, ref: "Message", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    readAt: { type: Date, default: () => new Date(), required: true },
  },
  { timestamps: false }
);

MessageReadSchema.index({ messageId: 1, userId: 1 }, { unique: true });
MessageReadSchema.index({ userId: 1, readAt: -1 });

export const MessageReadModel =
  (mongoose.models.MessageRead as mongoose.Model<MessageRead>) ||
  mongoose.model<MessageRead>("MessageRead", MessageReadSchema);
