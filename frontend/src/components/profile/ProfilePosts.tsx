"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button, Card, CardContent } from "@/components/ui";
import {
  Search,
  LayoutList,
  Grid3X3,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { postsApi, type Post } from "@/lib/api/posts";
import toast from "react-hot-toast";
import { PostCard } from "@/components/shared/PostCard";

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

  // Client-side filtering
  const filteredPosts = posts.filter((post) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "images" && post.media && post.media.some(m => m.type === 'image')) ||
      (filter === "announcements" && post.privacy === 'public');

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
