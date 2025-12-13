import mongoose, { Schema } from "mongoose";

import { ReportStatus, type ReportStatus as ReportStatusType } from "./common";
import type { ObjectId } from "./common";

export interface Report {
  reporterId: ObjectId;
  targetType: string;
  targetId: ObjectId;
  reason: string;
  status: ReportStatusType;
}

const ReportSchema = new Schema<Report>(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    targetType: { type: String, required: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(ReportStatus),
      default: ReportStatus.open,
      required: true,
    },
  },
  { timestamps: true }
);

ReportSchema.index({ targetType: 1, targetId: 1, status: 1 });

export const ReportModel =
  (mongoose.models.Report as mongoose.Model<Report>) || mongoose.model<Report>("Report", ReportSchema);
