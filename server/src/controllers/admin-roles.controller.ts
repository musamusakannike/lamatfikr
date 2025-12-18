import type { RequestHandler } from "express";

import { UserModel } from "../models/user.model";
import { UserRole } from "../models/common";

export const getAdminRolesSummary: RequestHandler = async (_req, res, next) => {
  try {
    const rows = await UserModel.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    const counts: Record<string, number> = {
      [UserRole.user]: 0,
      [UserRole.moderator]: 0,
      [UserRole.admin]: 0,
      [UserRole.superadmin]: 0,
    };

    for (const r of rows) {
      const key = String(r._id);
      if (Object.prototype.hasOwnProperty.call(counts, key)) {
        counts[key] = Number(r.count ?? 0);
      }
    }

    res.json({
      roles: Object.entries(counts).map(([role, count]) => ({ role, count })),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
