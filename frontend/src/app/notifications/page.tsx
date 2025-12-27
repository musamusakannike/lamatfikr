"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Navbar, Sidebar } from "@/components/layout";
import { Button, Card, CardContent, Avatar } from "@/components/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { notificationsApi, type Notification } from "@/lib/api/notifications";

function getNotificationText(n: Notification, t: (section: string, key: string) => string) {
  const actor = typeof n.actorId === "object" ? `${n.actorId.firstName} ${n.actorId.lastName}` : "Someone";

  switch (n.type) {
    case "like":
      return `${actor} ${t("notifications", "likedContent")}`;
    case "comment":
      return `${actor} ${t("notifications", "commented")}`;
    case "follow":
      return `${actor} ${t("notifications", "startedFollowing")}`;
    case "mention":
      return `${actor} ${t("notifications", "mentionedYou")}`;
    case "friend_request":
      return `${actor} ${t("notifications", "sentFriendRequest")}`;
    case "friend_accept":
      return `${actor} ${t("notifications", "acceptedFriendRequest")}`;
    case "verification_request_submitted":
      return `${actor} ${t("notifications", "verificationRequestSubmitted")}`;
    case "verification_request_approved":
      return t("notifications", "verificationRequestApproved");
    case "verification_request_rejected":
      return t("notifications", "verificationRequestRejected");
    case "marketplace_order_paid_buyer":
      return t("notifications", "orderPaymentConfirmed");
    case "marketplace_order_paid_seller":
      return t("notifications", "newPaidOrder");
    case "room_livestream_started":
      return `${actor} ${t("notifications", "startedLivestream")}`;
    case "room_video_call_started":
      return `${actor} ${t("notifications", "startedVideoCall")}`;
    case "room_space_started":
      return `${actor} ${t("notifications", "startedSpace")}`;
    default:
      return t("notifications", "newNotification");
  }
}

export default function NotificationsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isRTL, t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const load = async (nextPage = 1) => {
    setIsLoading(true);
    try {
      const res = await notificationsApi.list(nextPage, 20);
      setItems(res.notifications);
      setPage(res.pagination.page);
      setPages(res.pagination.pages);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    load(1);
  }, [isAuthenticated]);

  const handleOpen = async (n: Notification) => {
    try {
      if (!n.isRead) {
        await notificationsApi.markRead(n._id);
      }
    } catch {
      // ignore
    }

    router.push(n.url);
  };

  const markAll = async () => {
    try {
      await notificationsApi.markAllRead();
      await load(page);
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} isSidebarOpen={sidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className={cn("pt-16", isRTL ? "lg:pr-64" : "lg:pl-64")}>
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">{t("notifications", "title")}</h1>
            <Button variant="outline" size="sm" onClick={markAll} disabled={!isAuthenticated || items.length === 0}>
              {t("notifications", "markAllAsRead")}
            </Button>
          </div>

          {!isAuthenticated ? (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-(--text-muted)">{t("notifications", "pleaseLogin")}</p>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-(--text-muted)">Loading...</p>
              </CardContent>
            </Card>
          ) : items.length === 0 ? (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-(--text-muted)">{t("notifications", "noNotificationsYet")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {items.map((n) => {
                const actor = typeof n.actorId === "object" ? n.actorId : undefined;
                return (
                  <button
                    key={n._id}
                    onClick={() => handleOpen(n)}
                    className={cn(
                      "w-full text-left",
                      "p-3 rounded-xl border border-(--border)",
                      "bg-(--bg-card)",
                      "hover:bg-primary-50 dark:hover:bg-primary-900/20",
                      "transition-colors",
                      !n.isRead && "ring-1 ring-primary-400/40"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar src={actor?.avatar} alt={actor?.firstName || "User"} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm", !n.isRead ? "font-semibold" : "text-(--text)")}>
                          {getNotificationText(n, t)}
                        </p>
                        <p className="text-xs text-(--text-muted) truncate">{n.url}</p>
                      </div>
                      {!n.isRead && <span className="w-2.5 h-2.5 rounded-full bg-primary-500" />}
                    </div>
                  </button>
                );
              })}

              <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" size="sm" onClick={() => load(Math.max(1, page - 1))} disabled={page <= 1}>
                  {t("notifications", "prev")}
                </Button>
                <p className="text-xs text-(--text-muted)">
                  {t("notifications", "page")} {page} / {pages}
                </p>
                <Button variant="ghost" size="sm" onClick={() => load(Math.min(pages, page + 1))} disabled={page >= pages}>
                  {t("notifications", "next")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
