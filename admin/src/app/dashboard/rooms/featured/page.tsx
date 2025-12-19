"use client";

import { useEffect, useMemo, useState } from "react";

import { apiClient, getErrorMessage } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type { AdminFeaturedRoomsResponse, AdminFeaturedRoom } from "@/types/admin-community-room";

type StatusFilter = "all" | "pending" | "active" | "expired" | "cancelled";

export default function FeaturedRoomsPage() {
  const { t, isRTL } = useLanguage();
  const [status, setStatus] = useState<StatusFilter>("active");
  const [page, setPage] = useState(1);
  const limit = 20;

  const [data, setData] = useState<AdminFeaturedRoomsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    params.set("status", status);
    return params.toString();
  }, [page, limit, status]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<AdminFeaturedRoomsResponse>(`/admin/featured-rooms?${queryString}`);
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

  const roomName = (r: AdminFeaturedRoom["roomId"]) => {
    if (!r || typeof r === "string") return "-";
    return r.name || r._id;
  };

  const userName = (u: AdminFeaturedRoom["userId"]) => {
    if (!u || typeof u === "string") return "-";
    const full = [u.firstName, u.lastName].filter(Boolean).join(" ");
    return full || u.username || u._id;
  };

  const mutate = async (featuredId: string, fn: () => Promise<void>) => {
    setBusyId(featuredId);
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

  const onCancel = async (fr: AdminFeaturedRoom) => {
    await mutate(fr._id, async () => {
      await apiClient.patch(`/admin/featured-rooms/${fr._id}/cancel`);
    });
  };

  const onExpire = async (fr: AdminFeaturedRoom) => {
    await mutate(fr._id, async () => {
      await apiClient.patch(`/admin/featured-rooms/${fr._id}/expire`);
    });
  };

  const fmt = (amount: number, currency: string) => `${amount.toFixed(2)} ${currency}`;

  return (
    <div className={cn("space-y-4", isRTL ? "text-right" : "text-left")}>
      <div>
        <h1 className="text-2xl font-bold text-(--text)">{t("adminCommunityRoom", "featuredRoomsTitle")}</h1>
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
          <option value="all">{t("adminCommunityRoom", "filterAll")}</option>
          <option value="pending">pending</option>
          <option value="active">active</option>
          <option value="expired">expired</option>
          <option value="cancelled">cancelled</option>
        </select>
      </div>

      {loading ? <div className="text-(--text-muted)">{t("adminCommunityRoom", "loading")}</div> : null}
      {error ? (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
          {t("adminCommunityRoom", "failedToLoad")}: {error}
        </div>
      ) : null}

      {!loading && data?.success ? (
        <>
          <div className="overflow-x-auto rounded-xl border border-(--border) bg-(--bg-card)">
            <table className="min-w-[1180px] w-full text-sm">
              <thead className="bg-(--bg)">
                <tr className="text-(--text-muted)">
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("adminCommunityRoom", "colId")}</th>
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("adminCommunityRoom", "colName")}</th>
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("adminCommunityRoom", "colOwner")}</th>
                  <th className="px-3 py-3 text-center">{t("adminCommunityRoom", "colStatus")}</th>
                  <th className="px-3 py-3 text-center">{t("adminCommunityRoom", "colAmount")}</th>
                  <th className="px-3 py-3 text-center">{t("adminCommunityRoom", "colStart")}</th>
                  <th className="px-3 py-3 text-center">{t("adminCommunityRoom", "colEnd")}</th>
                  <th className="px-3 py-3 text-center">{t("adminCommunityRoom", "colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {(data.featuredRooms ?? []).map((fr) => {
                  const isBusy = busyId === fr._id;
                  return (
                    <tr key={fr._id} className="border-t border-(--border)">
                      <td className={cn("px-3 py-3 font-mono text-xs", isRTL ? "text-right" : "text-left")}>{fr._id}</td>
                      <td className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{roomName(fr.roomId)}</td>
                      <td className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{userName(fr.userId)}</td>
                      <td className="px-3 py-3 text-center">{fr.status}</td>
                      <td className="px-3 py-3 text-center">{fmt(fr.amount, fr.currency)}</td>
                      <td className="px-3 py-3 text-center">{fr.startDate ? new Date(fr.startDate).toLocaleDateString() : "-"}</td>
                      <td className="px-3 py-3 text-center">{fr.endDate ? new Date(fr.endDate).toLocaleDateString() : "-"}</td>
                      <td className="px-3 py-3">
                        <div className={cn("flex gap-2 justify-center flex-wrap", isRTL ? "flex-row-reverse" : "flex-row")}>
                          <button
                            disabled={isBusy}
                            onClick={() => onCancel(fr)}
                            className="px-2 py-1 rounded border border-(--border) bg-(--bg) disabled:opacity-50"
                          >
                            {t("adminCommunityRoom", "btnCancel")}
                          </button>
                          <button
                            disabled={isBusy}
                            onClick={() => onExpire(fr)}
                            className="px-2 py-1 rounded border border-(--border) bg-(--bg) disabled:opacity-50"
                          >
                            {t("adminCommunityRoom", "btnExpire")}
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
              {t("adminCommunityRoom", "paginationPrev")}
            </button>
            <div className="text-sm text-(--text-muted)">
              {t("adminCommunityRoom", "page")} {data.page} / {data.totalPages}
            </div>
            <button
              disabled={!canNext}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-2 rounded-lg border border-(--border) bg-(--bg) disabled:opacity-50"
            >
              {t("adminCommunityRoom", "paginationNext")}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
