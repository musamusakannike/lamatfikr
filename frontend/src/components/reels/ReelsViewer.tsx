"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Loader2,
  MapPin,
  Smile,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { reelsApi, type Reel } from "@/lib/api/reels";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";

interface ReelsViewerProps {
  initialReels: Reel[];
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function ReelsViewer({ initialReels, onLoadMore, hasMore = false }: ReelsViewerProps) {
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();
  const [reels, setReels] = useState<Reel[]>(initialReels);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(true);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLiking, setIsLiking] = useState(false);
  const viewRecordedRef = useRef<Set<string>>(new Set());
  const viewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const currentReel = reels[currentIndex];

  useEffect(() => {
    setReels(initialReels);
  }, [initialReels]);

  const recordView = useCallback(async (reelId: string, watchDuration: number) => {
    if (viewRecordedRef.current.has(reelId)) return;
    
    try {
      await reelsApi.recordView(reelId, watchDuration);
      viewRecordedRef.current.add(reelId);
    } catch (error) {
      console.error("Failed to record view:", error);
    }
  }, []);

  useEffect(() => {
    if (!currentReel) return;

    startTimeRef.current = Date.now();

    viewTimerRef.current = setTimeout(() => {
      const watchDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      recordView(currentReel._id, watchDuration);
    }, 3000);

    return () => {
      if (viewTimerRef.current) {
        clearTimeout(viewTimerRef.current);
      }
    };
  }, [currentReel, recordView]);

  useEffect(() => {
    const video = videoRefs.current.get(currentIndex);
    if (video) {
      video.currentTime = 0;
      if (playing) {
        video.play().catch(() => {});
      }
    }

    videoRefs.current.forEach((v, idx) => {
      if (idx !== currentIndex) {
        v.pause();
        v.currentTime = 0;
      }
    });
  }, [currentIndex, playing]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        handleNext();
      } else if (e.key === " ") {
        e.preventDefault();
        setPlaying((prev) => !prev);
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        setMuted((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, reels.length]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex(currentIndex + 1);
      
      if (currentIndex >= reels.length - 3 && hasMore && onLoadMore) {
        onLoadMore();
      }
    }
  };

  const handleLike = async () => {
    if (isLiking || !currentReel) return;

    const previousLiked = currentReel.userLiked;
    const previousLikeCount = currentReel.likeCount;

    setReels((prev) =>
      prev.map((r, idx) =>
        idx === currentIndex
          ? {
              ...r,
              userLiked: !r.userLiked,
              likeCount: r.userLiked ? r.likeCount - 1 : r.likeCount + 1,
            }
          : r
      )
    );
    setIsLiking(true);

    try {
      await reelsApi.likeReel(currentReel._id);
    } catch (error) {
      setReels((prev) =>
        prev.map((r, idx) =>
          idx === currentIndex
            ? { ...r, userLiked: previousLiked, likeCount: previousLikeCount }
            : r
        )
      );
      toast.error("Failed to like reel");
    } finally {
      setIsLiking(false);
    }
  };

  const handleVideoClick = () => {
    setPlaying((prev) => !prev);
  };

  const handleDoubleTap = () => {
    if (!currentReel?.userLiked) {
      handleLike();
    }
  };

