import { Router } from "express";
import { searchAll } from "../controllers/search.controller";
import { optionalAuth } from "../middleware/auth";

export const searchRouter = Router();

// Public search with optional auth for better privacy filtering
searchRouter.get("/all", optionalAuth, searchAll);
