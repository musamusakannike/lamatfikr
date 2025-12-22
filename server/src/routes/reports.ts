import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import { createReport, getReports } from "../controllers/report.controller";

export const reportsRouter = Router();

reportsRouter.post("/", requireAuth, createReport);
reportsRouter.get("/", requireAuth, requireAdmin, getReports);
