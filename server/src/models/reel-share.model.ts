import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export interface ReelShare {
    userId: ObjectId;
    reelId: ObjectId;
    sharedAt: Date;
}

const ReelShareSchema = new Schema<ReelShare>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        reelId: { type: Schema.Types.ObjectId, ref: "Reel", required: true, index: true },
        sharedAt: { type: Date, default: () => new Date(), required: true },
    },
    { timestamps: true }
);

ReelShareSchema.index({ userId: 1, reelId: 1 });
ReelShareSchema.index({ reelId: 1, sharedAt: -1 });

export const ReelShareModel =
    (mongoose.models.ReelShare as mongoose.Model<ReelShare>) ||
    mongoose.model<ReelShare>("ReelShare", ReelShareSchema);
