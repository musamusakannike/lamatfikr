import { Router } from "express";

import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import { getAdminAnalytics, getAdminOverview } from "../controllers/admin.controller";
import { batchAdminUsers, listAdminUsers, updateAdminUser } from "../controllers/admin-users.controller";
import { getAdminRolesSummary } from "../controllers/admin-roles.controller";

export const adminRouter = Router();

adminRouter.get("/overview", requireAuth, requireAdmin, getAdminOverview);
adminRouter.get("/analytics", requireAuth, requireAdmin, getAdminAnalytics);

adminRouter.get("/users", requireAuth, requireAdmin, listAdminUsers);
adminRouter.patch("/users/:userId", requireAuth, requireAdmin, updateAdminUser);
adminRouter.post("/users/batch", requireAuth, requireAdmin, batchAdminUsers);

adminRouter.get("/roles/summary", requireAuth, requireAdmin, getAdminRolesSummary);
