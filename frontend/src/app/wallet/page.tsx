"use client";

import { useState, useEffect } from "react";
import { Navbar, Sidebar } from "@/components/layout";
import { useLanguage } from "@/contexts/LanguageContext";
import { walletApi, type Wallet, type Transaction, type Withdrawal } from "@/lib/api/wallet";
import { cn } from "@/lib/utils";
import { 
  Wallet as WalletIcon, 
  TrendingUp, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
} from "lucide-react";

export default function WalletPage() {
  const { t, isRTL } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "withdrawals">("overview");
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const [walletRes, transactionsRes, withdrawalsRes] = await Promise.all([
        walletApi.getWallet(),
        walletApi.getTransactions(1, 10),
        walletApi.getWithdrawals(1, 10),
      ]);

      if (walletRes.success) setWallet(walletRes.wallet);
      if (transactionsRes.success) setTransactions(transactionsRes.transactions);
      if (withdrawalsRes.success) setWithdrawals(withdrawalsRes.withdrawals);
    } catch (error) {
      console.error("Failed to load wallet data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTransactionTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      room_payment: t("wallet", "roomPayment"),
      product_purchase: t("wallet", "productPurchase"),
      withdrawal: t("wallet", "withdrawal"),
      refund: t("wallet", "refund"),
      platform_fee: t("wallet", "platformFee"),
    };
    return typeMap[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
      pending: { icon: Clock, color: "text-yellow-600 bg-yellow-100", label: t("wallet", "pending") },
      processing: { icon: AlertCircle, color: "text-blue-600 bg-blue-100", label: t("wallet", "processing") },
      completed: { icon: CheckCircle, color: "text-green-600 bg-green-100", label: t("wallet", "completed") },
      rejected: { icon: XCircle, color: "text-red-600 bg-red-100", label: t("wallet", "rejected") },
      cancelled: { icon: XCircle, color: "text-gray-600 bg-gray-100", label: t("wallet", "cancelled") },
      failed: { icon: XCircle, color: "text-red-600 bg-red-100", label: "Failed" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          isSidebarOpen={sidebarOpen}
        />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className={cn("pt-16", isRTL ? "lg:pr-64" : "lg:pl-64")}>
          <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-(--text-muted)">{t("common", "loading")}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        isSidebarOpen={sidebarOpen}
      />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className={cn("pt-16", isRTL ? "lg:pr-64" : "lg:pl-64")}>
        <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-(--text) flex items-center gap-3">
          <WalletIcon size={32} className="text-primary-600" />
          {t("wallet", "title")}
        </h1>
        <p className="text-(--text-muted) mt-2">{t("wallet", "platformFeeSplit")}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-(--bg-card) rounded-xl p-6 border border-(--border)">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <DollarSign className="text-green-600 dark:text-green-400" size={24} />
            </div>
            <TrendingUp className="text-green-600" size={20} />
          </div>
          <h3 className="text-(--text-muted) text-sm font-medium">{t("wallet", "availableBalance")}</h3>
          <p className="text-2xl font-bold text-(--text) mt-1">
            {formatCurrency(wallet?.balance || 0, wallet?.currency)}
          </p>
        </div>

        <div className="bg-(--bg-card) rounded-xl p-6 border border-(--border)">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Clock className="text-yellow-600 dark:text-yellow-400" size={24} />
            </div>
          </div>
          <h3 className="text-(--text-muted) text-sm font-medium">{t("wallet", "pendingBalance")}</h3>
          <p className="text-2xl font-bold text-(--text) mt-1">
            {formatCurrency(wallet?.pendingBalance || 0, wallet?.currency)}
          </p>
        </div>

        <div className="bg-(--bg-card) rounded-xl p-6 border border-(--border)">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ArrowUpRight className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
          </div>
          <h3 className="text-(--text-muted) text-sm font-medium">{t("wallet", "totalEarned")}</h3>
          <p className="text-2xl font-bold text-(--text) mt-1">
            {formatCurrency(wallet?.totalEarned || 0, wallet?.currency)}
          </p>
        </div>

        <div className="bg-(--bg-card) rounded-xl p-6 border border-(--border)">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <ArrowDownRight className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
          </div>
          <h3 className="text-(--text-muted) text-sm font-medium">{t("wallet", "totalWithdrawn")}</h3>
          <p className="text-2xl font-bold text-(--text) mt-1">
            {formatCurrency(wallet?.totalWithdrawn || 0, wallet?.currency)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-(--bg-card) rounded-xl border border-(--border) overflow-hidden">
        <div className="border-b border-(--border)">
          <div className="flex">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === "overview"
                  ? "text-primary-600 border-b-2 border-primary-600"
                  : "text-(--text-muted) hover:text-(--text)"
              }`}
            >
              {t("wallet", "overview")}
            </button>
            <button
              onClick={() => setActiveTab("transactions")}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === "transactions"
                  ? "text-primary-600 border-b-2 border-primary-600"
                  : "text-(--text-muted) hover:text-(--text)"
              }`}
            >
              {t("wallet", "transactions")}
            </button>
            <button
              onClick={() => setActiveTab("withdrawals")}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === "withdrawals"
                  ? "text-primary-600 border-b-2 border-primary-600"
                  : "text-(--text-muted) hover:text-(--text)"
              }`}
            >
              {t("wallet", "withdrawals")}
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === "overview" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-(--text)">{t("wallet", "recentTransactions")}</h2>
                <button
                  onClick={() => setShowWithdrawalModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Plus size={20} />
                  {t("wallet", "requestWithdrawal")}
                </button>
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <WalletIcon size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-(--text-muted)">{t("wallet", "noTransactions")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div
                      key={transaction._id}
                      className="flex items-center justify-between p-4 bg-(--bg) rounded-lg border border-(--border)"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${transaction.amount >= 0 ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                          {transaction.amount >= 0 ? (
                            <ArrowUpRight className="text-green-600 dark:text-green-400" size={20} />
                          ) : (
                            <ArrowDownRight className="text-red-600 dark:text-red-400" size={20} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-(--text)">{transaction.description}</p>
                          <p className="text-sm text-(--text-muted)">{formatDate(transaction.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${transaction.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {transaction.amount >= 0 ? "+" : ""}{formatCurrency(transaction.amount, transaction.currency)}
                        </p>
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "transactions" && (
            <div>
              <h2 className="text-xl font-semibold text-(--text) mb-6">{t("wallet", "allTransactions")}</h2>
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-(--text-muted)">{t("wallet", "noTransactions")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction._id}
                      className="flex items-center justify-between p-4 bg-(--bg) rounded-lg border border-(--border)"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${transaction.amount >= 0 ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                          {transaction.amount >= 0 ? (
                            <ArrowUpRight className="text-green-600 dark:text-green-400" size={20} />
                          ) : (
                            <ArrowDownRight className="text-red-600 dark:text-red-400" size={20} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-(--text)">{transaction.description}</p>
                          <p className="text-sm text-(--text-muted)">
                            {getTransactionTypeLabel(transaction.type)} • {formatDate(transaction.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${transaction.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {transaction.amount >= 0 ? "+" : ""}{formatCurrency(transaction.amount, transaction.currency)}
                        </p>
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "withdrawals" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-(--text)">{t("wallet", "withdrawalRequests")}</h2>
                <button
                  onClick={() => setShowWithdrawalModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Plus size={20} />
                  {t("wallet", "requestWithdrawal")}
                </button>
              </div>

              {withdrawals.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-(--text-muted)">{t("wallet", "noWithdrawals")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {withdrawals.map((withdrawal) => (
                    <div
                      key={withdrawal._id}
                      className="p-4 bg-(--bg) rounded-lg border border-(--border)"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-(--text)">
                            {formatCurrency(withdrawal.amount, withdrawal.currency)}
                          </p>
                          <p className="text-sm text-(--text-muted)">{formatDate(withdrawal.createdAt)}</p>
                        </div>
                        {getStatusBadge(withdrawal.status)}
                      </div>
                      <div className="text-sm text-(--text-muted)">
                        <p>{t("wallet", "withdrawalMethod")}: {withdrawal.method.replace("_", " ")}</p>
                        {withdrawal.rejectionReason && (
                          <p className="text-red-600 mt-1">{t("wallet", "rejectionReason")}: {withdrawal.rejectionReason}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
      </main>
    </div>
  );
}
