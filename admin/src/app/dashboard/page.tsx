"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { apiClient } from "@/lib/api";
import type { AdminAnalyticsResponse, AdminOverviewResponse } from "@/types/admin";
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

function LineChart({
  title,
  subtitle,
  values,
}: {
  title: string;
  subtitle?: string;
  values: number[];
}) {
  const width = 640;
  const height = 140;
  const padding = 12;

  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const range = Math.max(1, max - min);
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const points = values.map((v, i) => {
    const x = padding + (values.length <= 1 ? 0 : (i / (values.length - 1)) * innerW);
    const y = padding + innerH - ((v - min) / range) * innerH;
    return { x, y };
  });

  const d = points
    .map((p, idx) => `${idx === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");

  return (
    <div className="bg-(--bg-card) border border-(--border) rounded-xl p-4 shadow-sm">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-(--text)">{title}</div>
          {subtitle ? (
            <div className="text-xs text-(--text-muted) mt-0.5">{subtitle}</div>
          ) : null}
        </div>
        <div className="text-xs text-(--text-muted)">max: {max}</div>
      </div>
      <div className="mt-3 overflow-x-auto">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <path d={d} fill="none" stroke="var(--color-primary-500)" strokeWidth={2} />
          <path
            d={`${d} L ${padding + innerW} ${padding + innerH} L ${padding} ${padding + innerH} Z`}
            fill="rgba(124, 58, 237, 0.12)"
            stroke="none"
          />
        </svg>
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-(--bg-card) border border-(--border) rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="w-full">
          <div className="h-4 w-32 bg-(--border) rounded animate-pulse" />
          <div className="h-9 w-24 bg-(--border) rounded mt-3 animate-pulse" />
        </div>
        <div className="h-4 w-16 bg-(--border) rounded animate-pulse" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { t, isRTL } = useLanguage();
  const [data, setData] = useState<AdminOverviewResponse | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [res, analyticsRes] = await Promise.all([
          apiClient.get<AdminOverviewResponse>("/admin/overview"),
          apiClient.get<AdminAnalyticsResponse>("/admin/analytics?days=30"),
        ]);
        if (!mounted) return;
        setData(res);
        setAnalytics(analyticsRes);
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
      {
        title: t("adminOverview", "totalTransactions"),
        value: data.transactions.total,
        href: "/dashboard/wallet/transactions",
        action: t("adminOverview", "viewAll"),
      },
      {
        title: t("adminOverview", "transactionsToday"),
        value: data.transactions.today,
        href: "/dashboard/wallet/transactions",
        action: t("adminOverview", "viewAll"),
      },
      {
        title: t("adminOverview", "transactionsThisMonth"),
        value: data.transactions.month,
        href: "/dashboard/wallet/transactions",
        action: t("adminOverview", "viewAll"),
      },
      {
        title: t("adminOverview", "completedTransactions"),
        value: data.transactions.completedTotal,
        href: "/dashboard/wallet/transactions",
        action: t("adminOverview", "viewAll"),
      },
      {
        title: t("adminOverview", "grossTransactionVolume"),
        value: Math.round(data.transactions.grossAmountTotal),
        href: "/dashboard/wallet/transactions",
        action: t("adminOverview", "viewAll"),
      },
      {
        title: t("adminOverview", "netTransactionVolume"),
        value: Math.round(data.transactions.netAmountTotal),
        href: "/dashboard/wallet/transactions",
        action: t("adminOverview", "viewAll"),
      },
      {
        title: t("adminOverview", "totalWalletBalance"),
        value: Math.round(data.wallets.totalBalance),
        href: "/dashboard/wallet",
        action: t("adminOverview", "viewAll"),
      },
      {
        title: t("adminOverview", "totalPendingBalance"),
        value: Math.round(data.wallets.totalPendingBalance),
        href: "/dashboard/wallet",
        action: t("adminOverview", "viewAll"),
      },
      {
        title: t("adminOverview", "totalEarned"),
        value: Math.round(data.wallets.totalEarned),
        href: "/dashboard/wallet",
        action: t("adminOverview", "viewAll"),
      },
      {
        title: t("adminOverview", "totalWithdrawn"),
        value: Math.round(data.wallets.totalWithdrawn),
        href: "/dashboard/wallet",
        action: t("adminOverview", "viewAll"),
      },
    ];
  }, [data, t]);

  const chartValues = useMemo(() => {
    const users = analytics?.users?.map((p) => p.count) ?? [];
    const txCounts = analytics?.transactions?.map((p) => p.count) ?? [];
    const txGross = analytics?.transactions?.map((p) => Math.round(p.grossAmount)) ?? [];
    return { users, txCounts, txGross };
  }, [analytics]);

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, idx) => (
            <StatCardSkeleton key={idx} />
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {!loading && !error && data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

          <div className="pt-2">
            <div className="text-lg font-bold text-(--text)">{t("adminCharts", "title")}</div>
            <div className="text-sm text-(--text-muted) mt-1">{t("adminCharts", "lastNDays")}</div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LineChart
              title={t("adminCharts", "userGrowth")}
              values={chartValues.users}
            />
            <LineChart
              title={t("adminCharts", "transactionsTrend")}
              values={chartValues.txCounts}
            />
            <div className="lg:col-span-2">
              <LineChart
                title={t("adminCharts", "transactionVolumeTrend")}
                values={chartValues.txGross}
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
