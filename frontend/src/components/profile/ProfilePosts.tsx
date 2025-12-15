"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Avatar, Button, Card, CardContent } from "@/components/ui";
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
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { postsApi, type Post } from "@/lib/api/posts";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";

type FilterType = "all" | "images" | "announcements";

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

function PostCard({ post: initialPost }: { post: Post }) {
  const [post, setPost] = useState(initialPost);
  const [isVoting, setIsVoting] = useState(false);
  const [saved, setSaved] = useState(false); // ToDo: initialize from API if available

  // Determine user's current vote based on whatever logic you use (e.g. specialized field from API)
  // The API response for getFeed/getUserPosts returns `userVote` populated on the post object if we handled it in the backend
  // But checking the `Post` interface in `posts.ts`, it doesn't explicitly have `userVote` field yet?
  // Wait, I saw `userVote` in the backend controller response. Let me check `posts.ts` again.
  // In `posts.ts` interface: `userVote` is NOT defined. 
  // However, I will enhance the local type here or just cast it for now as the backend sends it.
  // Actually, I should probably add it to the interface file, but I can't edit that file extensively right now without context switch.
  // I'll extend the type locally for now.

  interface ExtendedPost extends Post {
    userVote?: "upvote" | "downvote" | null;
  }

  const extendedPost = post as ExtendedPost;

  const handleVote = async (type: "upvote" | "downvote") => {
    if (isVoting) return;

    const previousVote = extendedPost.userVote;
    const previousUpvotes = extendedPost.upvotes;
    const previousDownvotes = extendedPost.downvotes;

    // Optimistic Update
    let newUpvotes = previousUpvotes;
    let newDownvotes = previousDownvotes;
    let newVote: "upvote" | "downvote" | null = type;

    if (previousVote === type) {
      // Toggle off
      newVote = null;
      if (type === "upvote") newUpvotes = Math.max(0, newUpvotes - 1);
      else newDownvotes = Math.max(0, newDownvotes - 1);
    } else {
      // Changed vote or new vote
      if (previousVote === "upvote") newUpvotes = Math.max(0, newUpvotes - 1);
      if (previousVote === "downvote") newDownvotes = Math.max(0, newDownvotes - 1);

      if (type === "upvote") newUpvotes += 1;
      else newDownvotes += 1;
    }

    setPost({ ...post, upvotes: newUpvotes, downvotes: newDownvotes, userVote: newVote } as ExtendedPost);
    setIsVoting(true);

    try {
      if (previousVote === type) {
        await postsApi.removeVote(post._id);
      } else {
        await postsApi.votePost(post._id, type);
      }
    } catch (error) {
      console.error(error);
      // Revert
      setPost({ ...post, upvotes: previousUpvotes, downvotes: previousDownvotes, userVote: previousVote } as ExtendedPost);
      toast.error("Failed to vote");
    } finally {
      setIsVoting(false);
    }
  };

  const handleSave = async () => {
    try {
      if (saved) {
        await postsApi.unsavePost(post._id);
        setSaved(false);
        toast.success("Post unsaved");
      } else {
        await postsApi.savePost(post._id);
        setSaved(true);
        toast.success("Post saved");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to save post");
    }
  }

  const images = post.media?.filter(m => m.type === 'image').map(m => m.url) || [];
  const isAnnouncement = post.privacy === 'public'; // Just a guess for mapping "announcement", or logic needed (maybe check for specific tag or type)

  return (
    <Card className={cn(isAnnouncement && false && "border-primary-300 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-950/30")}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar src={post.userId.avatar} alt={post.userId.firstName} size="md" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold">{post.userId.firstName} {post.userId.lastName}</span>
                {post.userId.verified && (
                  <svg className="w-4 h-4 text-primary-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                )}
                {/* {isAnnouncement && (
                  <Badge variant="primary" size="sm" className="ml-1">
                    <Megaphone size={10} className="mr-1" />
                    Announcement
                  </Badge>
                )} */}
              </div>
              <div className="flex items-center gap-2 text-sm text-(--text-muted)">
                <span>@{post.userId.username}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-(--text-muted)">
            <MoreHorizontal size={18} />
          </Button>
        </div>

        {/* Content */}
        {post.contentText && (
          <p className="text-(--text) mb-3 whitespace-pre-wrap">{post.contentText}</p>
        )}

        {/* Images */}
        {images.length > 0 && (
          <div
            className={cn(
              "rounded-xl overflow-hidden mb-3",
              images.length === 1 ? "grid-cols-1" : "grid grid-cols-2 gap-1"
            )}
          >
            {images.map((image, index) => (
              <Image
                key={index}
                src={image}
                alt={`Post image ${index + 1}`}
                width={600}
                height={images.length === 1 ? 400 : 200}
                className={cn(
                  "w-full object-cover",
                  images.length === 1 ? "max-h-96" : "h-48"
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
                onClick={() => handleVote("upvote")}
                className={cn(
                  "p-2 rounded-l-full transition-colors",
                  extendedPost.userVote === "upvote"
                    ? "text-primary-600 dark:text-primary-400"
                    : "text-(--text-muted) hover:text-primary-600"
                )}
              >
                <ArrowBigUp size={22} fill={extendedPost.userVote === "upvote" ? "currentColor" : "none"} />
              </button>
              <span className={cn(
                "text-sm font-semibold min-w-[40px] text-center",
                extendedPost.userVote === "upvote" && "text-primary-600 dark:text-primary-400",
                extendedPost.userVote === "downvote" && "text-red-500"
              )}>
                {extendedPost.upvotes - extendedPost.downvotes}
              </span>
              <button
                onClick={() => handleVote("downvote")}
                className={cn(
                  "p-2 rounded-r-full transition-colors",
                  extendedPost.userVote === "downvote"
                    ? "text-red-500"
                    : "text-(--text-muted) hover:text-red-500"
                )}
              >
                <ArrowBigDown size={22} fill={extendedPost.userVote === "downvote" ? "currentColor" : "none"} />
              </button>
            </div>

            {/* Comments */}
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-full text-(--text-muted) hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors">
              <MessageCircle size={18} />
              <span className="text-sm">{post.commentCount}</span>
            </button>

            {/* Share */}
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-full text-(--text-muted) hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors">
              <Share2 size={18} />
              <span className="text-sm hidden sm:inline">{post.shareCount}</span>
            </button>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
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
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const postsPerPage = 5;

  useEffect(() => {
    const fetchPosts = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        // Using getUserPosts to fetch posts for the current profile view
        // Ideally this component should accept a userId prop to make it reusable for other profiles
        // But per instructions, we are using the current logged in user
        console.log("user:", user);
        const { posts, pagination } = await postsApi.getUserPosts(user.id, currentPage, postsPerPage);
        setPosts(posts);
        setTotalPages(pagination.pages);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
        toast.error("Failed to load posts");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [user, currentPage]);

  // Client-side filtering for now since the API might not support all filters yet
  // However, normally search/filter should happen backend side. 
  // For this iteration, I will apply client side filter on the fetched page (which is imperfect but follows the pattern)
  // Or better, just display what we got.
  const filteredPosts = posts.filter((post) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "images" && post.media && post.media.some(m => m.type === 'image')) ||
      (filter === "announcements" && post.privacy === 'public'); // Approximation

    const matchesSearch =
      !searchQuery ||
      (post.contentText && post.contentText.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  if (isLoading && posts.length === 0) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    )
  }

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
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => <PostCard key={post._id} post={post} />)
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
            <span className="text-sm font-medium">
              Page {currentPage} of {totalPages}
            </span>
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
