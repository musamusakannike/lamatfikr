"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import {
  LayoutList,
  Grid3X3,
  Megaphone,
  Loader2,
} from "lucide-react";
import { PostCard } from "@/components/shared/PostCard";
import { postsApi, type Post } from "@/lib/api/posts";
import { getErrorMessage } from "@/lib/api";

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

export function PostFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeed = useCallback(async (pageNum: number, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await postsApi.getFeed(pageNum, 20);
      
      if (append) {
        setPosts((prev) => [...prev, ...response.posts]);
      } else {
        setPosts(response.posts);
      }
      
      setHasMore(pageNum < response.pagination.pages);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed(1);
  }, [fetchFeed]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchFeed(nextPage, true);
  };

  const filteredPosts = posts.filter((post) => {
    if (filter === "images") return post.media && post.media.length > 0;
    if (filter === "announcements") return false; // API doesn't have announcement flag yet
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-(--bg-card) rounded-xl border border-(--border) p-2 flex gap-2">
          <FilterButton active={true} onClick={() => {}} icon={LayoutList}>
            All Posts
          </FilterButton>
          <FilterButton active={false} onClick={() => {}} icon={Grid3X3}>
            Media
          </FilterButton>
          <FilterButton active={false} onClick={() => {}} icon={Megaphone}>
            Announcements
          </FilterButton>
        </div>
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-(--bg-card) rounded-xl border border-(--border) p-2 flex gap-2">
          <FilterButton active={true} onClick={() => {}} icon={LayoutList}>
            All Posts
          </FilterButton>
          <FilterButton active={false} onClick={() => {}} icon={Grid3X3}>
            Media
          </FilterButton>
          <FilterButton active={false} onClick={() => {}} icon={Megaphone}>
            Announcements
          </FilterButton>
        </div>
        <div className="bg-(--bg-card) rounded-xl border border-(--border) p-6 text-center">
          <p className="text-(--text-muted) mb-4">{error}</p>
          <Button variant="outline" onClick={() => fetchFeed(1)}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

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
        {filteredPosts.length === 0 ? (
          <div className="bg-(--bg-card) rounded-xl border border-(--border) p-6 text-center">
            <p className="text-(--text-muted)">No posts to show</p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))
        )}
      </div>

      {/* Load more */}
      {hasMore && filteredPosts.length > 0 && (
        <div className="flex justify-center py-4">
          <Button 
            variant="outline" 
            className="gap-2" 
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load more posts"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
