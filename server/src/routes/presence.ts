import { Router } from "express";

import { getUserPresence } from "../controllers/presence.controller";

export const presenceRouter = Router();

presenceRouter.get("/:userId", getUserPresence);
