"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { apiClient, getErrorMessage } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type { AdminRoomsResponse, AdminRoom } from "@/types/admin-community-room";

type DeletedFilter = "active" | "deleted" | "all";
type MembershipFilter = "all" | "free" | "paid";

export default function RoomsPage() {
  const { t, isRTL } = useLanguage();
  const [q, setQ] = useState("");
  const [deleted, setDeleted] = useState<DeletedFilter>("active");
  const [membershipType, setMembershipType] = useState<MembershipFilter>("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  const [data, setData] = useState<AdminRoomsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    params.set("deleted", deleted);
    if (membershipType !== "all") params.set("membershipType", membershipType);
    if (q.trim()) params.set("q", q.trim());
    return params.toString();
  }, [page, limit, deleted, membershipType, q]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<AdminRoomsResponse>(`/admin/rooms?${queryString}`);
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

  const ownerName = (o: AdminRoom["ownerId"]) => {
    if (!o || typeof o === "string") return "-";
    const full = [o.firstName, o.lastName].filter(Boolean).join(" ");
    return full || o.username || o._id;
  };

  const renderMembership = (m: string) => {
    if (m === "free") return t("adminCommunityRoom", "membershipFree");
    if (m === "paid") return t("adminCommunityRoom", "membershipPaid");
    return m;
  };

  const mutate = async (roomId: string, fn: () => Promise<void>) => {
    setBusyId(roomId);
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

  const onDelete = async (r: AdminRoom) => {
    if (!window.confirm(t("adminCommunityRoom", "confirmDelete"))) return;
    await mutate(r._id, async () => {
      await apiClient.post(`/admin/rooms/${r._id}/delete`);
    });
  };

  const onRestore = async (r: AdminRoom) => {
    if (!window.confirm(t("adminCommunityRoom", "confirmRestore"))) return;
    await mutate(r._id, async () => {
      await apiClient.post(`/admin/rooms/${r._id}/restore`);
    });
  };

  return (
    <div className={cn("space-y-4", isRTL ? "text-right" : "text-left")}>
      <div>
        <h1 className="text-2xl font-bold text-(--text)">{t("adminCommunityRoom", "roomsTitle")}</h1>
      </div>

      <div className={cn("flex gap-3 flex-wrap", isRTL ? "flex-row-reverse" : "flex-row")}>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder={t("adminCommunityRoom", "searchPlaceholder")}
          className="px-3 py-2 rounded-lg border border-(--border) bg-(--bg) text-(--text) w-[280px]"
        />
        <select
          value={membershipType}
          onChange={(e) => {
            setMembershipType(e.target.value as MembershipFilter);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-(--border) bg-(--bg) text-(--text)"
        >
          <option value="all">{t("adminCommunityRoom", "filterAll")}</option>
          <option value="free">{t("adminCommunityRoom", "membershipFree")}</option>
          <option value="paid">{t("adminCommunityRoom", "membershipPaid")}</option>
        </select>
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
            <table className="min-w-[1320px] w-full text-sm">
              <thead className="bg-(--bg)">
                <tr className="text-(--text-muted)">
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("adminCommunityRoom", "colId")}</th>
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("adminCommunityRoom", "colName")}</th>
                  <th className="px-3 py-3 text-center">{t("adminCommunityRoom", "colCategory")}</th>
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("adminCommunityRoom", "colOwner")}</th>
                  <th className="px-3 py-3 text-center">{t("adminCommunityRoom", "colRoomType")}</th>
                  <th className="px-3 py-3 text-center">{t("adminCommunityRoom", "colPrivate")}</th>
                  <th className="px-3 py-3 text-center">{t("adminCommunityRoom", "colMembers")}</th>
                  <th className="px-3 py-3 text-center">{t("adminCommunityRoom", "colDeleted")}</th>
                  <th className="px-3 py-3 text-center">{t("adminCommunityRoom", "colCreatedAt")}</th>
                  <th className="px-3 py-3 text-center">{t("adminCommunityRoom", "colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {(data.rooms ?? []).map((r) => {
                  const isDeleted = !!r.deletedAt;
                  const isBusy = busyId === r._id;
                  return (
                    <tr key={r._id} className="border-t border-(--border)">
                      <td className={cn("px-3 py-3 font-mono text-xs", isRTL ? "text-right" : "text-left")}>{r._id}</td>
                      <td className={cn("px-3 py-3 max-w-[420px]", isRTL ? "text-right" : "text-left")}>
                        <div className="truncate text-(--text)">{r.name}</div>
                      </td>
                      <td className="px-3 py-3 text-center">{r.category}</td>
                      <td className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{ownerName(r.ownerId)}</td>
                      <td className="px-3 py-3 text-center">{renderMembership(r.membershipType)}</td>
                      <td className="px-3 py-3 text-center">
                        {r.isPrivate ? t("adminCommunityRoom", "yes") : t("adminCommunityRoom", "no")}
                      </td>
                      <td className="px-3 py-3 text-center">{r.memberCount}</td>
                      <td className="px-3 py-3 text-center">
                        {isDeleted ? t("adminCommunityRoom", "deletedDeleted") : t("adminCommunityRoom", "deletedActive")}
                      </td>
                      <td className="px-3 py-3 text-center">{r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}</td>
                      <td className="px-3 py-3">
                        <div className={cn("flex gap-2 justify-center flex-wrap", isRTL ? "flex-row-reverse" : "flex-row")}>
                          <Link
                            href={`/dashboard/rooms/${r._id}/members`}
                            className="px-2 py-1 rounded border border-(--border) bg-(--bg)"
                          >
                            {t("adminCommunityRoom", "btnViewMembers")}
                          </Link>
                          <Link
                            href={`/dashboard/rooms/${r._id}/messages`}
                            className="px-2 py-1 rounded border border-(--border) bg-(--bg)"
                          >
                            {t("adminCommunityRoom", "btnViewMessages")}
                          </Link>
                          {!isDeleted ? (
                            <button
                              disabled={isBusy}
                              onClick={() => onDelete(r)}
                              className="px-2 py-1 rounded border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 disabled:opacity-50"
                            >
                              {t("adminCommunityRoom", "btnDelete")}
                            </button>
                          ) : (
                            <button
                              disabled={isBusy}
                              onClick={() => onRestore(r)}
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
