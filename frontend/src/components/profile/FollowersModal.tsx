"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Modal, Avatar, Button } from "@/components/ui";
import { Search, UserPlus, UserMinus, CheckCircle } from "lucide-react";

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
  avatar: string;
  verified?: boolean;
  bio?: string;
  isFollowing: boolean;
}

const mockFollowers: UserItem[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    username: "sarah_j",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    verified: true,
    bio: "Product Designer at Tech Co.",
    isFollowing: true,
  },
  {
    id: "2",
    name: "Mike Chen",
    username: "mike_dev",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    bio: "Full-stack developer",
    isFollowing: false,
  },
  {
    id: "3",
    name: "Emma Wilson",
    username: "emma_art",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    bio: "Artist & Creative Director",
    isFollowing: true,
  },
  {
    id: "4",
    name: "Alex Rivera",
    username: "alex_r",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    verified: true,
    bio: "Entrepreneur | Speaker",
    isFollowing: false,
  },
  {
    id: "5",
    name: "Lisa Park",
    username: "lisa_park",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
    bio: "UX Researcher",
    isFollowing: true,
  },
];

const mockFollowing: UserItem[] = [
  {
    id: "6",
    name: "David Kim",
    username: "david_k",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    verified: true,
    bio: "Tech Lead at Startup",
    isFollowing: true,
  },
  {
    id: "7",
    name: "Rachel Green",
    username: "rachel_g",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    bio: "Fashion Designer",
    isFollowing: true,
  },
  {
    id: "8",
    name: "Tom Anderson",
    username: "tom_a",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
    bio: "Photographer",
    isFollowing: true,
  },
];

function UserCard({
  user,
  onToggleFollow,
}: {
  user: UserItem;
  onToggleFollow: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors">
      <Avatar src={user.avatar} alt={user.name} size="lg" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-sm truncate">{user.name}</span>
          {user.verified && (
            <CheckCircle size={14} className="text-primary-500 shrink-0" fill="currentColor" />
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
        onClick={() => onToggleFollow(user.id)}
        className="gap-1.5 shrink-0"
      >
        {user.isFollowing ? (
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
  const [followers, setFollowers] = useState(mockFollowers);
  const [following, setFollowing] = useState(mockFollowing);

  const currentList = activeTab === "followers" ? followers : following;
  const filteredList = currentList.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleFollow = (id: string) => {
    if (activeTab === "followers") {
      setFollowers((prev) =>
        prev.map((user) =>
          user.id === id ? { ...user, isFollowing: !user.isFollowing } : user
        )
      );
    } else {
      setFollowing((prev) =>
        prev.map((user) =>
          user.id === id ? { ...user, isFollowing: !user.isFollowing } : user
        )
      );
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
          {filteredList.length > 0 ? (
            filteredList.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onToggleFollow={handleToggleFollow}
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
