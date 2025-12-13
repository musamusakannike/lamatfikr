import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export interface Session {
  userId: ObjectId;
  token: string;
  deviceInfo?: Record<string, unknown>;
  ipAddress?: string;
  expiresAt: Date;
  revoked: boolean;
}

const SessionSchema = new Schema<Session>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    token: { type: String, required: true },
    deviceInfo: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    expiresAt: { type: Date, required: true },
    revoked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

SessionSchema.index({ token: 1 }, { unique: true });
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const SessionModel =
  (mongoose.models.Session as mongoose.Model<Session>) ||
  mongoose.model<Session>("Session", SessionSchema);
