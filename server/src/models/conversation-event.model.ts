import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export const ConversationEventType = {
  video_call: "video_call",
  audio_call: "audio_call",
} as const;
export type ConversationEventType = (typeof ConversationEventType)[keyof typeof ConversationEventType];

export const ConversationEventStatus = {
  active: "active",
  ended: "ended",
} as const;
export type ConversationEventStatus = (typeof ConversationEventStatus)[keyof typeof ConversationEventStatus];

export interface ConversationEvent {
  conversationId: ObjectId;
  type: ConversationEventType;
  status: ConversationEventStatus;
  startedBy: ObjectId;
  streamCallId?: string; // GetStream.io call ID
  endedAt?: Date;
}

const ConversationEventSchema = new Schema<ConversationEvent>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    type: {
      type: String,
      enum: Object.values(ConversationEventType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ConversationEventStatus),
      default: ConversationEventStatus.active,
      required: true,
    },
    startedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    streamCallId: { type: String },
    endedAt: { type: Date },
  },
  { timestamps: true }
);

ConversationEventSchema.index({ conversationId: 1, status: 1 });
ConversationEventSchema.index({ streamCallId: 1 });

export const ConversationEventModel =
  (mongoose.models.ConversationEvent as mongoose.Model<ConversationEvent>) ||
  mongoose.model<ConversationEvent>("ConversationEvent", ConversationEventSchema);

