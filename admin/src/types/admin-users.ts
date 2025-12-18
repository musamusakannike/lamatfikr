export interface AdminUserListItem {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  emailVerified: boolean;
  avatar?: string;
  role: string;
  isBanned: boolean;
  verified: boolean;
  paidVerifiedUntil?: string;
  effectiveVerified: boolean;
  createdAt?: string;
  lastActive?: string;
}

export interface AdminUsersListResponse {
  page: number;
  limit: number;
  total: number;
  pages: number;
  items: AdminUserListItem[];
}
