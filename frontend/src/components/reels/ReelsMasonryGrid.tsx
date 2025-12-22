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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {reels.map((reel, index) => (
                    <div
                        key={reel._id}
                        onClick={() => onReelClick(index)}
                        className="group relative aspect-[9/16] bg-gray-900 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                    >
                        {/* Thumbnail */}
                        {reel.thumbnailUrl ? (
                            <Image
                                src={reel.thumbnailUrl}
                                alt={reel.caption || "Reel"}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                            />
                        ) : (
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-900 via-pink-900 to-orange-900" />
                        )}

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                        {/* Play Icon Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                                <Play className="w-8 h-8 text-white fill-white" />
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
                                    size="sm"
                                    className="ring-2 ring-white/30"
                                />
                                <div className="flex items-center gap-1 min-w-0">
                                    <span className="text-white text-xs font-semibold truncate">
                                        {reel.userId.firstName}
                                    </span>
                                    {reel.userId.verified && <VerifiedBadge size={12} />}
                                </div>
                            </Link>
                        </div>

                        {/* View Count - Bottom */}
                        <div className="absolute bottom-2 left-2 right-2 z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 text-white text-xs font-medium">
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>{formatViewCount(reel.viewCount)}</span>
                                </div>
                                {reel.caption && (
                                    <div className="flex-1 ml-2">
                                        <p className="text-white text-xs line-clamp-1">
                                            {reel.caption}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
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
