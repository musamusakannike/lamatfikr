"use client";

import { useRef, useEffect } from "react";
import { Play, Eye, Loader2 } from "lucide-react";
import { type Reel } from "@/lib/api/reels";
import { Avatar } from "@/components/ui";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";
import Image from "next/image";

interface ReelsMasonryGridProps {
    reels: Reel[];
    onReelClick: (index: number) => void;
    onLoadMore?: () => void;
    hasMore?: boolean;
    loading?: boolean;
}

export function ReelsMasonryGrid({
    reels,
    onReelClick,
    onLoadMore,
    hasMore = false,
    loading = false,
}: ReelsMasonryGridProps) {
    const { t } = useLanguage();
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Set up intersection observer for infinite scroll
    useEffect(() => {
        if (!hasMore || loading) return;

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && onLoadMore) {
                    onLoadMore();
                }
            },
            { threshold: 0.5 }
        );

        if (loadMoreRef.current) {
            observerRef.current.observe(loadMoreRef.current);
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [hasMore, loading, onLoadMore]);

    const formatViewCount = (count: number): string => {
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M`;
        } else if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}K`;
        }
        return count.toString();
    };

    if (reels.length === 0 && !loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
                <Play className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">{t("reels", "noReelsYet")}</p>
            </div>
        );
    }

    return (
        <div className="w-full px-4 py-6">
            {/* Grid Container */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 auto-rows-[200px] md:auto-rows-[250px] grid-flow-dense">
                {reels.map((reel, index) => {
                    // Deterministic pattern for masonry layout
                    // Pattern repeats every 12 items
                    // 0: Vertical (1x2)
                    // 1: Square (1x1)
                    // 2: Square (1x1)
                    // 3: Horizontal (2x1)
                    // 4: Vertical (1x2)
                    // 5: Square (1x1)
                    // 6: Square (1x1)
                    // 7: Vertical (1x2)
                    // 8: Large Square (2x2) - rare
                    // 9: Square (1x1)
                    // 10: Square (1x1)
                    // 11: Horizontal (2x1)

                    const patternIndex = index % 12;
                    let spanClass = "col-span-1 row-span-1"; // Default Square

                    if ([0, 4, 7].includes(patternIndex)) {
                        spanClass = "col-span-1 row-span-2"; // Vertical
                    } else if ([3, 11].includes(patternIndex)) {
                        spanClass = "col-span-2 row-span-1"; // Horizontal
                    } else if (patternIndex === 8) {
                        spanClass = "col-span-2 row-span-2"; // Large Square
                    }

                    return (
                        <div
                            key={reel._id}
                            onClick={() => onReelClick(index)}
                            className={`group relative bg-gray-900 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:z-10 hover:scale-[1.02] hover:shadow-2xl ${spanClass}`}
                        >
                            {/* Thumbnail or Video */}
                            {reel.thumbnailUrl ? (
                                <Image
                                    src={reel.thumbnailUrl}
                                    alt={reel.caption || "Reel"}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                />
                            ) : (
                                <video
                                    src={reel.videoUrl}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    muted
                                    loop
                                    playsInline
                                    onMouseOver={(e) => e.currentTarget.play()}
                                    onMouseOut={(e) => e.currentTarget.pause()}
                                />
                            )}

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                            {/* Play Icon Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                                    <Play className="w-6 h-6 text-white fill-white" />
                                </div>
                            </div>

                            {/* User Info - Top */}
                            <div className="absolute top-2 left-2 right-2 flex items-center gap-2 z-10">
                                <Link
                                    href={`/user/${reel.userId.username}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-2 flex-1 min-w-0"
                                >
                                    <Avatar
                                        src={reel.userId.avatar}
                                        alt={reel.userId.firstName}
                                        size="xs"
                                        className="ring-1 ring-white/30 w-6 h-6"
                                    />
                                    <span className="text-white text-xs font-semibold truncate shadow-black drop-shadow-md">
                                        {reel.userId.firstName}
                                    </span>
                                </Link>
                            </div>

                            {/* View Count - Bottom */}
                            <div className="absolute bottom-2 left-2 right-2 z-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1 text-white text-xs font-medium drop-shadow-md">
                                        <Eye className="w-3 h-3" />
                                        <span>{formatViewCount(reel.viewCount)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Load More Trigger */}
            {hasMore && (
                <div
                    ref={loadMoreRef}
                    className="flex items-center justify-center py-8"
                >
                    {loading && (
                        <div className="flex items-center gap-2 text-gray-400">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-sm">{t("reels", "loading")}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
