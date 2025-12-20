"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import {
  Search,
  Filter,
  MoreVertical,
  Shield,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Mail,
  Calendar,
  BadgeCheck,
  User as UserIcon,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

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
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatDateTime(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
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

  // Grant Verified Dialog
  const [grantDialogOpen, setGrantDialogOpen] = useState(false);
  const [grantTargetId, setGrantTargetId] = useState<string | null>(null); // null means batch

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
    try {
      await apiClient.patch(`/admin/users/${userId}`, payload);
      await fetchUsers();
    } catch (error) {
      console.error("Failed to update user", error);
      // Could add toast notification here
    }
  };

  const executeGrantVerified = async (days: number) => {
    if (grantTargetId) {
      // Single user
      await updateUser(grantTargetId, { grantVerifiedDays: days });
    } else {
      // Batch
      await apiClient.post("/admin/users/batch", {
        ids: selectedIds,
        action: "grantVerifiedDays",
        payload: { days },
      });
      setBatchAction("none");
      await fetchUsers();
    }
    setGrantDialogOpen(false);
    setGrantTargetId(null);
  };

  const runBatch = async () => {
    if (batchAction === "none" || selectedIds.length === 0) return;

    if (batchAction === "grantVerifiedDays") {
      setGrantTargetId(null);
      setGrantDialogOpen(true);
      return;
    }

    try {
      if (batchAction === "ban") {
        await apiClient.post("/admin/users/batch", { ids: selectedIds, action: "ban" });
      }
      if (batchAction === "unban") {
        await apiClient.post("/admin/users/batch", { ids: selectedIds, action: "unban" });
      }
      if (batchAction === "revokeVerified") {
        await apiClient.post("/admin/users/batch", { ids: selectedIds, action: "revokeVerified" });
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
    } catch (e) {
      // Handle error
      console.error(e);
    }
  };

  const title =
    mode === "banned"
      ? t("adminUsers", "bannedTitle")
      : mode === "verified"
        ? t("adminUsers", "verifiedTitle")
        : t("adminUsers", "title");

  return (
    <div className={cn("space-y-6 relative", isRTL ? "text-right" : "text-left")}>
      {/* Header & Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-(--bg-card) p-4 rounded-xl border border-(--border) shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-(--text) flex items-center gap-2">
            {title}
            <span className="text-sm font-normal text-(--text-muted) bg-(--bg) px-2 py-0.5 rounded-full border border-(--border)">
              {data?.total || 0}
            </span>
          </h1>
          <p className="text-sm text-(--text-muted) mt-1">{t("adminUsers", "filters")}</p>
        </div>

        <div className={cn("flex flex-col gap-3 sm:flex-row", isRTL ? "sm:flex-row-reverse" : "")}>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" size={16} />
            <input
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
              placeholder={t("adminUsers", "searchPlaceholder")}
              className="w-full sm:w-64 pl-9 pr-4 py-2 rounded-lg border border-(--border) bg-(--bg) text-(--text) text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
            />
          </div>

          <button
            onClick={() => fetchUsers()}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-(--border) bg-(--bg) hover:bg-(--bg-muted) text-(--text) text-sm font-medium transition-colors"
          >
            <Filter size={16} />
            {t("adminUsers", "filters")}
          </button>
        </div>
      </div>

      {/* Batch Actions Bar (Conditional) */}
      {selectedIds.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-xl animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-medium text-primary-700 dark:text-primary-300 flex items-center gap-2">
            <CheckCircle size={16} />
            {t("adminUsers", "batchSelected")}: <b>{selectedIds.length}</b>
          </span>

          <div className="flex items-center gap-2">
            <select
              value={batchAction}
              onChange={(e) => setBatchAction(e.target.value as BatchAction)}
              className="px-3 py-1.5 rounded-lg border border-primary-200 dark:border-primary-700 bg-white dark:bg-black text-sm outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="none">{t("adminUsers", "batchNone")}</option>
              <option value="ban">{t("adminUsers", "actionBan")}</option>
              <option value="unban">{t("adminUsers", "actionUnban")}</option>
              <option value="revokeVerified">{t("adminUsers", "actionRevokeVerified")}</option>
              <option value="grantVerifiedDays">{t("adminUsers", "actionGrantVerified")}</option>
              <option value="setEmailVerifiedTrue">{t("adminUsers", "actionSetEmailVerified")} (True)</option>
              <option value="setEmailVerifiedFalse">{t("adminUsers", "actionSetEmailVerified")} (False)</option>
            </select>

            <button
              onClick={runBatch}
              disabled={batchAction === "none"}
              className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t("adminUsers", "batchApply")}
            </button>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 flex items-center gap-3">
          <ShieldAlert size={20} />
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && !data && (
        <div className="flex flex-col items-center justify-center py-20 text-(--text-muted)">
          <Loader2 size={32} className="animate-spin mb-4 text-primary-500" />
          <p>{t("adminUsers", "loading")}</p>
        </div>
      )}

      {/* Content */}
      {!loading && !error && data ? (
        <div className="space-y-4">

          {/* Desktop Table */}
          <div className="hidden md:block rounded-xl border border-(--border) bg-(--bg-card) overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-(--bg-muted) border-b border-(--border)">
                  <tr className="text-(--text-muted) uppercase text-xs font-semibold tracking-wider">
                    <th className="px-5 py-4 w-12 text-center">
                      <input
                        type="checkbox"
                        className="rounded border-(--border) text-primary-600 focus:ring-primary-500 cursor-pointer"
                        checked={data.items.length > 0 && selectedIds.length === data.items.length}
                        onChange={(e) => toggleAll(e.target.checked)}
                      />
                    </th>
                    <th className={cn("px-5 py-4", isRTL ? "text-right" : "text-left")}>{t("adminUsers", "colUser")}</th>
                    <th className={cn("px-5 py-4", isRTL ? "text-right" : "text-left")}>{t("adminUsers", "colRole")}</th>
                    <th className={cn("px-5 py-4", isRTL ? "text-right" : "text-left")}>{t("adminUsers", "colStatus")}</th>
                    <th className={cn("px-5 py-4", isRTL ? "text-right" : "text-left")}>{t("adminUsers", "colVerified")}</th>
                    <th className={cn("px-5 py-4", isRTL ? "text-right" : "text-left")}>{t("adminUsers", "colCreatedAt")}</th>
                    <th className="px-5 py-4 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border)">
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
                      onGrantVerified={(userId) => {
                        setGrantTargetId(userId);
                        setGrantDialogOpen(true);
                      }}
                    />
                  ))}
                  {data.items.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-(--text-muted)">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
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
                onGrantVerified={(userId) => {
                  setGrantTargetId(userId);
                  setGrantDialogOpen(true);
                }}
              />
            ))}
            {data.items.length === 0 && (
              <div className="px-5 py-12 text-center text-(--text-muted) border border-(--border) rounded-xl bg-(--bg-card)">
                No users found.
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className={cn("flex items-center justify-between p-2", isRTL ? "flex-row-reverse" : "")}>
            <div className="text-sm text-(--text-muted)">
              {t("adminUsers", "page")} {data.page} / {data.pages}
            </div>

            <div className="flex items-center gap-2">
              <button
                className="p-2 rounded-lg border border-(--border) bg-(--bg-card) hover:bg-(--bg-muted) disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, data.pages) }, (_, i) => {
                  // Simple pagination logic: show first 5 or context around current page if I had time to implement full logic
                  // For now just show active page number nicely
                  let pNum = i + 1;
                  if (data.pages > 5 && page > 3) pNum = page - 2 + i;
                  if (pNum > data.pages) return null;

                  return (
                    <button
                      key={pNum}
                      onClick={() => setPage(pNum)}
                      className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all",
                        page === pNum
                          ? "bg-primary-600 text-white shadow-md shadow-primary-500/20"
                          : "bg-(--bg-card) border border-(--border) hover:bg-(--bg-muted) text-(--text)"
                      )}
                    >
                      {pNum}
                    </button>
                  )
                })}
              </div>
              <button
                className="p-2 rounded-lg border border-(--border) bg-(--bg-card) hover:bg-(--bg-muted) disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.pages}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
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

      {/* Grant Verified Dialog */}
      {grantDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-(--bg-card) border border-(--border) rounded-xl shadow-xl p-6 space-y-4 slide-in-from-bottom-5">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-(--text)">Grant Verified Status</h3>
              <p className="text-sm text-(--text-muted)">
                Enter the number of days to grant verified status for {grantTargetId ? "this user" : `selected ${selectedIds.length} users`}.
              </p>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-(--text)">Days</label>
              <input
                type="number"
                min="1"
                value={grantDays}
                onChange={(e) => setGrantDays(parseInt(e.target.value) || 30)}
                className="w-full px-3 py-2 rounded-lg border border-(--border) bg-(--bg) text-(--text) focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setGrantDialogOpen(false)}
                className="px-4 py-2 rounded-lg border border-(--border) hover:bg-(--bg-muted) text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => executeGrantVerified(grantDays)}
                className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium shadow-sm transition-colors"
              >
                Grant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Components ---

function UserRow({
  user,
  selected,
  onSelect,
  onUpdate,
  onViewProfile,
  onGrantVerified
}: {
  user: AdminUserListItem;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onUpdate: (userId: string, payload: Record<string, unknown>) => Promise<void>;
  onViewProfile: (userId: string) => void;
  onGrantVerified: (userId: string) => void;
}) {
  const { isRTL } = useLanguage();

  return (
    <tr className={cn(
      "group transition-colors hover:bg-(--bg-muted)/50",
      selected && "bg-primary-50/50 dark:bg-primary-900/10"
    )}>
      <td className="px-5 py-4 text-center">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect(e.target.checked)}
          className="rounded border-(--border) text-primary-600 focus:ring-primary-500 cursor-pointer"
        />
      </td>

      <td className="px-5 py-4">
        <div className={cn("flex items-center gap-4", isRTL ? "flex-row-reverse text-right" : "text-left")}>
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center overflow-hidden border border-(--border)">
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="text-primary-600 dark:text-primary-400" size={18} />
              )}
            </div>
            {user.isBanned && (
              <div className="absolute -bottom-1 -right-1 bg-red-500 text-white rounded-full p-0.5 border-2 border-white dark:border-black">
                <XCircle size={10} />
              </div>
            )}
          </div>
          <div>
            <div className="font-semibold text-(--text) text-sm">{user.firstName} {user.lastName}</div>
            <div className="text-xs text-(--text-muted) flex items-center gap-1">
              <span>@{user.username}</span>
              <span className="w-1 h-1 rounded-full bg-(--border)"></span>
              <span className="truncate max-w-[120px]">{user.email}</span>
            </div>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <select
          value={user.role}
          onChange={(e) => onUpdate(user.id, { role: e.target.value })}
          className={cn(
            "px-2 py-1 text-xs rounded-full border bg-transparent font-medium cursor-pointer transition-colors outline-none",
            user.role === 'superadmin' ? "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900/50 dark:bg-purple-900/20 dark:text-purple-300" :
              user.role === 'admin' ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-300" :
                user.role === 'moderator' ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300" :
                  "border-(--border) text-(--text-muted)"
          )}
        >
          <option value="user">User</option>
          <option value="moderator">Moderator</option>
          <option value="admin">Admin</option>
          <option value="superadmin">Superadmin</option>
        </select>
      </td>

      <td className="px-5 py-4">
        {user.isBanned ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300 border border-red-200 dark:border-red-900/50">
            <ShieldAlert size={12} />
            Banned
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300 border border-green-200 dark:border-green-900/50">
            <CheckCircle size={12} />
            Active
          </span>
        )}
      </td>

      <td className="px-5 py-4">
        <div className="flex flex-col gap-1.5">
          {/* Verified Badge Status */}
          <div className="flex items-center gap-1.5">
            <div className={cn(
              "w-5 h-5 flex items-center justify-center rounded-full",
              user.effectiveVerified ? "bg-blue-100 text-blue-600 dark:text-blue-400 dark:bg-blue-900/20" : "bg-gray-100 text-gray-400 dark:bg-gray-800"
            )}>
              <BadgeCheck size={14} />
            </div>
            <span className={cn("text-xs font-medium", user.effectiveVerified ? "text-blue-700 dark:text-blue-300" : "text-(--text-muted)")}>
              {user.effectiveVerified ? "Verified" : "Unverified"}
            </span>
          </div>

          {/* Email Status */}
          <div className="flex items-center gap-1.5">
            <div className={cn(
              "w-5 h-5 flex items-center justify-center rounded-full",
              user.emailVerified ? "bg-green-100 text-green-600 dark:text-green-400 dark:bg-green-900/20" : "bg-amber-100 text-amber-500 dark:text-amber-400 dark:bg-amber-900/20"
            )}>
              <Mail size={12} />
            </div>
            <span className={cn("text-xs font-medium", user.emailVerified ? "text-green-700 dark:text-green-300" : "text-amber-700 dark:text-amber-300")}>
              {user.emailVerified ? "Email Verified" : "Pending Email"}
            </span>
          </div>
        </div>
      </td>

      <td className="px-5 py-4 text-(--text-muted) text-xs">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5">
            <Calendar size={12} className="opacity-70" />
            {formatDate(user.createdAt)}
          </span>
          <span className="flex items-center gap-1.5 ">
            <Loader2 size={12} className="opacity-70" />
            Active: {user.lastActive ? formatDate(user.lastActive) : "Never"}
          </span>
        </div>
      </td>

      <td className="px-5 py-4 text-right">
        <ActionMenu
          user={user}
          onUpdate={onUpdate}
          onViewProfile={() => onViewProfile(user.id)}
          onGrantVerified={() => onGrantVerified(user.id)}
        />
      </td>
    </tr>
  );
}

