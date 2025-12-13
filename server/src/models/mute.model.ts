import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export interface Mute {
  muterId: ObjectId;
  mutedId: ObjectId;
  expiresAt?: Date;
}

const MuteSchema = new Schema<Mute>(
  {
    muterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    mutedId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    expiresAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

MuteSchema.index({ muterId: 1, mutedId: 1 }, { unique: true });
MuteSchema.index({ mutedId: 1 });
MuteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const MuteModel =
  (mongoose.models.Mute as mongoose.Model<Mute>) || mongoose.model<Mute>("Mute", MuteSchema);
