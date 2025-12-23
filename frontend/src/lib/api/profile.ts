import { apiClient } from "@/lib/api";
import type { User } from "@/types/auth";

export interface ProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
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
  location?: {
    type: "Point";
    coordinates: number[];
  };
}

export interface VerifiedTagInitiateResponse {
  message: string;
  redirectUrl: string;
  chargeId: string;
  amount: number;
  currency: string;
  durationDays: number;
}

export interface VerifiedTagVerifyResponse {
  message: string;
  profile: User;
  verifiedUntil: string;
}

export interface PrivacySettings {
  whoCanFollowMe?: "everyone" | "friends" | "nobody";
  whoCanMessageMe?: "everyone" | "friends" | "nobody";
  whoCanSeeMyBirthday?: "everyone" | "friends" | "nobody";
  whoCanSeeMyEmail?: "everyone" | "friends" | "nobody";
  whoCanSeeMyPhone?: "everyone" | "friends" | "nobody";
  whoCanSeeMyLocation?: "everyone" | "friends" | "nobody";
  whoCanSeeMyGender?: "everyone" | "friends" | "nobody";
  whoCanSeeMyNationality?: "everyone" | "friends" | "nobody";
  whoCanSeeMyCity?: "everyone" | "friends" | "nobody";
  whoCanSeeMyOccupation?: "everyone" | "friends" | "nobody";
  whoCanSeeMyRelationshipStatus?: "everyone" | "friends" | "nobody";
  whoCanSeeMyWorkingAt?: "everyone" | "friends" | "nobody";
  whoCanSeeMySchool?: "everyone" | "friends" | "nobody";
  whoCanSeeMyWebsite?: "everyone" | "friends" | "nobody";
  whoCanSeeMyInterests?: "everyone" | "friends" | "nobody";
  whoCanSeeMyLanguages?: "everyone" | "friends" | "nobody";
}

export interface ProfileResponse {
  profile: User;
}

export interface PublicProfile {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar?: string;
  coverPhoto?: string;
  bio?: string;
  verified: boolean;
  role: string;
  createdAt: string;
  gender?: string;
  birthday?: string;
  address?: string;
  nationality?: string;
  city?: string;
  occupation?: string;
  relationshipStatus?: string;
  website?: string;
  workingAt?: string;
  school?: string;
  interests?: string[];
  languagesSpoken?: string[];
}

export const profileApi = {
  getProfile: () => apiClient.get<ProfileResponse>("/profile/me"),

  getPublicProfile: (username: string) =>
    apiClient.get<{ profile: PublicProfile }>(`/profile/user/${username}`),

  updateProfile: (data: ProfileData) =>
    apiClient.patch<{ message: string; profile: User }>("/profile", data),

  updateAvatar: (avatarUrl: string) =>
    apiClient.patch<{ message: string; avatar: string }>("/profile/avatar", {
      avatarUrl,
    }),

  updateCoverPhoto: (coverPhotoUrl: string) =>
    apiClient.patch<{ message: string; coverPhoto: string }>(
      "/profile/cover-photo",
      { coverPhotoUrl }
    ),

  getPrivacySettings: () =>
    apiClient.get<{ privacySettings: PrivacySettings }>("/profile/privacy"),

  updatePrivacySettings: (settings: PrivacySettings) =>
    apiClient.patch<{ message: string; privacySettings: PrivacySettings }>(
      "/profile/privacy",
      settings
    ),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post<{ message: string }>("/profile/change-password", {
      currentPassword,
      newPassword,
    }),

  deleteAccount: (password?: string) =>
    apiClient.delete<{ message: string }>("/profile", {
      data: password ? { password } : undefined,
    }),

  initiateVerifiedTagPurchase: () =>
    apiClient.post<VerifiedTagInitiateResponse>("/profile/verified-tag/initiate"),

  verifyVerifiedTagPurchase: (tapId: string) =>
    apiClient.get<VerifiedTagVerifyResponse>(`/profile/verified-tag/verify?tap_id=${tapId}`),
};
