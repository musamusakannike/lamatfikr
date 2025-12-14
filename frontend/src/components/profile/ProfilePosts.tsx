"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, Badge, Button, Card, CardContent } from "@/components/ui";
import {
  Search,
  ArrowBigUp,
  ArrowBigDown,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  LayoutList,
  Grid3X3,
  Megaphone,
  ChevronLeft,
  ChevronRight,
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
      name: "John Doe",
      username: "johndoe",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
      verified: true,
    },
    content: "Just launched my new project! After months of hard work, I'm excited to share what we've been building. Check it out and let me know your thoughts!",
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
      name: "John Doe",
      username: "johndoe",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
      verified: true,
    },
    content: "The sunset from my balcony today was absolutely breathtaking! Nature never fails to amaze me.",
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
    id: "3",
    author: {
      name: "John Doe",
      username: "johndoe",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
      verified: true,
    },
    content: "Just finished reading 'Atomic Habits' by James Clear. Highly recommend it to anyone looking to build better habits and break bad ones. The 1% improvement concept is a game-changer!",
    upvotes: 123,
    comments: 34,
    shares: 8,
    timestamp: "1d ago",
    userVote: "up",
  },
  {
    id: "4",
    author: {
      name: "John Doe",
      username: "johndoe",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
      verified: true,
    },
    content: "Announcing my upcoming workshop on React best practices! Join me for 2 hours of coding, learning, and fun. Registration opens next week!",
    upvotes: 341,
    comments: 56,
    shares: 34,
    timestamp: "2d ago",
    isAnnouncement: true,
    userVote: null,
  },
  {
    id: "5",
    author: {
      name: "John Doe",
      username: "johndoe",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
      verified: true,
    },
    content: "Working on something exciting! Can't wait to share more details soon.",
    upvotes: 89,
    comments: 12,
    shares: 5,
    timestamp: "3d ago",
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

export function ProfilePosts() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 3;

  // Filter posts based on filter type and search query
  const filteredPosts = dummyPosts.filter((post) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "images" && post.images && post.images.length > 0) ||
      (filter === "announcements" && post.isAnnouncement);

    const matchesSearch =
      !searchQuery ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const paginatedPosts = filteredPosts.slice(startIndex, startIndex + postsPerPage);

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <Card>
        <CardContent className="p-3">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)"
            />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
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
        </CardContent>
      </Card>

      {/* Filter tabs */}
      <div className="bg-(--bg-card) rounded-xl border border-(--border) p-2 flex gap-2">
        <FilterButton
          active={filter === "all"}
          onClick={() => {
            setFilter("all");
            setCurrentPage(1);
          }}
          icon={LayoutList}
        >
          All Posts
        </FilterButton>
        <FilterButton
          active={filter === "images"}
          onClick={() => {
            setFilter("images");
            setCurrentPage(1);
          }}
          icon={Grid3X3}
        >
          Media
        </FilterButton>
        <FilterButton
          active={filter === "announcements"}
          onClick={() => {
            setFilter("announcements");
            setCurrentPage(1);
          }}
          icon={Megaphone}
        >
          Announcements
        </FilterButton>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {paginatedPosts.length > 0 ? (
          paginatedPosts.map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-(--text-muted)">No posts found</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                  page === currentPage
                    ? "bg-primary-600 text-white"
                    : "text-(--text-muted) hover:bg-primary-100 dark:hover:bg-primary-900/50"
                )}
              >
                {page}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}
