"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { apiClient, getErrorMessage } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type {
  AdminCommunityMember,
  AdminCommunityMembersResponse,
} from "@/types/admin-community-room";

type DeletedFilter = "active" | "deleted" | "all";

type RoleFilter = "all" | "owner" | "admin" | "member";

export default function AdminCommunityMembersPage() {
  const params = useParams<{ communityId: string }>();
  const communityId = params?.communityId;

  const { t, isRTL } = useLanguage();
  const [page, setPage] = useState(1);
  const limit = 50;
  const [role, setRole] = useState<RoleFilter>("all");
  const [deleted, setDeleted] = useState<DeletedFilter>("active");

  const [data, setData] = useState<AdminCommunityMembersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("limit", String(limit));
    p.set("deleted", deleted);
    if (role !== "all") p.set("role", role);
    return p.toString();
  }, [page, limit, deleted, role]);

  const load = async () => {
    if (!communityId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<AdminCommunityMembersResponse>(
        `/admin/communities/${communityId}/members?${queryString}`
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

  const userName = (u: AdminCommunityMember["userId"]) => {
    if (!u || typeof u === "string") return "-";
    const full = [u.firstName, u.lastName].filter(Boolean).join(" ");
    return full || u.username || u._id;
  };

  const renderRole = (r: string) => {
    if (r === "owner") return t("adminCommunityRoom", "roleOwner");
    if (r === "admin") return t("adminCommunityRoom", "roleAdmin");
    if (r === "member") return t("adminCommunityRoom", "roleMember");
    return r;
  };

  const mutate = async (memberId: string, fn: () => Promise<void>) => {
    setBusyId(memberId);
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

  const setMemberRole = async (m: AdminCommunityMember) => {
    const nextRole = window.prompt(t("adminCommunityRoom", "btnSetRole"), m.role);
    if (!nextRole) return;
    await mutate(m._id, async () => {
      await apiClient.patch(`/admin/communities/${communityId}/members/${m._id}/role`, {
        role: nextRole,
      });
    });
  };

  const removeMember = async (m: AdminCommunityMember) => {
    if (!window.confirm(t("adminCommunityRoom", "confirmRemove"))) return;
    await mutate(m._id, async () => {
      await apiClient.post(`/admin/communities/${communityId}/members/${m._id}/remove`);
    });
  };

  return (
    <div className={cn("space-y-4", isRTL ? "text-right" : "text-left")}>
      <div>
        <h1 className="text-2xl font-bold text-(--text)">{t("adminCommunityRoom", "membersTitle")}</h1>
        <div className="text-xs text-(--text-muted) font-mono">{communityId}</div>
      </div>

      <div className={cn("flex gap-3 flex-wrap", isRTL ? "flex-row-reverse" : "flex-row")}>
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value as RoleFilter);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-(--border) bg-(--bg) text-(--text)"
        >
          <option value="all">{t("adminCommunityRoom", "filterAll")}</option>
          <option value="owner">{t("adminCommunityRoom", "roleOwner")}</option>
          <option value="admin">{t("adminCommunityRoom", "roleAdmin")}</option>
          <option value="member">{t("adminCommunityRoom", "roleMember")}</option>
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
            <table className="min-w-[980px] w-full text-sm">
              <thead className="bg-(--bg)">
                <tr className="text-(--text-muted)">
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("adminCommunityRoom", "colId")}</th>
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("adminCommunityRoom", "colUser")}</th>
                  <th className="px-3 py-3 text-center">{t("adminCommunityRoom", "colRole")}</th>
                  <th className="px-3 py-3 text-center">{t("adminCommunityRoom", "colDeleted")}</th>
                  <th className="px-3 py-3 text-center">{t("adminCommunityRoom", "colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {(data.members ?? []).map((m) => {
                  const isBusy = busyId === m._id;
                  const isDeleted = !!m.deletedAt;
                  return (
                    <tr key={m._id} className="border-t border-(--border)">
                      <td className={cn("px-3 py-3 font-mono text-xs", isRTL ? "text-right" : "text-left")}>{m._id}</td>
                      <td className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{userName(m.userId)}</td>
                      <td className="px-3 py-3 text-center">{renderRole(m.role)}</td>
                      <td className="px-3 py-3 text-center">
                        {isDeleted ? t("adminCommunityRoom", "deletedDeleted") : t("adminCommunityRoom", "deletedActive")}
                      </td>
                      <td className="px-3 py-3">
                        <div className={cn("flex gap-2 justify-center flex-wrap", isRTL ? "flex-row-reverse" : "flex-row")}>
                          <button
                            disabled={isBusy}
                            onClick={() => setMemberRole(m)}
                            className="px-2 py-1 rounded border border-(--border) bg-(--bg) disabled:opacity-50"
                          >
                            {t("adminCommunityRoom", "btnSetRole")}
                          </button>
                          <button
                            disabled={isBusy || isDeleted}
                            onClick={() => removeMember(m)}
                            className="px-2 py-1 rounded border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 disabled:opacity-50"
                          >
                            {t("adminCommunityRoom", "btnRemoveMember")}
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
