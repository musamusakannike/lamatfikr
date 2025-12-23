export const Gender = {
  male: "male",
  female: "female",
  other: "other",
  preferNotToSay: "prefer_not_to_say",
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];

export const AuthProvider = {
  email: "email",
  google: "google",
  facebook: "facebook",
  apple: "apple",
} as const;
export type AuthProvider = (typeof AuthProvider)[keyof typeof AuthProvider];

export const UserRole = {
  user: "user",
  admin: "admin",
  moderator: "moderator",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const PrivacyOption = {
  everyone: "everyone",
  friends: "friends",
  nobody: "nobody",
} as const;
export type PrivacyOption = (typeof PrivacyOption)[keyof typeof PrivacyOption];

export interface PrivacySettings {
  whoCanFollowMe: PrivacyOption;
  whoCanMessageMe: PrivacyOption;
  whoCanSeeMyBirthday: PrivacyOption;
  whoCanSeeMyEmail: PrivacyOption;
  whoCanSeeMyPhone: PrivacyOption;
  whoCanSeeMyLocation: PrivacyOption;
  whoCanSeeMyGender: PrivacyOption;
  whoCanSeeMyNationality: PrivacyOption;
  whoCanSeeMyCity: PrivacyOption;
  whoCanSeeMyOccupation: PrivacyOption;
  whoCanSeeMyRelationshipStatus: PrivacyOption;
  whoCanSeeMyWorkingAt: PrivacyOption;
  whoCanSeeMySchool: PrivacyOption;
  whoCanSeeMyWebsite: PrivacyOption;
  whoCanSeeMyInterests: PrivacyOption;
  whoCanSeeMyLanguages: PrivacyOption;
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  emailVerified?: boolean;
  phone?: string;
  avatar?: string;
  coverPhoto?: string;
  bio?: string;
  gender?: Gender;
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
  verified: boolean;
  paidVerifiedUntil?: string;
  role: UserRole;
  privacySettings?: PrivacySettings;
  lastActive?: string;
  isBanned?: boolean;
  authProvider?: AuthProvider;
  createdAt?: string;
  updatedAt?: string;
  location?: {
    type: "Point";
    coordinates: number[];
  };
}

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  avatar?: string;
  verified: boolean;
  paidVerifiedUntil?: string;
  role: UserRole;
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  gender: Gender;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SocialAuthInput {
  idToken: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  gender?: Gender;
}

export interface CompleteSocialProfileInput {
  idToken: string;
  username: string;
  firstName: string;
  lastName: string;
  gender: Gender;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

export interface ResendVerificationInput {
  email: string;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  user: AuthUser;
}

export interface RegisterResponse {
  message: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    emailVerified: boolean;
  };
}

export interface SocialAuthResponse {
  message: string;
  accessToken?: string;
  user?: AuthUser;
  requiresProfileCompletion: boolean;
  missingFields?: string[];
  firebaseUser?: {
    uid: string;
    email?: string;
    displayName?: string;
    photoURL?: string;
  };
}

export interface MessageResponse {
  message: string;
}
