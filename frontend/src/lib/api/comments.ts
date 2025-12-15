import { apiClient } from "@/lib/api";

export interface Comment {
    _id: string;
    postId: string;
    userId: {
        _id: string;
        firstName: string;
        lastName: string;
        username: string;
        avatar?: string;
        verified?: boolean;
    };
    parentCommentId?: string | null;
    content: string;
    media?: Array<{
        type: "image" | "video" | "audio" | "voice_note" | "file";
        url: string;
        thumbnail?: string;
        size?: number;
        duration?: number;
    }>;
    reactionCount: number;
    replyCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCommentData {
    content: string;
    parentCommentId?: string;
    media?: Array<{
        type: "image" | "video" | "audio" | "voice_note" | "file";
        url: string;
        thumbnail?: string;
        size?: number;
        duration?: number;
    }>;
}

export const commentsApi = {
    getComments: (postId: string, page = 1, limit = 20) =>
        apiClient.get<{ comments: Comment[]; pagination: { page: number; limit: number; total: number; pages: number } }>(
            `/posts/${postId}/comments?page=${page}&limit=${limit}`
        ),

    getReplies: (postId: string, commentId: string, page = 1, limit = 20) =>
        apiClient.get<{ replies: Comment[]; pagination: { page: number; limit: number; total: number; pages: number } }>(
            `/posts/${postId}/comments/${commentId}/replies?page=${page}&limit=${limit}`
        ),

    createComment: (postId: string, data: CreateCommentData) =>
        apiClient.post<{ message: string; comment: Comment }>(`/posts/${postId}/comments`, data),

    updateComment: (postId: string, commentId: string, content: string) =>
        apiClient.patch<{ message: string; comment: Comment }>(`/posts/${postId}/comments/${commentId}`, { content }),

    deleteComment: (postId: string, commentId: string) =>
        apiClient.delete<{ message: string }>(`/posts/${postId}/comments/${commentId}`),

    reactToComment: (postId: string, commentId: string, reactionType: string) =>
        apiClient.post<{ message: string; userReaction: string | null }>(`/posts/${postId}/comments/${commentId}/react`, { reactionType }),

    removeCommentReaction: (postId: string, commentId: string) =>
        apiClient.delete<{ message: string }>(`/posts/${postId}/comments/${commentId}/react`),

    saveComment: (postId: string, commentId: string) =>
        apiClient.post<{ message: string }>(`/posts/${postId}/comments/${commentId}/save`),

    unsaveComment: (commentId: string) =>
        apiClient.delete<{ message: string }>(`/posts/comments/${commentId}/save`),
};
