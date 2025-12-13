import { Router } from "express";

import {
  createVerificationRequest,
  getMyVerificationRequests,
  getVerificationRequestStatus,
  cancelVerificationRequest,
  getAllVerificationRequests,
  getVerificationRequestById,
  reviewVerificationRequest,
  getVerificationStats,
} from "../controllers/verification.controller";
import { requireAuth } from "../middleware/auth";

export const verificationRouter = Router();

verificationRouter.post("/request", requireAuth, createVerificationRequest);
verificationRouter.get("/my-requests", requireAuth, getMyVerificationRequests);
verificationRouter.get("/request/:requestId", requireAuth, getVerificationRequestStatus);
verificationRouter.delete("/request/:requestId", requireAuth, cancelVerificationRequest);

verificationRouter.get("/admin/requests", requireAuth, getAllVerificationRequests);
verificationRouter.get("/admin/requests/:requestId", requireAuth, getVerificationRequestById);
verificationRouter.post("/admin/requests/:requestId/review", requireAuth, reviewVerificationRequest);
verificationRouter.get("/admin/stats", requireAuth, getVerificationStats);
