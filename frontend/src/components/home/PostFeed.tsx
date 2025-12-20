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
import { MediaGrid } from "@/components/home/MediaGrid";
import { MediaModal } from "@/components/home/MediaModal";
import { AnnouncementCard } from "@/components/home/AnnouncementCard";
import { postsApi, type Post } from "@/lib/api/posts";
import { announcementsApi, type Announcement } from "@/lib/api/announcements";
import { getErrorMessage } from "@/lib/api";

type FilterType = "all" | "images" | "announcements";

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
  const [posts, setPosts] = useState<Post[]>([]);
  const [mediaPosts, setMediaPosts] = useState<Post[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(1);
  const [mediaPage, setMediaPage] = useState(1);
  const [announcementPage, setAnnouncementPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [hasMoreMedia, setHasMoreMedia] = useState(true);
  const [hasMoreAnnouncements, setHasMoreAnnouncements] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<{ post: Post; mediaIndex: number } | null>(null);
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

  const fetchMediaPosts = useCallback(async (pageNum: number, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await postsApi.getMediaPosts(pageNum, 20);

      if (append) {
        setMediaPosts((prev) => [...prev, ...response.posts]);
      } else {
        setMediaPosts(response.posts);
      }

      setHasMoreMedia(pageNum < response.pagination.pages);
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
    if (filter === "images") {
      fetchMediaPosts(1);
      setMediaPage(1);
    } else if (filter === "announcements") {
      fetchAnnouncements(1);
      setAnnouncementPage(1);
    } else {
      fetchFeed(1);
      setPage(1);
    }
  }, [filter, fetchFeed, fetchMediaPosts, fetchAnnouncements]);

  const handleLoadMore = () => {
    if (filter === "images") {
      const nextPage = mediaPage + 1;
      setMediaPage(nextPage);
      fetchMediaPosts(nextPage, true);
    } else if (filter === "announcements") {
      const nextPage = announcementPage + 1;
      setAnnouncementPage(nextPage);
      fetchAnnouncements(nextPage, true);
    } else {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFeed(nextPage, true);
    }
  };

  const handleMediaClick = (post: Post, mediaIndex: number) => {
    setSelectedPost({ post, mediaIndex });
  };

  const handleCloseModal = () => {
    setSelectedPost(null);
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
            onClick={() => filter === "images" ? fetchMediaPosts(1) : fetchFeed(1)}
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const displayPosts = filter === "images" ? mediaPosts : filter === "announcements" ? [] : posts;
  const currentHasMore = filter === "images" ? hasMoreMedia : filter === "announcements" ? hasMoreAnnouncements : hasMore;

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

      {/* Posts */}
      {filter === "images" ? (
        <MediaGrid posts={displayPosts} onMediaClick={handleMediaClick} />
      ) : filter === "announcements" ? (
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

      {/* Load more */}
      {currentHasMore && displayPosts.length > 0 && (
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

      {/* Media Modal */}
      {selectedPost && (
        <MediaModal
          post={selectedPost.post}
          initialMediaIndex={selectedPost.mediaIndex}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
