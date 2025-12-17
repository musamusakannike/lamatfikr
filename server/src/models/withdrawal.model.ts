import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export const WithdrawalStatus = {
  pending: "pending",
  processing: "processing",
  completed: "completed",
  rejected: "rejected",
  cancelled: "cancelled",
} as const;
export type WithdrawalStatus = (typeof WithdrawalStatus)[keyof typeof WithdrawalStatus];

export const WithdrawalMethod = {
  bankTransfer: "bank_transfer",
  paypal: "paypal",
  tap: "tap",
} as const;
export type WithdrawalMethod = (typeof WithdrawalMethod)[keyof typeof WithdrawalMethod];

export interface BankDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  swiftCode?: string;
  iban?: string;
}

export interface Withdrawal {
  userId: ObjectId;
  amount: number;
  currency: string;
  method: WithdrawalMethod;
  status: WithdrawalStatus;
  bankDetails?: BankDetails;
  paypalEmail?: string;
  tapAccountId?: string;
  processedBy?: ObjectId;
  processedAt?: Date;
  rejectionReason?: string;
  transactionId?: ObjectId;
  notes?: string;
}

const BankDetailsSchema = new Schema<BankDetails>(
  {
    accountName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    bankName: { type: String, required: true },
    swiftCode: { type: String },
    iban: { type: String },
  },
  { _id: false }
);

const WithdrawalSchema = new Schema<Withdrawal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "SAR", enum: ["SAR", "OMR", "USD"] },
    method: {
      type: String,
      enum: Object.values(WithdrawalMethod),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(WithdrawalStatus),
      default: WithdrawalStatus.pending,
      required: true,
      index: true,
    },
    bankDetails: BankDetailsSchema,
    paypalEmail: { type: String },
    tapAccountId: { type: String },
    processedBy: { type: Schema.Types.ObjectId, ref: "User" },
    processedAt: { type: Date },
    rejectionReason: { type: String },
    transactionId: { type: Schema.Types.ObjectId, ref: "Transaction" },
    notes: { type: String },
  },
  { timestamps: true }
);

WithdrawalSchema.index({ userId: 1, status: 1 });
WithdrawalSchema.index({ createdAt: -1 });

export const WithdrawalModel =
  (mongoose.models.Withdrawal as mongoose.Model<Withdrawal>) ||
  mongoose.model<Withdrawal>("Withdrawal", WithdrawalSchema);
