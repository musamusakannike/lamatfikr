import type { RequestHandler } from "express";

import { UserModel } from "../models/user.model";
import { UserRole } from "../models/common";

export const requireAdmin: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await UserModel.findById(userId).select("role");
    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (user.role !== UserRole.admin && user.role !== UserRole.superadmin) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};