  if (!currentReel) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <p className="text-white">{t("reels", "noReelsAvailable")}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-full bg-black overflow-hidden"
    >
      {reels.map((reel, index) => (
        <div
          key={reel._id}
          className={cn(
            "absolute inset-0 transition-transform duration-300",
            index === currentIndex
              ? "translate-y-0"
              : index < currentIndex
              ? "-translate-y-full"
              : "translate-y-full"
          )}
        >
          <video
            ref={(el) => {
              if (el) videoRefs.current.set(index, el);
            }}
            src={reel.videoUrl}
            poster={reel.thumbnailUrl}
            className="w-full h-full object-contain"
            loop
            playsInline
            muted={muted}
            onClick={handleVideoClick}
            onDoubleClick={handleDoubleTap}
          />

          {!playing && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-20 h-20 rounded-full bg-black/50 flex items-center justify-center">
                <Play className="w-10 h-10 text-white ml-2" fill="white" />
              </div>
            </div>
          )}

          {index === currentIndex && (
            <>
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <Link href={`/user/${reel.userId.username}`}>
                    <Avatar
                      src={reel.userId.avatar}
                      alt={reel.userId.firstName}
                      size="md"
                      className="ring-2 ring-white"
                    />
                  </Link>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Link href={`/user/${reel.userId.username}`}>
                        <span className="font-semibold text-white text-sm">
                          {reel.userId.firstName} {reel.userId.lastName}
                        </span>
                      </Link>
                      {reel.userId.verified && <VerifiedBadge size={14} />}
                    </div>
                    <p className="text-xs text-white/80">
                      {formatDistanceToNow(new Date(reel.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <button className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                  <MoreHorizontal className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10">
                {reel.caption && (
                  <p className="text-white text-sm mb-3 line-clamp-3">{reel.caption}</p>
                )}
                
                {(reel.location || reel.feeling) && (
                  <div className="flex flex-wrap gap-2 text-xs text-white/80 mb-3">
                    {reel.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {reel.location}
                      </span>
                    )}
                    {reel.feeling && (
                      <span className="flex items-center gap-1">
                        <Smile size={12} />
                        {reel.feeling}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-white/80">
                  <span>{reel.viewCount.toLocaleString()} {t("reels", "views")}</span>
                  <span>•</span>
                  <span>{reel.commentCount} {t("reels", "comments")}</span>
                </div>
              </div>

              <div className="absolute right-4 bottom-24 flex flex-col gap-6 z-10">
                <button
                  onClick={handleLike}
                  disabled={isLiking}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center transition-transform group-active:scale-90">
                    <Heart
                      className={cn(
                        "w-6 h-6 transition-colors",
                        reel.userLiked ? "text-red-500 fill-red-500" : "text-white"
                      )}
                    />
                  </div>
                  <span className="text-white text-xs font-medium">
                    {reel.likeCount > 0 ? reel.likeCount : ""}
                  </span>
                </button>

                <Link
                  href={`/reels/${reel._id}`}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center transition-transform group-active:scale-90">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-white text-xs font-medium">
                    {reel.commentCount > 0 ? reel.commentCount : ""}
                  </span>
                </Link>

                <button className="flex flex-col items-center gap-1 group">
                  <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center transition-transform group-active:scale-90">
                    <Send className="w-6 h-6 text-white" />
                  </div>
                </button>

                <button className="flex flex-col items-center gap-1 group">
                  <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center transition-transform group-active:scale-90">
                    <Bookmark className="w-6 h-6 text-white" />
                  </div>
                </button>

                <button
                  onClick={() => setMuted(!muted)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center transition-transform group-active:scale-90">
                    {muted ? (
                      <VolumeX className="w-6 h-6 text-white" />
                    ) : (
                      <Volume2 className="w-6 h-6 text-white" />
                    )}
                  </div>
                </button>
              </div>

              {currentIndex > 0 && (
                <button
                  onClick={handlePrevious}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(50%+200px)] w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center z-10 hover:bg-black/50 transition-colors"
                >
                  <ChevronUp className="w-6 h-6 text-white" />
                </button>
              )}

              {currentIndex < reels.length - 1 && (
                <button
                  onClick={handleNext}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-[calc(50%+150px)] w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center z-10 hover:bg-black/50 transition-colors"
                >
                  <ChevronDown className="w-6 h-6 text-white" />
                </button>
              )}
            </>
          )}
        </div>
      ))}

      <div className="absolute top-1/2 right-2 -translate-y-1/2 flex flex-col gap-1 z-20">
        {reels.map((_, index) => (
          <div
            key={index}
            className={cn(
              "w-1 h-8 rounded-full transition-all",
              index === currentIndex
                ? "bg-white"
                : "bg-white/30"
            )}
          />
        ))}
      </div>
    </div>
  );
}
