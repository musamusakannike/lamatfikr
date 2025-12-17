import mongoose from "mongoose";
import { WalletModel } from "../models/wallet.model";
import { TransactionModel, TransactionType, TransactionStatus } from "../models/transaction.model";
import { UserModel } from "../models/user.model";
import { UserRole } from "../models/common";
import type { ObjectId } from "../models/common";

const PLATFORM_FEE_PERCENTAGE = 0.15;
const SELLER_PERCENTAGE = 0.85;

export class WalletService {
  static async getOrCreateWallet(userId: ObjectId) {
    let wallet = await WalletModel.findOne({ userId });
    
    if (!wallet) {
      wallet = await WalletModel.create({
        userId,
        balance: 0,
        currency: "SAR",
        pendingBalance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
      });
    }
    
    return wallet;
  }

  static async getSuperAdminId(): Promise<ObjectId | null> {
    const superAdmin = await UserModel.findOne({ role: UserRole.superadmin });
    return superAdmin?._id || null;
  }

  static async splitPayment(
    amount: number,
    sellerId: ObjectId,
    type: TransactionType,
    description: string,
    referenceId?: ObjectId,
    referenceType?: string,
    metadata?: Record<string, unknown>
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const platformFee = Math.round(amount * PLATFORM_FEE_PERCENTAGE * 100) / 100;
      const sellerAmount = Math.round(amount * SELLER_PERCENTAGE * 100) / 100;

      const superAdminId = await this.getSuperAdminId();
      if (!superAdminId) {
        throw new Error("Super admin not found");
      }

      const [sellerWallet, platformWallet] = await Promise.all([
        this.getOrCreateWallet(sellerId),
        this.getOrCreateWallet(superAdminId),
      ]);

      sellerWallet.balance += sellerAmount;
      sellerWallet.totalEarned += sellerAmount;
      sellerWallet.lastTransactionAt = new Date();
      await sellerWallet.save({ session });

      platformWallet.balance += platformFee;
      platformWallet.totalEarned += platformFee;
      platformWallet.lastTransactionAt = new Date();
      await platformWallet.save({ session });

      const [sellerTransaction, platformTransaction] = await TransactionModel.create(
        [
          {
            userId: sellerId,
            type,
            amount: sellerAmount,
            currency: "SAR",
            status: TransactionStatus.completed,
            description: `${description} (85% seller share)`,
            referenceId,
            referenceType,
            metadata: { ...metadata, split: "seller", originalAmount: amount },
            completedAt: new Date(),
          },
          {
            userId: superAdminId,
            type: TransactionType.platformFee,
            amount: platformFee,
            currency: "SAR",
            status: TransactionStatus.completed,
            description: `${description} (15% platform fee)`,
            referenceId,
            referenceType,
            metadata: { ...metadata, split: "platform", originalAmount: amount },
            completedAt: new Date(),
          },
        ],
        { session }
      );

      await session.commitTransaction();

      return {
        sellerAmount,
        platformFee,
        sellerTransaction,
        platformTransaction,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async addPendingBalance(userId: ObjectId, amount: number) {
    const wallet = await this.getOrCreateWallet(userId);
    wallet.pendingBalance += amount;
    await wallet.save();
    return wallet;
  }

  static async releasePendingBalance(userId: ObjectId, amount: number) {
    const wallet = await this.getOrCreateWallet(userId);
    
    if (wallet.pendingBalance < amount) {
      throw new Error("Insufficient pending balance");
    }
    
    wallet.pendingBalance -= amount;
    wallet.balance += amount;
    wallet.totalEarned += amount;
    wallet.lastTransactionAt = new Date();
    await wallet.save();
    
    return wallet;
  }

  static async deductBalance(userId: ObjectId, amount: number) {
    const wallet = await this.getOrCreateWallet(userId);
    
    if (wallet.balance < amount) {
      throw new Error("Insufficient balance");
    }
    
    wallet.balance -= amount;
    wallet.totalWithdrawn += amount;
    wallet.lastTransactionAt = new Date();
    await wallet.save();
    
    return wallet;
  }

  static async createTransaction(
    userId: ObjectId,
    type: TransactionType,
    amount: number,
    description: string,
    status: TransactionStatus = TransactionStatus.completed,
    referenceId?: ObjectId,
    referenceType?: string,
    metadata?: Record<string, unknown>
  ) {
    return await TransactionModel.create({
      userId,
      type,
      amount,
      currency: "SAR",
      status,
      description,
      referenceId,
      referenceType,
      metadata,
      completedAt: status === TransactionStatus.completed ? new Date() : undefined,
    });
  }

  static async getWalletBalance(userId: ObjectId) {
    const wallet = await this.getOrCreateWallet(userId);
    return {
      balance: wallet.balance,
      pendingBalance: wallet.pendingBalance,
      totalEarned: wallet.totalEarned,
      totalWithdrawn: wallet.totalWithdrawn,
      currency: wallet.currency,
    };
  }

  static async getTransactions(
    userId: ObjectId,
    page: number = 1,
    limit: number = 20,
    type?: TransactionType
  ) {
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

    return {
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
