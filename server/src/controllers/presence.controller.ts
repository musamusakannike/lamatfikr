import type { RequestHandler } from "express";

import { isOnline } from "../services/presence";

export const getUserPresence: RequestHandler = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      res.status(400).json({ message: "userId is required" });
      return;
    }

    res.json({ userId, isOnline: isOnline(userId) });
  } catch (error) {
    next(error);
  }
};