function ActionMenu({
  user,
  onUpdate,
  onViewProfile,
  onGrantVerified
}: {
  user: AdminUserListItem;
  onUpdate: (userId: string, payload: Record<string, unknown>) => Promise<void>;
  onViewProfile: () => void;
  onGrantVerified: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { isRTL } = useLanguage();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-(--text-muted) hover:bg-(--bg-muted) hover:text-(--text) transition-colors"
      >
        <MoreVertical size={18} />
      </button>

      {isOpen && (
        <div className={cn(
          "absolute z-10 w-48 rounded-xl shadow-lg bg-(--bg-card) border border-(--border) ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden origin-top-right animate-in fade-in zoom-in-95 duration-100",
          isRTL ? "left-0" : "right-0 top-full mt-1"
        )}>
          <div className="py-1">
            <button
              onClick={() => { onViewProfile(); setIsOpen(false); }}
              className="flex items-center w-full px-4 py-2 text-sm text-(--text) hover:bg-(--bg-muted)"
            >
              <UserIcon size={16} className="mr-2 opacity-70" />
              View Profile
            </button>

            <div className="h-px bg-(--border) my-1 mx-2" />

            <button
              onClick={() => { onUpdate(user.id, { isBanned: !user.isBanned }); setIsOpen(false); }}
              className={cn(
                "flex items-center w-full px-4 py-2 text-sm hover:bg-(--bg-muted)",
                user.isBanned ? "text-green-600" : "text-red-600"
              )}
            >
              {user.isBanned ? (
                <><Shield size={16} className="mr-2" /> Unban User</>
              ) : (
                <><ShieldAlert size={16} className="mr-2" /> Ban User</>
              )}
            </button>

            <button
              onClick={() => { onUpdate(user.id, { emailVerified: !user.emailVerified }); setIsOpen(false); }}
              className="flex items-center w-full px-4 py-2 text-sm text-(--text) hover:bg-(--bg-muted)"
            >
              <Mail size={16} className="mr-2 opacity-70" />
              {user.emailVerified ? "Mark Email Invalid" : "Mark Email Verified"}
            </button>

            <div className="h-px bg-(--border) my-1 mx-2" />

            <button
              onClick={() => { onGrantVerified(); setIsOpen(false); }}
              className="flex items-center w-full px-4 py-2 text-sm text-(--text) hover:bg-(--bg-muted)"
            >
              <BadgeCheck size={16} className="mr-2 opacity-70 text-blue-500" />
              Grant Verified
            </button>

            <button
              onClick={() => { onUpdate(user.id, { revokeVerified: true }); setIsOpen(false); }}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
            >
              <XCircle size={16} className="mr-2 opacity-70" />
              Revoke Verified
            </button>

          </div>
        </div>
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
  onGrantVerified
}: {
  user: AdminUserListItem;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onUpdate: (userId: string, payload: Record<string, unknown>) => Promise<void>;
  onViewProfile: (userId: string) => void;
  onGrantVerified: (userId: string) => void;
}) {

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={cn(
      "rounded-xl border border-(--border) bg-(--bg-card) overflow-hidden transition-all duration-200",
      selected && "ring-2 ring-primary-500 border-transparent"
    )}>
      <div className="p-4 flex items-start gap-3">
        <div className="pt-1">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(e.target.checked)}
            className="w-5 h-5 rounded border-(--border) text-primary-600 focus:ring-primary-500"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 overflow-hidden border border-(--border)">
                {user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UserIcon className="text-primary-600 dark:text-primary-400" size={18} />
                  </div>
                )}
              </div>
              <div>
                <div className="font-semibold text-(--text)">{user.firstName} {user.lastName}</div>
                <div className="text-xs text-(--text-muted)">@{user.username}</div>
              </div>
            </div>

            <div className="flex gap-2">
              <ActionMenu
                user={user}
                onUpdate={onUpdate}
                onViewProfile={() => onViewProfile(user.id)}
                onGrantVerified={() => onGrantVerified(user.id)}
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className={cn(
              "px-2 py-1 rounded-md text-xs font-medium border",
              user.isBanned ? "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:border-red-900"
                : "bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:border-green-900"
            )}>
              {user.isBanned ? "Banned" : "Active"}
            </span>

            <span className="px-2 py-1 rounded-md text-xs font-medium bg-(--bg) border border-(--border) text-(--text-muted) uppercase">
              {user.role}
            </span>

            {user.effectiveVerified && (
              <span className="px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/20 dark:border-blue-900">
                Verified
              </span>
            )}
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full mt-3 flex items-center justify-center p-1 text-xs text-(--text-muted) hover:bg-(--bg-muted) rounded transition-colors"
          >
            {isExpanded ? (
              <>Show Less <ChevronLeft className="rotate-90 ml-1" size={12} /></>
            ) : (
              <>Show Details <ChevronRight className="rotate-90 ml-1" size={12} /></>
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t border-(--border) bg-(--bg-muted)/30">
          <div className="grid grid-cols-2 gap-3 py-3 text-sm">
            <div>
              <div className="text-xs text-(--text-muted) mb-1">Email Verified</div>
              <div className={cn("font-medium", user.emailVerified ? "text-green-600" : "text-amber-600")}>
                {user.emailVerified ? "Yes" : "No"}
              </div>
            </div>
            <div>
              <div className="text-xs text-(--text-muted) mb-1">Joined</div>
              <div className="font-medium text-(--text)">{formatDate(user.createdAt)}</div>
            </div>
            <div>
              <div className="text-xs text-(--text-muted) mb-1">Last Active</div>
              <div className="font-medium text-(--text)">{user.lastActive ? formatDateTime(user.lastActive) : "Never"}</div>
            </div>
            <div>
              <div className="text-xs text-(--text-muted) mb-1">Email</div>
              <div className="font-medium text-(--text) truncate">{user.email}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
