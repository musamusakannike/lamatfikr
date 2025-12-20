"use client";

import { useEffect, useMemo, useState } from "react";

import { apiClient, getErrorMessage } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type { AdminUserListItem, AdminUsersListResponse } from "@/types/admin-users";
import UserProfileModal from "./UserProfileModal";

type Mode = "all" | "banned" | "verified";

type BatchAction =
  | "none"
  | "ban"
  | "unban"
  | "revokeVerified"
  | "grantVerifiedDays"
  | "setEmailVerifiedTrue"
  | "setEmailVerifiedFalse";

function formatDate(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

export default function UsersTable({ mode }: { mode: Mode }) {
  const { t, isRTL } = useLanguage();

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [data, setData] = useState<AdminUsersListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const selectedIds = useMemo(() => Object.keys(selected).filter((id) => selected[id]), [selected]);

  const [batchAction, setBatchAction] = useState<BatchAction>("none");
  const [grantDays, setGrantDays] = useState(30);

  // Profile modal state
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (q.trim()) params.set("q", q.trim());
    if (mode === "banned") params.set("banned", "true");
    if (mode === "verified") params.set("verified", "true");
    return params.toString();
  }, [page, limit, q, mode]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<AdminUsersListResponse>(`/admin/users?${queryString}`);
      setData(res);
      setSelected({});
    } catch (e) {
      setError(getErrorMessage(e) || t("adminUsers", "failedToLoad"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  const toggleAll = (checked: boolean) => {
    const next: Record<string, boolean> = {};
    (data?.items ?? []).forEach((u) => {
      next[u.id] = checked;
    });
    setSelected(next);
  };

  const updateUser = async (userId: string, payload: Record<string, unknown>) => {
    await apiClient.patch(`/admin/users/${userId}`, payload);
    await fetchUsers();
  };

  const runBatch = async () => {
    if (batchAction === "none" || selectedIds.length === 0) return;

    if (batchAction === "ban") {
      await apiClient.post("/admin/users/batch", { ids: selectedIds, action: "ban" });
    }
    if (batchAction === "unban") {
      await apiClient.post("/admin/users/batch", { ids: selectedIds, action: "unban" });
    }
    if (batchAction === "revokeVerified") {
      await apiClient.post("/admin/users/batch", { ids: selectedIds, action: "revokeVerified" });
    }
    if (batchAction === "grantVerifiedDays") {
      await apiClient.post("/admin/users/batch", {
        ids: selectedIds,
        action: "grantVerifiedDays",
        payload: { days: grantDays },
      });
    }
    if (batchAction === "setEmailVerifiedTrue") {
      await apiClient.post("/admin/users/batch", {
        ids: selectedIds,
        action: "setEmailVerified",
        payload: { emailVerified: true },
      });
    }
    if (batchAction === "setEmailVerifiedFalse") {
      await apiClient.post("/admin/users/batch", {
        ids: selectedIds,
        action: "setEmailVerified",
        payload: { emailVerified: false },
      });
    }

    setBatchAction("none");
    await fetchUsers();
  };

  const title =
    mode === "banned"
      ? t("adminUsers", "bannedTitle")
      : mode === "verified"
        ? t("adminUsers", "verifiedTitle")
        : t("adminUsers", "title");

  return (
    <div className={cn("space-y-4", isRTL ? "text-right" : "text-left")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-(--text)">{title}</h1>
          <div className="text-sm text-(--text-muted)">{t("adminUsers", "filters")}</div>
        </div>

        <div className={cn("flex flex-col gap-2 sm:flex-row", isRTL ? "sm:flex-row-reverse" : "")}
        >
          <input
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            placeholder={t("adminUsers", "searchPlaceholder")}
            className="w-full sm:w-80 px-3 py-2 rounded-lg border border-(--border) bg-(--bg) text-(--text)"
          />

          <button
            onClick={() => fetchUsers()}
            className="px-3 py-2 rounded-lg border border-(--border) bg-(--bg-card) hover:bg-primary-50 dark:hover:bg-primary-900/20 text-sm"
          >
            {t("adminUsers", "filters")}
          </button>
        </div>
      </div>

      <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between", isRTL ? "sm:flex-row-reverse" : "")}
      >
        <div className="text-sm text-(--text-muted)">
          {t("adminUsers", "batchSelected")}: {selectedIds.length}
        </div>

        <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-center", isRTL ? "sm:flex-row-reverse" : "")}
        >
          <select
            value={batchAction}
            onChange={(e) => setBatchAction(e.target.value as BatchAction)}
            className="px-3 py-2 rounded-lg border border-(--border) bg-(--bg) text-(--text) text-sm"
          >
            <option value="none">{t("adminUsers", "batchNone")}</option>
            <option value="ban">{t("adminUsers", "actionBan")}</option>
            <option value="unban">{t("adminUsers", "actionUnban")}</option>
            <option value="revokeVerified">{t("adminUsers", "actionRevokeVerified")}</option>
            <option value="grantVerifiedDays">{t("adminUsers", "actionGrantVerified")}</option>
            <option value="setEmailVerifiedTrue">
              {t("adminUsers", "actionSetEmailVerified")} ({t("adminUsers", "emailVerifiedTrue")})
            </option>
            <option value="setEmailVerifiedFalse">
              {t("adminUsers", "actionSetEmailVerified")} ({t("adminUsers", "emailVerifiedFalse")})
            </option>
          </select>

          {batchAction === "grantVerifiedDays" ? (
            <div className={cn("flex items-center gap-2", isRTL ? "flex-row-reverse" : "")}
            >
              <input
                type="number"
                min={1}
                max={365}
                value={grantDays}
                onChange={(e) => setGrantDays(parseInt(e.target.value, 10) || 30)}
                className="w-24 px-3 py-2 rounded-lg border border-(--border) bg-(--bg) text-(--text) text-sm"
                aria-label={t("adminUsers", "grantDaysLabel")}
              />
              <div className="text-xs text-(--text-muted)">{t("adminUsers", "grantDaysHint")}</div>
            </div>
          ) : null}

          <button
            disabled={selectedIds.length === 0 || batchAction === "none"}
            onClick={() => runBatch()}
            className={cn(
              "px-3 py-2 rounded-lg border border-(--border) text-sm",
              selectedIds.length === 0 || batchAction === "none"
                ? "opacity-50 cursor-not-allowed"
                : "bg-primary-600 text-white hover:bg-primary-700"
            )}
          >
            {t("adminUsers", "batchApply")}
          </button>
        </div>
      </div>

      {loading ? <div className="text-(--text-muted)">{t("adminUsers", "loading")}</div> : null}
      {error ? (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {!loading && !error && data ? (
        <div className="space-y-3">
          <div className="md:hidden space-y-3">
            <div className={cn("flex items-center justify-between rounded-xl border border-(--border) bg-(--bg-card) px-3 py-2", isRTL ? "flex-row-reverse" : "")}
            >
              <label className={cn("flex items-center gap-2 text-sm text-(--text-muted)", isRTL ? "flex-row-reverse" : "")}
              >
                <input
                  type="checkbox"
                  checked={data.items.length > 0 && selectedIds.length === data.items.length}
                  onChange={(e) => toggleAll(e.target.checked)}
                />
                <span>{t("adminUsers", "batchSelected")}: {selectedIds.length}</span>
              </label>
            </div>

            {data.items.map((u) => (
              <UserCard
                key={u.id}
                user={u}
                selected={!!selected[u.id]}
                onSelect={(checked) => setSelected((prev) => ({ ...prev, [u.id]: checked }))}
                onUpdate={updateUser}
                onViewProfile={(userId) => {
                  setSelectedUserId(userId);
                  setProfileModalOpen(true);
                }}
              />
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto rounded-xl border border-(--border) bg-(--bg-card)">
            <table className="min-w-[1100px] w-full text-sm">
              <thead className="bg-(--bg)">
                <tr className="text-(--text-muted)">
                  <th className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={data.items.length > 0 && selectedIds.length === data.items.length}
                      onChange={(e) => toggleAll(e.target.checked)}
                    />
                  </th>
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("adminUsers", "colUser")}</th>
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("adminUsers", "colUsername")}</th>
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("adminUsers", "colEmail")}</th>
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("adminUsers", "colRole")}</th>
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("adminUsers", "colStatus")}</th>
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("adminUsers", "colVerified")}</th>
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("adminUsers", "colEmailVerified")}</th>
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("adminUsers", "colCreatedAt")}</th>
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("adminUsers", "colLastActive")}</th>
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("adminUsers", "colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    selected={!!selected[u.id]}
                    onSelect={(checked) => setSelected((prev) => ({ ...prev, [u.id]: checked }))}
                    onUpdate={updateUser}
                    onViewProfile={(userId) => {
                      setSelectedUserId(userId);
                      setProfileModalOpen(true);
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {!loading && !error && data ? (
        <div className={cn("flex items-center justify-between", isRTL ? "flex-row-reverse" : "")}
        >
          <button
            className="px-3 py-2 rounded-lg border border-(--border) bg-(--bg-card) hover:bg-primary-50 dark:hover:bg-primary-900/20 text-sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            {t("adminUsers", "paginationPrev")}
          </button>

          <div className="text-sm text-(--text-muted)">
            {t("adminUsers", "page")}: {data.page} / {data.pages}
          </div>

          <button
            className="px-3 py-2 rounded-lg border border-(--border) bg-(--bg-card) hover:bg-primary-50 dark:hover:bg-primary-900/20 text-sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= data.pages}
          >
            {t("adminUsers", "paginationNext")}
          </button>
        </div>
      ) : null}

      {/* User Profile Modal */}
      {selectedUserId && (
        <UserProfileModal
          isOpen={profileModalOpen}
          onClose={() => {
            setProfileModalOpen(false);
            setSelectedUserId(null);
          }}
          userId={selectedUserId}
          onProfileUpdate={() => fetchUsers()}
        />
      )}
    </div>
  );
}

function UserCard({
  user,
  selected,
  onSelect,
  onUpdate,
  onViewProfile,
}: {
  user: AdminUserListItem;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onUpdate: (userId: string, payload: Record<string, unknown>) => Promise<void>;
  onViewProfile: (userId: string) => void;
}) {
  const { t, isRTL } = useLanguage();

  const [role, setRole] = useState(user.role);
  const [grantDays, setGrantDays] = useState(30);

  return (
    <div className="rounded-xl border border-(--border) bg-(--bg-card) p-3">
      <div className={cn("flex items-start justify-between gap-3", isRTL ? "flex-row-reverse" : "")}
      >
        <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "")}
        >
          <div className="h-10 w-10 rounded-full bg-(--border) overflow-hidden shrink-0">
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt={user.username} className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-(--text) truncate">{user.firstName} {user.lastName}</div>
            <div className="text-xs text-(--text-muted) truncate">{user.username}</div>
            <div className="text-xs text-(--text-muted) truncate">{user.email}</div>
          </div>
        </div>

        <div className={cn("flex items-center gap-2 shrink-0", isRTL ? "flex-row-reverse" : "")}
        >
          <span
            className={cn(
              "px-2 py-1 rounded-full text-xs",
              user.isBanned
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200"
                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200"
            )}
          >
            {user.isBanned ? t("adminUsers", "statusBanned") : t("adminUsers", "statusActive")}
          </span>

          <label className={cn("flex items-center gap-2 text-sm", isRTL ? "flex-row-reverse" : "")}
          >
            <input type="checkbox" checked={selected} onChange={(e) => onSelect(e.target.checked)} />
          </label>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2">
        <div className={cn("flex items-center justify-between gap-3", isRTL ? "flex-row-reverse" : "")}
        >
          <div className="text-xs text-(--text-muted)">{t("adminUsers", "colRole")}</div>
          <div className={cn("flex items-center gap-2", isRTL ? "flex-row-reverse" : "")}
          >
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="px-2 py-1 rounded-md border border-(--border) bg-(--bg) text-(--text)"
            >
              <option value="user">user</option>
              <option value="moderator">moderator</option>
              <option value="admin">admin</option>
              <option value="superadmin">superadmin</option>
            </select>
            <button
              className="px-2 py-1 rounded-md border border-(--border) bg-(--bg-card) hover:bg-primary-50 dark:hover:bg-primary-900/20"
              onClick={() => onUpdate(user.id, { role })}
            >
              {t("adminUsers", "actionSetRole")}
            </button>
          </div>
        </div>

        <div className={cn("flex items-center justify-between gap-3", isRTL ? "flex-row-reverse" : "")}
        >
          <div className="text-xs text-(--text-muted)">{t("adminUsers", "colVerified")}</div>
          <div className="text-sm text-(--text)">
            {user.effectiveVerified ? (
              <div>
                {t("adminUsers", "yes")}
                {user.paidVerifiedUntil ? (
                  <div className="text-xs text-(--text-muted)">{formatDate(user.paidVerifiedUntil)}</div>
                ) : null}
              </div>
            ) : (
              <span className="text-(--text-muted)">{t("adminUsers", "no")}</span>
            )}
          </div>
        </div>

        <div className={cn("flex items-center justify-between gap-3", isRTL ? "flex-row-reverse" : "")}
        >
          <div className="text-xs text-(--text-muted)">{t("adminUsers", "colEmailVerified")}</div>
          <span
            className={cn(
              "px-2 py-1 rounded-full text-xs",
              user.emailVerified
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200"
                : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
            )}
          >
            {user.emailVerified ? t("adminUsers", "yes") : t("adminUsers", "no")}
          </span>
        </div>

        <div className={cn("flex items-center justify-between gap-3", isRTL ? "flex-row-reverse" : "")}
        >
          <div className="text-xs text-(--text-muted)">{t("adminUsers", "colCreatedAt")}</div>
          <div className="text-xs text-(--text-muted)">{formatDate(user.createdAt)}</div>
        </div>

        <div className={cn("flex items-center justify-between gap-3", isRTL ? "flex-row-reverse" : "")}
        >
          <div className="text-xs text-(--text-muted)">{t("adminUsers", "colLastActive")}</div>
          <div className="text-xs text-(--text-muted)">{formatDate(user.lastActive)}</div>
        </div>
      </div>

      <div className={cn("mt-3 flex flex-wrap gap-2", isRTL ? "flex-row-reverse" : "")}
      >
        <button
          className={cn(
            "px-2 py-1 rounded-md border border-(--border)",
            user.isBanned ? "bg-(--bg-card)" : "bg-red-50 dark:bg-red-900/20"
          )}
          onClick={() => onUpdate(user.id, { isBanned: !user.isBanned })}
        >
          {user.isBanned ? t("adminUsers", "actionUnban") : t("adminUsers", "actionBan")}
        </button>

        <button
          className="px-2 py-1 rounded-md border border-(--border) bg-(--bg-card) hover:bg-primary-50 dark:hover:bg-primary-900/20"
          onClick={() => onUpdate(user.id, { emailVerified: !user.emailVerified })}
        >
          {t("adminUsers", "actionSetEmailVerified")}
        </button>

        <div className={cn("flex items-center gap-2", isRTL ? "flex-row-reverse" : "")}
        >
          <input
            type="number"
            min={1}
            max={365}
            value={grantDays}
            onChange={(e) => setGrantDays(parseInt(e.target.value, 10) || 30)}
            className="w-20 px-2 py-1 rounded-md border border-(--border) bg-(--bg)"
          />
          <button
            className="px-2 py-1 rounded-md border border-(--border) bg-(--bg-card) hover:bg-primary-50 dark:hover:bg-primary-900/20"
            onClick={() => onUpdate(user.id, { grantVerifiedDays: grantDays })}
          >
            {t("adminUsers", "actionGrantVerified")}
          </button>
        </div>

        <button
          className="px-2 py-1 rounded-md border border-(--border) bg-(--bg-card) hover:bg-primary-50 dark:hover:bg-primary-900/20"
          onClick={() => onUpdate(user.id, { revokeVerified: true })}
        >
          {t("adminUsers", "actionRevokeVerified")}
        </button>

        <button
          className="px-2 py-1 rounded-md border border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/30"
          onClick={() => onViewProfile(user.id)}
        >
          {t("adminUserProfile", "viewProfile")}
        </button>
      </div>
    </div>
  );
}

function UserRow({
  user,
  selected,
  onSelect,
  onUpdate,
  onViewProfile,
}: {
  user: AdminUserListItem;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onUpdate: (userId: string, payload: Record<string, unknown>) => Promise<void>;
  onViewProfile: (userId: string) => void;
}) {
  const { t, isRTL } = useLanguage();

  const [role, setRole] = useState(user.role);
  const [grantDays, setGrantDays] = useState(30);

  return (
    <tr className="border-t border-(--border)">
      <td className="px-3 py-3">
        <input type="checkbox" checked={selected} onChange={(e) => onSelect(e.target.checked)} />
      </td>

      <td className="px-3 py-3">
        <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "")}
        >
          <div className="h-9 w-9 rounded-full bg-(--border) overflow-hidden shrink-0">
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt={user.username} className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div>
            <div className="font-medium text-(--text)">{user.firstName} {user.lastName}</div>
            <div className="text-xs text-(--text-muted)">{user.id}</div>
          </div>
        </div>
      </td>

      <td className="px-3 py-3 text-(--text)">{user.username}</td>
      <td className="px-3 py-3 text-(--text)">{user.email}</td>

      <td className="px-3 py-3">
        <div className={cn("flex items-center gap-2", isRTL ? "flex-row-reverse" : "")}
        >
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="px-2 py-1 rounded-md border border-(--border) bg-(--bg) text-(--text)"
          >
            <option value="user">user</option>
            <option value="moderator">moderator</option>
            <option value="admin">admin</option>
            <option value="superadmin">superadmin</option>
          </select>
          <button
            className="px-2 py-1 rounded-md border border-(--border) bg-(--bg-card) hover:bg-primary-50 dark:hover:bg-primary-900/20"
            onClick={() => onUpdate(user.id, { role })}
          >
            {t("adminUsers", "actionSetRole")}
          </button>
        </div>
      </td>

      <td className="px-3 py-3">
        <span
          className={cn(
            "px-2 py-1 rounded-full text-xs",
            user.isBanned
              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200"
              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200"
          )}
        >
          {user.isBanned ? t("adminUsers", "statusBanned") : t("adminUsers", "statusActive")}
        </span>
      </td>

      <td className="px-3 py-3">
        {user.effectiveVerified ? (
          <div className="text-(--text)">
            {t("adminUsers", "yes")}
            {user.paidVerifiedUntil ? (
              <div className="text-xs text-(--text-muted)">{formatDate(user.paidVerifiedUntil)}</div>
            ) : null}
          </div>
        ) : (
          <span className="text-(--text-muted)">{t("adminUsers", "no")}</span>
        )}
      </td>

      <td className="px-3 py-3">
        <span className={cn("px-2 py-1 rounded-full text-xs", user.emailVerified ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200" : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200")}
        >
          {user.emailVerified ? t("adminUsers", "yes") : t("adminUsers", "no")}
        </span>
      </td>

      <td className="px-3 py-3 text-(--text-muted)">{formatDate(user.createdAt)}</td>
      <td className="px-3 py-3 text-(--text-muted)">{formatDate(user.lastActive)}</td>

      <td className="px-3 py-3">
        <div className={cn("flex flex-wrap gap-2", isRTL ? "flex-row-reverse" : "")}
        >
          <button
            className={cn(
              "px-2 py-1 rounded-md border border-(--border)",
              user.isBanned ? "bg-(--bg-card)" : "bg-red-50 dark:bg-red-900/20"
            )}
            onClick={() => onUpdate(user.id, { isBanned: !user.isBanned })}
          >
            {user.isBanned ? t("adminUsers", "actionUnban") : t("adminUsers", "actionBan")}
          </button>

          <button
            className="px-2 py-1 rounded-md border border-(--border) bg-(--bg-card) hover:bg-primary-50 dark:hover:bg-primary-900/20"
            onClick={() => onUpdate(user.id, { emailVerified: !user.emailVerified })}
          >
            {t("adminUsers", "actionSetEmailVerified")}
          </button>

          <div className={cn("flex items-center gap-2", isRTL ? "flex-row-reverse" : "")}
          >
            <input
              type="number"
              min={1}
              max={365}
              value={grantDays}
              onChange={(e) => setGrantDays(parseInt(e.target.value, 10) || 30)}
              className="w-20 px-2 py-1 rounded-md border border-(--border) bg-(--bg)"
            />
            <button
              className="px-2 py-1 rounded-md border border-(--border) bg-(--bg-card) hover:bg-primary-50 dark:hover:bg-primary-900/20"
              onClick={() => onUpdate(user.id, { grantVerifiedDays: grantDays })}
            >
              {t("adminUsers", "actionGrantVerified")}
            </button>
          </div>

          <button
            className="px-2 py-1 rounded-md border border-(--border) bg-(--bg-card) hover:bg-primary-50 dark:hover:bg-primary-900/20"
            onClick={() => onUpdate(user.id, { revokeVerified: true })}
          >
            {t("adminUsers", "actionRevokeVerified")}
          </button>

          <button
            className="px-2 py-1 rounded-md border border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/30"
            onClick={() => onViewProfile(user.id)}
          >
            {t("adminUserProfile", "viewProfile")}
          </button>
        </div>
      </td>
    </tr>
  );
}
