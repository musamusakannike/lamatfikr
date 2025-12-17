import { Types } from "mongoose";

import { NotificationModel } from "../models/notification.model";
import { NotificationType } from "../models/common";

type CreateNotificationInput = {
  userId: string;
  actorId?: string;
  type: (typeof NotificationType)[keyof typeof NotificationType];
  targetId?: string;
  url: string;
};

export async function createNotification(input: CreateNotificationInput) {
  if (input.actorId && input.userId === input.actorId) return;

  await NotificationModel.create({
    userId: new Types.ObjectId(input.userId),
    actorId: input.actorId ? new Types.ObjectId(input.actorId) : undefined,
    type: input.type,
    targetId: input.targetId ? new Types.ObjectId(input.targetId) : undefined,
    url: input.url,
    isRead: false,
  });
}
