"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, Badge, Button, Card, CardContent } from "@/components/ui";
import {
  ArrowBigUp,
  ArrowBigDown,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  LayoutList,
  Grid3X3,
  Megaphone,
} from "lucide-react";
import Image from "next/image";

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

function PostCard({ post }: { post: Post }) {
  const [votes, setVotes] = useState(post.upvotes);
  const [userVote, setUserVote] = useState<"up" | "down" | null>(post.userVote || null);
  const [saved, setSaved] = useState(false);

  const handleUpvote = () => {
    if (userVote === "up") {
      setVotes(votes - 1);
      setUserVote(null);
    } else if (userVote === "down") {
      setVotes(votes + 2);
      setUserVote("up");
    } else {
      setVotes(votes + 1);
      setUserVote("up");
    }
  };

  const handleDownvote = () => {
    if (userVote === "down") {
      setUserVote(null);
    } else if (userVote === "up") {
      setVotes(votes - 1);
      setUserVote("down");
    } else {
      setUserVote("down");
    }
  };

  return (
    <Card className={cn(post.isAnnouncement && "border-primary-300 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-950/30")}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar src={post.author.avatar} alt={post.author.name} size="md" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold">{post.author.name}</span>
                {post.author.verified && (
                  <svg className="w-4 h-4 text-primary-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                )}
                {post.isAnnouncement && (
                  <Badge variant="primary" size="sm" className="ml-1">
                    <Megaphone size={10} className="mr-1" />
                    Announcement
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-(--text-muted)">
                <span>@{post.author.username}</span>
                <span>•</span>
                <span>{post.timestamp}</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-(--text-muted)">
            <MoreHorizontal size={18} />
          </Button>
        </div>

        {/* Content */}
        <p className="text-(--text) mb-3 whitespace-pre-wrap">{post.content}</p>

        {/* Images */}
        {post.images && post.images.length > 0 && (
          <div
            className={cn(
              "rounded-xl overflow-hidden mb-3",
              post.images.length === 1 ? "grid-cols-1" : "grid grid-cols-2 gap-1"
            )}
          >
            {post.images.map((image, index) => (
              <Image
                key={index}
                src={image}
                alt={`Post image ${index + 1}`}
                width={600}
                height={post.images!.length === 1 ? 400 : 200}
                className={cn(
                  "w-full object-cover",
                  post.images!.length === 1 ? "max-h-96" : "h-48"
                )}
              />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-(--border)">
          <div className="flex items-center gap-1">
            {/* Vote buttons */}
            <div className="flex items-center bg-primary-50 dark:bg-primary-900/30 rounded-full">
              <button
                onClick={handleUpvote}
                className={cn(
                  "p-2 rounded-l-full transition-colors",
                  userVote === "up"
                    ? "text-primary-600 dark:text-primary-400"
                    : "text-(--text-muted) hover:text-primary-600"
                )}
              >
                <ArrowBigUp size={22} fill={userVote === "up" ? "currentColor" : "none"} />
              </button>
              <span className={cn(
                "text-sm font-semibold min-w-[40px] text-center",
                userVote === "up" && "text-primary-600 dark:text-primary-400"
              )}>
                {votes}
              </span>
              <button
                onClick={handleDownvote}
                className={cn(
                  "p-2 rounded-r-full transition-colors",
                  userVote === "down"
                    ? "text-red-500"
                    : "text-(--text-muted) hover:text-red-500"
                )}
              >
                <ArrowBigDown size={22} fill={userVote === "down" ? "currentColor" : "none"} />
              </button>
            </div>

            {/* Comments */}
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-full text-(--text-muted) hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors">
              <MessageCircle size={18} />
              <span className="text-sm">{post.comments}</span>
            </button>

            {/* Share */}
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-full text-(--text-muted) hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors">
              <Share2 size={18} />
              <span className="text-sm hidden sm:inline">{post.shares}</span>
            </button>
          </div>

          {/* Save */}
          <button
            onClick={() => setSaved(!saved)}
            className={cn(
              "p-2 rounded-full transition-colors",
              saved
                ? "text-primary-600 dark:text-primary-400"
                : "text-(--text-muted) hover:text-primary-600"
            )}
          >
            <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
          </button>
        </div>
      </CardContent>
    </Card>
  );
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
          <PostCard key={post.id} post={post} />
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
