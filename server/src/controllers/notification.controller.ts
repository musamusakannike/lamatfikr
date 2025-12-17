import type { RequestHandler } from "express";

import { NotificationModel } from "../models/notification.model";
import {
  listNotificationsSchema,
  markNotificationReadSchema,
} from "../validators/notification.validator";

export const getUnreadNotificationsCount: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const count = await NotificationModel.countDocuments({ userId, isRead: false });
    res.json({ unreadCount: count });
  } catch (error) {
    next(error);
  }
};

export const listNotifications: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const validation = listNotificationsSchema.safeParse(req.query);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { page = 1, limit = 20, unreadOnly = false } = validation.data;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { userId };
    if (unreadOnly) filter.isRead = false;

    const [notifications, total] = await Promise.all([
      NotificationModel.find(filter)
        .populate("actorId", "firstName lastName username avatar verified")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      NotificationModel.countDocuments(filter),
    ]);

    res.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationAsRead: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const validation = markNotificationReadSchema.safeParse(req.params);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { notificationId } = validation.data;

    const notification = await NotificationModel.findOne({
      _id: notificationId,
      userId,
    });

    if (!notification) {
      res.status(404).json({ message: "Notification not found" });
      return;
    }

    if (!notification.isRead) {
      notification.isRead = true;
      await notification.save();
    }

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsAsRead: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    await NotificationModel.updateMany({ userId, isRead: false }, { $set: { isRead: true } });

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    next(error);
  }
};
