"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, Button, Modal } from "@/components/ui";
import { Plus, ChevronRight, Image, Video, X, Upload } from "lucide-react";
import Link from "next/link";

export interface Story {
  id: string;
  username: string;
  avatar: string;
  hasUnviewed: boolean;
  mediaType: "image" | "video";
  mediaUrl: string;
  timestamp: string;
}

export const dummyStories: Story[] = [
  {
    id: "1",
    username: "sarah_j",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    hasUnviewed: true,
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&h=1200&fit=crop",
    timestamp: "2h ago",
  },
  {
    id: "2",
    username: "mike_dev",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    hasUnviewed: true,
    mediaType: "video",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    timestamp: "4h ago",
  },
  {
    id: "3",
    username: "emma_art",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    hasUnviewed: true,
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1682695796954-bad0d0f59ff1?w=800&h=1200&fit=crop",
    timestamp: "5h ago",
  },
  {
    id: "4",
    username: "alex_photo",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    hasUnviewed: false,
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1682686581580-d99b0e6f8431?w=800&h=1200&fit=crop",
    timestamp: "8h ago",
  },
  {
    id: "5",
    username: "lisa_music",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    hasUnviewed: true,
    mediaType: "video",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    timestamp: "10h ago",
  },
  {
    id: "6",
    username: "david_fit",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
    hasUnviewed: false,
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1682687982501-1e58ab814714?w=800&h=1200&fit=crop",
    timestamp: "12h ago",
  },
  {
    id: "7",
    username: "nina_cook",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
    hasUnviewed: true,
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1682695794947-17061dc284dd?w=800&h=1200&fit=crop",
    timestamp: "14h ago",
  },
  {
    id: "8",
    username: "tom_travel",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    hasUnviewed: true,
    mediaType: "video",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    timestamp: "18h ago",
  },
];

function StoryItem({ story, onClick }: { story: Story; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 group">
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

function AddStoryButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 group">
      <div className="relative">
        <Avatar
          src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"
          alt="Your story"
          size="lg"
          className="opacity-80"
        />
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center border-2 border-(--bg)">
          <Plus size={14} className="text-white" />
        </div>
      </div>
      <span className="text-xs text-(--text-muted)">Your story</span>
    </button>
  );
}

interface AddStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function AddStoryModal({ isOpen, onClose }: AddStoryModalProps) {
  const [selectedType, setSelectedType] = useState<"image" | "video" | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleTypeSelect = (type: "image" | "video") => {
    setSelectedType(type);
    fileInputRef.current?.click();
  };

  const handleClear = () => {
    setSelectedType(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = () => {
    // In a real app, this would upload the file and create the story
    alert("Story created! (This is a dummy action)");
    handleClear();
    onClose();
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
                  <Image size={28} className="text-primary-600"  />
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

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleClear}>
                Change
              </Button>
              <Button variant="primary" className="flex-1 gap-2" onClick={handleSubmit}>
                <Upload size={18} />
                Share Story
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
}

function StoryViewerModal({ story, isOpen, onClose }: StoryViewerModalProps) {
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

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  const handleStoryClick = (story: Story) => {
    setSelectedStory(story);
    setIsViewerOpen(true);
  };

  return (
    <>
      <div className="bg-(--bg-card) rounded-xl border border-(--border) p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Stories</h2>
          <Link href="/stories">
            <Button variant="ghost" size="sm" className="text-primary-600 dark:text-primary-400 gap-1">
              View all
              <ChevronRight size={16} />
            </Button>
          </Link>
        </div>

        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto hide-scrollbar pb-2"
          >
            <AddStoryButton onClick={() => setIsAddModalOpen(true)} />
            {dummyStories.map((story) => (
              <StoryItem 
                key={story.id} 
                story={story} 
                onClick={() => handleStoryClick(story)}
              />
            ))}
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

      <AddStoryModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <StoryViewerModal 
        story={selectedStory} 
        isOpen={isViewerOpen} 
        onClose={() => setIsViewerOpen(false)} 
      />
    </>
  );
}
