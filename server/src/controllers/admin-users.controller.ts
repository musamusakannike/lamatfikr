import type { RequestHandler } from "express";
import { Types } from "mongoose";

import { UserModel } from "../models/user.model";
import { UserRole } from "../models/common";

function parseIntParam(value: unknown, fallback: number) {
  const n = typeof value === "string" ? parseInt(value, 10) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function effectiveVerifiedFilter(now: Date) {
  return {
    $or: [{ verified: true }, { paidVerifiedUntil: { $gt: now } }],
  };
}

export const listAdminUsers: RequestHandler = async (req, res, next) => {
  try {
    const page = clamp(parseIntParam(req.query.page, 1), 1, 100000);
    const limit = clamp(parseIntParam(req.query.limit, 20), 5, 100);
    const skip = (page - 1) * limit;

    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const banned = typeof req.query.banned === "string" ? req.query.banned : undefined;
    const verified = typeof req.query.verified === "string" ? req.query.verified : undefined;
    const role = typeof req.query.role === "string" ? req.query.role : undefined;

    const now = new Date();

    const filter: any = {};

    if (q) {
      filter.$or = [
        { username: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { firstName: { $regex: q, $options: "i" } },
        { lastName: { $regex: q, $options: "i" } },
      ];
    }

    if (banned === "true") filter.isBanned = true;
    if (banned === "false") filter.isBanned = false;

    if (verified === "true") Object.assign(filter, effectiveVerifiedFilter(now));
    if (verified === "false") {
      filter.$and = [
        { verified: { $ne: true } },
        {
          $or: [{ paidVerifiedUntil: { $exists: false } }, { paidVerifiedUntil: { $lte: now } }],
        },
      ];
    }

    if (role && Object.values(UserRole).includes(role as any)) {
      filter.role = role;
    }

    const [total, users] = await Promise.all([
      UserModel.countDocuments(filter),
      UserModel.find(filter)
        .select(
          "firstName lastName username email emailVerified avatar verified paidVerifiedUntil role lastActive isBanned createdAt"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const items = users.map((u: any) => {
      const paidUntilMs = u.paidVerifiedUntil ? new Date(u.paidVerifiedUntil).getTime() : 0;
      const isPaidVerified = paidUntilMs > now.getTime();
      return {
        id: u._id,
        firstName: u.firstName,
        lastName: u.lastName,
        username: u.username,
        email: u.email,
        emailVerified: !!u.emailVerified,
        avatar: u.avatar,
        role: u.role,
        isBanned: !!u.isBanned,
        lastActive: u.lastActive,
        createdAt: u.createdAt,
        verified: !!u.verified,
        paidVerifiedUntil: u.paidVerifiedUntil,
        effectiveVerified: !!u.verified || isPaidVerified,
      };
    });

    res.json({
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      items,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdminUser: RequestHandler = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!Types.ObjectId.isValid(userId)) {
      res.status(400).json({ message: "Invalid userId" });
      return;
    }

    const {
      role,
      isBanned,
      emailVerified,
      grantVerifiedDays,
      revokeVerified,
    }: {
      role?: string;
      isBanned?: boolean;
      emailVerified?: boolean;
      grantVerifiedDays?: number;
      revokeVerified?: boolean;
    } = req.body ?? {};

    const update: any = {};
    const unset: any = {};

    if (typeof isBanned === "boolean") update.isBanned = isBanned;
    if (typeof emailVerified === "boolean") update.emailVerified = emailVerified;

    if (typeof role === "string" && Object.values(UserRole).includes(role as any)) {
      update.role = role;
    }

    if (typeof grantVerifiedDays === "number" && Number.isFinite(grantVerifiedDays)) {
      const days = clamp(Math.floor(grantVerifiedDays), 1, 365);
      const now = new Date();
      const user = await UserModel.findById(userId).select("paidVerifiedUntil verified");
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      const currentUntil = user.paidVerifiedUntil && user.paidVerifiedUntil > now ? user.paidVerifiedUntil : now;
      const newUntil = new Date(currentUntil);
      newUntil.setDate(newUntil.getDate() + days);

      update.paidVerifiedUntil = newUntil;
    }

    if (revokeVerified === true) {
      update.verified = false;
      unset.paidVerifiedUntil = "";
    }

    const updateDoc = Object.keys(unset).length > 0 ? { $set: update, $unset: unset } : update;

    const user = await UserModel.findByIdAndUpdate(userId, updateDoc, { new: true })
      .select(
        "firstName lastName username email emailVerified avatar verified paidVerifiedUntil role lastActive isBanned createdAt"
      )
      .lean();

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const now = Date.now();
    const paidUntilMs = (user as any).paidVerifiedUntil ? new Date((user as any).paidVerifiedUntil).getTime() : 0;

    res.json({
      user: {
        id: (user as any)._id,
        firstName: (user as any).firstName,
        lastName: (user as any).lastName,
        username: (user as any).username,
        email: (user as any).email,
        emailVerified: !!(user as any).emailVerified,
        avatar: (user as any).avatar,
        role: (user as any).role,
        isBanned: !!(user as any).isBanned,
        lastActive: (user as any).lastActive,
        createdAt: (user as any).createdAt,
        verified: !!(user as any).verified,
        paidVerifiedUntil: (user as any).paidVerifiedUntil,
        effectiveVerified: !!(user as any).verified || paidUntilMs > now,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const batchAdminUsers: RequestHandler = async (req, res, next) => {
  try {
    const { ids, action, payload } = req.body as {
      ids: string[];
      action:
        | "ban"
        | "unban"
        | "setRole"
        | "setEmailVerified"
        | "grantVerifiedDays"
        | "revokeVerified";
      payload?: any;
    };

    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ message: "ids is required" });
      return;
    }

    const objectIds = ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
    if (objectIds.length === 0) {
      res.status(400).json({ message: "No valid ids" });
      return;
    }

    const update: any = {};
    const unset: any = {};

    if (action === "ban") update.isBanned = true;
    if (action === "unban") update.isBanned = false;

    if (action === "setRole") {
      const role = payload?.role;
      if (typeof role !== "string" || !Object.values(UserRole).includes(role as any)) {
        res.status(400).json({ message: "Invalid role" });
        return;
      }
      update.role = role;
    }

    if (action === "setEmailVerified") {
      const emailVerified = payload?.emailVerified;
      if (typeof emailVerified !== "boolean") {
        res.status(400).json({ message: "Invalid emailVerified" });
        return;
      }
      update.emailVerified = emailVerified;
    }

    if (action === "grantVerifiedDays") {
      const daysRaw = payload?.days;
      const daysNum = typeof daysRaw === "number" ? daysRaw : parseInt(String(daysRaw), 10);
      if (!Number.isFinite(daysNum)) {
        res.status(400).json({ message: "Invalid days" });
        return;
      }
      const days = clamp(Math.floor(daysNum), 1, 365);
      const now = new Date();
      const newUntil = new Date(now);
      newUntil.setDate(newUntil.getDate() + days);

      // For batch, just set paidVerifiedUntil to now+days (doesn't extend existing).
      // Single-user endpoint extends existing if already verified.
      update.paidVerifiedUntil = newUntil;
    }

    if (action === "revokeVerified") {
      update.verified = false;
      unset.paidVerifiedUntil = "";
    }

    const updateDoc = Object.keys(unset).length > 0 ? { $set: update, $unset: unset } : update;

    const result = await UserModel.updateMany({ _id: { $in: objectIds } }, updateDoc);

    res.json({
      matched: result.matchedCount ?? (result as any).n ?? 0,
      modified: result.modifiedCount ?? (result as any).nModified ?? 0,
    });
  } catch (error) {
    next(error);
  }
};
