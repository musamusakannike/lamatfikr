import { Router } from "express";

import { requireAuth } from "../middleware/auth";
import {
  getSuggestedUsers,
  getMutualConnections,
  getNearestUsers,
} from "../controllers/user-suggestions.controller";

export const userSuggestionsRouter = Router();

userSuggestionsRouter.get("/suggested", requireAuth, getSuggestedUsers);
userSuggestionsRouter.get("/nearest", requireAuth, getNearestUsers);
userSuggestionsRouter.get("/mutual/:targetUserId", requireAuth, getMutualConnections);
