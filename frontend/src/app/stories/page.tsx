"use client";

import { useState, useEffect, useCallback } from "react";
import { Navbar, Sidebar } from "@/components/layout";
import { Avatar, Button, Modal } from "@/components/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { dummyStories, Story } from "@/components/home/StoriesSection";
import { 
  ArrowLeft, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Image as ImageIcon,
  Video,
  Filter,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { storiesApi, Story as ApiStory, MediaFilterType } from "@/lib/api/stories";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

type FilterType = "all" | "images" | "videos";

// Transform API story to local Story format
function transformApiStory(apiStory: ApiStory): Story {
  const firstMedia = apiStory.mediaItems[0];
  return {
    id: apiStory._id,
    username: apiStory.userId.username,
    avatar: apiStory.userId.avatar || "/images/default-avatar.png",
    hasUnviewed: apiStory.hasUnviewed,
    mediaType: firstMedia?.type || "image",
    mediaUrl: firstMedia?.url || "",
    timestamp: formatDistanceToNow(new Date(apiStory.createdAt), { addSuffix: true }),
  };
}

function StoryCard({ story, onClick }: { story: Story; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group relative aspect-9/16 rounded-xl overflow-hidden bg-gray-900 hover:ring-2 hover:ring-primary-500 transition-all"
    >
      {story.mediaType === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={story.mediaUrl}
          alt={`${story.username}'s story`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <>
          <video
            src={story.mediaUrl}
            className="w-full h-full object-cover"
            muted
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play size={24} className="text-white ml-1" fill="white" />
            </div>
          </div>
        </>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/30" />

      {/* User info */}
      <div className="absolute top-3 left-3 flex items-center gap-2">
        <div
          className={cn(
            "p-0.5 rounded-full",
            story.hasUnviewed
              ? "bg-linear-to-tr from-primary-500 via-accent-pink to-accent-orange"
              : "bg-gray-400"
          )}
        >
          <div className="p-0.5 bg-gray-900 rounded-full">
            <Avatar src={story.avatar} alt={story.username} size="sm" />
          </div>
        </div>
      </div>

      {/* Media type indicator */}
      <div className="absolute top-3 right-3">
        {story.mediaType === "video" ? (
          <Video size={18} className="text-white/80" />
        ) : (
          <ImageIcon size={18} className="text-white/80" />
        )}
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-3 left-3 right-3">
        <p className="text-white font-medium text-sm truncate">{story.username}</p>
        <p className="text-white/70 text-xs">{story.timestamp}</p>
      </div>

      {/* Unviewed indicator */}
      {story.hasUnviewed && (
        <div className="absolute top-3 left-3 w-2 h-2 bg-primary-500 rounded-full" />
      )}
    </button>
  );
}

interface FullScreenViewerProps {
  stories: Story[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onView?: (storyId: string) => void;
}

function FullScreenViewer({ stories, initialIndex, isOpen, onClose, onView }: FullScreenViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Mark story as viewed when it changes
  useEffect(() => {
    if (isOpen && stories[currentIndex] && onView) {
      onView(stories[currentIndex].id);
    }
  }, [isOpen, currentIndex, stories, onView]);

  const currentStory = stories[currentIndex];

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  if (!isOpen || !currentStory) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false} size="xl">
      <div className="relative bg-black min-h-[80vh] flex items-center justify-center">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          <X size={24} className="text-white" />
        </button>

        {/* User info */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
          <div
            className={cn(
              "p-0.5 rounded-full",
              currentStory.hasUnviewed
                ? "bg-linear-to-tr from-primary-500 via-accent-pink to-accent-orange"
                : "bg-gray-400"
            )}
          >
            <div className="p-0.5 bg-black rounded-full">
              <Avatar src={currentStory.avatar} alt={currentStory.username} size="md" />
            </div>
          </div>
          <div>
            <p className="text-white font-medium">{currentStory.username}</p>
            <p className="text-white/70 text-xs">{currentStory.timestamp}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="absolute top-16 left-4 right-4 z-20 flex gap-1">
          {stories.map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                index < currentIndex
                  ? "bg-white"
                  : index === currentIndex
                  ? "bg-white/80"
                  : "bg-white/30"
              )}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        {currentIndex > 0 && (
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <ChevronLeft size={28} className="text-white" />
          </button>
        )}

        {currentIndex < stories.length - 1 && (
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <ChevronRight size={28} className="text-white" />
          </button>
        )}

        {/* Story counter */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1 bg-black/50 rounded-full">
          <span className="text-white text-sm">
            {currentIndex + 1} / {stories.length}
          </span>
        </div>

        {/* Media content */}
        <div className="w-full max-w-md aspect-9/16 mx-auto">
          {currentStory.mediaType === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentStory.mediaUrl}
              alt={`${currentStory.username}'s story`}
              className="w-full h-full object-contain"
            />
          ) : (
            <video
              key={currentStory.id}
              src={currentStory.mediaUrl}
              className="w-full h-full object-contain"
              controls
              autoPlay
            />
          )}
        </div>
      </div>
    </Modal>
  );
}

export default function StoriesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t, isRTL } = useLanguage();
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [stories, setStories] = useState<Story[]>(dummyStories);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const fetchStories = useCallback(async () => {
    if (!isAuthenticated) {
      setStories(dummyStories);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const mediaType: MediaFilterType = filter;
      const response = await storiesApi.getStories(1, 50, mediaType);
      if (response.stories.length > 0) {
        setStories(response.stories.map(transformApiStory));
      } else {
        // Fallback to filtered dummy stories if no real stories
        const filtered = dummyStories.filter((story) => {
          if (filter === "all") return true;
          if (filter === "images") return story.mediaType === "image";
          if (filter === "videos") return story.mediaType === "video";
          return true;
        });
        setStories(filtered);
      }
    } catch (error) {
      console.error("Failed to fetch stories:", error);
      // Fallback to filtered dummy stories on error
      const filtered = dummyStories.filter((story) => {
        if (filter === "all") return true;
        if (filter === "images") return story.mediaType === "image";
        if (filter === "videos") return story.mediaType === "video";
        return true;
      });
      setStories(filtered);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, filter]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  // For display counts, filter locally from current stories
  const filteredStories = stories;

  const handleStoryClick = (index: number) => {
    setSelectedStoryIndex(index);
    setIsViewerOpen(true);
  };

  const handleViewStory = async (storyId: string) => {
    if (!isAuthenticated) return;

    try {
      await storiesApi.viewStory(storyId);
      // Update local state to mark as viewed
      setStories((prev) =>
        prev.map((s) => (s.id === storyId ? { ...s, hasUnviewed: false } : s))
      );
    } catch (error) {
      console.error("Failed to mark story as viewed:", error);
    }
  };

  const unviewedCount = stories.filter((s) => s.hasUnviewed).length;
  const imageCount = stories.filter((s) => s.mediaType === "image").length;
  const videoCount = stories.filter((s) => s.mediaType === "video").length;

  return (
    <div className="min-h-screen">
      <Navbar
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        isSidebarOpen={sidebarOpen}
      />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className={cn("pt-16", isRTL ? "lg:pr-64" : "lg:pl-64")}>
        <div className="max-w-6xl mx-auto p-4">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-(--text-muted) hover:text-(--text) transition-colors mb-4"
            >
              <ArrowLeft size={20} />
              <span>{t("stories", "backToHome")}</span>
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-(--text)">{t("stories", "title")}</h1>
                <p className="text-(--text-muted) text-sm mt-1">
                  {unviewedCount} {t("stories", "newStories")}
                </p>
              </div>

              {/* Filter buttons */}
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-(--text-muted)" />
                <div className="flex bg-(--bg-card) border border-(--border) rounded-lg p-1">
                  <button
                    onClick={() => setFilter("all")}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-md transition-colors",
                      filter === "all"
                        ? "bg-primary-600 text-white"
                        : "text-(--text-muted) hover:text-(--text)"
                    )}
                  >
                    {t("common", "all")} ({stories.length})
                  </button>
                  <button
                    onClick={() => setFilter("images")}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1",
                      filter === "images"
                        ? "bg-primary-600 text-white"
                        : "text-(--text-muted) hover:text-(--text)"
                    )}
                  >
                    <ImageIcon size={14} />
                    {t("stories", "photos")} ({imageCount})
                  </button>
                  <button
                    onClick={() => setFilter("videos")}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1",
                      filter === "videos"
                        ? "bg-primary-600 text-white"
                        : "text-(--text-muted) hover:text-(--text)"
                    )}
                  >
                    <Video size={14} />
                    {t("stories", "videos")} ({videoCount})
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stories Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-primary-500" />
            </div>
          ) : filteredStories.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredStories.map((story, index) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  onClick={() => handleStoryClick(index)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-(--bg-card) flex items-center justify-center">
                {filter === "videos" ? (
                  <Video size={32} className="text-(--text-muted)" />
                ) : (
                  <ImageIcon size={32} className="text-(--text-muted)" />
                )}
              </div>
              <h3 className="text-lg font-medium text-(--text) mb-2">No stories found</h3>
              <p className="text-(--text-muted)">
                There are no {filter === "videos" ? "video" : "photo"} stories to show right now.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setFilter("all")}
              >
                View all stories
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Full screen viewer */}
      <FullScreenViewer
        stories={filteredStories}
        initialIndex={selectedStoryIndex ?? 0}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        onView={isAuthenticated ? handleViewStory : undefined}
      />
    </div>
  );
}
