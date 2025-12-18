"use client";

import { useEffect, useMemo, useState } from "react";

import { apiClient, getErrorMessage } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type { AdminTopFollowedResponse } from "@/types/admin-social";

export default function RelationshipsPage() {
  const { t, isRTL } = useLanguage();
  const [page, setPage] = useState(1);
  const limit = 20;

  const [data, setData] = useState<AdminTopFollowedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    return params.toString();
  }, [page, limit]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get<AdminTopFollowedResponse>(`/admin/social/top-followed?${queryString}`);
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

  const canPrev = (data?.pagination?.page ?? 1) > 1;
  const canNext = (data?.pagination?.page ?? 1) < (data?.pagination?.pages ?? 1);

  return (
    <div className={cn("space-y-4", isRTL ? "text-right" : "text-left")}>
      <div>
        <h1 className="text-2xl font-bold text-(--text)">{t("adminSocial", "topFollowedTitle")}</h1>
        <div className="text-sm text-(--text-muted) mt-1">{t("adminSocial", "topFollowedSubtitle")}</div>
      </div>

      {loading ? <div className="text-(--text-muted)">{t("adminSocial", "loading")}</div> : null}
      {error ? (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
          {t("adminSocial", "failedToLoad")}: {error}
        </div>
      ) : null}

      {!loading && data ? (
        <>
          <div className="overflow-x-auto rounded-xl border border-(--border) bg-(--bg-card)">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="bg-(--bg)">
                <tr className="text-(--text-muted)">
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("adminSocial", "colRank")}</th>
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("adminSocial", "colUser")}</th>
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("adminSocial", "colUserId")}</th>
                  <th className="px-3 py-3 text-center">{t("adminSocial", "colFollowers")}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((it, idx) => {
                  const rank = (data.pagination.page - 1) * data.pagination.limit + idx + 1;
                  const u = it.user;
                  const name = [u?.firstName, u?.lastName].filter(Boolean).join(" ");
                  const label = u?.username ? `@${u.username}` : name || it.userId;
                  return (
                    <tr key={it.userId} className="border-t border-(--border)">
                      <td className={cn("px-3 py-3 font-semibold", isRTL ? "text-right" : "text-left")}>{rank}</td>
                      <td className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>
                        <div className="text-(--text)">{label}</div>
                      </td>
                      <td className={cn("px-3 py-3 font-mono text-xs", isRTL ? "text-right" : "text-left")}>{it.userId}</td>
                      <td className="px-3 py-3 text-center">{it.followersCount}</td>
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
              {t("adminSocial", "paginationPrev")}
            </button>
            <div className="text-sm text-(--text-muted)">
              {t("adminSocial", "page")} {data.pagination.page} / {data.pagination.pages}
            </div>
            <button
              disabled={!canNext}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-2 rounded-lg border border-(--border) bg-(--bg) disabled:opacity-50"
            >
              {t("adminSocial", "paginationNext")}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
