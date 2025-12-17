import { api } from "./client";

export interface Wallet {
  balance: number;
  pendingBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  currency: string;
  lastTransactionAt?: string;
}

export interface Transaction {
  _id: string;
  userId: string;
  type: "room_payment" | "product_purchase" | "withdrawal" | "refund" | "platform_fee";
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  description: string;
  referenceId?: string;
  referenceType?: string;
  metadata?: Record<string, any>;
  completedAt?: string;
  failedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Withdrawal {
  _id: string;
  userId: string;
  amount: number;
  currency: string;
  method: "bank_transfer" | "paypal" | "tap";
  status: "pending" | "processing" | "completed" | "rejected" | "cancelled";
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    swiftCode?: string;
    iban?: string;
  };
  paypalEmail?: string;
  tapAccountId?: string;
  processedBy?: any;
  processedAt?: string;
  rejectionReason?: string;
  transactionId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletStats {
  balance: number;
  pendingBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  currency: string;
  lastTransactionAt?: string;
}

export const walletApi = {
  async getWallet(): Promise<{ success: boolean; wallet: Wallet }> {
    const response = await api.get("/wallet");
    return response.data;
  },

  async getTransactions(
    page: number = 1,
    limit: number = 20,
    type?: string
  ): Promise<{
    success: boolean;
    transactions: Transaction[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (type) params.append("type", type);

    const response = await api.get(`/wallet/transactions?${params}`);
    return response.data;
  },

  async getWalletStats(): Promise<{
    success: boolean;
    stats: WalletStats;
    recentTransactions: Transaction[];
  }> {
    const response = await api.get("/wallet/stats");
    return response.data;
  },

  async requestWithdrawal(data: {
    amount: number;
    method: "bank_transfer" | "paypal" | "tap";
    bankDetails?: {
      accountName: string;
      accountNumber: string;
      bankName: string;
      swiftCode?: string;
      iban?: string;
    };
    paypalEmail?: string;
    tapAccountId?: string;
    notes?: string;
  }): Promise<{
    success: boolean;
    message: string;
    withdrawal: Withdrawal;
  }> {
    const response = await api.post("/wallet/withdrawals", data);
    return response.data;
  },

  async getWithdrawals(
    page: number = 1,
    limit: number = 20,
    status?: string
  ): Promise<{
    success: boolean;
    withdrawals: Withdrawal[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (status) params.append("status", status);

    const response = await api.get(`/wallet/withdrawals?${params}`);
    return response.data;
  },

  async cancelWithdrawal(
    withdrawalId: string
  ): Promise<{
    success: boolean;
    message: string;
    withdrawal: Withdrawal;
  }> {
    const response = await api.patch(`/wallet/withdrawals/${withdrawalId}/cancel`);
    return response.data;
  },
};
