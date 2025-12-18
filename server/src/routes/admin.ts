import { Router } from "express";

import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import { getAdminAnalytics, getAdminOverview } from "../controllers/admin.controller";

export const adminRouter = Router();

adminRouter.get("/overview", requireAuth, requireAdmin, getAdminOverview);
adminRouter.get("/analytics", requireAuth, requireAdmin, getAdminAnalytics);
