import { apiClient } from "@/lib/api";

export interface Announcement {
    _id: string;
    title: string;
    content: string;
    priority: "low" | "medium" | "high";
    isActive: boolean;
    createdBy: {
        _id: string;
        firstName: string;
        lastName: string;
        username: string;
        avatar?: string;
        verified?: boolean;
    };
    createdAt: string;
    updatedAt: string;
}

export interface AnnouncementsResponse {
    announcements: Announcement[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export interface UnreadCountResponse {
    unreadCount: number;
}

export const announcementsApi = {
    getAnnouncements: (page = 1, limit = 20) =>
        apiClient.get<AnnouncementsResponse>(
            `/announcements?page=${page}&limit=${limit}`
        ),

    getUnreadCount: () =>
        apiClient.get<UnreadCountResponse>("/announcements/unread-count"),

    markAsRead: (announcementId: string) =>
        apiClient.post<{ message: string }>(`/announcements/${announcementId}/read`),
};
