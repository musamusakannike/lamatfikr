export interface AdminOverviewResponse {
  users: {
    total: number;
    online: number;
    banned: number;
  };
  visits: {
    today: number;
    month: number;
  };
  posts: {
    total: number;
    today: number;
    month: number;
  };
  comments: {
    total: number;
    today: number;
    month: number;
  };
  communities: {
    total: number;
  };
  roomChats: {
    total: number;
  };
  transactions: {
    total: number;
    today: number;
    month: number;
    completedTotal: number;
    grossAmountTotal: number;
    netAmountTotal: number;
  };
  wallets: {
    totalBalance: number;
    totalPendingBalance: number;
    totalEarned: number;
    totalWithdrawn: number;
  };
  generatedAt: string;
}

export interface AdminAnalyticsPoint {
  dateKey: string;
  count: number;
  amount: number;
  grossAmount: number;
}

export interface AdminAnalyticsResponse {
  range: {
    days: number;
    start: string;
    end: string;
  };
  users: AdminAnalyticsPoint[];
  transactions: AdminAnalyticsPoint[];
  generatedAt: string;
}

export interface AdminNavStatsResponse {
  pendingReports: number;
  pendingVerifications: number;
}
