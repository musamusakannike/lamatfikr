import { RequestHandler } from "express";
import { SettingModel } from "../models/setting.model";
import { UserModel } from "../models/user.model";
import { UserRole } from "../models/common";

export const getAdminSettings: RequestHandler = async (req, res, next) => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const admin = await UserModel.findById(userId);
        if (!admin || (admin.role !== UserRole.admin && admin.role !== UserRole.moderator)) {
            res.status(403).json({ message: "Access denied" });
            return;
        }

        const settings = await SettingModel.find({});

        // Transform array to object for easier consumption { key: value }
        const settingsMap: Record<string, any> = {};
        settings.forEach((s) => {
            settingsMap[s.key] = s.value;
        });

        res.json({ settings: settingsMap });
    } catch (error) {
        next(error);
    }
};

export const updateAdminSettings: RequestHandler = async (req, res, next) => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const admin = await UserModel.findById(userId);
        if (!admin || admin.role !== UserRole.admin) { // Only admins can change settings, maybe moderators too? sticking to admin for now
            res.status(403).json({ message: "Access denied. Only admins can update settings." });
            return;
        }

        const { settings } = req.body; // Expecting { key: value, key2: value2 }

        if (!settings || typeof settings !== 'object') {
            res.status(400).json({ message: "Invalid settings format" });
            return;
        }

        const updates = [];
        for (const [key, value] of Object.entries(settings)) {
            updates.push(
                SettingModel.findOneAndUpdate(
                    { key },
                    { key, value },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                )
            );
        }

        await Promise.all(updates);

        res.json({ message: "Settings updated successfully" });
    } catch (error) {
        next(error);
    }
};
