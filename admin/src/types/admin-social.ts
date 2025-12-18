export interface AdminPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface AdminTopFollowedItem {
  userId: string;
  followersCount: number;
  user?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    avatar?: string;
    verified?: boolean;
  };
}

export interface AdminTopFollowedResponse {
  items: AdminTopFollowedItem[];
  pagination: AdminPagination;
}
