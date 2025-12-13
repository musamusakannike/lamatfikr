import mongoose, { Schema } from "mongoose";

import { ObjectId, VerificationStatus, DocumentType } from "./common";

export interface VerificationRequest {
  userId: ObjectId;
  documentType: typeof DocumentType[keyof typeof DocumentType];
  documentFrontUrl: string;
  documentBackUrl?: string;
  selfieUrl?: string;
  status: typeof VerificationStatus[keyof typeof VerificationStatus];
  adminNotes?: string;
  reviewedBy?: ObjectId;
  reviewedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const VerificationRequestSchema = new Schema<VerificationRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    documentType: {
      type: String,
      enum: Object.values(DocumentType),
      required: true,
    },
    documentFrontUrl: { type: String, required: true },
    documentBackUrl: { type: String },
    selfieUrl: { type: String },
    status: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.pending,
      required: true,
    },
    adminNotes: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

VerificationRequestSchema.index({ userId: 1 });
VerificationRequestSchema.index({ status: 1 });
VerificationRequestSchema.index({ createdAt: -1 });

export const VerificationRequestModel =
  (mongoose.models.VerificationRequest as mongoose.Model<VerificationRequest>) ||
  mongoose.model<VerificationRequest>("VerificationRequest", VerificationRequestSchema);

export type VerificationRequestId = ObjectId;
