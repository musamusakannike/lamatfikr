"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

function DashboardChart({
  title,
  subtitle,
  data,
  dataKey = "value",
}: {
  title: string;
  subtitle?: string;
  data: any[];
  dataKey?: string;
}) {
  return (
    <div className="bg-(--bg-card) border border-(--border) rounded-xl p-4 shadow-sm h-[300px] flex flex-col">
      <div className="mb-4">
        <div className="text-sm font-semibold text-(--text)">{title}</div>
        {subtitle ? (
          <div className="text-xs text-(--text-muted) mt-0.5">{subtitle}</div>
        ) : null}
      </div>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-neutral-200)" opacity={0.5} />
            <XAxis
              dataKey="name"
              stroke="var(--text-muted)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--text-muted)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--bg-card)",
                borderColor: "var(--border)",
                borderRadius: "8px",
                color: "var(--text)",
              }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="var(--color-primary-500)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
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

  const chartData = useMemo(() => {
    const users =
      analytics?.users?.map((p, i) => ({
        name: i + 1,
        value: p.count,
      })) ?? [];
    const txCounts =
      analytics?.transactions?.map((p, i) => ({
        name: i + 1,
        value: p.count,
      })) ?? [];
    const txGross =
      analytics?.transactions?.map((p, i) => ({
        name: i + 1,
        value: Math.round(p.grossAmount),
      })) ?? [];
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
            <DashboardChart
              title={t("adminCharts", "userGrowth")}
              data={chartData.users}
            />
            <DashboardChart
              title={t("adminCharts", "transactionsTrend")}
              data={chartData.txCounts}
            />
            <div className="lg:col-span-2">
              <DashboardChart
                title={t("adminCharts", "transactionVolumeTrend")}
                data={chartData.txGross}
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
