import { Router } from "express";

import { requireAuth } from "../middleware/auth";
import {
  getUnreadNotificationsCount,
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../controllers/notification.controller";

export const notificationsRouter = Router();

notificationsRouter.get("/unread-count", requireAuth, getUnreadNotificationsCount);
notificationsRouter.get("/", requireAuth, listNotifications);
notificationsRouter.post("/:notificationId/read", requireAuth, markNotificationAsRead);
notificationsRouter.post("/read-all", requireAuth, markAllNotificationsAsRead);
