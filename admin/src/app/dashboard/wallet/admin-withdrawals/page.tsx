"use client";

import { useEffect, useMemo, useState } from "react";

import { apiClient, getErrorMessage } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type {
  WalletWithdrawalsResponse,
  WalletWithdrawal,
  ProcessWithdrawalResponse,
} from "@/types/admin-wallet";

type StatusFilter = "all" | "pending" | "processing" | "completed" | "rejected" | "cancelled";

export default function AdminWithdrawalsPage() {
  const { t, isRTL } = useLanguage();
  const [page, setPage] = useState(1);
  const limit = 20;
  const [status, setStatus] = useState<StatusFilter>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [data, setData] = useState<WalletWithdrawalsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (status !== "all") params.set("status", status);
    return params.toString();
  }, [page, limit, status]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<WalletWithdrawalsResponse>(`/wallet/admin/withdrawals?${queryString}`);
      setData(res);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!mounted) return;
      await load();
    };
    run();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  const canPrev = (data?.page ?? 1) > 1;
  const canNext = (data?.page ?? 1) < (data?.totalPages ?? 1);

  const fmt = (amount: number, currency: string) => `${amount.toFixed(2)} ${currency}`;

  const renderStatus = (s: string) => {
    if (s === "pending") return t("adminWallet", "statusPending");
    if (s === "processing") return t("adminWallet", "statusProcessing");
    if (s === "completed") return t("adminWallet", "statusCompleted");
    if (s === "rejected") return t("adminWallet", "statusRejected");
    if (s === "cancelled") return t("adminWallet", "statusCancelled");
    return s;
  };

  const renderMethod = (m: string) => {
    if (m === "bank_transfer") return t("adminWallet", "methodBankTransfer");
    if (m === "paypal") return t("adminWallet", "methodPaypal");
    if (m === "tap") return t("adminWallet", "methodTap");
    return m;
  };

  const process = async (withdrawalId: string, nextStatus: string, rejectionReason?: string) => {
    setBusyId(withdrawalId);
    setError(null);
    try {
      await apiClient.patch<ProcessWithdrawalResponse>(`/wallet/admin/withdrawals/${withdrawalId}/process`, {
        status: nextStatus,
        rejectionReason,
      });
      await load();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const onReject = async (w: WalletWithdrawal) => {
    const reason = window.prompt(t("adminWallet", "rejectReasonPrompt"));
    if (!reason) return;
    await process(w._id, "rejected", reason);
  };

  return (
    <div className={cn("space-y-4", isRTL ? "text-right" : "text-left")}>
      <div>
        <h1 className="text-2xl font-bold text-(--text)">{t("adminWallet", "adminWithdrawalsTitle")}</h1>
      </div>

      <div className={cn("flex gap-3 flex-wrap", isRTL ? "flex-row-reverse" : "flex-row")}>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as StatusFilter);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-(--border) bg-(--bg) text-(--text)"
        >
          <option value="all">{t("adminWallet", "filterAll")}</option>
          <option value="pending">{t("adminWallet", "statusPending")}</option>
          <option value="processing">{t("adminWallet", "statusProcessing")}</option>
          <option value="completed">{t("adminWallet", "statusCompleted")}</option>
          <option value="rejected">{t("adminWallet", "statusRejected")}</option>
          <option value="cancelled">{t("adminWallet", "statusCancelled")}</option>
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
            <table className="min-w-[1100px] w-full text-sm">
              <thead className="bg-(--bg)">
                <tr className="text-(--text-muted)">
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("adminWallet", "colId")}</th>
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("adminWallet", "colUser")}</th>
                  <th className="px-3 py-3 text-center">{t("adminWallet", "colAmount")}</th>
                  <th className="px-3 py-3 text-center">{t("adminWallet", "colMethod")}</th>
                  <th className="px-3 py-3 text-center">{t("adminWallet", "colStatus")}</th>
                  <th className="px-3 py-3 text-center">{t("adminWallet", "colProcessedBy")}</th>
                  <th className="px-3 py-3 text-center">{t("adminWallet", "colProcessedAt")}</th>
                  <th className="px-3 py-3 text-center">{t("adminWallet", "colCreatedAt")}</th>
                  <th className="px-3 py-3 text-center">{t("adminWallet", "colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {(data.withdrawals ?? []).map((w: WalletWithdrawal) => {
                  const u = (w as any).userId;
                  const userLabel = u?.username || u?.email || u?._id || "-";
                  const pb = (w as any).processedBy;
                  const processedBy = pb?.username || pb?._id || "-";
                  const pending = w.status === "pending";
                  const processing = w.status === "processing";
                  const disabled = busyId === w._id;

                  return (
                    <tr key={w._id} className="border-t border-(--border)">
                      <td className={cn("px-3 py-3 font-mono text-xs", isRTL ? "text-right" : "text-left")}>{w._id}</td>
                      <td className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{userLabel}</td>
                      <td className="px-3 py-3 text-center">{fmt(w.amount, w.currency)}</td>
                      <td className="px-3 py-3 text-center">{renderMethod(w.method)}</td>
                      <td className="px-3 py-3 text-center">{renderStatus(w.status)}</td>
                      <td className="px-3 py-3 text-center">{processedBy}</td>
                      <td className="px-3 py-3 text-center">{w.processedAt ? new Date(w.processedAt).toLocaleString() : "-"}</td>
                      <td className="px-3 py-3 text-center">{w.createdAt ? new Date(w.createdAt).toLocaleString() : "-"}</td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {pending ? (
                            <button
                              disabled={disabled}
                              onClick={() => process(w._id, "processing")}
                              className="px-3 py-1.5 rounded-md border border-(--border) bg-(--bg) hover:bg-primary-50 dark:hover:bg-primary-900/20 disabled:opacity-50"
                            >
                              {t("adminWallet", "btnMarkProcessing")}
                            </button>
                          ) : null}

                          {processing ? (
                            <>
                              <button
                                disabled={disabled}
                                onClick={() => process(w._id, "completed")}
                                className="px-3 py-1.5 rounded-md border border-(--border) bg-(--bg) hover:bg-primary-50 dark:hover:bg-primary-900/20 disabled:opacity-50"
                              >
                                {t("adminWallet", "btnApprove")}
                              </button>
                              <button
                                disabled={disabled}
                                onClick={() => onReject(w)}
                                className="px-3 py-1.5 rounded-md border border-(--border) bg-(--bg) hover:bg-primary-50 dark:hover:bg-primary-900/20 disabled:opacity-50"
                              >
                                {t("adminWallet", "btnReject")}
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
