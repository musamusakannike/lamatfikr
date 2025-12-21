"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, NotificationBadge } from "@/components/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { roomsApi } from "@/lib/api/rooms";
import { communitiesApi } from "@/lib/api/communities";
import { notificationsApi } from "@/lib/api/notifications";
import {
  Home,
  MessageSquare,
  Mail,
  Users,
  ShoppingBag,
  List,
  LayoutDashboard,
  Receipt,
  UserPlus,
  Wallet,
  Bell,
  Settings,
  ChevronRight,
} from "lucide-react";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
  active?: boolean;
}


function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <a
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
        isActive
          ? "bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300"
          : "hover:bg-primary-50 dark:hover:bg-primary-900/30 text-(--text-muted) hover:text-(--text)"
      )}
    >
      <div className="relative">
        <item.icon
          size={20}
          className={cn(
            "transition-colors",
            isActive && "text-primary-600 dark:text-primary-400"
          )}
        />
        {item.badge && <NotificationBadge count={item.badge} />}
      </div>
      <span className="font-medium">{item.label}</span>
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-r-full" />
      )}
    </a>
  );
}

const DEFAULT_AVATAR = "/images/default-avatar.svg";

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { t, isRTL } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [roomsUnreadCount, setRoomsUnreadCount] = useState(0);
  const [communitiesUnreadCount, setCommunitiesUnreadCount] = useState(0);
  const [notificationsUnreadCount, setNotificationsUnreadCount] = useState(0);

  const isMarketplaceRoute = pathname === "/marketplace" || pathname.startsWith("/marketplace/");

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchUnreadCounts = async () => {
      try {
        const [roomsResponse, communitiesResponse, notificationsResponse] = await Promise.all([
          roomsApi.getTotalUnreadCount(),
          communitiesApi.getTotalUnreadCount(),
          notificationsApi.getUnreadCount(),
        ]);
        setRoomsUnreadCount(roomsResponse.totalUnreadCount);
        setCommunitiesUnreadCount(communitiesResponse.totalUnreadCount);
        setNotificationsUnreadCount(notificationsResponse.unreadCount);
      } catch {
        // Silently ignore errors
      }
    };

    fetchUnreadCounts();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCounts, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const navItems: NavItem[] = [
    { icon: Home, label: t("nav", "home"), href: "/" },
    { icon: Mail, label: t("nav", "messages"), href: "/messages" },
    { icon: MessageSquare, label: t("nav", "rooms"), href: "/rooms", badge: roomsUnreadCount > 0 ? roomsUnreadCount : undefined },
    { icon: Users, label: t("nav", "communities"), href: "/communities", badge: communitiesUnreadCount > 0 ? communitiesUnreadCount : undefined },
    { icon: ShoppingBag, label: t("nav", "marketplace"), href: "/marketplace" },
    { icon: UserPlus, label: t("suggestions", "peopleYouMayKnow"), href: "/suggestions" },
    { icon: Wallet, label: t("nav", "wallet"), href: "/wallet" },
    { icon: Bell, label: t("nav", "notifications"), href: "/notifications", badge: notificationsUnreadCount > 0 ? notificationsUnreadCount : undefined },
    { icon: Settings, label: t("nav", "settings"), href: "/profile" },
  ];

  const marketplaceManagementItems: NavItem[] = [
    { icon: List, label: isRTL ? "قائمتي" : "My Listings", href: "/marketplace/my-listings" },
    { icon: LayoutDashboard, label: isRTL ? "لوحة البائع" : "Seller Dashboard", href: "/marketplace/seller-dashboard" },
    { icon: Receipt, label: isRTL ? "الطلبات" : "Orders", href: "/marketplace/orders" },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-16 bottom-0 w-64 bg-(--bg-sidebar) z-40 transition-transform duration-300 flex flex-col",
          isRTL ? "right-0 border-l border-(--border)" : "left-0 border-r border-(--border)",
          isOpen 
            ? "translate-x-0" 
            : isRTL 
              ? "translate-x-full lg:translate-x-0" 
              : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink 
              key={item.label} 
              item={item} 
              isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`))} 
            />
          ))}

          {isAuthenticated && isMarketplaceRoute && (
            <div className="mt-4 pt-4 border-t border-(--border)">
              <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
                {isRTL ? "إدارة المتجر" : "Marketplace Management"}
              </p>
              <div className="space-y-1">
                {marketplaceManagementItems.map((item) => (
                  <NavLink
                    key={item.label}
                    item={item}
                    isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                  />
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Profile section at bottom */}
        <div className="p-3 border-t border-(--border)">
          <a
            href="/profile"
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors group",
              pathname === "/profile" && "bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300"
            )}
          >
            <Avatar
              src={user?.avatar || DEFAULT_AVATAR}
              alt={user?.firstName || "User"}
              size="md"
              online={isAuthenticated}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm truncate">
                  {user ? `${user.firstName} ${user.lastName}` : "Guest"}
                </p>
                {user?.verified && (
                  <VerifiedBadge size={14} />
                )}
              </div>
              <p className="text-xs text-(--text-muted) truncate">
                {user ? `@${user.username}` : ""}
              </p>
            </div>
            <ChevronRight
              size={16}
              className={cn(
                "text-(--text-muted) group-hover:text-primary-500 transition-colors",
                pathname === "/profile" && "text-primary-600 dark:text-primary-400"
              )}
            />
          </a>
        </div>
      </aside>
    </>
  );
}
