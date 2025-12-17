import { apiClient } from "../api";

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
  metadata?: Record<string, unknown>;
  completedAt?: string;
  failedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessedBy {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
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
  processedBy?: ProcessedBy;
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
    return apiClient.get<{ success: boolean; wallet: Wallet }>("/wallet");
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

    return apiClient.get<{
      success: boolean;
      transactions: Transaction[];
      total: number;
      page: number;
      totalPages: number;
    }>(`/wallet/transactions?${params}`);
  },

  async getWalletStats(): Promise<{
    success: boolean;
    stats: WalletStats;
    recentTransactions: Transaction[];
  }> {
    return apiClient.get<{
      success: boolean;
      stats: WalletStats;
      recentTransactions: Transaction[];
    }>("/wallet/stats");
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
    return apiClient.post<{
      success: boolean;
      message: string;
      withdrawal: Withdrawal;
    }>("/wallet/withdrawals", data);
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

    return apiClient.get<{
      success: boolean;
      withdrawals: Withdrawal[];
      total: number;
      page: number;
      totalPages: number;
    }>(`/wallet/withdrawals?${params}`);
  },

  async cancelWithdrawal(
    withdrawalId: string
  ): Promise<{
    success: boolean;
    message: string;
    withdrawal: Withdrawal;
  }> {
    return apiClient.patch<{
      success: boolean;
      message: string;
      withdrawal: Withdrawal;
    }>(`/wallet/withdrawals/${withdrawalId}/cancel`);
  },
};
