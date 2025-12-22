"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    Heart,
    MessageCircle,
    Send,
    Bookmark,
    Volume2,
    VolumeX,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ReelActionButtonsProps {
    likeCount: number;
    commentCount: number;
    shareCount?: number;
    isLiked: boolean;
    isSaved?: boolean;
    isMuted: boolean;
    isLiking?: boolean;
    onLike: () => void;
    onComment: () => void;
    onShare: () => void;
    onSave?: () => void;
    onToggleMute: () => void;
    className?: string;
}

export function ReelActionButtons({
    likeCount,
    commentCount,
    shareCount,
    isLiked,
    isSaved = false,
    isMuted,
    isLiking = false,
    onLike,
    onComment,
    onShare,
    onSave,
    onToggleMute,
    className,
}: ReelActionButtonsProps) {
    const { t } = useLanguage();
    const [showHeartAnimation, setShowHeartAnimation] = useState(false);

    const handleLike = () => {
        if (!isLiked) {
            setShowHeartAnimation(true);
            setTimeout(() => setShowHeartAnimation(false), 1000);
        }
        onLike();
    };

    const formatCount = (count: number): string => {
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M`;
        }
        if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}K`;
        }
        return count.toString();
    };

    return (
        <div className={cn("flex flex-col gap-5", className)}>
            {/* Like Button */}
            <button
                onClick={handleLike}
                disabled={isLiking}
                className="flex flex-col items-center gap-1.5 group relative"
            >
                <div className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center transition-all group-active:scale-90 group-hover:bg-black/30">
                    <Heart
                        className={cn(
                            "w-7 h-7 transition-all duration-200",
                            isLiked
                                ? "text-red-500 fill-red-500 scale-110"
                                : "text-white group-hover:scale-110"
                        )}
                    />
                </div>
                {likeCount > 0 && (
                    <span className="text-white text-xs font-semibold drop-shadow-lg">
                        {formatCount(likeCount)}
                    </span>
                )}

                {/* Heart Animation on Like */}
                {showHeartAnimation && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <Heart
                            className="w-16 h-16 text-red-500 fill-red-500 animate-ping"
                            style={{ animationDuration: "0.6s", animationIterationCount: "1" }}
                        />
                    </div>
                )}
            </button>

            {/* Comment Button */}
            <button
                onClick={onComment}
                className="flex flex-col items-center gap-1.5 group"
            >
                <div className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center transition-all group-active:scale-90 group-hover:bg-black/30">
                    <MessageCircle className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
                </div>
                {commentCount > 0 && (
                    <span className="text-white text-xs font-semibold drop-shadow-lg">
                        {formatCount(commentCount)}
                    </span>
                )}
            </button>

            {/* Share Button */}
            <button
                onClick={onShare}
                className="flex flex-col items-center gap-1.5 group"
            >
                <div className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center transition-all group-active:scale-90 group-hover:bg-black/30">
                    <Send className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
                </div>
                {shareCount !== undefined && shareCount > 0 && (
                    <span className="text-white text-xs font-semibold drop-shadow-lg">
                        {formatCount(shareCount)}
                    </span>
                )}
            </button>

            {/* Save Button */}
            {onSave && (
                <button
                    onClick={onSave}
                    className="flex flex-col items-center gap-1.5 group"
                >
                    <div className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center transition-all group-active:scale-90 group-hover:bg-black/30">
                        <Bookmark
                            className={cn(
                                "w-7 h-7 transition-all duration-200",
                                isSaved
                                    ? "text-yellow-400 fill-yellow-400 scale-110"
                                    : "text-white group-hover:scale-110"
                            )}
                        />
                    </div>
                </button>
            )}

            {/* Mute/Unmute Button */}
            <button
                onClick={onToggleMute}
                className="flex flex-col items-center gap-1.5 group mt-2"
            >
                <div className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center transition-all group-active:scale-90 group-hover:bg-black/30">
                    {isMuted ? (
                        <VolumeX className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
                    ) : (
                        <Volume2 className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
                    )}
                </div>
            </button>
        </div>
    );
}
