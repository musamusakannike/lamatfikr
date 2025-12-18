"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Modal, Avatar, Button } from "@/components/ui";
import { Search, UserPlus, UserMinus, Loader2 } from "lucide-react";
import { socialApi, type UserSummary } from "@/lib/api/index";
import { getErrorMessage } from "@/lib/api";
import toast from "react-hot-toast";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: "followers" | "following";
  onTabChange: (tab: "followers" | "following") => void;
}

interface UserItem {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  verified?: boolean;
  bio?: string;
  isFollowing: boolean;
}

const DEFAULT_AVATAR = "/images/default-avatar.svg";

function UserCard({
  user,
  onToggleFollow,
  isToggling,
}: {
  user: UserItem;
  onToggleFollow: (id: string, currentlyFollowing: boolean) => void;
  isToggling: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors">
      <Avatar src={user.avatar || DEFAULT_AVATAR} alt={user.name} size="lg" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-sm truncate">{user.name}</span>
          {user.verified && (
            <VerifiedBadge size={14} className="shrink-0" />
          )}
        </div>
        <p className="text-sm text-(--text-muted) truncate">@{user.username}</p>
        {user.bio && (
          <p className="text-xs text-(--text-muted) truncate mt-0.5">{user.bio}</p>
        )}
      </div>
      <Button
        variant={user.isFollowing ? "outline" : "primary"}
        size="sm"
        onClick={() => onToggleFollow(user.id, user.isFollowing)}
        className="gap-1.5 shrink-0"
        disabled={isToggling}
      >
        {isToggling ? (
          <Loader2 size={14} className="animate-spin" />
        ) : user.isFollowing ? (
          <>
            <UserMinus size={14} />
            <span className="hidden sm:inline">Following</span>
          </>
        ) : (
          <>
            <UserPlus size={14} />
            <span className="hidden sm:inline">Follow</span>
          </>
        )}
      </Button>
    </div>
  );
}

export function FollowersModal({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
}: FollowersModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [followers, setFollowers] = useState<UserItem[]>([]);
  const [following, setFollowing] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  const transformUser = (user: UserSummary, isFollowing: boolean): UserItem => ({
    id: user._id,
    name: `${user.firstName} ${user.lastName}`,
    username: user.username,
    avatar: user.avatar,
    verified: user.verified,
    bio: user.bio,
    isFollowing,
  });

  const fetchData = useCallback(async () => {
    if (!isOpen) return;
    
    try {
      setIsLoading(true);
      const [followersRes, followingRes] = await Promise.all([
        socialApi.getFollowers(),
        socialApi.getFollowing(),
      ]);

      // Get the list of users I'm following to mark isFollowing correctly
      const followingIds = new Set(followingRes.following.map((u) => u._id));

      setFollowers(
        followersRes.followers.map((u) => transformUser(u, followingIds.has(u._id)))
      );
      setFollowing(
        followingRes.following.map((u) => transformUser(u, true))
      );
    } catch (error) {
      console.error("Failed to fetch followers/following:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currentList = activeTab === "followers" ? followers : following;
  const filteredList = currentList.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleFollow = async (id: string, currentlyFollowing: boolean) => {
    setTogglingIds((prev) => new Set(prev).add(id));

    try {
      if (currentlyFollowing) {
        await socialApi.unfollowUser(id);
        toast.success("Unfollowed successfully");
      } else {
        await socialApi.followUser(id);
        toast.success("Now following!");
      }

      // Update local state
      const updateList = (list: UserItem[]) =>
        list.map((user) =>
          user.id === id ? { ...user, isFollowing: !currentlyFollowing } : user
        );

      setFollowers(updateList);
      setFollowing(updateList);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-4">
        {/* Tabs */}
        <div className="flex border-b border-(--border) mb-4">
          <button
            onClick={() => onTabChange("followers")}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors relative",
              activeTab === "followers"
                ? "text-primary-600 dark:text-primary-400"
                : "text-(--text-muted) hover:text-(--text)"
            )}
          >
            Followers
            {activeTab === "followers" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400" />
            )}
          </button>
          <button
            onClick={() => onTabChange("following")}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors relative",
              activeTab === "following"
                ? "text-primary-600 dark:text-primary-400"
                : "text-(--text-muted) hover:text-(--text)"
            )}
          >
            Following
            {activeTab === "following" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400" />
            )}
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)"
          />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full pl-10 pr-4 py-2.5 rounded-lg text-sm",
              "bg-primary-50/80 dark:bg-primary-950/40",
              "border border-(--border)",
              "focus:border-primary-400 dark:focus:border-primary-500",
              "placeholder:text-(--text-muted)",
              "outline-none transition-all duration-200"
            )}
          />
        </div>

        {/* User list */}
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="py-8 flex justify-center">
              <Loader2 size={24} className="animate-spin text-primary-500" />
            </div>
          ) : filteredList.length > 0 ? (
            filteredList.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onToggleFollow={handleToggleFollow}
                isToggling={togglingIds.has(user.id)}
              />
            ))
          ) : (
            <div className="py-8 text-center">
              <p className="text-(--text-muted)">
                {searchQuery
                  ? `No ${activeTab} found matching "${searchQuery}"`
                  : `No ${activeTab} yet`}
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
