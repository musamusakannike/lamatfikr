"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Avatar, Button, Modal, LanguageSwitcher } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Search,
  Bell,
  // MessageCircle,
  Menu,
  X,
  Sun,
  Moon,
  Plus,
  ChevronDown,
  User,
  Settings,
  LogOut,
  HelpCircle,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { CreatePost } from "@/components/home/CreatePost";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { notificationsApi } from "@/lib/api/notifications";

interface NavbarProps {
  onMenuToggle: () => void;
  isSidebarOpen: boolean;
}

const DEFAULT_AVATAR = "/images/default-avatar.svg";

export function Navbar({ onMenuToggle, isSidebarOpen }: NavbarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const { t, isRTL } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount, openCart } = useCart();
  const [notificationsUnreadCount, setNotificationsUnreadCount] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [createPostModalOpen, setCreatePostModalOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when mobile search opens
  useEffect(() => {
    if (mobileSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [mobileSearchOpen]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchUnread = async () => {
      try {
        const { unreadCount } = await notificationsApi.getUnreadCount();
        setNotificationsUnreadCount(unreadCount);
      } catch {
        // Silently ignore errors
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 h-16",
          "bg-(--bg-card)/95 backdrop-blur-md",
          "border-b border-(--border)",
          "transition-all duration-300 ease-in-out",
          "shadow-sm dark:shadow-none"
        )}
      >
        <div className="h-full px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left section */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuToggle}
              className="lg:hidden hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
              aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
            >
              <div className="relative w-5 h-5">
                <Menu
                  size={20}
                  className={cn(
                    "absolute inset-0 transition-all duration-300",
                    isSidebarOpen
                      ? "opacity-0 rotate-90"
                      : "opacity-100 rotate-0"
                  )}
                />
                <X
                  size={20}
                  className={cn(
                    "absolute inset-0 transition-all duration-300",
                    isSidebarOpen
                      ? "opacity-100 rotate-0"
                      : "opacity-0 -rotate-90"
                  )}
                />
              </div>
            </Button>

            <Link href="/" className="flex items-center gap-2 group">
              <div
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center",
                  "bg-linear-to-br from-primary-500 via-primary-600 to-primary-700",
                  "shadow-lg shadow-primary-500/25 dark:shadow-primary-500/15",
                  "group-hover:shadow-xl group-hover:shadow-primary-500/30",
                  "transition-all duration-300 group-hover:scale-105"
                )}
              >
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <span
                className={cn(
                  "hidden sm:block text-xl font-bold",
                  "bg-linear-to-r from-primary-600 via-primary-500 to-primary-400",
                  "bg-clip-text text-transparent",
                  "group-hover:from-primary-500 group-hover:to-primary-300",
                  "transition-all duration-300"
                )}
              >
                Lamatfikr
              </span>
            </Link>
          </div>

          {/* Search bar - Desktop */}
          <div className="flex-1 max-w-xl hidden md:block">
            <div
              className={cn(
                "relative flex items-center transition-all duration-300",
                searchFocused && "scale-[1.02]"
              )}
            >
              <Search
                size={18}
                className={cn(
                  "absolute left-4 transition-colors duration-200",
                  searchFocused ? "text-primary-500" : "text-(--text-muted)"
                )}
              />
              <input
                type="text"
                placeholder={t("common", "search") + "..."}
                className={cn(
                  "w-full pl-11 pr-4 py-2.5 rounded-full text-sm",
                  "bg-primary-50/80 dark:bg-primary-950/40",
                  "border-2 border-transparent",
                  "focus:border-primary-400 dark:focus:border-primary-500",
                  "focus:bg-(--bg-card)",
                  "placeholder:text-(--text-muted)",
                  "outline-none transition-all duration-300",
                  "hover:bg-primary-100/80 dark:hover:bg-primary-900/40"
                )}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Mobile search button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden hover:bg-primary-100 dark:hover:bg-primary-900/50"
              onClick={() => setMobileSearchOpen(true)}
              aria-label="Search"
            >
              <Search size={20} />
            </Button>

            {/* Create button */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCreatePostModalOpen(true)}
              className={cn(
                "hidden sm:flex gap-1.5 items-center",
                "shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/30",
                "hover:scale-[1.02] active:scale-[0.98]",
                "transition-all duration-200"
              )}
            >
              <Plus size={16} strokeWidth={2.5} />
              <span className="font-semibold">{t("common", "create")}</span>
            </Button>

            {/* Mobile create button */}
            <Button
              variant="primary"
              size="icon"
              onClick={() => setCreatePostModalOpen(true)}
              className={cn(
                "sm:hidden",
                "shadow-md shadow-primary-500/20",
                "hover:scale-[1.02] active:scale-[0.98]",
                "transition-all duration-200"
              )}
              aria-label="Create post"
            >
              <Plus size={18} strokeWidth={2.5} />
            </Button>

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              onClick={openCart}
              className="relative hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
              aria-label="Shopping Cart"
            >
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span
                  className={cn(
                    "absolute -top-0.5 -right-0.5",
                    "min-w-[20px] h-[20px] px-1.5",
                    "flex items-center justify-center",
                    "text-[10px] font-bold text-white",
                    "bg-linear-to-r from-primary-500 to-primary-600",
                    "rounded-full shadow-sm",
                    "ring-2 ring-(--bg-card)"
                  )}
                >
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
              aria-label="Notifications"
              onClick={() => router.push("/notifications")}
            >
              <Bell size={20} />
              {notificationsUnreadCount > 0 && (
                <span
                  className={cn(
                    "absolute -top-0.5 -right-0.5",
                    "min-w-[20px] h-[20px] px-1.5",
                    "flex items-center justify-center",
                    "text-[10px] font-bold text-white",
                    "bg-linear-to-r from-red-500 to-red-600",
                    "rounded-full shadow-sm",
                    "ring-2 ring-(--bg-card)"
                  )}
                >
                  {notificationsUnreadCount > 99 ? "99+" : notificationsUnreadCount}
                </span>
              )}
            </Button>

            {/* Language Switcher */}
            <LanguageSwitcher variant="icon" />

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
              aria-label={
                resolvedTheme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
            >
              <div className="relative w-5 h-5">
                <Sun
                  size={20}
                  className={cn(
                    "absolute inset-0 transition-all duration-500",
                    "text-amber-500",
                    resolvedTheme === "dark"
                      ? "opacity-100 rotate-0 scale-100"
                      : "opacity-0 rotate-90 scale-0"
                  )}
                />
                <Moon
                  size={20}
                  className={cn(
                    "absolute inset-0 transition-all duration-500",
                    "text-primary-600 dark:text-primary-400",
                    resolvedTheme === "dark"
                      ? "opacity-0 -rotate-90 scale-0"
                      : "opacity-100 rotate-0 scale-100"
                  )}
                />
              </div>
            </Button>

            {/* User menu */}
            <div className="relative ml-1" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={cn(
                  "flex items-center gap-1.5 p-1 pr-2 rounded-full",
                  "hover:bg-primary-100 dark:hover:bg-primary-900/50",
                  "transition-colors duration-200",
                  userMenuOpen && "bg-primary-100 dark:bg-primary-900/50"
                )}
                aria-label="User menu"
                aria-expanded={userMenuOpen}
              >
                <Avatar
                  src={user?.avatar || DEFAULT_AVATAR}
                  alt={user?.firstName || "User"}
                  size="sm"
                  online={isAuthenticated}
                />
                <ChevronDown
                  size={14}
                  className={cn(
                    "hidden sm:block text-(--text-muted) transition-transform duration-200",
                    userMenuOpen && "rotate-180"
                  )}
                />
              </button>

              {/* Dropdown menu */}
              <div
                className={cn(
                  "absolute right-0 top-full mt-2 w-56",
                  "bg-(--bg-card) rounded-xl",
                  "border border-(--border)",
                  "shadow-xl shadow-black/10 dark:shadow-black/30",
                  "py-2 overflow-hidden",
                  "transition-all duration-200 origin-top-right",
                  userMenuOpen
                    ? "opacity-100 scale-100 translate-y-0"
                    : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                )}
              >
                <div className="px-4 py-3 border-b border-(--border)">
                  <p className="font-semibold text-sm text-(--text)">
                    {user ? `${user.firstName} ${user.lastName}` : "Guest"}
                  </p>
                  <p className="text-xs text-(--text-muted)">
                    {user ? `@${user.username}` : ""}
                  </p>
                </div>
                <div className="py-1">
                  <DropdownItem
                    icon={User}
                    label={t("nav", "profile")}
                    onClick={() => {
                      router.push("/profile");
                    }}
                  />
                  <DropdownItem
                    icon={Settings}
                    label={t("nav", "settings")}
                    onClick={() => {}}
                  />
                  <DropdownItem
                    icon={HelpCircle}
                    label={isRTL ? "المساعدة والدعم" : "Help & Support"}
                    onClick={() => {}}
                  />
                </div>
                <div className="border-t border-(--border) pt-1">
                  <DropdownItem
                    icon={LogOut}
                    label={t("nav", "logout")}
                    danger
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile search overlay */}
      <div
        className={cn(
          "fixed inset-0 z-60 bg-(--bg)/95 backdrop-blur-sm",
          "transition-all duration-300 md:hidden",
          mobileSearchOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
      >
        <div className="flex items-center gap-3 p-4 h-16 border-b border-(--border)">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileSearchOpen(false)}
            aria-label="Close search"
          >
            <X size={20} />
          </Button>
          <div className="flex-1 relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)"
            />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search..."
              className={cn(
                "w-full pl-10 pr-4 py-2.5 rounded-full text-sm",
                "bg-primary-50/80 dark:bg-primary-950/40",
                "border-2 border-primary-400 dark:border-primary-500",
                "placeholder:text-(--text-muted)",
                "outline-none transition-all duration-200"
              )}
            />
          </div>
        </div>
        <div className="p-4">
          <p className="text-sm text-(--text-muted)">Recent searches</p>
        </div>
      </div>

      {/* Create Post Modal */}
      <Modal
        isOpen={createPostModalOpen}
        onClose={() => setCreatePostModalOpen(false)}
        size="lg"
        title="Create Post"
        closeOnBackdropClick={true}
        closeOnEscape={true}
      >
        <div className="p-2">
          <CreatePost
            onClose={() => setCreatePostModalOpen(false)}
            inModal={true}
          />
        </div>
      </Modal>
    </>
  );
}

interface DropdownItemProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  danger?: boolean;
  onClick?: () => void;
}

function DropdownItem({ icon: Icon, label, danger, onClick }: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2.5 text-sm",
        "transition-colors duration-150",
        danger
          ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          : "text-(--text) hover:bg-primary-50 dark:hover:bg-primary-900/30"
      )}
    >
      <Icon size={18} className={danger ? "" : "text-(--text-muted)"} />
      <span>{label}</span>
    </button>
  );
}
