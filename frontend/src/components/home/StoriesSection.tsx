"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Avatar, Button, Modal } from "@/components/ui";
import { Plus, ChevronRight, Image, Video, X, Upload, Loader2 } from "lucide-react";
import Link from "next/link";
import { storiesApi, Story as ApiStory } from "@/lib/api/stories";
import { uploadApi } from "@/lib/api/upload";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDistanceToNow } from "date-fns";

export interface Story {
  id: string;
  username: string;
  avatar: string;
  hasUnviewed: boolean;
  mediaType: "image" | "video";
  mediaUrl: string;
  timestamp: string;
}

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


function StoryItem({ story, onClick, onView }: { story: Story; onClick: () => void; onView?: (storyId: string) => void }) {
  const handleClick = () => {
    onClick();
    if (onView && story.hasUnviewed) {
      onView(story.id);
    }
  };

  return (
    <button onClick={handleClick} className="flex flex-col items-center gap-1.5 group">
      <div
        className={cn(
          "p-0.5 rounded-full",
          story.hasUnviewed
            ? "bg-linear-to-tr from-primary-500 via-accent-pink to-accent-orange"
            : "bg-gray-300 dark:bg-gray-600"
        )}
      >
        <div className="p-0.5 bg-(--bg) rounded-full">
          <Avatar
            src={story.avatar}
            alt={story.username}
            size="lg"
            className="group-hover:scale-105 transition-transform"
          />
        </div>
      </div>
      <span className="text-xs text-(--text-muted) truncate max-w-[64px]">
        {story.username}
      </span>
    </button>
  );
}

function AddStoryButton({ onClick, userAvatar, label }: { onClick: () => void; userAvatar?: string; label: string }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 group">
      <div className="relative">
        <Avatar
          src={userAvatar || "/images/default-avatar.png"}
          alt={label}
          size="lg"
          className="opacity-80"
        />
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center border-2 border-(--bg)">
          <Plus size={14} className="text-white" />
        </div>
      </div>
      <span className="text-xs text-(--text-muted)">{label}</span>
    </button>
  );
}

interface AddStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated?: () => void;
}

function AddStoryModal({ isOpen, onClose, onStoryCreated }: AddStoryModalProps) {
  const [selectedType, setSelectedType] = useState<"image" | "video" | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleTypeSelect = (type: "image" | "video") => {
    setSelectedType(type);
    fileInputRef.current?.click();
  };

  const handleClear = () => {
    setSelectedType(null);
    setPreviewUrl(null);
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      // Upload the media file
      const uploadResponse = await uploadApi.uploadMedia(selectedFile, "stories");
      
      // Create the story with the uploaded media URL
      await storiesApi.createStory({
        media: [uploadResponse.url],
        expiresInHours: 24,
      });

      handleClear();
      onClose();
      onStoryCreated?.();
    } catch (err) {
      console.error("Failed to create story:", err);
      setError(err instanceof Error ? err.message : "Failed to create story");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    handleClear();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add to Your Story" size="md">
      <div className="p-4">
        <input
          ref={fileInputRef}
          type="file"
          accept={selectedType === "image" ? "image/*" : "video/*"}
          onChange={handleFileSelect}
          className="hidden"
        />

        {!previewUrl ? (
          <div className="space-y-4">
            <p className="text-(--text-muted) text-sm text-center mb-6">
              Share a moment with your followers
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleTypeSelect("image")}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-(--border) hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors group"
              >
                <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Image size={28} className="text-primary-600" alt="Story"  />
                </div>
                <span className="font-medium text-(--text)">Photo</span>
                <span className="text-xs text-(--text-muted)">Share an image</span>
              </button>

              <button
                onClick={() => handleTypeSelect("video")}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-(--border) hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors group"
              >
                <div className="w-16 h-16 rounded-full bg-accent-pink/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Video size={28} className="text-accent-pink" />
                </div>
                <span className="font-medium text-(--text)">Video</span>
                <span className="text-xs text-(--text-muted)">Share a video</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative aspect-9/16 max-h-[400px] mx-auto rounded-xl overflow-hidden bg-black">
              {selectedType === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Story preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <video
                  src={previewUrl}
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                  muted
                />
              )}
              <button
                onClick={handleClear}
                className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <X size={18} className="text-white" />
              </button>
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleClear} disabled={isUploading}>
                Change
              </Button>
              <Button variant="primary" className="flex-1 gap-2" onClick={handleSubmit} disabled={isUploading}>
                {isUploading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Upload size={18} />
                )}
                {isUploading ? "Uploading..." : "Share Story"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

interface StoryViewerModalProps {
  story: Story | null;
  isOpen: boolean;
  onClose: () => void;
  onView?: (storyId: string) => void;
}

function StoryViewerModal({ story, isOpen, onClose, onView }: StoryViewerModalProps) {
  useEffect(() => {
    if (isOpen && story && onView) {
      onView(story.id);
    }
  }, [isOpen, story, onView]);

  if (!story) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false} size="lg">
      <div className="relative bg-black">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          <X size={24} className="text-white" />
        </button>

        <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
          <Avatar src={story.avatar} alt={story.username} size="md" />
          <div>
            <p className="text-white font-medium">{story.username}</p>
            <p className="text-white/70 text-xs">{story.timestamp}</p>
          </div>
        </div>

        <div className="aspect-9/16 max-h-[80vh] mx-auto">
          {story.mediaType === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={story.mediaUrl}
              alt={`${story.username}'s story`}
              className="w-full h-full object-contain"
            />
          ) : (
            <video
              src={story.mediaUrl}
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

export function StoriesSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const fetchStories = useCallback(async () => {
    if (!isAuthenticated) {
      setStories([]);
      setIsLoading(false);
      return;
    }

    try {
      const response = await storiesApi.getStories(1, 20);
      setStories(response.stories.map(transformApiStory));
    } catch (error) {
      console.error("Failed to fetch stories:", error);
      setStories([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  const handleStoryClick = (story: Story) => {
    setSelectedStory(story);
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

  return (
    <>
      <div className="bg-(--bg-card) rounded-xl border border-(--border) p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">{t("home", "stories")}</h2>
          <Link href="/stories">
            <Button variant="ghost" size="sm" className="text-primary-600 dark:text-primary-400 gap-1">
              {t("home", "viewAll")}
              <ChevronRight size={16} />
            </Button>
          </Link>
        </div>

        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto hide-scrollbar pb-2"
          >
            {isAuthenticated && (
              <AddStoryButton onClick={() => setIsAddModalOpen(true)} userAvatar={user?.avatar} label={t("home", "yourStory")} />
            )}
            {isLoading ? (
              <div className="flex items-center justify-center w-full py-4">
                <Loader2 size={24} className="animate-spin text-primary-500" />
              </div>
            ) : (
              stories.map((story) => (
                <StoryItem
                  key={story.id}
                  story={story}
                  onClick={() => handleStoryClick(story)}
                  onView={isAuthenticated ? handleViewStory : undefined}
                />
              ))
            )}
          </div>

          {/* Scroll indicator */}
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-(--bg-card) border border-(--border) rounded-full shadow-lg flex items-center justify-center hover:bg-primary-50 dark:hover:bg-primary-900/50 transition-colors"
          >
            <ChevronRight size={18} className="text-primary-600" />
          </button>
        </div>
      </div>

      <AddStoryModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onStoryCreated={fetchStories}
      />
      <StoryViewerModal
        story={selectedStory}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        onView={isAuthenticated ? handleViewStory : undefined}
      />
    </>
  );
}
