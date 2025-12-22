import { z } from "zod";
import { ReportStatus } from "../models/common";

export const createReportSchema = z.object({
    targetType: z.string().min(1),
    targetId: z.string().min(1),
    reason: z.string().min(1).max(1000),
});

export const updateReportStatusSchema = z.object({
    status: z.nativeEnum(ReportStatus),
});
