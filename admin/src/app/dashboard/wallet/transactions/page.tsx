"use client";

import { useEffect, useMemo, useState } from "react";

import { apiClient, getErrorMessage } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type { WalletTransactionsResponse, WalletTransaction } from "@/types/admin-wallet";

export default function WalletTransactionsPage() {
  const { t, isRTL } = useLanguage();
  const [page, setPage] = useState(1);
  const limit = 20;
  const [type, setType] = useState<string>("all");

  const [data, setData] = useState<WalletTransactionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (type !== "all") params.set("type", type);
    return params.toString();
  }, [page, limit, type]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get<WalletTransactionsResponse>(`/wallet/transactions?${queryString}`);
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
  }, [queryString]);

  const canPrev = (data?.page ?? 1) > 1;
  const canNext = (data?.page ?? 1) < (data?.totalPages ?? 1);

  const fmt = (amount: number, currency: string) => `${amount.toFixed(2)} ${currency}`;

  const renderType = (txType: string) => {
    if (txType === "room_payment") return t("adminWallet", "typeRoomPayment");
    if (txType === "product_purchase") return t("adminWallet", "typeProductPurchase");
    if (txType === "withdrawal") return t("adminWallet", "typeWithdrawal");
    if (txType === "refund") return t("adminWallet", "typeRefund");
    if (txType === "platform_fee") return t("adminWallet", "typePlatformFee");
    return txType;
  };

  return (
    <div className={cn("space-y-4", isRTL ? "text-right" : "text-left")}>
      <div>
        <h1 className="text-2xl font-bold text-(--text)">{t("adminWallet", "transactionsTitle")}</h1>
      </div>

      <div className={cn("flex gap-3 flex-wrap", isRTL ? "flex-row-reverse" : "flex-row")}>
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-(--border) bg-(--bg) text-(--text)"
        >
          <option value="all">{t("adminWallet", "filterAll")}</option>
          <option value="room_payment">{t("adminWallet", "typeRoomPayment")}</option>
          <option value="product_purchase">{t("adminWallet", "typeProductPurchase")}</option>
          <option value="withdrawal">{t("adminWallet", "typeWithdrawal")}</option>
          <option value="refund">{t("adminWallet", "typeRefund")}</option>
          <option value="platform_fee">{t("adminWallet", "typePlatformFee")}</option>
        </select>
      </div>

      {loading ? <div className="text-(--text-muted)">{t("adminWallet", "loading")}</div> : null}
      {error ? (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
          {t("adminWallet", "failedToLoad")}: {error}
        </div>
      ) : null}

      {!loading && data?.success ? (
        <>
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
                {(data.transactions ?? []).map((tx: WalletTransaction) => (
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

          <div className={cn("flex items-center justify-between", isRTL ? "flex-row-reverse" : "flex-row")}>
            <button
              disabled={!canPrev}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-2 rounded-lg border border-(--border) bg-(--bg) disabled:opacity-50"
            >
              {t("adminWallet", "paginationPrev")}
            </button>
            <div className="text-sm text-(--text-muted)">
              {t("adminWallet", "page")} {data.page} / {data.totalPages}
            </div>
            <button
              disabled={!canNext}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-2 rounded-lg border border-(--border) bg-(--bg) disabled:opacity-50"
            >
              {t("adminWallet", "paginationNext")}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
