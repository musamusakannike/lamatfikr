import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export const RoomEventType = {
  livestream: "livestream",
  video_call: "video_call",
  space: "space",
} as const;
export type RoomEventType = (typeof RoomEventType)[keyof typeof RoomEventType];

export const RoomEventStatus = {
  active: "active",
  ended: "ended",
} as const;
export type RoomEventStatus = (typeof RoomEventStatus)[keyof typeof RoomEventStatus];

export interface RoomEvent {
  roomId: ObjectId;
  type: RoomEventType;
  status: RoomEventStatus;
  startedBy: ObjectId;
  streamCallId?: string; // GetStream.io call ID
  endedAt?: Date;
}

const RoomEventSchema = new Schema<RoomEvent>(
  {
    roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true, index: true },
    type: {
      type: String,
      enum: Object.values(RoomEventType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(RoomEventStatus),
      default: RoomEventStatus.active,
      required: true,
    },
    startedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    streamCallId: { type: String },
    endedAt: { type: Date },
  },
  { timestamps: true }
);

RoomEventSchema.index({ roomId: 1, status: 1 });
RoomEventSchema.index({ streamCallId: 1 });

export const RoomEventModel =
  (mongoose.models.RoomEvent as mongoose.Model<RoomEvent>) ||
  mongoose.model<RoomEvent>("RoomEvent", RoomEventSchema);

