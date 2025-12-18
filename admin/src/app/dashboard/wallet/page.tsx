"use client";

import { useEffect, useState } from "react";

import { apiClient, getErrorMessage } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type { WalletStatsResponse, WalletTransaction } from "@/types/admin-wallet";

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-(--bg-card) border border-(--border) rounded-xl p-4 shadow-sm">
      <div className="text-sm text-(--text-muted)">{title}</div>
      <div className="text-2xl font-bold text-(--text) mt-2">{value}</div>
    </div>
  );
}

export default function WalletPage() {
  const { t, isRTL } = useLanguage();
  const [data, setData] = useState<WalletStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get<WalletStatsResponse>("/wallet/stats");
        if (!mounted) return;
        setData(res);
      } catch (e) {
        if (!mounted) return;
        setError(getErrorMessage(e));
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const fmt = (amount: number | undefined, currency: string | undefined) => {
    const a = typeof amount === "number" ? amount : 0;
    const c = currency || "";
    return `${a.toFixed(2)} ${c}`.trim();
  };

  const renderType = (type: string) => {
    if (type === "room_payment") return t("adminWallet", "typeRoomPayment");
    if (type === "product_purchase") return t("adminWallet", "typeProductPurchase");
    if (type === "withdrawal") return t("adminWallet", "typeWithdrawal");
    if (type === "refund") return t("adminWallet", "typeRefund");
    if (type === "platform_fee") return t("adminWallet", "typePlatformFee");
    return type;
  };

  const stats = data?.stats;
  const currency = stats?.currency;

  return (
    <div className={cn("space-y-4", isRTL ? "text-right" : "text-left")}>
      <div>
        <h1 className="text-2xl font-bold text-(--text)">{t("adminWallet", "overviewTitle")}</h1>
        <div className="text-sm text-(--text-muted) mt-1">{t("adminWallet", "overviewSubtitle")}</div>
      </div>

      {loading ? <div className="text-(--text-muted)">{t("adminWallet", "loading")}</div> : null}
      {error ? (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
          {t("adminWallet", "failedToLoad")}: {error}
        </div>
      ) : null}

      {!loading && data?.success && stats ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title={t("adminWallet", "balance")} value={fmt(stats.balance, currency)} />
            <StatCard title={t("adminWallet", "pendingBalance")} value={fmt(stats.pendingBalance, currency)} />
            <StatCard title={t("adminWallet", "totalEarned")} value={fmt(stats.totalEarned, currency)} />
            <StatCard title={t("adminWallet", "totalWithdrawn")} value={fmt(stats.totalWithdrawn, currency)} />
          </div>

          <div className="pt-2">
            <div className="text-lg font-bold text-(--text)">{t("adminWallet", "recentTransactions")}</div>
            <div className="text-xs text-(--text-muted) mt-1">
              {t("adminWallet", "lastTransactionAt")}: {stats.lastTransactionAt ? new Date(stats.lastTransactionAt).toLocaleString() : "-"}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-(--border) bg-(--bg-card)">
            <table className="min-w-[980px] w-full text-sm">
              <thead className="bg-(--bg)">
                <tr className="text-(--text-muted)">
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("adminWallet", "colId")}</th>
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("adminWallet", "colType")}</th>
                  <th className="px-3 py-3 text-center">{t("adminWallet", "colAmount")}</th>
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("adminWallet", "colDescription")}</th>
                  <th className="px-3 py-3 text-center">{t("adminWallet", "colStatus")}</th>
                  <th className="px-3 py-3 text-center">{t("adminWallet", "colCreatedAt")}</th>
                </tr>
              </thead>
              <tbody>
                {(data.recentTransactions ?? []).map((tx: WalletTransaction) => (
                  <tr key={tx._id} className="border-t border-(--border)">
                    <td className={cn("px-3 py-3 font-mono text-xs", isRTL ? "text-right" : "text-left")}>{tx._id}</td>
                    <td className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{renderType(tx.type)}</td>
                    <td className="px-3 py-3 text-center">{fmt(tx.amount, tx.currency)}</td>
                    <td className={cn("px-3 py-3 max-w-[520px]", isRTL ? "text-right" : "text-left")}>
                      <div className="truncate text-(--text)">{tx.description}</div>
                    </td>
                    <td className="px-3 py-3 text-center">{tx.status}</td>
                    <td className="px-3 py-3 text-center">{tx.createdAt ? new Date(tx.createdAt).toLocaleString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
