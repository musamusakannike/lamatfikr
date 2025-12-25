"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import {
  LayoutList,
  Megaphone,
  Loader2,
  Grid3X3
} from "lucide-react";
import { PostCard } from "@/components/shared/PostCard";
import { AnnouncementCard } from "@/components/home/AnnouncementCard";
import { postsApi, type Post } from "@/lib/api/posts";
import { announcementsApi, type Announcement } from "@/lib/api/announcements";
import { reelsApi, type Reel } from "@/lib/api/reels"; // Import reels API
import { ReelsMasonryGrid } from "@/components/reels/ReelsMasonryGrid"; // Import Masonry Grid
import { getErrorMessage } from "@/lib/api";
import { useRouter } from "next/navigation";

type FilterType = "all" | "reels" | "announcements" | "images";

function FilterButton({
  active,
  onClick,
  children,
  icon: Icon,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon: React.ElementType;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all relative",
        active
          ? "bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300"
          : "text-(--text-muted) hover:bg-primary-50 dark:hover:bg-primary-900/30"
      )}
    >
      <Icon size={18} />
      <span className="hidden sm:inline">{children}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}

export function PostFeed() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [reels, setReels] = useState<Reel[]>([]); // New state for reels
  const [filter, setFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(1);
  const [announcementPage, setAnnouncementPage] = useState(1);
  const [reelsPage, setReelsPage] = useState(1); // New state for reels page
  const [hasMore, setHasMore] = useState(true);
  const [hasMoreAnnouncements, setHasMoreAnnouncements] = useState(true);
  const [hasMoreReels, setHasMoreReels] = useState(true); // New state for hasMoreReels
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

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


  const fetchAnnouncements = useCallback(async (pageNum: number, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await announcementsApi.getAnnouncements(pageNum, 20);

      if (append) {
        setAnnouncements((prev) => [...prev, ...response.announcements]);
      } else {
        setAnnouncements(response.announcements);
      }

      setHasMoreAnnouncements(pageNum < response.pagination.pages);

      // Reset unread count when viewing announcements
      setUnreadCount(0);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const fetchReels = useCallback(async (pageNum: number, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await reelsApi.getReelsFeed(pageNum, 20);

      if (append) {
        setReels((prev) => [...prev, ...response.reels]);
      } else {
        setReels(response.reels);
      }

      setHasMoreReels(pageNum < response.pagination.pages);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Fetch unread count on mount
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await announcementsApi.getUnreadCount();
        setUnreadCount(response.unreadCount);
      } catch (err) {
        console.error("Failed to fetch unread count:", err);
      }
    };
    fetchUnreadCount();
  }, []);

  useEffect(() => {
    if (filter === "reels") {
      router.push("/reels");
    } else if (filter === "announcements") {
      fetchAnnouncements(1);
      setAnnouncementPage(1);
    } else if (filter === "images") { // Fetch reels when filter is images
      fetchReels(1);
      setReelsPage(1);
    } else {
      fetchFeed(1);
      setPage(1);
    }
  }, [filter, fetchFeed, fetchAnnouncements, fetchReels, router]);

  const handleLoadMore = () => {
    if (filter === "announcements") {
      const nextPage = announcementPage + 1;
      setAnnouncementPage(nextPage);
      fetchAnnouncements(nextPage, true);
    } else if (filter === "images") { // Load more reels
      const nextPage = reelsPage + 1;
      setReelsPage(nextPage);
      fetchReels(nextPage, true);
    } else {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFeed(nextPage, true);
    }
  };

  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    setError(null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-(--bg-card) rounded-xl border border-(--border) p-2 flex gap-2">
          <FilterButton active={true} onClick={() => { }} icon={LayoutList}>
            All Posts
          </FilterButton>
          <FilterButton active={false} onClick={() => { }} icon={Grid3X3}>
            Media
          </FilterButton>
          <FilterButton active={false} onClick={() => { }} icon={Megaphone} badge={unreadCount}>
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
          <FilterButton
            active={filter === "all"}
            onClick={() => handleFilterChange("all")}
            icon={LayoutList}
          >
            All Posts
          </FilterButton>
          <FilterButton
            active={filter === "images"}
            onClick={() => handleFilterChange("images")}
            icon={Grid3X3}
          >
            Media
          </FilterButton>
          <FilterButton
            active={filter === "announcements"}
            onClick={() => handleFilterChange("announcements")}
            icon={Megaphone}
            badge={unreadCount}
          >
            Announcements
          </FilterButton>
        </div>
        <div className="bg-(--bg-card) rounded-xl border border-(--border) p-6 text-center">
          <p className="text-(--text-muted) mb-4">{error}</p>
          <Button
            variant="outline"
            onClick={() => fetchFeed(1)}
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const displayPosts = filter === "announcements" ? [] : posts;

  let currentHasMore = hasMore;
  if (filter === "announcements") currentHasMore = hasMoreAnnouncements;
  if (filter === "images") currentHasMore = hasMoreReels;

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="bg-(--bg-card) rounded-xl border border-(--border) p-2 flex gap-2">
        <FilterButton
          active={filter === "all"}
          onClick={() => handleFilterChange("all")}
          icon={LayoutList}
        >
          All Posts
        </FilterButton>
        <FilterButton
          active={filter === "images"}
          onClick={() => handleFilterChange("images")}
          icon={Grid3X3}
        >
          Media
        </FilterButton>
        <FilterButton
          active={filter === "announcements"}
          onClick={() => handleFilterChange("announcements")}
          icon={Megaphone}
          badge={unreadCount}
        >
          Announcements
        </FilterButton>
      </div>

      {/* Content */}
      {filter === "announcements" ? (
        <div className="space-y-4">
          {announcements.length === 0 ? (
            <div className="bg-(--bg-card) rounded-xl border border-(--border) p-6 text-center">
              <p className="text-(--text-muted)">No announcements to show</p>
            </div>
          ) : (
            announcements.map((announcement) => (
              <AnnouncementCard key={announcement._id} announcement={announcement} />
            ))
          )}
        </div>
      ) : filter === "images" ? (
        // Reels Grid
        <div className="w-full">
          <ReelsMasonryGrid
            reels={reels}
            onReelClick={(index) => {
              const reel = reels[index];
              if (reel) {
                router.push(`/reels?reelId=${reel._id}`);
              }
            }}
            onLoadMore={handleLoadMore}
            hasMore={hasMoreReels}
            loading={loadingMore}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {displayPosts.length === 0 ? (
            <div className="bg-(--bg-card) rounded-xl border border-(--border) p-6 text-center">
              <p className="text-(--text-muted)">No posts to show</p>
            </div>
          ) : (
            displayPosts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))
          )}
        </div>
      )}

      {/* Load more button (only for non-masonry views) */}
      {filter !== "images" && currentHasMore && (filter === "announcements" ? announcements.length > 0 : displayPosts.length > 0) && (
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
