"use client";

import { Play, Image as ImageIcon, Layers } from "lucide-react";
import { type Post } from "@/lib/api/posts";
import Image from "next/image";

interface MediaGridProps {
    posts: Post[];
    onMediaClick: (post: Post, mediaIndex: number) => void;
}

export function MediaGrid({ posts, onMediaClick }: MediaGridProps) {
    if (posts.length === 0) {
        return (
            <div className="bg-(--bg-card) rounded-xl border border-(--border) p-12 text-center">
                <ImageIcon className="w-16 h-16 mx-auto mb-4 text-(--text-muted) opacity-50" />
                <p className="text-(--text-muted) text-lg">No media posts to show</p>
                <p className="text-(--text-muted) text-sm mt-2">
                    Posts with photos or videos will appear here
                </p>
            </div>
        );
    }

    return (
        <div className="columns-2 sm:columns-2 lg:columns-3 gap-3 space-y-3">
            {posts.map((post) => {
                const media = post.media || [];
                if (media.length === 0) return null;

                const firstMedia = media[0];
                const isVideo = firstMedia.type === "video";
                const hasMultiple = media.length > 1;

                return (
                    <div
                        key={post._id}
                        className="break-inside-avoid mb-3"
                    >
                        <div
                            className="relative bg-(--bg-secondary) rounded-lg overflow-hidden cursor-pointer group"
                            onClick={() => onMediaClick(post, 0)}
                        >
                            {/* Media thumbnail */}
                            {isVideo ? (
                                <div className="relative w-full">
                                    <video
                                        src={firstMedia.url}
                                        poster={firstMedia.thumbnail}
                                        className="w-full h-auto object-cover"
                                        preload="metadata"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                                        <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                                            <Play className="w-8 h-8 text-gray-900 ml-1" fill="currentColor" />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative w-full">
                                    <Image
                                        src={firstMedia.url}
                                        alt="Post media"
                                        width={400}
                                        height={400}
                                        className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                    />
                                </div>
                            )}

                            {/* Multiple media indicator */}
                            {hasMultiple && (
                                <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 z-10">
                                    <Layers className="w-4 h-4 text-white" />
                                    <span className="text-white text-sm font-medium">
                                        {media.length}
                                    </span>
                                </div>
                            )}

                            {/* Hover overlay with stats */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-1">
                                            <span className="font-semibold">{post.upvotes || 0}</span>
                                            <span className="text-white/80">upvotes</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="font-semibold">{post.commentCount || 0}</span>
                                            <span className="text-white/80">comments</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
