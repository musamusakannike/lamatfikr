"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { LanguageSwitcher } from "@/components/ui";

import {
  LayoutDashboard,
  Users,
  FileText,
  ShieldCheck,
  Wallet,
  Store,
  Image as ImageIcon,
  Radio,
  Star,
  Building2,
  Layers,
  Flag,
  HeartHandshake,
  Ban,
  UserCog,
  Activity,
  CreditCard,
  ChevronDown,
  Megaphone,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

type NavItem =
  | {
    type: "link";
    key: string;
    href: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }
  | {
    type: "group";
    key: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    items: Array<{ key: string; href: string }>;
  };

export default function AdminSidebar({
  open,
  onClose,
  onNavigate,
}: {
  open?: boolean;
  onClose?: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { t, isRTL } = useLanguage();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const nav: NavItem[] = [
    {
      type: "link",
      key: "dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      type: "group",
      key: "users",
      icon: Users,
      items: [
        { key: "userDirectory", href: "/dashboard/users" },
        { key: "bannedUsers", href: "/dashboard/users/banned" },
        { key: "verifiedUsers", href: "/dashboard/users/verified" },
        { key: "rolesPermissions", href: "/dashboard/users/roles" },
      ],
    },
    {
      type: "group",
      key: "content",
      icon: FileText,
      items: [
        { key: "posts", href: "/dashboard/content/posts" },
        { key: "comments", href: "/dashboard/content/comments" },
        { key: "stories", href: "/dashboard/content/stories" },
        { key: "uploadsMedia", href: "/dashboard/content/media" },
      ],
    },
    {
      type: "link",
      key: "announcements",
      href: "/dashboard/announcements",
      icon: Megaphone,
    },
    {
      type: "link",
      key: "reports",
      href: "/dashboard/reports",
      icon: Flag,
    },
    {
      type: "group",
      key: "social",
      icon: HeartHandshake,
      items: [
        { key: "followsFriends", href: "/dashboard/social/relationships" },
        { key: "blocksMutes", href: "/dashboard/social/moderation" },
      ],
    },
    {
      type: "group",
      key: "communities",
      icon: Building2,
      items: [
        { key: "communitiesList", href: "/dashboard/communities" },
      ],
    },
    {
      type: "group",
      key: "rooms",
      icon: Radio,
      items: [
        { key: "rooms", href: "/dashboard/rooms" },
        { key: "featuredRooms", href: "/dashboard/rooms/featured" },
      ],
    },
    {
      type: "group",
      key: "marketplace",
      icon: Store,
      items: [
        { key: "listings", href: "/dashboard/marketplace/listings" },
        { key: "orders", href: "/dashboard/marketplace/orders" },
      ],
    },
    {
      type: "group",
      key: "wallet",
      icon: Wallet,
      items: [
        { key: "walletOverview", href: "/dashboard/wallet" },
        { key: "companyWallet", href: "/dashboard/wallet/company" },
        { key: "transactions", href: "/dashboard/wallet/transactions" },
        { key: "withdrawals", href: "/dashboard/wallet/withdrawals" },
        { key: "adminWithdrawals", href: "/dashboard/wallet/admin-withdrawals" },
      ],
    },
    {
      type: "group",
      key: "verification",
      icon: ShieldCheck,
      items: [
        { key: "verificationRequests", href: "/dashboard/verification/requests" },
        { key: "verificationStats", href: "/dashboard/verification/stats" },
      ],
    },
    {
      type: "group",
      key: "system",
      icon: Activity,
      items: [
        { key: "health", href: "/dashboard/system/health" },
        { key: "stripe", href: "/dashboard/system/stripe" },
      ],
    },
  ];

  const iconByKey: Record<string, any> = {
    posts: FileText,
    comments: Flag,
    reports: Flag,
    stories: ImageIcon,
    uploadsMedia: ImageIcon,
    userDirectory: Users,
    bannedUsers: Ban,
    verifiedUsers: ShieldCheck,
    rolesPermissions: UserCog,
    rooms: Radio,
    featuredRooms: Star,
    communitiesList: Building2,
    groups: Layers,
    pages: Layers,
    marketplace: Store,
    listings: Store,
    orders: Store,
    walletOverview: Wallet,
    companyWallet: Building2,
    transactions: CreditCard,
    withdrawals: Wallet,
    adminWithdrawals: Wallet,
    verificationRequests: ShieldCheck,
    verificationStats: Activity,
  };

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");

  const renderLink = (labelKey: string, href: string) => {
    const active = isActive(href);
    const Icon = iconByKey[labelKey];

    return (
      <Link
        key={href}
        href={href}
        onClick={() => {
          onNavigate?.();
          onClose?.();
        }}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
          active
            ? "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200"
            : "text-(--text-muted) hover:bg-primary-50 hover:text-(--text) dark:hover:bg-primary-900/20"
        )}
      >
        {Icon ? <Icon size={18} className="shrink-0" /> : null}
        <span className="truncate">{t("adminNav", labelKey)}</span>
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        "h-screen w-72 border-(--border) bg-(--bg-card) flex flex-col",
        "fixed inset-y-0 z-50 transition-transform duration-200 ease-out",
        isRTL ? "right-0 border-l" : "left-0 border-r",
        open
          ? "translate-x-0"
          : isRTL
            ? "translate-x-full"
            : "-translate-x-full",
        "lg:static lg:translate-x-0 lg:shrink-0"
      )}
    >
      <div className="px-4 py-4 border-b border-(--border)">
        <div className={cn("flex items-center justify-between", isRTL ? "flex-row-reverse" : "flex-row")}>
          <div>
            <div className="text-lg font-bold text-(--text)">{t("common", "appName")}</div>
            <div className="text-xs text-(--text-muted)">{t("adminNav", "dashboard")}</div>
          </div>
          <LanguageSwitcher
            variant="icon"
            className="border border-(--border) bg-(--bg) hover:bg-primary-50 dark:hover:bg-primary-900/30"
          />
        </div>
      </div>

      <nav className="p-3 overflow-y-auto">
        <div className="space-y-2">
          {nav.map((item) => {
            if (item.type === "link") {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    onNavigate?.();
                    onClose?.();
                  }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                    active
                      ? "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200"
                      : "text-(--text-muted) hover:bg-primary-50 hover:text-(--text) dark:hover:bg-primary-900/20"
                  )}
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="truncate">{t("adminNav", item.key)}</span>
                </Link>
              );
            }

            const anyChildActive = item.items.some((x) => isActive(x.href));

            return (
              <div key={item.key} className="rounded-lg">
                <div
                  className={cn(
                    "flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wide",
                    anyChildActive ? "text-(--text)" : "text-(--text-muted)"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <item.icon size={14} className="opacity-80" />
                    <span>{t("adminNav", item.key)}</span>
                  </div>
                  <ChevronDown size={14} className={cn("opacity-60", anyChildActive ? "rotate-180" : "")} />
                </div>
                <div className="mt-1 space-y-1">
                  {item.items.map((child) => renderLink(child.key, child.href))}
                </div>
              </div>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
