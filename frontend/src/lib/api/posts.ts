import { apiClient } from "@/lib/api";

export interface Post {
    _id: string;
    userId: {
        _id: string;
        firstName: string;
        lastName: string;
        username: string;
        avatar?: string;
        verified?: boolean;
    };
    contentText?: string;
    privacy: "public" | "followers" | "friends" | "friends_only" | "me_only";
    location?: string;
    feeling?: string;
    isEdited?: boolean;
    media?: Array<{
        _id: string;
        type: "image" | "video" | "audio" | "voice_note" | "file";
        url: string;
        thumbnail?: string;
        size?: number;
        duration?: number;
    }>;
    poll?: {
        _id: string;
        question: string;
        options: Array<{
            _id: string;
            text: string;
            voteCount: number;
        }>;
        allowMultipleVotes: boolean;
        endsAt?: string;
        userVotes?: string[];
    };
    upvotes: number;
    downvotes: number;
    likeCount?: number;
    commentCount: number;
    shareCount: number;
    hasPoll: boolean;
    userVote?: "upvote" | "downvote" | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePostData {
    contentText?: string;
    privacy?: "public" | "followers" | "friends" | "friends_only" | "me_only";
    location?: string;
    feeling?: string;
    media?: Array<{
        type: "image" | "video" | "audio" | "voice_note" | "file";
        url: string;
        thumbnail?: string;
        size?: number;
        duration?: number;
    }>;
    poll?: {
        question: string;
        options: string[];
        allowMultipleVotes?: boolean;
        endsAt?: string;
    };
}

export interface CreatePostResponse {
    message: string;
    post: Post;
}

export const postsApi = {
    createPost: (data: CreatePostData) =>
        apiClient.post<CreatePostResponse>("/posts", data),

    getFeed: (page = 1, limit = 20) =>
        apiClient.get<{ posts: Post[]; pagination: { page: number; limit: number; total: number; pages: number } }>(
            `/posts/feed?page=${page}&limit=${limit}`
        ),

    getMediaPosts: (page = 1, limit = 20) =>
        apiClient.get<{ posts: Post[]; pagination: { page: number; limit: number; total: number; pages: number } }>(
            `/posts/media?page=${page}&limit=${limit}`
        ),

    getUserPosts: (userId: string, page = 1, limit = 20) =>
        apiClient.get<{ posts: Post[]; pagination: { page: number; limit: number; total: number; pages: number } }>(
            `/posts/user/${userId}?page=${page}&limit=${limit}`
        ),

    getPost: (postId: string) =>
        apiClient.get<{ post: Post }>(`/posts/${postId}`),

    updatePost: (postId: string, data: Partial<CreatePostData>) =>
        apiClient.patch<{ message: string; post: Post }>(`/posts/${postId}`, data),

    deletePost: (postId: string) =>
        apiClient.delete<{ message: string }>(`/posts/${postId}`),

    votePost: (postId: string, voteType: "upvote" | "downvote") =>
        apiClient.post<{ message: string }>(`/posts/${postId}/vote`, { voteType }),

    removeVote: (postId: string) =>
        apiClient.delete<{ message: string }>(`/posts/${postId}/vote`),

    savePost: (postId: string) =>
        apiClient.post<{ message: string }>(`/posts/${postId}/save`),

    unsavePost: (postId: string) =>
        apiClient.delete<{ message: string }>(`/posts/${postId}/save`),

    getSavedPosts: (page = 1, limit = 20) =>
        apiClient.get<{ posts: Post[]; pagination: { page: number; limit: number; total: number; pages: number } }>(
            `/posts/saved?page=${page}&limit=${limit}`
        ),

    votePoll: (postId: string, optionIds: string[]) =>
        apiClient.post<{ message: string; poll: Post["poll"] }>(`/posts/${postId}/poll/vote`, { optionIds }),
};
