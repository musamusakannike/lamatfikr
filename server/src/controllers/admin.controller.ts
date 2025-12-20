import type { RequestHandler } from "express";

import { UserModel } from "../models/user.model";
import { PostModel } from "../models/post.model";
import { CommentModel } from "../models/comment.model";
import { CommunityModel } from "../models/community.model";
import { RoomMessageModel } from "../models/room-message.model";
import { TransactionModel, TransactionStatus } from "../models/transaction.model";
import { WalletModel } from "../models/wallet.model";
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

function addDaysUTC(date: Date, days: number) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function startOfDayUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
}

function daysBackStartUTC(days: number) {
  const todayStart = startOfDayUTC(new Date());
  return addDaysUTC(todayStart, -(days - 1));
}

function fillSeries(days: number, points: Record<string, { count: number; amount?: number; grossAmount?: number }>) {
  const start = daysBackStartUTC(days);
  const series: Array<{ dateKey: string; count: number; amount: number; grossAmount: number }> = [];
  for (let i = 0; i < days; i++) {
    const d = addDaysUTC(start, i);
    const key = toDateKey(d);
    const p = points[key];
    series.push({
      dateKey: key,
      count: p?.count ?? 0,
      amount: p?.amount ?? 0,
      grossAmount: p?.grossAmount ?? 0,
    });
  }
  return series;
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
      transactionsTotal,
      transactionsToday,
      transactionsThisMonth,
      transactionsTotalsAgg,
      walletsTotalsAgg,
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

      TransactionModel.countDocuments({}),
      TransactionModel.countDocuments({ createdAt: { $gte: todayStart } }),
      TransactionModel.countDocuments({ createdAt: { $gte: monthStart } }),
      TransactionModel.aggregate([
        { $match: { status: TransactionStatus.completed } },
        {
          $group: {
            _id: null,
            completedCount: { $sum: 1 },
            netAmount: { $sum: "$amount" },
            grossAmount: { $sum: { $abs: "$amount" } },
          },
        },
      ]),
      WalletModel.aggregate([
        {
          $group: {
            _id: null,
            totalBalance: { $sum: "$balance" },
            totalPendingBalance: { $sum: "$pendingBalance" },
            totalEarned: { $sum: "$totalEarned" },
            totalWithdrawn: { $sum: "$totalWithdrawn" },
          },
        },
      ]),

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

    const txTotals = transactionsTotalsAgg?.[0] ?? {
      completedCount: 0,
      netAmount: 0,
      grossAmount: 0,
    };
    const walletTotals = walletsTotalsAgg?.[0] ?? {
      totalBalance: 0,
      totalPendingBalance: 0,
      totalEarned: 0,
      totalWithdrawn: 0,
    };

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
      transactions: {
        total: transactionsTotal,
        today: transactionsToday,
        month: transactionsThisMonth,
        completedTotal: txTotals.completedCount ?? 0,
        grossAmountTotal: txTotals.grossAmount ?? 0,
        netAmountTotal: txTotals.netAmount ?? 0,
      },
      wallets: {
        totalBalance: walletTotals.totalBalance ?? 0,
        totalPendingBalance: walletTotals.totalPendingBalance ?? 0,
        totalEarned: walletTotals.totalEarned ?? 0,
        totalWithdrawn: walletTotals.totalWithdrawn ?? 0,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminAnalytics: RequestHandler = async (req, res, next) => {
  try {
    const daysParam = typeof req.query.days === "string" ? parseInt(req.query.days, 10) : 30;
    const days = Number.isFinite(daysParam) ? Math.min(180, Math.max(7, daysParam)) : 30;

    const start = daysBackStartUTC(days);
    const end = addDaysUTC(startOfDayUTC(new Date()), 1);

    const [userSeriesRaw, txSeriesRaw] = await Promise.all([
      UserModel.aggregate([
        { $match: { createdAt: { $gte: start, $lt: end } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
      ]),
      TransactionModel.aggregate([
        { $match: { status: TransactionStatus.completed, createdAt: { $gte: start, $lt: end } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
            netAmount: { $sum: "$amount" },
            grossAmount: { $sum: { $abs: "$amount" } },
          },
        },
      ]),
    ]);

    const usersPoints: Record<string, { count: number }> = {};
    for (const row of userSeriesRaw) {
      usersPoints[String(row._id)] = { count: Number(row.count ?? 0) };
    }

    const txPoints: Record<string, { count: number; amount: number; grossAmount: number }> = {};
    for (const row of txSeriesRaw) {
      txPoints[String(row._id)] = {
        count: Number(row.count ?? 0),
        amount: Number(row.netAmount ?? 0),
        grossAmount: Number(row.grossAmount ?? 0),
      };
    }

    const users = fillSeries(days, usersPoints);
    const transactions = fillSeries(days, txPoints);

    res.json({
      range: { days, start: start.toISOString(), end: end.toISOString() },
      users,
      transactions,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// Admin Wallet Tracking Endpoints

/**
 * Get admin's own wallet stats
 */
export const getAdminWallet: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await UserModel.findById(userId);
    if (!user || user.role !== "superadmin") {
      res.status(403).json({ message: "Forbidden - Admin access required" });
      return;
    }

    const wallet = await WalletModel.findOne({ userId }).lean();

    if (!wallet) {
      res.json({
        balance: 0,
        pendingBalance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
        currency: "SAR",
      });
      return;
    }

    res.json({
      balance: wallet.balance,
      pendingBalance: wallet.pendingBalance,
      totalEarned: wallet.totalEarned,
      totalWithdrawn: wallet.totalWithdrawn,
      currency: wallet.currency,
      lastTransactionAt: wallet.lastTransactionAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get admin's transaction history
 */
export const getAdminTransactions: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await UserModel.findById(userId);
    if (!user || user.role !== "superadmin") {
      res.status(403).json({ message: "Forbidden - Admin access required" });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as string | undefined;
    const skip = (page - 1) * limit;

    const query: any = { userId };
    if (type) {
      query.type = type;
    }

    const [transactions, total] = await Promise.all([
      TransactionModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TransactionModel.countDocuments(query),
    ]);

    res.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all user wallets (paginated, searchable)
 */
export const getAllWallets: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await UserModel.findById(userId);
    if (!user || user.role !== "superadmin") {
      res.status(403).json({ message: "Forbidden - Admin access required" });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string | undefined;
    const skip = (page - 1) * limit;

    let userQuery: any = {};
    if (search) {
      userQuery = {
        $or: [
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
        ],
      };
    }

    const users = await UserModel.find(userQuery)
      .select("_id username email firstName lastName avatar")
      .skip(skip)
      .limit(limit)
      .lean();

    const userIds = users.map((u) => u._id);
    const wallets = await WalletModel.find({ userId: { $in: userIds } }).lean();

    const walletMap = new Map(wallets.map((w) => [w.userId.toString(), w]));

    const walletsWithUser = users.map((u) => {
      const wallet = walletMap.get(u._id.toString());
      return {
        user: {
          id: u._id,
          username: u.username,
          email: u.email,
          name: `${u.firstName || ""} ${u.lastName || ""}`.trim(),
          avatar: u.avatar,
        },
        wallet: wallet
          ? {
            balance: wallet.balance,
            pendingBalance: wallet.pendingBalance,
            totalEarned: wallet.totalEarned,
            totalWithdrawn: wallet.totalWithdrawn,
            currency: wallet.currency,
            lastTransactionAt: wallet.lastTransactionAt,
          }
          : {
            balance: 0,
            pendingBalance: 0,
            totalEarned: 0,
            totalWithdrawn: 0,
            currency: "SAR",
            lastTransactionAt: null,
          },
      };
    });

    const total = await UserModel.countDocuments(userQuery);

    res.json({
      wallets: walletsWithUser,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all platform transactions (with filters)
 */
export const getAllTransactions: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await UserModel.findById(userId);
    if (!user || user.role !== "superadmin") {
      res.status(403).json({ message: "Forbidden - Admin access required" });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as string | undefined;
    const status = req.query.status as string | undefined;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (type) {
      query.type = type;
    }
    if (status) {
      query.status = status;
    }

    const [transactions, total] = await Promise.all([
      TransactionModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "username email firstName lastName avatar")
        .lean(),
      TransactionModel.countDocuments(query),
    ]);

    res.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

