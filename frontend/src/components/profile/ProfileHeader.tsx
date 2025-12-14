"use client";

import { useState, useRef } from "react";
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
  CheckCircle,
  MoreHorizontal,
} from "lucide-react";
import Image from "next/image";

interface ProfileHeaderProps {
  onEditProfile: () => void;
  onShowFollowers: () => void;
  onShowFollowing: () => void;
}

// Mock user data - in real app, this would come from API/context
const mockUser = {
  id: "1",
  firstName: "John",
  lastName: "Doe",
  username: "johndoe",
  email: "john.doe@example.com",
  phone: "+1 234 567 8900",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop",
  coverPhoto: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&h=400&fit=crop",
  bio: "Full-stack developer passionate about building great products. Love coffee, coding, and creating meaningful connections. 🚀",
  verified: true,
  location: "San Francisco, CA",
  workingAt: "Tech Startup Inc.",
  school: "Stanford University",
  website: "https://johndoe.dev",
  birthday: "January 15",
  relationshipStatus: "Single",
  followersCount: 1234,
  followingCount: 567,
  postsCount: 89,
  joinedDate: "March 2023",
};

export function ProfileHeader({
  onEditProfile,
  onShowFollowers,
  onShowFollowing,
}: ProfileHeaderProps) {
  const [isHoveringBanner, setIsHoveringBanner] = useState(false);
  const [isHoveringAvatar, setIsHoveringAvatar] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Upload banner image
      console.log("Banner file:", file);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Upload avatar image
      console.log("Avatar file:", file);
    }
  };

  return (
    <Card className="overflow-hidden">
      {/* Banner Image */}
      <div
        className="relative h-48 sm:h-56 md:h-64 bg-linear-to-r from-primary-500 to-primary-700"
        onMouseEnter={() => setIsHoveringBanner(true)}
        onMouseLeave={() => setIsHoveringBanner(false)}
      >
        {mockUser.coverPhoto && (
          <Image
            src={mockUser.coverPhoto}
            alt="Cover photo"
            fill
            className="object-cover"
          />
        )}
        
        {/* Banner edit overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity",
            isHoveringBanner ? "opacity-100" : "opacity-0"
          )}
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={() => bannerInputRef.current?.click()}
            className="gap-2"
          >
            <Camera size={16} />
            Change Cover
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
              {mockUser.avatar ? (
                <Image
                  src={mockUser.avatar}
                  alt={`${mockUser.firstName} ${mockUser.lastName}`}
                  width={144}
                  height={144}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-primary-600 dark:text-primary-400">
                  {mockUser.firstName.charAt(0)}
                </div>
              )}
            </div>
            
            {/* Avatar edit overlay */}
            <div
              className={cn(
                "absolute inset-0 rounded-full bg-black/40 flex items-center justify-center transition-opacity cursor-pointer",
                isHoveringAvatar ? "opacity-100" : "opacity-0"
              )}
              onClick={() => avatarInputRef.current?.click()}
            >
              <Camera size={24} className="text-white" />
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />

            {/* Verified badge */}
            {mockUser.verified && (
              <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center border-2 border-(--bg-card)">
                <CheckCircle size={16} className="text-white" fill="currentColor" />
              </div>
            )}
          </div>

          {/* Name and actions */}
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">
                  {mockUser.firstName} {mockUser.lastName}
                </h1>
              </div>
              <p className="text-(--text-muted)">@{mockUser.username}</p>
            </div>

            <div className="flex items-center gap-2">
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
        {mockUser.bio && (
          <p className="mt-4 text-(--text) whitespace-pre-wrap">{mockUser.bio}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-6 mt-4">
          <button
            onClick={onShowFollowers}
            className="hover:underline"
          >
            <span className="font-bold">{mockUser.followersCount.toLocaleString()}</span>
            <span className="text-(--text-muted) ml-1">Followers</span>
          </button>
          <button
            onClick={onShowFollowing}
            className="hover:underline"
          >
            <span className="font-bold">{mockUser.followingCount.toLocaleString()}</span>
            <span className="text-(--text-muted) ml-1">Following</span>
          </button>
          <div>
            <span className="font-bold">{mockUser.postsCount}</span>
            <span className="text-(--text-muted) ml-1">Posts</span>
          </div>
        </div>

        {/* Personal Details */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {mockUser.location && (
            <div className="flex items-center gap-2 text-sm text-(--text-muted)">
              <MapPin size={16} className="text-primary-500" />
              <span>{mockUser.location}</span>
            </div>
          )}
          {mockUser.workingAt && (
            <div className="flex items-center gap-2 text-sm text-(--text-muted)">
              <Briefcase size={16} className="text-primary-500" />
              <span>Works at {mockUser.workingAt}</span>
            </div>
          )}
          {mockUser.school && (
            <div className="flex items-center gap-2 text-sm text-(--text-muted)">
              <GraduationCap size={16} className="text-primary-500" />
              <span>Studied at {mockUser.school}</span>
            </div>
          )}
          {mockUser.website && (
            <div className="flex items-center gap-2 text-sm">
              <LinkIcon size={16} className="text-primary-500" />
              <a
                href={mockUser.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                {mockUser.website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}
          {mockUser.birthday && (
            <div className="flex items-center gap-2 text-sm text-(--text-muted)">
              <Calendar size={16} className="text-primary-500" />
              <span>Born on {mockUser.birthday}</span>
            </div>
          )}
          {mockUser.relationshipStatus && (
            <div className="flex items-center gap-2 text-sm text-(--text-muted)">
              <Heart size={16} className="text-primary-500" />
              <span>{mockUser.relationshipStatus}</span>
            </div>
          )}
          {mockUser.email && (
            <div className="flex items-center gap-2 text-sm text-(--text-muted)">
              <Mail size={16} className="text-primary-500" />
              <span>{mockUser.email}</span>
            </div>
          )}
          {mockUser.phone && (
            <div className="flex items-center gap-2 text-sm text-(--text-muted)">
              <Phone size={16} className="text-primary-500" />
              <span>{mockUser.phone}</span>
            </div>
          )}
        </div>

        {/* Joined date */}
        <p className="mt-4 text-sm text-(--text-muted)">
          Joined {mockUser.joinedDate}
        </p>
      </CardContent>
    </Card>
  );
}
