"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { Avatar, Button } from "@/components/ui";
import { Plus, ChevronRight } from "lucide-react";

interface Story {
  id: string;
  username: string;
  avatar: string;
  hasUnviewed: boolean;
}

const dummyStories: Story[] = [
  {
    id: "1",
    username: "sarah_j",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    hasUnviewed: true,
  },
  {
    id: "2",
    username: "mike_dev",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    hasUnviewed: true,
  },
  {
    id: "3",
    username: "emma_art",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    hasUnviewed: true,
  },
  {
    id: "4",
    username: "alex_photo",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    hasUnviewed: false,
  },
  {
    id: "5",
    username: "lisa_music",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    hasUnviewed: true,
  },
  {
    id: "6",
    username: "david_fit",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
    hasUnviewed: false,
  },
  {
    id: "7",
    username: "nina_cook",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
    hasUnviewed: true,
  },
  {
    id: "8",
    username: "tom_travel",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    hasUnviewed: true,
  },
];

function StoryItem({ story }: { story: Story }) {
  return (
    <button className="flex flex-col items-center gap-1.5 group">
      <div
        className={cn(
          "p-0.5 rounded-full",
          story.hasUnviewed
            ? "bg-gradient-to-tr from-primary-500 via-accent-pink to-accent-orange"
            : "bg-gray-300 dark:bg-gray-600"
        )}
      >
        <div className="p-0.5 bg-[var(--bg)] rounded-full">
          <Avatar
            src={story.avatar}
            alt={story.username}
            size="lg"
            className="group-hover:scale-105 transition-transform"
          />
        </div>
      </div>
      <span className="text-xs text-[var(--text-muted)] truncate max-w-[64px]">
        {story.username}
      </span>
    </button>
  );
}

function AddStoryButton() {
  return (
    <button className="flex flex-col items-center gap-1.5 group">
      <div className="relative">
        <Avatar
          src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"
          alt="Your story"
          size="lg"
          className="opacity-80"
        />
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center border-2 border-[var(--bg)]">
          <Plus size={14} className="text-white" />
        </div>
      </div>
      <span className="text-xs text-[var(--text-muted)]">Your story</span>
    </button>
  );
}

export function StoriesSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  return (
    <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">Stories</h2>
        <Button variant="ghost" size="sm" className="text-primary-600 dark:text-primary-400 gap-1">
          View all
          <ChevronRight size={16} />
        </Button>
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto hide-scrollbar pb-2"
        >
          <AddStoryButton />
          {dummyStories.map((story) => (
            <StoryItem key={story.id} story={story} />
          ))}
        </div>

        {/* Scroll indicator */}
        <button
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-[var(--bg-card)] border border-[var(--border)] rounded-full shadow-lg flex items-center justify-center hover:bg-primary-50 dark:hover:bg-primary-900/50 transition-colors"
        >
          <ChevronRight size={18} className="text-primary-600" />
        </button>
      </div>
    </div>
  );
}
