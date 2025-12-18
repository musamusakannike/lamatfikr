import type { RequestHandler } from "express";

import { UserModel } from "../models/user.model";
import { PostModel } from "../models/post.model";
import { CommentModel } from "../models/comment.model";
import { CommunityModel } from "../models/community.model";
import { RoomMessageModel } from "../models/room-message.model";
import { AppVisitModel } from "../models/app-visit.model";
import { getTotalOnlineUsers } from "../services/presence";

function startOfTodayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
}

function startOfMonthUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
}

function toDateKey(date: Date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const getAdminOverview: RequestHandler = async (_req, res, next) => {
  try {
    const todayStart = startOfTodayUTC();
    const monthStart = startOfMonthUTC();

    const todayKey = toDateKey(new Date());

    const [
      totalUsers,
      onlineUsers,
      bannedUsers,
      totalPosts,
      postsToday,
      postsThisMonth,
      totalComments,
      commentsToday,
      commentsThisMonth,
      totalCommunities,
      totalRoomChats,
      todayVisitDoc,
      monthVisitDocs,
    ] = await Promise.all([
      UserModel.countDocuments({}),
      Promise.resolve(getTotalOnlineUsers()),
      UserModel.countDocuments({ isBanned: true }),

      PostModel.countDocuments({ deletedAt: null }),
      PostModel.countDocuments({ deletedAt: null, createdAt: { $gte: todayStart } }),
      PostModel.countDocuments({ deletedAt: null, createdAt: { $gte: monthStart } }),

      CommentModel.countDocuments({ deletedAt: null }),
      CommentModel.countDocuments({ deletedAt: null, createdAt: { $gte: todayStart } }),
      CommentModel.countDocuments({ deletedAt: null, createdAt: { $gte: monthStart } }),

      CommunityModel.countDocuments({ deletedAt: null }),
      RoomMessageModel.countDocuments({ deletedAt: null }),

      AppVisitModel.findOne({ dateKey: todayKey }).select("count"),
      AppVisitModel.find({
        dateKey: {
          $gte: toDateKey(monthStart),
          $lte: todayKey,
        },
      }).select("count"),
    ]);

    const visitsToday = todayVisitDoc?.count ?? 0;
    const visitsThisMonth = monthVisitDocs.reduce((sum, d) => sum + (d.count ?? 0), 0);

    res.json({
      users: {
        total: totalUsers,
        online: onlineUsers,
        banned: bannedUsers,
      },
      visits: {
        today: visitsToday,
        month: visitsThisMonth,
      },
      posts: {
        total: totalPosts,
        today: postsToday,
        month: postsThisMonth,
      },
      comments: {
        total: totalComments,
        today: commentsToday,
        month: commentsThisMonth,
      },
      communities: {
        total: totalCommunities,
      },
      roomChats: {
        total: totalRoomChats,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
