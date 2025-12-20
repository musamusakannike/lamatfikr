import { Router } from "express";

import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import {
    createAnnouncement,
    getAnnouncements,
    getAnnouncementById,
    updateAnnouncement,
    deleteAnnouncement,
    markAnnouncementAsRead,
    getUnreadCount,
    getAllAnnouncementsAdmin,
} from "../controllers/announcement.controller";

export const announcementsRouter = Router();

// User routes
announcementsRouter.get("/", requireAuth, getAnnouncements);
announcementsRouter.get("/unread-count", requireAuth, getUnreadCount);
announcementsRouter.get("/:id", requireAuth, getAnnouncementById);
announcementsRouter.post("/:id/read", requireAuth, markAnnouncementAsRead);

// Admin routes
announcementsRouter.post("/", requireAuth, requireAdmin, createAnnouncement);
announcementsRouter.get("/admin/all", requireAuth, requireAdmin, getAllAnnouncementsAdmin);
announcementsRouter.patch("/:id", requireAuth, requireAdmin, updateAnnouncement);
announcementsRouter.delete("/:id", requireAuth, requireAdmin, deleteAnnouncement);
