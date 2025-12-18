"use client";

import { useEffect, useMemo, useState } from "react";

import { apiClient, getErrorMessage } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type {
  AdminMarketplaceOrder,
  AdminMarketplaceOrdersResponse,
  AdminMarketplaceUpdateOrderResponse,
  OrderStatus,
  PaymentMethod,
} from "@/types/admin-marketplace";

type StatusFilter = "all" | OrderStatus;
type PaymentFilter = "all" | PaymentMethod;

export default function MarketplaceOrdersPage() {
  const { t, isRTL } = useLanguage();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [payment, setPayment] = useState<PaymentFilter>("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  const [data, setData] = useState<AdminMarketplaceOrdersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (status !== "all") params.set("status", status);
    if (payment !== "all") params.set("paymentMethod", payment);
    if (q.trim()) params.set("search", q.trim());
    return params.toString();
  }, [page, limit, status, payment, q]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<AdminMarketplaceOrdersResponse>(`/admin/marketplace/orders?${queryString}`);
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

  const userName = (u: AdminMarketplaceOrder["buyerId"] | AdminMarketplaceOrder["sellerId"]) => {
    if (!u || typeof u === "string") return "-";
    const full = [u.firstName, u.lastName].filter(Boolean).join(" ");
    return full || u.username || u._id;
  };

  const renderStatus = (s: string) => {
    if (s === "pending") return t("adminMarketplace", "orderStatusPending");
    if (s === "awaiting_payment") return t("adminMarketplace", "orderStatusAwaitingPayment");
    if (s === "paid") return t("adminMarketplace", "orderStatusPaid");
    if (s === "processing") return t("adminMarketplace", "orderStatusProcessing");
    if (s === "shipped") return t("adminMarketplace", "orderStatusShipped");
    if (s === "delivered") return t("adminMarketplace", "orderStatusDelivered");
    if (s === "completed") return t("adminMarketplace", "orderStatusCompleted");
    if (s === "cancelled") return t("adminMarketplace", "orderStatusCancelled");
    if (s === "refunded") return t("adminMarketplace", "orderStatusRefunded");
    if (s === "disputed") return t("adminMarketplace", "orderStatusDisputed");
    return s;
  };

  const renderPayment = (m: string) => {
    if (m === "tap") return t("adminMarketplace", "paymentTap");
    if (m === "cash") return t("adminMarketplace", "paymentCash");
    return m;
  };

  const mutate = async (orderId: string, fn: () => Promise<void>) => {
    setBusyId(orderId);
    setError(null);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const onUpdateStatus = async (order: AdminMarketplaceOrder) => {
    const next = window.prompt(t("adminMarketplace", "btnUpdateStatus"), order.status);
    if (!next) return;
    await mutate(order._id, async () => {
      await apiClient.patch<AdminMarketplaceUpdateOrderResponse>(`/admin/marketplace/orders/${order._id}`, {
        status: next,
      });
    });
  };

  const onSetTracking = async (order: AdminMarketplaceOrder) => {
    const trackingNumber = window.prompt(t("adminMarketplace", "trackingPrompt"), order.trackingNumber || "");
    if (trackingNumber === null) return;
    await mutate(order._id, async () => {
      await apiClient.patch<AdminMarketplaceUpdateOrderResponse>(`/admin/marketplace/orders/${order._id}`, {
        trackingNumber,
      });
    });
  };

  return (
    <div className={cn("space-y-4", isRTL ? "text-right" : "text-left")}>
      <div>
        <h1 className="text-2xl font-bold text-(--text)">{t("adminMarketplace", "ordersTitle")}</h1>
      </div>

      <div className={cn("flex gap-3 flex-wrap", isRTL ? "flex-row-reverse" : "flex-row")}>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder={t("adminMarketplace", "searchPlaceholderOrders")}
          className="px-3 py-2 rounded-lg border border-(--border) bg-(--bg) text-(--text) w-[280px]"
        />

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as StatusFilter);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-(--border) bg-(--bg) text-(--text)"
        >
          <option value="all">{t("adminMarketplace", "filterAll")}</option>
          <option value="pending">{t("adminMarketplace", "orderStatusPending")}</option>
          <option value="awaiting_payment">{t("adminMarketplace", "orderStatusAwaitingPayment")}</option>
          <option value="paid">{t("adminMarketplace", "orderStatusPaid")}</option>
          <option value="processing">{t("adminMarketplace", "orderStatusProcessing")}</option>
          <option value="shipped">{t("adminMarketplace", "orderStatusShipped")}</option>
          <option value="delivered">{t("adminMarketplace", "orderStatusDelivered")}</option>
          <option value="completed">{t("adminMarketplace", "orderStatusCompleted")}</option>
          <option value="cancelled">{t("adminMarketplace", "orderStatusCancelled")}</option>
          <option value="refunded">{t("adminMarketplace", "orderStatusRefunded")}</option>
          <option value="disputed">{t("adminMarketplace", "orderStatusDisputed")}</option>
        </select>

        <select
          value={payment}
          onChange={(e) => {
            setPayment(e.target.value as PaymentFilter);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-(--border) bg-(--bg) text-(--text)"
        >
          <option value="all">{t("adminMarketplace", "filterAll")}</option>
          <option value="tap">{t("adminMarketplace", "paymentTap")}</option>
          <option value="cash">{t("adminMarketplace", "paymentCash")}</option>
        </select>
      </div>

      {loading ? <div className="text-(--text-muted)">{t("adminMarketplace", "loading")}</div> : null}
      {error ? (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
          {t("adminMarketplace", "failedToLoad")}: {error}
        </div>
      ) : null}

      {!loading && data?.success ? (
        <>
          <div className="overflow-x-auto rounded-xl border border-(--border) bg-(--bg-card)">
            <table className="min-w-[1220px] w-full text-sm">
              <thead className="bg-(--bg)">
                <tr className="text-(--text-muted)">
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("adminMarketplace", "colId")}</th>
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("adminMarketplace", "colOrderNumber")}</th>
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("adminMarketplace", "colBuyer")}</th>
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("adminMarketplace", "colSeller")}</th>
                  <th className="px-3 py-3 text-center">{t("adminMarketplace", "colItems")}</th>
                  <th className="px-3 py-3 text-center">{t("adminMarketplace", "colTotal")}</th>
                  <th className="px-3 py-3 text-center">{t("adminMarketplace", "colPayment")}</th>
                  <th className="px-3 py-3 text-center">{t("adminMarketplace", "colStatus")}</th>
                  <th className="px-3 py-3 text-center">{t("adminMarketplace", "colCreatedAt")}</th>
                  <th className="px-3 py-3 text-center">{t("adminMarketplace", "colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {(data.orders ?? []).map((o) => {
                  const isBusy = busyId === o._id;
                  const itemCount = (o.items ?? []).reduce((sum, it) => sum + (it.quantity ?? 0), 0);
                  return (
                    <tr key={o._id} className="border-t border-(--border)">
                      <td className={cn("px-3 py-3 font-mono text-xs", isRTL ? "text-right" : "text-left")}>{o._id}</td>
                      <td className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{o.orderNumber}</td>
                      <td className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{userName(o.buyerId)}</td>
                      <td className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{userName(o.sellerId)}</td>
                      <td className="px-3 py-3 text-center">{itemCount}</td>
                      <td className="px-3 py-3 text-center">{fmt(o.total, o.currency)}</td>
                      <td className="px-3 py-3 text-center">{renderPayment(o.paymentMethod)}</td>
                      <td className="px-3 py-3 text-center">{renderStatus(o.status)}</td>
                      <td className="px-3 py-3 text-center">{o.createdAt ? new Date(o.createdAt).toLocaleString() : "-"}</td>
                      <td className="px-3 py-3">
                        <div className={cn("flex gap-2 justify-center flex-wrap", isRTL ? "flex-row-reverse" : "flex-row")}>
                          <button
                            disabled={isBusy}
                            onClick={() => onUpdateStatus(o)}
                            className="px-2 py-1 rounded border border-(--border) bg-(--bg) disabled:opacity-50"
                          >
                            {t("adminMarketplace", "btnUpdateStatus")}
                          </button>
                          <button
                            disabled={isBusy}
                            onClick={() => onSetTracking(o)}
                            className="px-2 py-1 rounded border border-(--border) bg-(--bg) disabled:opacity-50"
                          >
                            {t("adminMarketplace", "btnSetTracking")}
                          </button>
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
              {t("adminMarketplace", "paginationPrev")}
            </button>
            <div className="text-sm text-(--text-muted)">
              {t("adminMarketplace", "page")} {data.page} / {data.totalPages}
            </div>
            <button
              disabled={!canNext}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-2 rounded-lg border border-(--border) bg-(--bg) disabled:opacity-50"
            >
              {t("adminMarketplace", "paginationNext")}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
