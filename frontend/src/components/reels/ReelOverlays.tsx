"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, Button } from "@/components/ui";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";
import { MoreHorizontal, MapPin, Smile, Music } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

interface ReelOverlaysProps {
    user: {
        _id: string;
        firstName: string;
        lastName: string;
        username: string;
        avatar?: string;
        verified?: boolean;
    };
    caption?: string;
    location?: string;
    feeling?: string;
    music?: string;
    viewCount: number;
    createdAt: string;
    isFollowing?: boolean;
    onFollow?: () => void;
    onMenuClick?: () => void;
    className?: string;
}

export function ReelOverlays({
    user,
    caption,
    location,
    feeling,
    music,
    viewCount,
    createdAt,
    isFollowing = false,
    onFollow,
    onMenuClick,
    className,
}: ReelOverlaysProps) {
    const { t } = useLanguage();
    const [expanded, setExpanded] = useState(false);
    const maxCaptionLength = 100;
    const shouldTruncate = caption && caption.length > maxCaptionLength;

    return (
        <div className={cn("absolute inset-0 pointer-events-none", className)}>
            {/* Top Overlay - User Info */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 via-black/30 to-transparent pointer-events-auto">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href={`/user/${user.username}`}>
                            <Avatar
                                src={user.avatar}
                                alt={user.firstName}
                                size="md"
                                className="ring-2 ring-white/20 hover:ring-white/40 transition-all"
                            />
                        </Link>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <Link href={`/user/${user.username}`}>
                                    <span className="font-semibold text-white text-sm hover:underline">
                                        {user.firstName} {user.lastName}
                                    </span>
                                </Link>
                                {user.verified && <VerifiedBadge size={14} />}
                            </div>
                            <p className="text-xs text-white/80">
                                {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
                            </p>
                        </div>
                        {onFollow && !isFollowing && (
                            <Button
                                size="sm"
                                onClick={onFollow}
                                className="ml-2 bg-white text-black hover:bg-white/90 font-semibold px-4 py-1 h-8"
                            >
                                {t("common", "follow")}
                            </Button>
                        )}
                    </div>

                    {onMenuClick && (
                        <button
                            onClick={onMenuClick}
                            className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center hover:bg-black/30 transition-all"
                        >
                            <MoreHorizontal className="w-5 h-5 text-white" />
                        </button>
                    )}
                </div>
            </div>

            {/* Bottom Overlay - Caption & Metadata */}
            <div className="absolute bottom-0 left-0 right-16 p-4 pb-6 bg-gradient-to-t from-black/80 via-black/50 to-transparent pointer-events-auto">
                {/* Caption */}
                {caption && (
                    <div className="mb-3">
                        <p className="text-white text-sm leading-relaxed">
                            {shouldTruncate && !expanded
                                ? `${caption.slice(0, maxCaptionLength)}...`
                                : caption}
                            {shouldTruncate && (
                                <button
                                    onClick={() => setExpanded(!expanded)}
                                    className="ml-2 text-white/80 font-medium hover:text-white"
                                >
                                    {expanded ? t("common", "less") : t("common", "more")}
                                </button>
                            )}
                        </p>
                    </div>
                )}

                {/* Metadata */}
                <div className="flex flex-wrap gap-3 text-xs text-white/90 mb-2">
                    {location && (
                        <span className="flex items-center gap-1 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
                            <MapPin size={12} />
                            {location}
                        </span>
                    )}
                    {feeling && (
                        <span className="flex items-center gap-1 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
                            <Smile size={12} />
                            {feeling}
                        </span>
                    )}
                    {music && (
                        <span className="flex items-center gap-1 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
                            <Music size={12} />
                            {music}
                        </span>
                    )}
                </div>

                {/* View Count */}
                <div className="text-xs text-white/70">
                    {viewCount.toLocaleString()} {t("reels", "views")}
                </div>
            </div>
        </div>
    );
}
