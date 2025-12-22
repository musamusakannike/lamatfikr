import type { RequestHandler } from "express";
import { ReportModel } from "../models/report.model";
import { createReportSchema, updateReportStatusSchema } from "../validators/report.validator";
import { UserModel } from "../models/user.model";

export const createReport: RequestHandler = async (req, res, next) => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const validation = createReportSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                message: "Validation failed",
                errors: validation.error.flatten().fieldErrors,
            });
            return;
        }

        const { targetType, targetId, reason } = validation.data;

        // Verify target exists (optional but recommended)
        if (targetType === "user") {
            const targetUser = await UserModel.findById(targetId);
            if (!targetUser) {
                res.status(404).json({ message: "User not found" });
                return;
            }
        }
        // Add other target checks if needed (post, room, etc.)

        const report = await ReportModel.create({
            reporterId: userId,
            targetType,
            targetId,
            reason,
            status: "open",
        });

        res.status(201).json({
            message: "Report submitted successfully",
            report,
        });
    } catch (error) {
        next(error);
    }
};

export const getReports: RequestHandler = async (req, res, next) => {
    try {
        // Admin only - handled by middleware usually, but checking role here is safe too if middleware isn't explicit
        // Assuming requireAdmin middleware is used in route

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const reports = await ReportModel.find()
            .populate("reporterId", "firstName lastName username avatar")
            // .populate("targetId") // Dynamic population is tricky in Mongoose without refPath, or we handle it on frontend or specific endpoints
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .lean();

        const total = await ReportModel.countDocuments();

        res.json({
            reports,
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
