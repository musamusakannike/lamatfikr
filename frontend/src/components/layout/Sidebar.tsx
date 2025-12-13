"use client";

import { cn } from "@/lib/utils";
import { Avatar, NotificationBadge } from "@/components/ui";
import {
  Home,
  MessageSquare,
  Users,
  ShoppingBag,
  FileText,
  Newspaper,
  Bell,
  Settings,
  ChevronRight,
} from "lucide-react";

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

const navItems: NavItem[] = [
  { icon: Home, label: "Home", href: "/", active: true },
  { icon: MessageSquare, label: "Room Chats", href: "/rooms", badge: 12 },
  { icon: Users, label: "Communities", href: "/communities", badge: 3 },
  { icon: ShoppingBag, label: "Marketplace", href: "/marketplace" },
  { icon: FileText, label: "Articles", href: "/articles" },
  { icon: Newspaper, label: "Posts", href: "/posts" },
  { icon: Bell, label: "Notifications", href: "/notifications", badge: 5 },
  { icon: Settings, label: "Settings", href: "/settings" },
];

function NavLink({ item }: { item: NavItem }) {
  return (
    <a
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
        item.active
          ? "bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300"
          : "hover:bg-primary-50 dark:hover:bg-primary-900/30 text-[var(--text-muted)] hover:text-[var(--text)]"
      )}
    >
      <div className="relative">
        <item.icon
          size={20}
          className={cn(
            "transition-colors",
            item.active && "text-primary-600 dark:text-primary-400"
          )}
        />
        {item.badge && <NotificationBadge count={item.badge} />}
      </div>
      <span className="font-medium">{item.label}</span>
      {item.active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-r-full" />
      )}
    </a>
  );
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
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
          "fixed left-0 top-16 bottom-0 w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border)] z-40 transition-transform duration-300 flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink key={item.label} item={item} />
          ))}
        </nav>

        {/* Profile section at bottom */}
        <div className="p-3 border-t border-[var(--border)]">
          <a
            href="/profile"
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors group"
          >
            <Avatar
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"
              alt="John Doe"
              size="md"
              online
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">John Doe</p>
              <p className="text-xs text-[var(--text-muted)] truncate">
                @johndoe
              </p>
            </div>
            <ChevronRight
              size={16}
              className="text-[var(--text-muted)] group-hover:text-primary-500 transition-colors"
            />
          </a>
        </div>
      </aside>
    </>
  );
}
