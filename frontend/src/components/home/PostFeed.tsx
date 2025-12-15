"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import {
  LayoutList,
  Grid3X3,
  Megaphone,
} from "lucide-react";
import { PostCard } from "@/components/shared/PostCard";
import type { Post as ApiPost } from "@/lib/api/posts";

type FilterType = "all" | "images" | "announcements";

interface Post {
  id: string;
  author: {
    name: string;
    username: string;
    avatar: string;
    verified?: boolean;
  };
  content: string;
  images?: string[];
  upvotes: number;
  comments: number;
  shares: number;
  timestamp: string;
  isAnnouncement?: boolean;
  userVote?: "up" | "down" | null;
}

const dummyPosts: Post[] = [
  {
    id: "1",
    author: {
      name: "Sarah Johnson",
      username: "sarah_j",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      verified: true,
    },
    content: "Just launched my new project! 🚀 After months of hard work, I'm excited to share what we've been building. Check it out and let me know your thoughts!",
    images: [
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=400&fit=crop",
    ],
    upvotes: 234,
    comments: 45,
    shares: 12,
    timestamp: "2h ago",
    userVote: null,
  },
  {
    id: "2",
    author: {
      name: "Lamatfikr Team",
      username: "lamatfikr",
      avatar: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop",
      verified: true,
    },
    content: "📢 Important Update: We're rolling out new community guidelines to make Lamatfikr a safer and more inclusive space for everyone. Please take a moment to review the changes.",
    upvotes: 1892,
    comments: 234,
    shares: 89,
    timestamp: "5h ago",
    isAnnouncement: true,
    userVote: "up",
  },
  {
    id: "3",
    author: {
      name: "Mike Chen",
      username: "mike_dev",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    },
    content: "The sunset from my balcony today was absolutely breathtaking! 🌅 Nature never fails to amaze me.",
    images: [
      "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=600&h=400&fit=crop",
    ],
    upvotes: 567,
    comments: 78,
    shares: 23,
    timestamp: "8h ago",
    userVote: null,
  },
  {
    id: "4",
    author: {
      name: "Emma Wilson",
      username: "emma_art",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    },
    content: "Just finished reading 'Atomic Habits' by James Clear. Highly recommend it to anyone looking to build better habits and break bad ones. The 1% improvement concept is a game-changer! 📚",
    upvotes: 123,
    comments: 34,
    shares: 8,
    timestamp: "12h ago",
    userVote: "up",
  },
  {
    id: "5",
    author: {
      name: "Tech Community",
      username: "tech_community",
      avatar: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=100&h=100&fit=crop",
      verified: true,
    },
    content: "🎉 Announcing our upcoming virtual hackathon! Join developers from around the world for 48 hours of coding, learning, and fun. Registration opens next week!",
    upvotes: 2341,
    comments: 456,
    shares: 234,
    timestamp: "1d ago",
    isAnnouncement: true,
    userVote: null,
  },
];

function FilterButton({
  active,
  onClick,
  children,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon: React.ElementType;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all",
        active
          ? "bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300"
          : "text-(--text-muted) hover:bg-primary-50 dark:hover:bg-primary-900/30"
      )}
    >
      <Icon size={18} />
      <span className="hidden sm:inline">{children}</span>
    </button>
  );
}

// Helper function to convert dummy post to API Post format
function convertDummyPost(dummyPost: Post): ApiPost {
  return {
    _id: dummyPost.id,
    userId: {
      _id: "dummy",
      firstName: dummyPost.author.name.split(" ")[0],
      lastName: dummyPost.author.name.split(" ").slice(1).join(" "),
      username: dummyPost.author.username,
      avatar: dummyPost.author.avatar,
      verified: dummyPost.author.verified,
    },
    contentText: dummyPost.content,
    privacy: "public" as const,
    media: dummyPost.images?.map((url, index) => ({
      _id: `media-${index}`,
      type: "image" as const,
      url,
    })),
    upvotes: dummyPost.upvotes,
    downvotes: 0,
    commentCount: dummyPost.comments,
    shareCount: dummyPost.shares,
    hasPoll: false,
    userVote: dummyPost.userVote === "up" ? ("upvote" as const) : dummyPost.userVote === "down" ? ("downvote" as const) : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function PostFeed() {
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredPosts = dummyPosts.filter((post) => {
    if (filter === "images") return post.images && post.images.length > 0;
    if (filter === "announcements") return post.isAnnouncement;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="bg-(--bg-card) rounded-xl border border-(--border) p-2 flex gap-2">
        <FilterButton
          active={filter === "all"}
          onClick={() => setFilter("all")}
          icon={LayoutList}
        >
          All Posts
        </FilterButton>
        <FilterButton
          active={filter === "images"}
          onClick={() => setFilter("images")}
          icon={Grid3X3}
        >
          Media
        </FilterButton>
        <FilterButton
          active={filter === "announcements"}
          onClick={() => setFilter("announcements")}
          icon={Megaphone}
        >
          Announcements
        </FilterButton>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <PostCard key={post.id} post={convertDummyPost(post)} showAnnouncement={post.isAnnouncement} />
        ))}
      </div>

      {/* Load more */}
      <div className="flex justify-center py-4">
        <Button variant="outline" className="gap-2">
          Load more posts
        </Button>
      </div>
    </div>
  );
}
