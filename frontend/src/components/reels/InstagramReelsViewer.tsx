"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import { InstagramReelPlayer } from "./InstagramReelPlayer";
import { ReelActionButtons } from "./ReelActionButtons";
import { ReelOverlays } from "./ReelOverlays";
import { reelsApi, type Reel } from "@/lib/api/reels";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface InstagramReelsViewerProps {
    initialReels: Reel[];
    initialIndex?: number;
    onLoadMore?: () => void;
    hasMore?: boolean;
}

export function InstagramReelsViewer({
    initialReels,
    initialIndex = 0,
    onLoadMore,
    hasMore = false,
}: InstagramReelsViewerProps) {
    const { user: currentUser } = useAuth();
    const router = useRouter();
    const [reels, setReels] = useState<Reel[]>(initialReels);
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [muted, setMuted] = useState(false);
    const [isLiking, setIsLiking] = useState(false);
    const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const viewRecordedRef = useRef<Set<string>>(new Set());
    const viewTimerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);
    const isScrollingRef = useRef(false);

    const currentReel = reels[currentIndex];

    // Sync with initial reels
    useEffect(() => {
        setReels(initialReels);
    }, [initialReels]);

    // Record view after 3 seconds
    const recordView = useCallback(async (reelId: string, watchDuration: number) => {
        if (viewRecordedRef.current.has(reelId)) return;

        try {
            const response = await reelsApi.recordView(reelId, watchDuration);
            viewRecordedRef.current.add(reelId);

            // Only update local count if backend confirms new view was recorded
            if (response.viewRecorded) {
                setReels((prev) =>
                    prev.map((r) =>
                        r._id === reelId ? { ...r, viewCount: response.viewCount } : r
                    )
                );
            }
        } catch (error) {
            console.error("Failed to record view:", error);
        }
    }, []);

    // Start view timer when reel becomes active
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

    // Handle scroll to detect current reel
    const handleScroll = useCallback(() => {
        if (!containerRef.current || isScrollingRef.current) return;

        const container = containerRef.current;
        const scrollTop = container.scrollTop;
        const reelHeight = window.innerHeight;
        const newIndex = Math.round(scrollTop / reelHeight);

        if (newIndex !== currentIndex && newIndex >= 0 && newIndex < reels.length) {
            setCurrentIndex(newIndex);

            // Load more if near the end
            if (newIndex >= reels.length - 2 && hasMore && onLoadMore) {
                onLoadMore();
            }
        }
    }, [currentIndex, reels.length, hasMore, onLoadMore]);

    // Debounced scroll handler
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const onScroll = () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }

            scrollTimeoutRef.current = setTimeout(() => {
                handleScroll();
            }, 150);
        };

        container.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            container.removeEventListener("scroll", onScroll);
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, [handleScroll]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowUp" && currentIndex > 0) {
                e.preventDefault();
                scrollToReel(currentIndex - 1);
            } else if (e.key === "ArrowDown" && currentIndex < reels.length - 1) {
                e.preventDefault();
                scrollToReel(currentIndex + 1);
            } else if (e.key === "m" || e.key === "M") {
                e.preventDefault();
                setMuted((prev) => !prev);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentIndex, reels.length]);

    const scrollToReel = (index: number) => {
        if (!containerRef.current) return;

        isScrollingRef.current = true;
        const reelHeight = window.innerHeight;
        containerRef.current.scrollTo({
            top: index * reelHeight,
            behavior: "smooth",
        });

        setTimeout(() => {
            isScrollingRef.current = false;
            setCurrentIndex(index);
        }, 300);
    };

    const handleLike = async () => {
        if (isLiking || !currentReel) return;

        const previousLiked = currentReel.userLiked;
        const previousLikeCount = currentReel.likeCount;

        // Optimistic update
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
            // Revert on error
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

    const handleDoubleTap = () => {
        if (!currentReel?.userLiked) {
            handleLike();
        }

        // Show heart animation
        setShowDoubleTapHeart(true);
        setTimeout(() => setShowDoubleTapHeart(false), 1000);
    };

    const handleComment = () => {
        router.push(`/reels/${currentReel._id}#comments`);
    };

    const handleShare = async () => {
        if (!currentReel) return;

        const shareUrl = `${window.location.origin}/reels/${currentReel._id}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Reel by ${currentReel.userId.firstName} ${currentReel.userId.lastName}`,
                    text: currentReel.caption || "Check out this reel!",
                    url: shareUrl,
                });

                // Track share on backend
                try {
                    await reelsApi.shareReel(currentReel._id);

                    // Update local count
                    setReels((prev) =>
                        prev.map((r, idx) =>
                            idx === currentIndex
                                ? { ...r, shareCount: r.shareCount + 1 }
                                : r
                        )
                    );
                } catch (error) {
                    console.error("Failed to track share:", error);
                }
            } catch (error) {
                if ((error as Error).name !== "AbortError") {
                    copyToClipboard(shareUrl);
                }
            }
        } else {
            copyToClipboard(shareUrl);

            // Still track the share
            try {
                await reelsApi.shareReel(currentReel._id);
                setReels((prev) =>
                    prev.map((r, idx) =>
                        idx === currentIndex
                            ? { ...r, shareCount: r.shareCount + 1 }
                            : r
                    )
                );
            } catch (error) {
                console.error("Failed to track share:", error);
            }
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Link copied to clipboard!");
    };

    if (!currentReel) {
        return (
            <div className="h-screen flex items-center justify-center bg-black">
                <p className="text-white">No reels available</p>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-black"
            style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
            }}
        >
            <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>

            {reels.map((reel, index) => (
                <div
                    key={reel._id}
                    className="relative h-full w-full snap-start snap-always flex items-center justify-center"
                >
                    {/* Video Player */}
                    <InstagramReelPlayer
                        videoUrl={reel.videoUrl}
                        thumbnailUrl={reel.thumbnailUrl}
                        isActive={index === currentIndex}
                        isMuted={muted}
                        onDoubleTap={handleDoubleTap}
                        className="absolute inset-0"
                    />

                    {/* Double Tap Heart Animation */}
                    {index === currentIndex && showDoubleTapHeart && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                            <Heart
                                className="w-32 h-32 text-white fill-white animate-ping"
                                style={{
                                    animationDuration: "0.8s",
                                    animationIterationCount: "1",
                                }}
                            />
                        </div>
                    )}

                    {/* Overlays (only show for current reel) */}
                    {index === currentIndex && (
                        <>
                            <ReelOverlays
                                user={reel.userId}
                                caption={reel.caption}
                                location={reel.location}
                                feeling={reel.feeling}
                                viewCount={reel.viewCount}
                                createdAt={reel.createdAt}
                            />

                            {/* Action Buttons */}
                            <div className="absolute right-3 bottom-24 z-20">
                                <ReelActionButtons
                                    likeCount={reel.likeCount}
                                    commentCount={reel.commentCount}
                                    shareCount={reel.shareCount}
                                    isLiked={reel.userLiked || false}
                                    isMuted={muted}
                                    isLiking={isLiking}
                                    onLike={handleLike}
                                    onComment={handleComment}
                                    onShare={handleShare}
                                    onToggleMute={() => setMuted(!muted)}
                                />
                            </div>
                        </>
                    )}

                    {/* Progress Indicator */}
                    {index === currentIndex && reels.length > 1 && (
                        <div className="absolute top-1/2 right-2 -translate-y-1/2 flex flex-col gap-1.5 z-20">
                            {reels.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        "w-1 rounded-full transition-all duration-300",
                                        idx === currentIndex
                                            ? "h-10 bg-white"
                                            : "h-6 bg-white/30"
                                    )}
                                />
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
