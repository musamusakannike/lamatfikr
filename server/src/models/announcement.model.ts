import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export enum AnnouncementPriority {
    low = "low",
    medium = "medium",
    high = "high",
}

export interface Announcement {
    title: string;
    content: string;
    createdBy: ObjectId;
    priority: AnnouncementPriority;
    isActive: boolean;
    deletedAt?: Date | null;
}

const AnnouncementSchema = new Schema<Announcement>(
    {
        title: { type: String, required: true },
        content: { type: String, required: true },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        priority: {
            type: String,
            enum: Object.values(AnnouncementPriority),
            default: AnnouncementPriority.medium,
            required: true,
        },
        isActive: { type: Boolean, default: true },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

AnnouncementSchema.index({ isActive: 1, deletedAt: 1, createdAt: -1 });
AnnouncementSchema.index({ createdBy: 1 });

export const AnnouncementModel =
    (mongoose.models.Announcement as mongoose.Model<Announcement>) ||
    mongoose.model<Announcement>("Announcement", AnnouncementSchema);
