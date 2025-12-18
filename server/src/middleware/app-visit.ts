import type { RequestHandler } from "express";

import { AppVisitModel } from "../models/app-visit.model";

function toDateKey(date: Date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const trackAppVisit: RequestHandler = async (req, _res, next) => {
  try {
    // Avoid counting health checks and webhooks
    if (req.path.startsWith("/health") || req.path.startsWith("/webhooks")) {
      next();
      return;
    }

    // Count only GET requests to reduce noise
    if (req.method !== "GET") {
      next();
      return;
    }

    const dateKey = toDateKey(new Date());

    // Simple counter (not unique visitors). Minimal viable implementation.
    await AppVisitModel.updateOne(
      { dateKey },
      { $inc: { count: 1 } },
      { upsert: true }
    );

    next();
  } catch {
    // Never block user traffic because of analytics
    next();
  }
};
