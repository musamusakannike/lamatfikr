import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export interface Wallet {
  userId?: ObjectId; // Optional for company wallet
  balance: number;
  currency: string;
  pendingBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  lastTransactionAt?: Date;
  isCompanyWallet?: boolean; // Flag to identify company wallet
}

const WalletSchema = new Schema<Wallet>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: false, sparse: true },
    balance: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "SAR", enum: ["SAR", "OMR", "USD"] },
    pendingBalance: { type: Number, default: 0, min: 0 },
    totalEarned: { type: Number, default: 0, min: 0 },
    totalWithdrawn: { type: Number, default: 0, min: 0 },
    lastTransactionAt: { type: Date },
    isCompanyWallet: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const WalletModel =
  (mongoose.models.Wallet as mongoose.Model<Wallet>) ||
  mongoose.model<Wallet>("Wallet", WalletSchema);
