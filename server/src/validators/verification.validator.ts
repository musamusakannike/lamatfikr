import { z } from "zod";
import { DocumentType, VerificationStatus } from "../models/common";

export const createVerificationRequestSchema = z.object({
  documentType: z.enum([DocumentType.passport, DocumentType.nationalId, DocumentType.driversLicense]),
  documentFrontUrl: z.string().url("Invalid document front URL"),
  documentBackUrl: z.string().url("Invalid document back URL").optional(),
  selfieUrl: z.string().url("Invalid selfie URL").optional(),
});

export const reviewVerificationRequestSchema = z.object({
  status: z.enum([VerificationStatus.approved, VerificationStatus.rejected]),
  adminNotes: z.string().max(500).optional(),
});

export type CreateVerificationRequestInput = z.infer<typeof createVerificationRequestSchema>;
export type ReviewVerificationRequestInput = z.infer<typeof reviewVerificationRequestSchema>;
