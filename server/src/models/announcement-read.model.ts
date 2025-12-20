import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export interface AnnouncementRead {
    userId: ObjectId;
    announcementId: ObjectId;
    readAt: Date;
}

const AnnouncementReadSchema = new Schema<AnnouncementRead>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        announcementId: { type: Schema.Types.ObjectId, ref: "Announcement", required: true },
        readAt: { type: Date, default: Date.now, required: true },
    },
    { timestamps: true }
);

AnnouncementReadSchema.index({ userId: 1, announcementId: 1 }, { unique: true });
AnnouncementReadSchema.index({ announcementId: 1 });

export const AnnouncementReadModel =
    (mongoose.models.AnnouncementRead as mongoose.Model<AnnouncementRead>) ||
    mongoose.model<AnnouncementRead>("AnnouncementRead", AnnouncementReadSchema);
