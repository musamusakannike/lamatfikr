import type { RequestHandler } from "express";

import { FollowModel } from "../models/follow.model";
import { FollowStatus } from "../models/common";

function parseIntParam(value: unknown, fallback: number) {
  const n = typeof value === "string" ? Number.parseInt(value, 10) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

export const getAdminTopFollowed: RequestHandler = async (req, res, next) => {
  try {
    const page = Math.max(1, parseIntParam(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, parseIntParam(req.query.limit, 20)));
    const skip = (page - 1) * limit;

    const baseMatch = { status: FollowStatus.accepted };

    const [rows, totalRows] = await Promise.all([
      FollowModel.aggregate([
        { $match: baseMatch },
        { $group: { _id: "$followingId", followersCount: { $sum: 1 } } },
        { $sort: { followersCount: -1, _id: 1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            userId: "$_id",
            followersCount: 1,
            user: {
              _id: "$user._id",
              firstName: "$user.firstName",
              lastName: "$user.lastName",
              username: "$user.username",
              avatar: "$user.avatar",
              verified: "$user.verified",
            },
          },
        },
      ]),
      FollowModel.aggregate([
        { $match: baseMatch },
        { $group: { _id: "$followingId" } },
        { $count: "total" },
      ]),
    ]);

    const total = Number(totalRows?.[0]?.total ?? 0);

    res.json({
      items: rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};
