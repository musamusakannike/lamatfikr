export interface WalletStats {
  balance: number;
  pendingBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  currency: string;
  lastTransactionAt?: string;
}

export interface WalletStatsResponse {
  success: boolean;
  stats: WalletStats;
  recentTransactions: WalletTransaction[];
}

export interface WalletResponse {
  success: boolean;
  wallet: WalletStats;
}

export interface WalletTransaction {
  _id: string;
  userId: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  createdAt?: string;
  completedAt?: string;
}

export interface WalletTransactionsResponse {
  success: boolean;
  transactions: WalletTransaction[];
  total: number;
  page: number;
  totalPages: number;
}

export interface WalletWithdrawal {
  _id: string;
  userId?: any;
  amount: number;
  currency: string;
  method: string;
  status: string;
  processedBy?: any;
  processedAt?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt?: string;
}

export interface WalletWithdrawalsResponse {
  success: boolean;
  withdrawals: WalletWithdrawal[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ProcessWithdrawalResponse {
  success: boolean;
  message: string;
  withdrawal: WalletWithdrawal;
}
