"use client";

import { useEffect, useMemo, useState } from "react";

import { apiClient, getErrorMessage } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type {
  AdminMarketplaceListing,
  AdminMarketplaceListingsResponse,
  AdminMarketplaceUpdateListingResponse,
} from "@/types/admin-marketplace";

type DeletedFilter = "active" | "deleted" | "all";

export default function MarketplaceListingsPage() {
  const { t, isRTL } = useLanguage();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [deleted, setDeleted] = useState<DeletedFilter>("active");
  const [featured, setFeatured] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  const [data, setData] = useState<AdminMarketplaceListingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    params.set("deleted", deleted);
    if (status !== "all") params.set("status", status);
    if (featured !== "all") params.set("featured", featured);
    if (q.trim()) params.set("search", q.trim());
    return params.toString();
  }, [page, limit, deleted, status, featured, q]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<AdminMarketplaceListingsResponse>(`/admin/marketplace/listings?${queryString}`);
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

  const sellerName = (sellerId: AdminMarketplaceListing["sellerId"]) => {
    if (!sellerId || typeof sellerId === "string") return "-";
    const full = [sellerId.firstName, sellerId.lastName].filter(Boolean).join(" ");
    return full || sellerId.username || sellerId._id;
  };

  const renderProductStatus = (s: string) => {
    if (s === "active") return t("adminMarketplace", "statusActive");
    if (s === "inactive") return t("adminMarketplace", "statusInactive");
    if (s === "sold") return t("adminMarketplace", "statusSold");
    if (s === "reserved") return t("adminMarketplace", "statusReserved");
    return s;
  };

  const mutate = async (productId: string, fn: () => Promise<void>) => {
    setBusyId(productId);
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

  const toggleFeatured = async (p: AdminMarketplaceListing) => {
    await mutate(p._id, async () => {
      await apiClient.patch<AdminMarketplaceUpdateListingResponse>(
        `/admin/marketplace/listings/${p._id}/featured`,
        { isFeatured: !p.isFeatured }
      );
    });
  };

  const toggleActive = async (p: AdminMarketplaceListing) => {
    const nextStatus = p.status === "active" ? "inactive" : "active";
    await mutate(p._id, async () => {
      await apiClient.patch<AdminMarketplaceUpdateListingResponse>(
        `/admin/marketplace/listings/${p._id}/status`,
        { status: nextStatus }
      );
    });
  };

  const onDelete = async (p: AdminMarketplaceListing) => {
    if (!window.confirm(t("adminMarketplace", "confirmDelete"))) return;
    await mutate(p._id, async () => {
      await apiClient.post<AdminMarketplaceUpdateListingResponse>(`/admin/marketplace/listings/${p._id}/delete`);
    });
  };

  const onRestore = async (p: AdminMarketplaceListing) => {
    if (!window.confirm(t("adminMarketplace", "confirmRestore"))) return;
    await mutate(p._id, async () => {
      await apiClient.post<AdminMarketplaceUpdateListingResponse>(`/admin/marketplace/listings/${p._id}/restore`);
    });
  };

  return (
    <div className={cn("space-y-4", isRTL ? "text-right" : "text-left")}>
      <div>
        <h1 className="text-2xl font-bold text-(--text)">{t("adminMarketplace", "listingsTitle")}</h1>
      </div>

      <div className={cn("flex gap-3 flex-wrap", isRTL ? "flex-row-reverse" : "flex-row")}>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder={t("adminMarketplace", "searchPlaceholderListings")}
          className="px-3 py-2 rounded-lg border border-(--border) bg-(--bg) text-(--text) w-[280px]"
        />

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-(--border) bg-(--bg) text-(--text)"
        >
          <option value="all">{t("adminMarketplace", "filterAll")}</option>
          <option value="active">{t("adminMarketplace", "statusActive")}</option>
          <option value="inactive">{t("adminMarketplace", "statusInactive")}</option>
          <option value="sold">{t("adminMarketplace", "statusSold")}</option>
          <option value="reserved">{t("adminMarketplace", "statusReserved")}</option>
        </select>

        <select
          value={featured}
          onChange={(e) => {
            setFeatured(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-(--border) bg-(--bg) text-(--text)"
        >
          <option value="all">{t("adminMarketplace", "filterAll")}</option>
          <option value="true">{t("adminMarketplace", "featuredYes")}</option>
          <option value="false">{t("adminMarketplace", "featuredNo")}</option>
        </select>

        <select
          value={deleted}
          onChange={(e) => {
            setDeleted(e.target.value as DeletedFilter);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-(--border) bg-(--bg) text-(--text)"
        >
          <option value="active">{t("adminMarketplace", "deletedActive")}</option>
          <option value="deleted">{t("adminMarketplace", "deletedDeleted")}</option>
          <option value="all">{t("adminMarketplace", "deletedAll")}</option>
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
            <table className="min-w-[1180px] w-full text-sm">
              <thead className="bg-(--bg)">
                <tr className="text-(--text-muted)">
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("adminMarketplace", "colId")}</th>
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("adminMarketplace", "colTitle")}</th>
                  <th className="px-3 py-3 text-center">{t("adminMarketplace", "colPrice")}</th>
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("adminMarketplace", "colSeller")}</th>
                  <th className="px-3 py-3 text-center">{t("adminMarketplace", "colCategory")}</th>
                  <th className="px-3 py-3 text-center">{t("adminMarketplace", "colStatus")}</th>
                  <th className="px-3 py-3 text-center">{t("adminMarketplace", "colFeatured")}</th>
                  <th className="px-3 py-3 text-center">{t("adminMarketplace", "colDeleted")}</th>
                  <th className="px-3 py-3 text-center">{t("adminMarketplace", "colCreatedAt")}</th>
                  <th className="px-3 py-3 text-center">{t("adminMarketplace", "colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {(data.products ?? []).map((p) => {
                  const isDeleted = !!p.deletedAt;
                  const isBusy = busyId === p._id;
                  return (
                    <tr key={p._id} className="border-t border-(--border)">
                      <td className={cn("px-3 py-3 font-mono text-xs", isRTL ? "text-right" : "text-left")}>{p._id}</td>
                      <td className={cn("px-3 py-3 max-w-[420px]", isRTL ? "text-right" : "text-left")}>
                        <div className="truncate text-(--text)">{p.title}</div>
                      </td>
                      <td className="px-3 py-3 text-center">{fmt(p.price, p.currency)}</td>
                      <td className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{sellerName(p.sellerId)}</td>
                      <td className="px-3 py-3 text-center">{p.category}</td>
                      <td className="px-3 py-3 text-center">{renderProductStatus(p.status)}</td>
                      <td className="px-3 py-3 text-center">{p.isFeatured ? t("adminMarketplace", "featuredYes") : t("adminMarketplace", "featuredNo")}</td>
                      <td className="px-3 py-3 text-center">{isDeleted ? t("adminMarketplace", "deletedDeleted") : t("adminMarketplace", "deletedActive")}</td>
                      <td className="px-3 py-3 text-center">{p.createdAt ? new Date(p.createdAt).toLocaleString() : "-"}</td>
                      <td className="px-3 py-3">
                        <div className={cn("flex gap-2 justify-center flex-wrap", isRTL ? "flex-row-reverse" : "flex-row")}>
                          <button
                            disabled={isBusy}
                            onClick={() => toggleFeatured(p)}
                            className="px-2 py-1 rounded border border-(--border) bg-(--bg) disabled:opacity-50"
                          >
                            {p.isFeatured ? t("adminMarketplace", "btnUnfeature") : t("adminMarketplace", "btnFeature")}
                          </button>

                          <button
                            disabled={isBusy || isDeleted}
                            onClick={() => toggleActive(p)}
                            className="px-2 py-1 rounded border border-(--border) bg-(--bg) disabled:opacity-50"
                          >
                            {p.status === "active" ? t("adminMarketplace", "btnDeactivate") : t("adminMarketplace", "btnActivate")}
                          </button>

                          {!isDeleted ? (
                            <button
                              disabled={isBusy}
                              onClick={() => onDelete(p)}
                              className="px-2 py-1 rounded border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 disabled:opacity-50"
                            >
                              {t("adminMarketplace", "btnDelete")}
                            </button>
                          ) : (
                            <button
                              disabled={isBusy}
                              onClick={() => onRestore(p)}
                              className="px-2 py-1 rounded border border-(--border) bg-(--bg) disabled:opacity-50"
                            >
                              {t("adminMarketplace", "btnRestore")}
                            </button>
                          )}
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
