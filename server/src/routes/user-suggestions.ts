import { Router } from "express";

import { requireAuth } from "../middleware/auth";
import {
  getSuggestedUsers,
  getMutualConnections,
} from "../controllers/user-suggestions.controller";

export const userSuggestionsRouter = Router();

userSuggestionsRouter.get("/suggested", requireAuth, getSuggestedUsers);
userSuggestionsRouter.get("/mutual/:targetUserId", requireAuth, getMutualConnections);
