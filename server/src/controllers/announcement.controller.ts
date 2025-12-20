import type { RequestHandler } from "express";
import { Types } from "mongoose";
import { z } from "zod";

import { AnnouncementModel, AnnouncementPriority } from "../models/announcement.model";
import { AnnouncementReadModel } from "../models/announcement-read.model";
import { UserModel } from "../models/user.model";

// ==================== VALIDATORS ====================

const createAnnouncementSchema = z.object({
    title: z.string().min(1).max(200),
    content: z.string().min(1).max(5000),
    priority: z.enum([AnnouncementPriority.low, AnnouncementPriority.medium, AnnouncementPriority.high]).optional(),
    isActive: z.boolean().optional(),
});

const updateAnnouncementSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    content: z.string().min(1).max(5000).optional(),
    priority: z.enum([AnnouncementPriority.low, AnnouncementPriority.medium, AnnouncementPriority.high]).optional(),
    isActive: z.boolean().optional(),
});

// ==================== CRUD ====================

export const createAnnouncement: RequestHandler = async (req, res, next) => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const validation = createAnnouncementSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                message: "Validation failed",
                errors: validation.error.flatten().fieldErrors,
            });
            return;
        }

        const { title, content, priority, isActive } = validation.data;

        const announcement = await AnnouncementModel.create({
            title,
            content,
            createdBy: userId,
            priority: priority || AnnouncementPriority.medium,
            isActive: isActive !== undefined ? isActive : true,
        });

        const populatedAnnouncement = await AnnouncementModel.findById(announcement._id)
            .populate("createdBy", "firstName lastName username avatar verified")
            .lean();

        res.status(201).json({
            message: "Announcement created successfully",
            announcement: populatedAnnouncement,
        });
    } catch (error) {
        next(error);
    }
};

export const getAnnouncements: RequestHandler = async (req, res, next) => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        // Only get active, non-deleted announcements
        const announcements = await AnnouncementModel.find({
            isActive: true,
            deletedAt: null,
        })
            .populate("createdBy", "firstName lastName username avatar verified")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Mark all fetched announcements as read for this user
        const announcementIds = announcements.map((a) => a._id);
        if (announcementIds.length > 0) {
            await Promise.all(
                announcementIds.map((announcementId) =>
                    AnnouncementReadModel.findOneAndUpdate(
                        { userId, announcementId },
                        { userId, announcementId, readAt: new Date() },
                        { upsert: true, new: true }
                    )
                )
            );
        }

        const total = await AnnouncementModel.countDocuments({
            isActive: true,
            deletedAt: null,
        });

        res.json({
            announcements,
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

export const getAnnouncementById: RequestHandler = async (req, res, next) => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { id } = req.params;

        const announcement = await AnnouncementModel.findOne({
            _id: id,
            isActive: true,
            deletedAt: null,
        })
            .populate("createdBy", "firstName lastName username avatar verified")
            .lean();

        if (!announcement) {
            res.status(404).json({ message: "Announcement not found" });
            return;
        }

        // Mark as read
        await AnnouncementReadModel.findOneAndUpdate(
            { userId, announcementId: id },
            { userId, announcementId: id, readAt: new Date() },
            { upsert: true, new: true }
        );

        res.json({ announcement });
    } catch (error) {
        next(error);
    }
};

export const updateAnnouncement: RequestHandler = async (req, res, next) => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { id } = req.params;

        const validation = updateAnnouncementSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                message: "Validation failed",
                errors: validation.error.flatten().fieldErrors,
            });
            return;
        }

        const announcement = await AnnouncementModel.findOne({
            _id: id,
            deletedAt: null,
        });

        if (!announcement) {
            res.status(404).json({ message: "Announcement not found" });
            return;
        }

        const { title, content, priority, isActive } = validation.data;

        if (title !== undefined) announcement.title = title;
        if (content !== undefined) announcement.content = content;
        if (priority !== undefined) announcement.priority = priority;
        if (isActive !== undefined) announcement.isActive = isActive;

        await announcement.save();

        const populatedAnnouncement = await AnnouncementModel.findById(announcement._id)
            .populate("createdBy", "firstName lastName username avatar verified")
            .lean();

        res.json({
            message: "Announcement updated successfully",
            announcement: populatedAnnouncement,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteAnnouncement: RequestHandler = async (req, res, next) => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { id } = req.params;

        const announcement = await AnnouncementModel.findOne({
            _id: id,
            deletedAt: null,
        });

        if (!announcement) {
            res.status(404).json({ message: "Announcement not found" });
            return;
        }

        announcement.deletedAt = new Date();
        await announcement.save();

        res.json({ message: "Announcement deleted successfully" });
    } catch (error) {
        next(error);
    }
};

// ==================== READ TRACKING ====================

export const markAnnouncementAsRead: RequestHandler = async (req, res, next) => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { id } = req.params;

        const announcement = await AnnouncementModel.findOne({
            _id: id,
            isActive: true,
            deletedAt: null,
        });

        if (!announcement) {
            res.status(404).json({ message: "Announcement not found" });
            return;
        }

        await AnnouncementReadModel.findOneAndUpdate(
            { userId, announcementId: id },
            { userId, announcementId: id, readAt: new Date() },
            { upsert: true, new: true }
        );

        res.json({ message: "Announcement marked as read" });
    } catch (error) {
        next(error);
    }
};

export const getUnreadCount: RequestHandler = async (req, res, next) => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        // Get all active announcement IDs
        const activeAnnouncements = await AnnouncementModel.find({
            isActive: true,
            deletedAt: null,
        })
            .select("_id")
            .lean();

        const activeAnnouncementIds = activeAnnouncements.map((a) => a._id.toString());

        // Get read announcement IDs for this user
        const readAnnouncements = await AnnouncementReadModel.find({
            userId,
            announcementId: { $in: activeAnnouncementIds.map((id) => new Types.ObjectId(id)) },
        })
            .select("announcementId")
            .lean();

        const readAnnouncementIds = readAnnouncements.map((r) => r.announcementId.toString());

        // Calculate unread count
        const unreadCount = activeAnnouncementIds.filter(
            (id) => !readAnnouncementIds.includes(id)
        ).length;

        res.json({ unreadCount });
    } catch (error) {
        next(error);
    }
};

// ==================== ADMIN FUNCTIONS ====================

export const getAllAnnouncementsAdmin: RequestHandler = async (req, res, next) => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;
        const includeDeleted = req.query.includeDeleted === "true";

        const filter: any = {};
        if (!includeDeleted) {
            filter.deletedAt = null;
        }

        const announcements = await AnnouncementModel.find(filter)
            .populate("createdBy", "firstName lastName username avatar verified")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await AnnouncementModel.countDocuments(filter);

        res.json({
            announcements,
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
