"use client";

import { useEffect, useMemo, useState } from "react";

import { apiClient, getErrorMessage } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type { AdminMediaListResponse, AdminMediaItem } from "@/types/admin-content";

type StatusFilter = "active" | "deleted" | "all";

export default function AdminMediaPage() {
  const { t, isRTL } = useLanguage();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("active");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  const [data, setData] = useState<AdminMediaListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    params.set("status", status);
    params.set("type", type);
    if (q.trim()) params.set("q", q.trim());
    return params.toString();
  }, [page, limit, status, type, q]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get<AdminMediaListResponse>(`/admin/content/media?${queryString}`);
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

  const onDelete = async (m: AdminMediaItem) => {
    if (!window.confirm(t("adminContent", "confirmDelete"))) return;
    setBusyId(m._id);
    try {
      await apiClient.post(`/admin/content/media/${m._id}/delete`);
      setPage(1);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const onRestore = async (m: AdminMediaItem) => {
    if (!window.confirm(t("adminContent", "confirmRestore"))) return;
    setBusyId(m._id);
    try {
      await apiClient.post(`/admin/content/media/${m._id}/restore`);
      setPage(1);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className={cn("space-y-4", isRTL ? "text-right" : "text-left")}>
      <div>
        <h1 className="text-2xl font-bold text-(--text)">{t("adminContent", "mediaTitle")}</h1>
      </div>

      <div className={cn("flex gap-3 flex-wrap", isRTL ? "flex-row-reverse" : "flex-row")}>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder={t("adminContent", "searchPlaceholderMedia")}
          className="w-full sm:w-[420px] px-3 py-2 rounded-lg border border-(--border) bg-(--bg) text-(--text)"
        />

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as StatusFilter);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-(--border) bg-(--bg) text-(--text)"
        >
          <option value="active">{t("adminContent", "statusActive")}</option>
          <option value="deleted">{t("adminContent", "statusDeleted")}</option>
          <option value="all">{t("adminContent", "statusAll")}</option>
        </select>

        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-(--border) bg-(--bg) text-(--text)"
        >
          <option value="all">{t("adminContent", "typeAll")}</option>
          <option value="image">image</option>
          <option value="video">video</option>
          <option value="audio">audio</option>
          <option value="voice_note">voice_note</option>
          <option value="file">file</option>
        </select>
      </div>

      {loading ? <div className="text-(--text-muted)">{t("adminContent", "loading")}</div> : null}
      {error ? (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {!loading && data ? (
        <>
          <div className="overflow-x-auto rounded-xl border border-(--border) bg-(--bg-card)">
            <table className="min-w-[980px] w-full text-sm">
              <thead className="bg-(--bg)">
                <tr className="text-(--text-muted)">
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("adminContent", "colId")}</th>
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("adminContent", "colPostId")}</th>
                  <th className="px-3 py-3 text-center">{t("adminContent", "type")}</th>
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>URL</th>
                  <th className="px-3 py-3 text-center">{t("adminContent", "status")}</th>
                  <th className="px-3 py-3 text-center">{t("adminContent", "colCreatedAt")}</th>
                  <th className="px-3 py-3 text-center">{t("adminContent", "colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {data.media.map((m) => {
                  const deleted = !!m.deletedAt;
                  return (
                    <tr key={m._id} className="border-t border-(--border)">
                      <td className={cn("px-3 py-3 font-mono text-xs", isRTL ? "text-right" : "text-left")}>{m._id}</td>
                      <td className={cn("px-3 py-3 font-mono text-xs", isRTL ? "text-right" : "text-left")}>{m.postId}</td>
                      <td className="px-3 py-3 text-center">{m.type}</td>
                      <td className={cn("px-3 py-3 max-w-[520px]", isRTL ? "text-right" : "text-left")}>
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary-600 dark:text-primary-300 underline truncate block"
                        >
                          {m.url}
                        </a>
                      </td>
                      <td className="px-3 py-3 text-center">{deleted ? t("adminContent", "statusDeleted") : t("adminContent", "statusActive")}</td>
                      <td className="px-3 py-3 text-center">{m.createdAt ? new Date(m.createdAt).toLocaleString() : "-"}</td>
                      <td className="px-3 py-3 text-center">
                        {!deleted ? (
                          <button
                            disabled={busyId === m._id}
                            onClick={() => onDelete(m)}
                            className="px-3 py-1.5 rounded-md border border-(--border) bg-(--bg) hover:bg-primary-50 dark:hover:bg-primary-900/20"
                          >
                            {t("adminContent", "btnDelete")}
                          </button>
                        ) : (
                          <button
                            disabled={busyId === m._id}
                            onClick={() => onRestore(m)}
                            className="px-3 py-1.5 rounded-md border border-(--border) bg-(--bg) hover:bg-primary-50 dark:hover:bg-primary-900/20"
                          >
                            {t("adminContent", "btnRestore")}
                          </button>
                        )}
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
              {t("adminContent", "paginationPrev")}
            </button>
            <div className="text-sm text-(--text-muted)">
              {t("adminContent", "page")} {data.pagination.page} / {data.pagination.pages}
            </div>
            <button
              disabled={!canNext}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-2 rounded-lg border border-(--border) bg-(--bg) disabled:opacity-50"
            >
              {t("adminContent", "paginationNext")}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
