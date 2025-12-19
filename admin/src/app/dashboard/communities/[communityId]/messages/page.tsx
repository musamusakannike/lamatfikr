"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { apiClient, getErrorMessage } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type {
  AdminCommunityMessage,
  AdminCommunityMessagesResponse,
} from "@/types/admin-community-room";

type DeletedFilter = "active" | "deleted" | "all";

export default function AdminCommunityMessagesPage() {
  const params = useParams<{ communityId: string }>();
  const communityId = params?.communityId;

  const { t, isRTL } = useLanguage();
  const [page, setPage] = useState(1);
  const limit = 50;
  const [deleted, setDeleted] = useState<DeletedFilter>("active");

  const [data, setData] = useState<AdminCommunityMessagesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("limit", String(limit));
    p.set("deleted", deleted);
    return p.toString();
  }, [page, limit, deleted]);

  const load = async () => {
    if (!communityId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<AdminCommunityMessagesResponse>(
        `/admin/communities/${communityId}/messages?${queryString}`
      );
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
  }, [communityId, queryString]);

  const canPrev = (data?.page ?? 1) > 1;
  const canNext = (data?.page ?? 1) < (data?.totalPages ?? 1);

  const senderName = (s: AdminCommunityMessage["senderId"]) => {
    if (!s || typeof s === "string") return "-";
    const full = [s.firstName, s.lastName].filter(Boolean).join(" ");
    return full || s.username || s._id;
  };

  const mutate = async (messageId: string, fn: () => Promise<void>) => {
    setBusyId(messageId);
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

  const onDelete = async (m: AdminCommunityMessage) => {
    await mutate(m._id, async () => {
      await apiClient.post(`/admin/communities/${communityId}/messages/${m._id}/delete`);
    });
  };

  const onRestore = async (m: AdminCommunityMessage) => {
    await mutate(m._id, async () => {
      await apiClient.post(`/admin/communities/${communityId}/messages/${m._id}/restore`);
    });
  };

  return (
    <div className={cn("space-y-4", isRTL ? "text-right" : "text-left")}>
      <div>
        <h1 className="text-2xl font-bold text-(--text)">{t("adminCommunityRoom", "messagesTitle")}</h1>
        <div className="text-xs text-(--text-muted) font-mono">{communityId}</div>
      </div>

      <div className={cn("flex gap-3 flex-wrap", isRTL ? "flex-row-reverse" : "flex-row")}>
        <select
          value={deleted}
          onChange={(e) => {
            setDeleted(e.target.value as DeletedFilter);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-(--border) bg-(--bg) text-(--text)"
        >
          <option value="active">{t("adminCommunityRoom", "deletedActive")}</option>
          <option value="deleted">{t("adminCommunityRoom", "deletedDeleted")}</option>
          <option value="all">{t("adminCommunityRoom", "deletedAll")}</option>
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
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("adminCommunityRoom", "colSender")}</th>
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("adminCommunityRoom", "colMessage")}</th>
                  <th className="px-3 py-3 text-center">{t("adminCommunityRoom", "colDeleted")}</th>
                  <th className="px-3 py-3 text-center">{t("adminCommunityRoom", "colCreatedAt")}</th>
                  <th className="px-3 py-3 text-center">{t("adminCommunityRoom", "colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {(data.messages ?? []).map((m) => {
                  const isDeleted = !!m.deletedAt;
                  const isBusy = busyId === m._id;
                  return (
                    <tr key={m._id} className="border-t border-(--border)">
                      <td className={cn("px-3 py-3 font-mono text-xs", isRTL ? "text-right" : "text-left")}>{m._id}</td>
                      <td className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{senderName(m.senderId)}</td>
                      <td className={cn("px-3 py-3 max-w-[680px]", isRTL ? "text-right" : "text-left")}>
                        <div className="truncate text-(--text)">{m.content || (m.media?.length ? `[media:${m.media.length}]` : "-")}</div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {isDeleted ? t("adminCommunityRoom", "deletedDeleted") : t("adminCommunityRoom", "deletedActive")}
                      </td>
                      <td className="px-3 py-3 text-center">{m.createdAt ? new Date(m.createdAt).toLocaleString() : "-"}</td>
                      <td className="px-3 py-3">
                        <div className={cn("flex gap-2 justify-center", isRTL ? "flex-row-reverse" : "flex-row")}>
                          {!isDeleted ? (
                            <button
                              disabled={isBusy}
                              onClick={() => onDelete(m)}
                              className="px-2 py-1 rounded border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 disabled:opacity-50"
                            >
                              {t("adminCommunityRoom", "btnDelete")}
                            </button>
                          ) : (
                            <button
                              disabled={isBusy}
                              onClick={() => onRestore(m)}
                              className="px-2 py-1 rounded border border-(--border) bg-(--bg) disabled:opacity-50"
                            >
                              {t("adminCommunityRoom", "btnRestore")}
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
