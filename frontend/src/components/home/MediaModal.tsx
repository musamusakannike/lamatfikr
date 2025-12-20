"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui";
import {
    X,
    ChevronLeft,
    ChevronRight,
    ArrowBigUp,
    ArrowBigDown,
    MessageCircle,
    BarChart3,
    ExternalLink,
} from "lucide-react";
import { type Post } from "@/lib/api/posts";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import Image from "next/image";

interface MediaModalProps {
    post: Post;
    initialMediaIndex?: number;
    onClose: () => void;
}

export function MediaModal({ post, initialMediaIndex = 0, onClose }: MediaModalProps) {
    const [currentIndex, setCurrentIndex] = useState(initialMediaIndex);
    const [showFullCaption, setShowFullCaption] = useState(false);

    const media = post.media || [];
    const currentMedia = media[currentIndex];
    const hasMultiple = media.length > 1;

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            } else if (e.key === "ArrowLeft" && hasMultiple && currentIndex > 0) {
                setCurrentIndex(currentIndex - 1);
            } else if (e.key === "ArrowRight" && hasMultiple && currentIndex < media.length - 1) {
                setCurrentIndex(currentIndex + 1);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentIndex, hasMultiple, media.length, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, []);

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < media.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const captionText = post.contentText || "";
    const shouldTruncate = captionText.length > 150;
    const displayCaption = showFullCaption || !shouldTruncate
        ? captionText
        : captionText.slice(0, 150) + "...";

    return (
        <div
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={onClose}
        >
            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors"
            >
                <X className="w-6 h-6 text-white" />
            </button>

            {/* Navigation buttons */}
            {hasMultiple && (
                <>
                    {currentIndex > 0 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handlePrevious();
                            }}
                            className="absolute left-4 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors"
                        >
                            <ChevronLeft className="w-6 h-6 text-white" />
                        </button>
                    )}
                    {currentIndex < media.length - 1 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleNext();
                            }}
                            className="absolute right-4 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors"
                        >
                            <ChevronRight className="w-6 h-6 text-white" />
                        </button>
                    )}
                </>
            )}

            {/* Content container */}
            <div
                className="w-full max-w-6xl h-full max-h-[90vh] flex flex-col lg:flex-row gap-0 lg:gap-4 p-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Media section */}
                <div className="flex-1 flex items-center justify-center bg-black rounded-lg overflow-hidden">
                    {currentMedia?.type === "video" ? (
                        <video
                            src={currentMedia.url}
                            controls
                            autoPlay
                            className="max-w-full max-h-full object-contain"
                        />
                    ) : (
                        <div className="relative w-full h-full flex items-center justify-center">
                            <Image
                                src={currentMedia?.url || ""}
                                alt="Post media"
                                fill
                                className="object-contain"
                                sizes="(max-width: 1024px) 100vw, 80vw"
                            />
                        </div>
                    )}
                </div>

                {/* Info sidebar */}
                <div className="w-full lg:w-96 bg-(--bg-card) rounded-lg border border-(--border) flex flex-col max-h-[40vh] lg:max-h-full">
                    {/* Header */}
                    <div className="p-4 border-b border-(--border)">
                        <div className="flex items-center gap-3">
                            <Link href={`/profile/${post.userId._id}`} onClick={onClose}>
                                <Avatar
                                    src={post.userId.avatar}
                                    alt={`${post.userId.firstName} ${post.userId.lastName}`}
                                    className="w-10 h-10"
                                />
                            </Link>
                            <div className="flex-1 min-w-0">
                                <Link
                                    href={`/profile/${post.userId._id}`}
                                    onClick={onClose}
                                    className="flex items-center gap-1 hover:underline"
                                >
                                    <span className="font-semibold text-(--text-primary) truncate">
                                        {post.userId.firstName} {post.userId.lastName}
                                    </span>
                                    {post.userId.verified && <VerifiedBadge />}
                                </Link>
                                <p className="text-xs text-(--text-muted)">
                                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* Caption */}
                        {captionText && (
                            <div className="text-sm text-(--text-primary)">
                                <p className="whitespace-pre-wrap break-words">{displayCaption}</p>
                                {shouldTruncate && !showFullCaption && (
                                    <button
                                        onClick={() => setShowFullCaption(true)}
                                        className="text-primary-600 dark:text-primary-400 hover:underline mt-1 text-xs font-medium"
                                    >
                                        Read more
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Location & Feeling */}
                        {(post.location || post.feeling) && (
                            <div className="flex flex-wrap gap-2 text-xs text-(--text-muted)">
                                {post.location && (
                                    <span className="flex items-center gap-1">
                                        📍 {post.location}
                                    </span>
                                )}
                                {post.feeling && (
                                    <span className="flex items-center gap-1">
                                        😊 {post.feeling}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Poll indicator */}
                        {post.hasPoll && post.poll && (
                            <Link
                                href={`/posts/${post._id}`}
                                onClick={onClose}
                                className="flex items-center gap-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors group"
                            >
                                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                                    <BarChart3 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-(--text-primary) truncate">
                                        {post.poll.question}
                                    </p>
                                    <p className="text-xs text-(--text-muted)">
                                        {post.poll.options.length} options • Click to vote
                                    </p>
                                </div>
                                <ExternalLink className="w-4 h-4 text-(--text-muted) group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
                            </Link>
                        )}

                        {/* Media counter */}
                        {hasMultiple && (
                            <div className="flex items-center justify-center gap-2">
                                {media.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentIndex(index)}
                                        className={cn(
                                            "w-2 h-2 rounded-full transition-all",
                                            index === currentIndex
                                                ? "bg-primary-600 dark:bg-primary-400 w-6"
                                                : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
                                        )}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer stats */}
                    <div className="p-4 border-t border-(--border)">
                        <div className="flex items-center justify-around text-sm">
                            <div className="flex items-center gap-2">
                                <ArrowBigUp className="w-5 h-5 text-(--text-muted)" />
                                <span className="font-semibold text-(--text-primary)">{post.upvotes || 0}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <ArrowBigDown className="w-5 h-5 text-(--text-muted)" />
                                <span className="font-semibold text-(--text-primary)">{post.downvotes || 0}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MessageCircle className="w-5 h-5 text-(--text-muted)" />
                                <span className="font-semibold text-(--text-primary)">{post.commentCount || 0}</span>
                            </div>
                        </div>
                        <Link
                            href={`/posts/${post._id}`}
                            onClick={onClose}
                            className="mt-3 w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white rounded-lg font-medium text-sm text-center transition-colors flex items-center justify-center gap-2"
                        >
                            View full post
                            <ExternalLink className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
