"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { apiClient } from "@/lib/api";
import type { AdminOverviewResponse } from "@/types/admin";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

function StatCard({
  title,
  value,
  href,
  actionLabel,
}: {
  title: string;
  value: number;
  href?: string;
  actionLabel?: string;
}) {
  return (
    <div className="bg-(--bg-card) border border-(--border) rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-(--text-muted)">{title}</div>
          <div className="text-3xl font-bold text-(--text) mt-2">{value}</div>
        </div>
        {href ? (
          <Link
            href={href}
            className="text-sm text-primary-600 hover:text-primary-700 whitespace-nowrap"
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { t, isRTL } = useLanguage();
  const [data, setData] = useState<AdminOverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get<AdminOverviewResponse>("/admin/overview");
        if (!mounted) return;
        setData(res);
      } catch {
        if (!mounted) return;
        setError(t("adminOverview", "failedToLoad"));
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [t]);

  const cards = useMemo(() => {
    if (!data) return [];

    return [
      {
        title: t("adminOverview", "totalUsers"),
        value: data.users.total,
        href: "/dashboard/users",
        action: t("adminOverview", "manage"),
      },
      {
        title: t("adminOverview", "onlineUsers"),
        value: data.users.online,
        href: "/dashboard/users",
        action: t("adminOverview", "viewAll"),
      },
      {
        title: t("adminOverview", "bannedUsers"),
        value: data.users.banned,
        href: "/dashboard/users/banned",
        action: t("adminOverview", "manage"),
      },
      {
        title: t("adminOverview", "visitsToday"),
        value: data.visits.today,
      },
      {
        title: t("adminOverview", "visitsThisMonth"),
        value: data.visits.month,
      },
      {
        title: t("adminOverview", "totalPosts"),
        value: data.posts.total,
        href: "/dashboard/content/posts",
        action: t("adminOverview", "manage"),
      },
      {
        title: t("adminOverview", "postsToday"),
        value: data.posts.today,
        href: "/dashboard/content/posts",
        action: t("adminOverview", "viewAll"),
      },
      {
        title: t("adminOverview", "postsThisMonth"),
        value: data.posts.month,
        href: "/dashboard/content/posts",
        action: t("adminOverview", "viewAll"),
      },
      {
        title: t("adminOverview", "totalComments"),
        value: data.comments.total,
        href: "/dashboard/content/comments",
        action: t("adminOverview", "manage"),
      },
      {
        title: t("adminOverview", "commentsToday"),
        value: data.comments.today,
        href: "/dashboard/content/comments",
        action: t("adminOverview", "viewAll"),
      },
      {
        title: t("adminOverview", "commentsThisMonth"),
        value: data.comments.month,
        href: "/dashboard/content/comments",
        action: t("adminOverview", "viewAll"),
      },
      {
        title: t("adminOverview", "totalCommunities"),
        value: data.communities.total,
        href: "/dashboard/communities",
        action: t("adminOverview", "manage"),
      },
      {
        title: t("adminOverview", "totalRoomChats"),
        value: data.roomChats.total,
        href: "/dashboard/rooms",
        action: t("adminOverview", "viewAll"),
      },
    ];
  }, [data, t]);

  return (
    <div className={cn("space-y-4", isRTL ? "text-right" : "text-left")}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-(--text)">{t("adminOverview", "title")}</h1>
          {data?.generatedAt ? (
            <div className="text-sm text-(--text-muted) mt-1">
              {t("adminOverview", "lastUpdated")}: {new Date(data.generatedAt).toLocaleString()}
            </div>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="text-(--text-muted)">{t("adminOverview", "loading")}</div>
      ) : null}

      {error ? (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {!loading && !error && data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c) => (
            <StatCard
              key={c.title}
              title={c.title}
              value={c.value}
              href={c.href}
              actionLabel={c.action}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
