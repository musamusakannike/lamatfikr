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

export interface AdminUserProfile {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  bio: string;
  gender: string;
  birthday: string;
  relationshipStatus: string;
  address: string;
  nationality: string;
  city: string;
  occupation: string;
  workingAt: string;
  school: string;
  website: string;
  interests: string[];
  languagesSpoken: string[];
  avatar: string;
  coverPhoto: string;
  role: string;
  isBanned: boolean;
  emailVerified: boolean;
  verified: boolean;
  paidVerifiedUntil?: string;
  effectiveVerified: boolean;
  lastActive?: string;
  createdAt?: string;
}

export interface AdminUserProfileResponse {
  profile: AdminUserProfile;
}

export interface UpdateAdminUserProfileData {
  firstName?: string;
  lastName?: string;
  bio?: string;
  gender?: string;
  birthday?: string;
  relationshipStatus?: string;
  address?: string;
  nationality?: string;
  city?: string;
  occupation?: string;
  website?: string;
  workingAt?: string;
  school?: string;
  interests?: string[];
  languagesSpoken?: string[];
  phone?: string;
}

