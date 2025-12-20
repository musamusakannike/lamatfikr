import { apiClient } from "@/lib/api";

export interface NotificationActor {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar?: string;
  verified?: boolean;
}

export interface Notification {
  _id: string;
  userId: string;
  actorId?: NotificationActor | string;
  type:
  | "like"
  | "comment"
  | "follow"
  | "mention"
  | "friend_request"
  | "friend_accept"
  | "verification_request_submitted"
  | "verification_request_approved"
  | "verification_request_rejected"
  | "marketplace_order_paid_buyer"
  | "marketplace_order_paid_seller";
  targetId?: string;
  url: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationsApi = {
  getUnreadCount: () => apiClient.get<{ unreadCount: number }>("/notifications/unread-count"),

  list: (page = 1, limit = 20, unreadOnly = false) =>
    apiClient.get<{
      notifications: Notification[];
      pagination: { page: number; limit: number; total: number; pages: number };
    }>(`/notifications?page=${page}&limit=${limit}&unreadOnly=${unreadOnly}`),

  markRead: (notificationId: string) =>
    apiClient.post<{ message: string }>(`/notifications/${notificationId}/read`),

  markAllRead: () => apiClient.post<{ message: string }>("/notifications/read-all"),
};
