export interface AdminPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface AdminPostItem {
  _id: string;
  userId?: any;
  contentText?: string;
  privacy?: string;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  upvoteCount?: number;
  downvoteCount?: number;
  hasPoll?: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  mediaCount?: number;
}

export interface AdminPostsListResponse {
  posts: AdminPostItem[];
  pagination: AdminPagination;
}

export interface AdminCommentItem {
  _id: string;
  postId: string;
  userId?: any;
  content: string;
  media?: string[];
  reactionCount?: number;
  replyCount?: number;
  deletedAt?: string | null;
  createdAt?: string;
}

export interface AdminCommentsListResponse {
  comments: AdminCommentItem[];
  pagination: AdminPagination;
}

export interface AdminStoryItem {
  _id: string;
  userId?: any;
  media: string[];
  viewCount?: number;
  expiresAt?: string;
  deletedAt?: string | null;
  createdAt?: string;
}

export interface AdminStoriesListResponse {
  stories: AdminStoryItem[];
  pagination: AdminPagination;
}

export interface AdminMediaItem {
  _id: string;
  postId: string;
  type: string;
  url: string;
  thumbnail?: string;
  size?: number;
  duration?: number;
  deletedAt?: string | null;
  createdAt?: string;
}

export interface AdminMediaListResponse {
  media: AdminMediaItem[];
  pagination: AdminPagination;
}
