import mongoose, { Schema } from "mongoose";

import { ConversationType, type ConversationType as ConversationTypeType } from "./common";
import type { ObjectId } from "./common";

export interface Conversation {
  type: ConversationTypeType;
  participants: ObjectId[];
  lastMessageId?: ObjectId;
  deletedAt?: Date | null;
}

const ConversationSchema = new Schema<Conversation>(
  {
    type: { type: String, enum: Object.values(ConversationType), required: true },
    participants: {
      type: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
      validate: {
        validator: (v: unknown) => Array.isArray(v) && v.length >= 2,
        message: "participants must contain at least 2 users",
      },
    },
    lastMessageId: { type: Schema.Types.ObjectId, ref: "Message" },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ deletedAt: 1, updatedAt: -1 });

export const ConversationModel =
  (mongoose.models.Conversation as mongoose.Model<Conversation>) ||
  mongoose.model<Conversation>("Conversation", ConversationSchema);
