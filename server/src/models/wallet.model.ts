import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export interface Wallet {
  userId: ObjectId;
  balance: number;
  currency: string;
  pendingBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  lastTransactionAt?: Date;
}

const WalletSchema = new Schema<Wallet>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    balance: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "USD" },
    pendingBalance: { type: Number, default: 0, min: 0 },
    totalEarned: { type: Number, default: 0, min: 0 },
    totalWithdrawn: { type: Number, default: 0, min: 0 },
    lastTransactionAt: { type: Date },
  },
  { timestamps: true }
);

WalletSchema.index({ userId: 1 });

export const WalletModel =
  (mongoose.models.Wallet as mongoose.Model<Wallet>) ||
  mongoose.model<Wallet>("Wallet", WalletSchema);
