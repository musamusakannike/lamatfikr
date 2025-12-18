"use client";

import { useEffect, useMemo, useState } from "react";

import { apiClient, getErrorMessage } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type { AdminRolesSummaryResponse } from "@/types/admin-roles";

type RoleKey = "user" | "moderator" | "admin" | "superadmin";

function RoleCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-(--bg-card) border border-(--border) rounded-xl p-4 shadow-sm">
      <div className="text-sm text-(--text-muted)">{title}</div>
      <div className="text-3xl font-bold text-(--text) mt-2">{value}</div>
    </div>
  );
}

export default function RolesPermissionsPage() {
  const { t, isRTL } = useLanguage();
  const [data, setData] = useState<AdminRolesSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get<AdminRolesSummaryResponse>("/admin/roles/summary");
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
  }, []);

  const counts = useMemo(() => {
    const base: Record<RoleKey, number> = { user: 0, moderator: 0, admin: 0, superadmin: 0 };
    for (const r of data?.roles ?? []) {
      const key = r.role as RoleKey;
      if (key in base) base[key] = r.count;
    }
    return base;
  }, [data]);

  const permissions = useMemo(() => {
    return [
      {
        key: "permViewUsers",
        user: true,
        moderator: true,
        admin: true,
        superadmin: true,
      },
      {
        key: "permManageUsers",
        user: false,
        moderator: false,
        admin: true,
        superadmin: true,
      },
      {
        key: "permBanUnban",
        user: false,
        moderator: true,
        admin: true,
        superadmin: true,
      },
      {
        key: "permGrantVerified",
        user: false,
        moderator: false,
        admin: true,
        superadmin: true,
      },
      {
        key: "permManageContent",
        user: false,
        moderator: true,
        admin: true,
        superadmin: true,
      },
      {
        key: "permManageWallet",
        user: false,
        moderator: false,
        admin: true,
        superadmin: true,
      },
      {
        key: "permManageVerification",
        user: false,
        moderator: false,
        admin: true,
        superadmin: true,
      },
      {
        key: "permViewAnalytics",
        user: false,
        moderator: false,
        admin: true,
        superadmin: true,
      },
    ] as Array<{ key: string } & Record<RoleKey, boolean>>;
  }, []);

  return (
    <div className={cn("space-y-4", isRTL ? "text-right" : "text-left")}>
      <div>
        <h1 className="text-2xl font-bold text-(--text)">{t("adminRoles", "title")}</h1>
        <div className="text-sm text-(--text-muted) mt-1">{t("adminRoles", "subtitle")}</div>
        {data?.generatedAt ? (
          <div className="text-xs text-(--text-muted) mt-2">
            {t("adminRoles", "lastUpdated")}: {new Date(data.generatedAt).toLocaleString()}
          </div>
        ) : null}
      </div>

      {loading ? <div className="text-(--text-muted)">{t("adminUsers", "loading")}</div> : null}
      {error ? (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {!loading && !error ? (
        <>
          <div className="pt-2">
            <div className="text-lg font-bold text-(--text)">{t("adminRoles", "rolesSummary")}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <RoleCard title={t("adminRoles", "roleUser")} value={counts.user} />
            <RoleCard title={t("adminRoles", "roleModerator")} value={counts.moderator} />
            <RoleCard title={t("adminRoles", "roleAdmin")} value={counts.admin} />
            <RoleCard title={t("adminRoles", "roleSuperadmin")} value={counts.superadmin} />
          </div>

          <div className="pt-2">
            <div className="text-lg font-bold text-(--text)">{t("adminRoles", "permissionsMatrix")}</div>
            <div className="text-sm text-(--text-muted) mt-1">{t("adminRoles", "note")}</div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-(--border) bg-(--bg-card)">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="bg-(--bg)">
                <tr className="text-(--text-muted)">
                  <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("adminRoles", "permissionsMatrix")}</th>
                  <th className="px-3 py-3">{t("adminRoles", "roleUser")}</th>
                  <th className="px-3 py-3">{t("adminRoles", "roleModerator")}</th>
                  <th className="px-3 py-3">{t("adminRoles", "roleAdmin")}</th>
                  <th className="px-3 py-3">{t("adminRoles", "roleSuperadmin")}</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map((p) => (
                  <tr key={p.key} className="border-t border-(--border)">
                    <td className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>
                      <div className="font-medium text-(--text)">{t("adminRoles", p.key as any)}</div>
                    </td>
                    <td className="px-3 py-3 text-center">{p.user ? "✓" : "—"}</td>
                    <td className="px-3 py-3 text-center">{p.moderator ? "✓" : "—"}</td>
                    <td className="px-3 py-3 text-center">{p.admin ? "✓" : "—"}</td>
                    <td className="px-3 py-3 text-center">{p.superadmin ? "✓" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
