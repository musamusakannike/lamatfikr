import type { Request, Response } from "express";
import { Types } from "mongoose";
import { WalletService } from "../services/wallet.service";
import { WithdrawalModel, WithdrawalStatus } from "../models/withdrawal.model";
import { TransactionType, TransactionStatus } from "../models/transaction.model";
import { UserModel } from "../models/user.model";
import { UserRole } from "../models/common";

function getUserId(req: Request): Types.ObjectId {
  const userId = (req as Request & { userId?: string }).userId;
  if (!userId) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return new Types.ObjectId(userId);
}

export const walletController = {
  async getWallet(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      const wallet = await WalletService.getOrCreateWallet(userId);

      res.json({
        success: true,
        wallet: {
          balance: wallet.balance,
          pendingBalance: wallet.pendingBalance,
          totalEarned: wallet.totalEarned,
          totalWithdrawn: wallet.totalWithdrawn,
          currency: wallet.currency,
          lastTransactionAt: wallet.lastTransactionAt,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch wallet",
      });
    }
  },

  async getTransactions(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const type = req.query.type as TransactionType | undefined;

      const result = await WalletService.getTransactions(userId, page, limit, type);

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch transactions",
      });
    }
  },

  async requestWithdrawal(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      const { amount, method, bankDetails, paypalEmail, tapAccountId, notes } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid withdrawal amount",
        });
      }

      const wallet = await WalletService.getOrCreateWallet(userId);

      if (wallet.balance < amount) {
        return res.status(400).json({
          success: false,
          message: "Insufficient balance",
        });
      }

      const withdrawal = await WithdrawalModel.create({
        userId,
        amount,
        currency: wallet.currency,
        method,
        status: WithdrawalStatus.pending,
        bankDetails,
        paypalEmail,
        tapAccountId,
        notes,
      });

      await WalletService.deductBalance(userId, amount);

      await WalletService.createTransaction(
        userId,
        TransactionType.withdrawal,
        -amount,
        `Withdrawal request #${withdrawal._id}`,
        TransactionStatus.pending,
        withdrawal._id,
        "Withdrawal"
      );

      res.json({
        success: true,
        message: "Withdrawal request submitted successfully",
        withdrawal,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to request withdrawal",
      });
    }
  },

  async getWithdrawals(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as WithdrawalStatus | undefined;

      const skip = (page - 1) * limit;
      const query: any = { userId };

      if (status) {
        query.status = status;
      }

      const [withdrawals, total] = await Promise.all([
        WithdrawalModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("processedBy", "firstName lastName username")
          .lean(),
        WithdrawalModel.countDocuments(query),
      ]);

      res.json({
        success: true,
        withdrawals,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch withdrawals",
      });
    }
  },

  async cancelWithdrawal(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      const { withdrawalId } = req.params;

      const withdrawal = await WithdrawalModel.findOne({
        _id: withdrawalId,
        userId,
      });

      if (!withdrawal) {
        return res.status(404).json({
          success: false,
          message: "Withdrawal not found",
        });
      }

      if (withdrawal.status !== WithdrawalStatus.pending) {
        return res.status(400).json({
          success: false,
          message: "Only pending withdrawals can be cancelled",
        });
      }

      withdrawal.status = WithdrawalStatus.cancelled;
      await withdrawal.save();

      const wallet = await WalletService.getOrCreateWallet(userId);
      wallet.balance += withdrawal.amount;
      wallet.totalWithdrawn -= withdrawal.amount;
      await wallet.save();

      res.json({
        success: true,
        message: "Withdrawal cancelled successfully",
        withdrawal,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to cancel withdrawal",
      });
    }
  },

  async getAllWithdrawals(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      const user = await UserModel.findById(userId);
      
      if (!user || (user.role !== UserRole.superadmin && user.role !== UserRole.admin)) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as WithdrawalStatus | undefined;

      const skip = (page - 1) * limit;
      const query: any = {};

      if (status) {
        query.status = status;
      }

      const [withdrawals, total] = await Promise.all([
        WithdrawalModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("userId", "firstName lastName username email")
          .populate("processedBy", "firstName lastName username")
          .lean(),
        WithdrawalModel.countDocuments(query),
      ]);

      res.json({
        success: true,
        withdrawals,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch withdrawals",
      });
    }
  },

  async processWithdrawal(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      const user = await UserModel.findById(userId);
      
      if (!user || (user.role !== UserRole.superadmin && user.role !== UserRole.admin)) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { withdrawalId } = req.params;
      const { status, rejectionReason } = req.body;

      const withdrawal = await WithdrawalModel.findById(withdrawalId);

      if (!withdrawal) {
        return res.status(404).json({
          success: false,
          message: "Withdrawal not found",
        });
      }

      if (withdrawal.status !== WithdrawalStatus.pending) {
        return res.status(400).json({
          success: false,
          message: "Only pending withdrawals can be processed",
        });
      }

      withdrawal.status = status;
      withdrawal.processedBy = userId;
      withdrawal.processedAt = new Date();

      if (status === WithdrawalStatus.rejected) {
        withdrawal.rejectionReason = rejectionReason;
        const wallet = await WalletService.getOrCreateWallet(withdrawal.userId);
        wallet.balance += withdrawal.amount;
        wallet.totalWithdrawn -= withdrawal.amount;
        await wallet.save();
      }

      await withdrawal.save();

      res.json({
        success: true,
        message: `Withdrawal ${status} successfully`,
        withdrawal,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to process withdrawal",
      });
    }
  },

  async getWalletStats(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      const wallet = await WalletService.getOrCreateWallet(userId);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentTransactions = await WalletService.getTransactions(userId, 1, 5);

      res.json({
        success: true,
        stats: {
          balance: wallet.balance,
          pendingBalance: wallet.pendingBalance,
          totalEarned: wallet.totalEarned,
          totalWithdrawn: wallet.totalWithdrawn,
          currency: wallet.currency,
          lastTransactionAt: wallet.lastTransactionAt,
        },
        recentTransactions: recentTransactions.transactions,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch wallet stats",
      });
    }
  },
};
