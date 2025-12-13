import mongoose, { Schema } from "mongoose";

import { NotificationType, type NotificationType as NotificationTypeType } from "./common";
import type { ObjectId } from "./common";

export interface Notification {
  userId: ObjectId;
  actorId?: ObjectId;
  type: NotificationTypeType;
  targetId?: ObjectId;
  isRead: boolean;
}

const NotificationSchema = new Schema<Notification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User" },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    targetId: { type: Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const NotificationModel =
  (mongoose.models.Notification as mongoose.Model<Notification>) ||
  mongoose.model<Notification>("Notification", NotificationSchema);
