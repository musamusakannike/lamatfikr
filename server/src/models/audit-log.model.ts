import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export interface AuditLog {
  actorId: ObjectId;
  action: string;
  targetType?: string;
  targetId?: ObjectId;
}

const AuditLogSchema = new Schema<AuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: { type: String, required: true },
    targetType: { type: String },
    targetId: { type: Schema.Types.ObjectId },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ actorId: 1, createdAt: -1 });
AuditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

export const AuditLogModel =
  (mongoose.models.AuditLog as mongoose.Model<AuditLog>) ||
  mongoose.model<AuditLog>("AuditLog", AuditLogSchema);
