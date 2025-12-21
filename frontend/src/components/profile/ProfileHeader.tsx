"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button, Card, CardContent } from "@/components/ui";
import {
  Camera,
  Edit3,
  MapPin,
  Briefcase,
  GraduationCap,
  Link as LinkIcon,
  Calendar,
  Heart,
  Mail,
  Phone,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { profileApi, socialApi, uploadApi } from "@/lib/api/index";
import type { User } from "@/types/auth";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/lib/api";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";
import { useRouter } from "next/navigation";

interface ProfileHeaderProps {
  onEditProfile: () => void;
  onShowFollowers: () => void;
  onShowFollowing: () => void;
  onProfileUpdate?: () => void;
}

const DEFAULT_AVATAR = "/images/default-avatar.svg";

export function ProfileHeader({
  onEditProfile,
  onShowFollowers,
  onShowFollowing,
  onProfileUpdate,
}: ProfileHeaderProps) {
  const router = useRouter();
  const { user: authUser, refreshUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitiatingVerifiedPurchase, setIsInitiatingVerifiedPurchase] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isHoveringBanner, setIsHoveringBanner] = useState(false);
  const [isHoveringAvatar, setIsHoveringAvatar] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const [profileRes, followersRes, followingRes] = await Promise.all([
          profileApi.getProfile(),
          socialApi.getFollowers(),
          socialApi.getFollowing(),
        ]);
        setProfile(profileRes.profile);
        setFollowersCount(followersRes.pagination.total);
        setFollowingCount(followingRes.pagination.total);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        toast.error(getErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    };

    if (authUser) {
      fetchProfile();
    }
  }, [authUser]);

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingCover(true);
      const { url: coverPhotoUrl } = await uploadApi.uploadImage(file, "covers");
      await profileApi.updateCoverPhoto(coverPhotoUrl);
      setProfile((prev) => prev ? { ...prev, coverPhoto: coverPhotoUrl } : null);
      toast.success("Cover photo updated!");
      refreshUser();
      onProfileUpdate?.();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAvatar(true);
      const { url: avatarUrl } = await uploadApi.uploadImage(file, "avatars");
      await profileApi.updateAvatar(avatarUrl);
      setProfile((prev) => prev ? { ...prev, avatar: avatarUrl } : null);
      toast.success("Profile photo updated!");
      refreshUser();
      onProfileUpdate?.();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  };

  const formatJoinedDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const isPaidVerifiedActive = !!profile?.paidVerifiedUntil && new Date(profile.paidVerifiedUntil).getTime() > Date.now();

  const handleBuyVerified = async () => {
    try {
      setIsInitiatingVerifiedPurchase(true);
      router.push("/profile/verified");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsInitiatingVerifiedPurchase(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <div className="h-48 sm:h-56 md:h-64 bg-primary-100 dark:bg-primary-900/50 animate-pulse" />
        <CardContent className="relative pt-0 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16 sm:-mt-20">
            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-primary-200 dark:bg-primary-800 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-6 w-48 bg-primary-200 dark:bg-primary-800 rounded animate-pulse" />
              <div className="h-4 w-32 bg-primary-200 dark:bg-primary-800 rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-8 text-center">
          <p className="text-(--text-muted)">Failed to load profile</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Banner Image */}
      <div
        className="relative h-48 sm:h-56 md:h-64 bg-linear-to-r from-primary-500 to-primary-700"
        onMouseEnter={() => setIsHoveringBanner(true)}
        onMouseLeave={() => setIsHoveringBanner(false)}
      >
        {profile.coverPhoto && (
          <Image
            src={profile.coverPhoto}
            alt="Cover photo"
            fill
            className="object-cover"
          />
        )}
        
        {/* Banner edit overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity",
            isHoveringBanner || isUploadingCover ? "opacity-100" : "opacity-0"
          )}
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={() => bannerInputRef.current?.click()}
            className="gap-2"
            disabled={isUploadingCover}
          >
            {isUploadingCover ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Camera size={16} />
            )}
            {isUploadingCover ? "Uploading..." : "Change Cover"}
          </Button>
        </div>
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          onChange={handleBannerChange}
          className="hidden"
        />
      </div>

      <CardContent className="relative pt-0 pb-6">
        {/* Avatar */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16 sm:-mt-20">
          <div
            className="relative"
            onMouseEnter={() => setIsHoveringAvatar(true)}
            onMouseLeave={() => setIsHoveringAvatar(false)}
          >
            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full border-4 border-(--bg-card) overflow-hidden bg-primary-100 dark:bg-primary-900">
              {profile.avatar ? (
                <Image
                  src={profile.avatar}
                  alt={`${profile.firstName} ${profile.lastName}`}
                  width={144}
                  height={144}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image
                  src={DEFAULT_AVATAR}
                  alt="Default avatar"
                  width={144}
                  height={144}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            
            {/* Avatar edit overlay */}
            <div
              className={cn(
                "absolute inset-0 rounded-full bg-black/40 flex items-center justify-center transition-opacity cursor-pointer",
                isHoveringAvatar || isUploadingAvatar ? "opacity-100" : "opacity-0"
              )}
              onClick={() => !isUploadingAvatar && avatarInputRef.current?.click()}
            >
              {isUploadingAvatar ? (
                <Loader2 size={24} className="text-white animate-spin" />
              ) : (
                <Camera size={24} className="text-white" />
              )}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          {/* Name and actions */}
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">
                  {profile.firstName} {profile.lastName}
                </h1>
                {profile.verified && (
                  <VerifiedBadge size={20} />
                )}
              </div>
              <p className="text-(--text-muted)">@{profile.username}</p>
              {isPaidVerifiedActive && (
                <p className="text-sm text-(--text-muted)">
                  Verified until {new Date(profile.paidVerifiedUntil as string).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!profile.verified && !isPaidVerifiedActive && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleBuyVerified}
                  disabled={isInitiatingVerifiedPurchase}
                  className="gap-2"
                >
                  {isInitiatingVerifiedPurchase ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <VerifiedBadge size={16} />
                  )}
                  {isInitiatingVerifiedPurchase ? "Redirecting..." : "Get Verified (1 month)"}
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={onEditProfile}
                className="gap-2"
              >
                <Edit3 size={16} />
                Edit Profile
              </Button>
              <Button variant="ghost" size="icon">
                <MoreHorizontal size={20} />
              </Button>
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="mt-4 text-(--text) whitespace-pre-wrap">{profile.bio}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-6 mt-4">
          <button
            onClick={onShowFollowers}
            className="hover:underline"
          >
            <span className="font-bold">{followersCount.toLocaleString()}</span>
            <span className="text-(--text-muted) ml-1">Followers</span>
          </button>
          <button
            onClick={onShowFollowing}
            className="hover:underline"
          >
            <span className="font-bold">{followingCount.toLocaleString()}</span>
            <span className="text-(--text-muted) ml-1">Following</span>
          </button>
        </div>

        {/* Personal Details */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {profile.address && (
            <div className="flex items-center gap-2 text-sm text-(--text-muted)">
              <MapPin size={16} className="text-primary-500" />
              <span>{profile.address}</span>
            </div>
          )}
          {profile.workingAt && (
            <div className="flex items-center gap-2 text-sm text-(--text-muted)">
              <Briefcase size={16} className="text-primary-500" />
              <span>Works at {profile.workingAt}</span>
            </div>
          )}
          {profile.school && (
            <div className="flex items-center gap-2 text-sm text-(--text-muted)">
              <GraduationCap size={16} className="text-primary-500" />
              <span>Studied at {profile.school}</span>
            </div>
          )}
          {profile.website && (
            <div className="flex items-center gap-2 text-sm">
              <LinkIcon size={16} className="text-primary-500" />
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                {profile.website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}
          {profile.birthday && (
            <div className="flex items-center gap-2 text-sm text-(--text-muted)">
              <Calendar size={16} className="text-primary-500" />
              <span>Born on {formatDate(profile.birthday)}</span>
            </div>
          )}
          {profile.relationshipStatus && (
            <div className="flex items-center gap-2 text-sm text-(--text-muted)">
              <Heart size={16} className="text-primary-500" />
              <span>{profile.relationshipStatus}</span>
            </div>
          )}
          {profile.email && (
            <div className="flex items-center gap-2 text-sm text-(--text-muted)">
              <Mail size={16} className="text-primary-500" />
              <span>{profile.email}</span>
            </div>
          )}
          {profile.phone && (
            <div className="flex items-center gap-2 text-sm text-(--text-muted)">
              <Phone size={16} className="text-primary-500" />
              <span>{profile.phone}</span>
            </div>
          )}
        </div>

        {/* Joined date */}
        {profile.createdAt && (
          <p className="mt-4 text-sm text-(--text-muted)">
            Joined {formatJoinedDate(profile.createdAt)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
