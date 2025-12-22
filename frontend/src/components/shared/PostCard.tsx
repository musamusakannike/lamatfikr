"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Avatar, Badge, Button, Card, CardContent } from "@/components/ui";
import {
    ArrowBigUp,
    ArrowBigDown,
    MessageCircle,
    Share2,
    Bookmark,
    MoreHorizontal,
    Megaphone,
    Send,
    Loader2,
    ChevronDown,
    ChevronUp,
    MapPin,
    Smile,
    Edit3,
    BarChart3,
    Play,
    Volume2,
    X,
    ChevronLeft,
    ChevronRight,
    UserPlus,
    UserCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { postsApi, type Post } from "@/lib/api/posts";
import { commentsApi, type Comment } from "@/lib/api/comments";
import { socialApi } from "@/lib/api/social";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";

interface PostCardProps {
    post: Post;
    showAnnouncement?: boolean;
}

export function PostCard({ post: initialPost, showAnnouncement = false }: PostCardProps) {
    const { user: currentUser, isAuthenticated } = useAuth();
    const [post, setPost] = useState(initialPost);
    const [isVoting, setIsVoting] = useState(false);
    const [saved, setSaved] = useState(initialPost.isSaved || false);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [commentPage, setCommentPage] = useState(1);
    const [hasMoreComments, setHasMoreComments] = useState(false);
    const [isVotingPoll, setIsVotingPoll] = useState(false);
    const [fullscreenImage, setFullscreenImage] = useState<{ url: string; index: number } | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isFollowLoading, setIsFollowLoading] = useState(false);

    const isOwnPost = currentUser?.id === post.userId._id;

    // Sync post state when initialPost prop changes
    useEffect(() => {
        setPost(initialPost);
        setSaved(initialPost.isSaved || false);
    }, [initialPost]);

    // Check follow status on mount
    useEffect(() => {
        const checkFollowStatus = async () => {
            if (!isAuthenticated || isOwnPost) return;
            try {
                const { isFollowing: following } = await socialApi.checkFollowStatus(post.userId._id);
                setIsFollowing(following);
            } catch (error) {
                console.error("Failed to check follow status:", error);
            }
        };
        checkFollowStatus();
    }, [isAuthenticated, isOwnPost, post.userId._id]);

    const handleFollow = async () => {
        if (isFollowLoading || !isAuthenticated) return;

        const previousFollowing = isFollowing;
        // Optimistic update
        setIsFollowing(!isFollowing);
        setIsFollowLoading(true);

        try {
            if (previousFollowing) {
                await socialApi.unfollowUser(post.userId._id);
                toast.success(`Unfollowed ${post.userId.firstName}`);
            } else {
                await socialApi.followUser(post.userId._id);
                toast.success(`Following ${post.userId.firstName}`);
            }
        } catch (error) {
            // Revert on error
            setIsFollowing(previousFollowing);
            console.error(error);
            toast.error(previousFollowing ? "Failed to unfollow" : "Failed to follow");
        } finally {
            setIsFollowLoading(false);
        }
    };

    const handleVote = async (type: "upvote" | "downvote") => {
        if (isVoting) return;

        const previousVote = post.userVote;
        const previousUpvotes = post.upvotes;
        const previousDownvotes = post.downvotes;

        // Optimistic Update
        let newUpvotes = previousUpvotes;
        let newDownvotes = previousDownvotes;
        let newVote: "upvote" | "downvote" | null = type;

        if (previousVote === type) {
            // Toggle off
            newVote = null;
            if (type === "upvote") newUpvotes = Math.max(0, newUpvotes - 1);
            else newDownvotes = Math.max(0, newDownvotes - 1);
        } else {
            // Changed vote or new vote
            if (previousVote === "upvote") newUpvotes = Math.max(0, newUpvotes - 1);
            if (previousVote === "downvote") newDownvotes = Math.max(0, newDownvotes - 1);

            if (type === "upvote") newUpvotes += 1;
            else newDownvotes += 1;
        }

        setPost({ ...post, upvotes: newUpvotes, downvotes: newDownvotes, userVote: newVote });
        setIsVoting(true);

        try {
            if (previousVote === type) {
                await postsApi.removeVote(post._id);
            } else {
                await postsApi.votePost(post._id, type);
            }
        } catch (error) {
            console.error(error);
            // Revert
            setPost({ ...post, upvotes: previousUpvotes, downvotes: previousDownvotes, userVote: previousVote });
            toast.error("Failed to vote");
        } finally {
            setIsVoting(false);
        }
    };

    const handleSave = async () => {
        try {
            if (saved) {
                await postsApi.unsavePost(post._id);
                setSaved(false);
                toast.success("Post unsaved");
            } else {
                await postsApi.savePost(post._id);
                setSaved(true);
                toast.success("Post saved");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to save post");
        }
    };

    const loadComments = async (page = 1) => {
        try {
            setIsLoadingComments(true);
            const { comments: fetchedComments, pagination } = await commentsApi.getComments(post._id, page, 10);

            if (page === 1) {
                setComments(fetchedComments);
            } else {
                setComments((prev) => [...prev, ...fetchedComments]);
            }

            setCommentPage(page);
            setHasMoreComments(pagination.page < pagination.pages);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load comments");
        } finally {
            setIsLoadingComments(false);
        }
    };

    const toggleComments = async () => {
        if (!showComments && comments.length === 0) {
            await loadComments(1);
        }
        setShowComments(!showComments);
    };

    const handleSubmitComment = async () => {
        if (!commentText.trim() || isSubmittingComment) return;

        try {
            setIsSubmittingComment(true);
            const { comment } = await commentsApi.createComment(post._id, { content: commentText });

            // Add new comment to the top of the list
            setComments((prev) => [comment, ...prev]);

            // Update comment count
            setPost({ ...post, commentCount: post.commentCount + 1 });

            setCommentText("");
            toast.success("Comment added");
        } catch (error) {
            console.error(error);
            toast.error("Failed to add comment");
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const images = post.media?.filter((m) => m.type === "image").map((m) => m.url) || [];
    const isAnnouncement = showAnnouncement && post.privacy === "public";

    // Calculate net votes (upvotes - downvotes), ensuring we handle undefined values
    const netVotes = (post.upvotes || 0) - (post.downvotes || 0);

    return (
        <Card className={cn(isAnnouncement && "border-primary-300 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-950/30")}>
            <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <Link href={`/user/${post.userId.username}`}>
                            <Avatar src={post.userId.avatar} alt={post.userId.firstName} size="md" className="cursor-pointer hover:opacity-80 transition-opacity" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <Link href={`/user/${post.userId.username}`} className="hover:underline">
                                    <span className="font-semibold">
                                        {post.userId.firstName} {post.userId.lastName}
                                    </span>
                                </Link>
                                {post.userId.verified && (
                                    <VerifiedBadge size={16} />
                                )}
                                {isAnnouncement && (
                                    <Badge variant="primary" size="sm" className="ml-1">
                                        <Megaphone size={10} className="mr-1" />
                                        Announcement
                                    </Badge>
                                )}
                                {/* Follow Button */}
                                {isAuthenticated && !isOwnPost && (
                                    <button
                                        onClick={handleFollow}
                                        disabled={isFollowLoading}
                                        className={cn(
                                            "ml-2 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                                            isFollowing
                                                ? "bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                                                : "bg-primary-500 text-white hover:bg-primary-600",
                                            isFollowLoading && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        {isFollowLoading ? (
                                            <Loader2 size={12} className="animate-spin" />
                                        ) : isFollowing ? (
                                            <>
                                                <UserCheck size={12} />
                                                <span className="hidden sm:inline">Following</span>
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus size={12} />
                                                <span className="hidden sm:inline">Follow</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-(--text-muted) flex-wrap">
                                <Link href={`/user/${post.userId.username}`} className="hover:underline">
                                    <span>@{post.userId.username}</span>
                                </Link>
                                <span>•</span>
                                <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                                {post.isEdited && (
                                    <>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <Edit3 size={12} />
                                            Edited
                                        </span>
                                    </>
                                )}
                                {post.location && (
                                    <>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <MapPin size={12} />
                                            {post.location}
                                        </span>
                                    </>
                                )}
                                {post.feeling && (
                                    <>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <Smile size={12} />
                                            {post.feeling}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-(--text-muted)">
                        <MoreHorizontal size={18} />
                    </Button>
                </div>

                {/* Content */}
                {post.contentText && <p className="text-(--text) mb-3 whitespace-pre-wrap">{post.contentText}</p>}

                {/* Media */}
                {post.media && post.media.length > 0 && (
                    <div className="mb-3 space-y-2">
                        {/* Images */}
                        {images.length > 0 && (
                            <div
                                className={cn(
                                    "rounded-xl overflow-hidden",
                                    images.length === 1 ? "grid-cols-1" : "grid grid-cols-2 gap-1"
                                )}
                            >
                                {images.map((image, index) => (
                                    <Image
                                        key={index}
                                        src={image}
                                        alt={`Post image ${index + 1}`}
                                        width={600}
                                        height={images.length === 1 ? 400 : 200}
                                        className={cn("w-full object-cover cursor-pointer hover:opacity-90 transition-opacity", images.length === 1 ? "max-h-96" : "h-48")}
                                        onClick={() => setFullscreenImage({ url: image, index })}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Videos */}
                        {post.media.filter((m) => m.type === "video").map((video, index) => (
                            <div key={`video-${index}`} className="rounded-xl overflow-hidden bg-black">
                                <video
                                    controls
                                    className="w-full max-h-96"
                                    poster={video.thumbnail}
                                >
                                    <source src={video.url} type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                        ))}

                        {/* Audio */}
                        {post.media.filter((m) => m.type === "audio" || m.type === "voice_note").map((audio, index) => (
                            <div key={`audio-${index}`} className="rounded-xl bg-primary-50 dark:bg-primary-900/30 p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <Volume2 size={20} className="text-primary-600" />
                                    <span className="text-sm font-medium">
                                        {audio.type === "voice_note" ? "Voice Note" : "Audio"}
                                    </span>
                                </div>
                                <audio controls className="w-full">
                                    <source src={audio.url} type="audio/mpeg" />
                                    Your browser does not support the audio tag.
                                </audio>
                            </div>
                        ))}
                    </div>
                )}

                {/* Poll */}
                {post.hasPoll && post.poll && (
                    <PollSection
                        post={post}
                        setPost={setPost}
                        isVotingPoll={isVotingPoll}
                        setIsVotingPoll={setIsVotingPoll}
                    />
                )}

                <div className="flex items-center justify-between pt-2 border-t border-(--border)">
                    <div className="flex items-center gap-1">
                        {/* Vote buttons */}
                        <div className="flex items-center bg-primary-50 dark:bg-primary-900/30 rounded-full">
                            <button
                                onClick={() => handleVote("upvote")}
                                disabled={isVoting}
                                className={cn(
                                    "p-2 rounded-l-full transition-colors",
                                    post.userVote === "upvote"
                                        ? "text-primary-600 dark:text-primary-400"
                                        : "text-(--text-muted) hover:text-primary-600",
                                    isVoting && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                <ArrowBigUp size={22} fill={post.userVote === "upvote" ? "currentColor" : "none"} />
                            </button>
                            <span
                                className={cn(
                                    "text-sm font-semibold min-w-[40px] text-center",
                                    post.userVote === "upvote" && "text-primary-600 dark:text-primary-400",
                                    post.userVote === "downvote" && "text-red-500"
                                )}
                            >
                                {netVotes}
                            </span>
                            <button
                                onClick={() => handleVote("downvote")}
                                disabled={isVoting}
                                className={cn(
                                    "p-2 rounded-r-full transition-colors",
                                    post.userVote === "downvote" ? "text-red-500" : "text-(--text-muted) hover:text-red-500",
                                    isVoting && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                <ArrowBigDown size={22} fill={post.userVote === "downvote" ? "currentColor" : "none"} />
                            </button>
                        </div>

                        {/* Comments */}
                        <button
                            onClick={toggleComments}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-(--text-muted) hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                        >
                            <MessageCircle size={18} />
                            <span className="text-sm">{post.commentCount}</span>
                        </button>

                        {/* Share */}
                        <button className="flex items-center gap-1.5 px-3 py-2 rounded-full text-(--text-muted) hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors">
                            <Share2 size={18} />
                            <span className="text-sm hidden sm:inline">{post.shareCount}</span>
                        </button>
                    </div>

                    {/* Save */}
                    <button
                        onClick={handleSave}
                        className={cn(
                            "p-2 rounded-full transition-colors",
                            saved ? "text-primary-600 dark:text-primary-400" : "text-(--text-muted) hover:text-primary-600"
                        )}
                    >
                        <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
                    </button>
                </div>

                {/* Comments Section */}
                {showComments && (
                    <div className="mt-4 pt-4 border-t border-(--border) space-y-4">
                        {/* Comment Input */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Write a comment..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmitComment();
                                    }
                                }}
                                className={cn(
                                    "flex-1 px-4 py-2 rounded-lg text-sm",
                                    "bg-primary-50/80 dark:bg-primary-950/40",
                                    "border border-(--border)",
                                    "focus:border-primary-400 dark:focus:border-primary-500",
                                    "placeholder:text-(--text-muted)",
                                    "outline-none transition-all duration-200"
                                )}
                            />
                            <Button
                                onClick={handleSubmitComment}
                                disabled={!commentText.trim() || isSubmittingComment}
                                size="icon"
                                className="shrink-0"
                            >
                                {isSubmittingComment ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            </Button>
                        </div>

                        {/* Comments List */}
                        {isLoadingComments && comments.length === 0 ? (
                            <div className="flex justify-center py-4">
                                <Loader2 size={24} className="animate-spin text-primary-500" />
                            </div>
                        ) : comments.length > 0 ? (
                            <div className="space-y-3">
                                {comments.map((comment) => (
                                    <CommentCard key={comment._id} comment={comment} postId={post._id} />
                                ))}

                                {/* Load More Button */}
                                {hasMoreComments && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => loadComments(commentPage + 1)}
                                        disabled={isLoadingComments}
                                        className="w-full"
                                    >
                                        {isLoadingComments ? (
                                            <>
                                                <Loader2 size={16} className="mr-2 animate-spin" />
                                                Loading...
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown size={16} className="mr-2" />
                                                Load more comments
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <p className="text-center text-sm text-(--text-muted) py-4">No comments yet. Be the first to comment!</p>
                        )}
                    </div>
                )}
            </CardContent>

            {/* Fullscreen Image Modal */}
            {fullscreenImage && (
                <ImageFullscreenModal
                    images={images}
                    currentIndex={fullscreenImage.index}
                    onClose={() => setFullscreenImage(null)}
                    onNavigate={(index) => setFullscreenImage({ url: images[index], index })}
                />
            )}
        </Card>
    );
}

interface ImageFullscreenModalProps {
    images: string[];
    currentIndex: number;
    onClose: () => void;
    onNavigate: (index: number) => void;
}

function ImageFullscreenModal({ images, currentIndex, onClose, onNavigate }: ImageFullscreenModalProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            } else if (e.key === "ArrowLeft" && currentIndex > 0) {
                onNavigate(currentIndex - 1);
            } else if (e.key === "ArrowRight" && currentIndex < images.length - 1) {
                onNavigate(currentIndex + 1);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [currentIndex, images.length, onClose, onNavigate]);

    return (
        <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={onClose}
        >
            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
            >
                <X size={24} />
            </button>

            {/* Image counter */}
            {images.length > 1 && (
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/50 text-white text-sm z-10">
                    {currentIndex + 1} / {images.length}
                </div>
            )}

            {/* Previous button */}
            {currentIndex > 0 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onNavigate(currentIndex - 1);
                    }}
                    className="absolute left-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
                >
                    <ChevronLeft size={32} />
                </button>
            )}

            {/* Next button */}
            {currentIndex < images.length - 1 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onNavigate(currentIndex + 1);
                    }}
                    className="absolute right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
                >
                    <ChevronRight size={32} />
                </button>
            )}

            {/* Image */}
            <div
                className="max-w-[90vw] max-h-[90vh] relative"
                onClick={(e) => e.stopPropagation()}
            >
                <Image
                    src={images[currentIndex]}
                    alt={`Fullscreen image ${currentIndex + 1}`}
                    width={1200}
                    height={800}
                    className="max-w-full max-h-[90vh] object-contain"
                    priority
                />
            </div>
        </div>
    );
}

interface PollSectionProps {
    post: Post;
    setPost: React.Dispatch<React.SetStateAction<Post>>;
    isVotingPoll: boolean;
    setIsVotingPoll: React.Dispatch<React.SetStateAction<boolean>>;
}

function PollSection({ post, setPost, isVotingPoll, setIsVotingPoll }: PollSectionProps) {
    const poll = post.poll!;
    const isPollEnded = poll.endsAt ? new Date(poll.endsAt) < new Date() : false;

    const handlePollVote = async (optionId: string) => {
        if (isVotingPoll || isPollEnded) return;

        setIsVotingPoll(true);

        // Determine new votes
        let newVotes: string[];
        if (poll.allowMultipleVotes) {
            // Toggle the option
            if (poll.userVotes?.includes(optionId)) {
                newVotes = poll.userVotes.filter((id) => id !== optionId);
            } else {
                newVotes = [...(poll.userVotes || []), optionId];
            }
        } else {
            // Single vote - replace or toggle
            if (poll.userVotes?.includes(optionId)) {
                newVotes = [];
            } else {
                newVotes = [optionId];
            }
        }

        // Optimistic update
        const previousPoll = { ...poll };
        const updatedOptions = poll.options.map((opt) => {
            let newVoteCount = opt.voteCount;
            const wasVoted = poll.userVotes?.includes(opt._id);
            const willBeVoted = newVotes.includes(opt._id);

            if (wasVoted && !willBeVoted) {
                newVoteCount = Math.max(0, newVoteCount - 1);
            } else if (!wasVoted && willBeVoted) {
                newVoteCount += 1;
            }

            return { ...opt, voteCount: newVoteCount };
        });

        setPost({
            ...post,
            poll: { ...poll, options: updatedOptions, userVotes: newVotes },
        });

        try {
            if (newVotes.length === 0) {
                // If no votes, we need to handle this - for now just vote with empty array
                // The server might not support removing all votes, so we'll just toggle
                await postsApi.votePoll(post._id, [optionId]);
            } else {
                const { poll: updatedPoll } = await postsApi.votePoll(post._id, newVotes);
                if (updatedPoll) {
                    setPost({
                        ...post,
                        poll: { ...updatedPoll, userVotes: newVotes },
                    });
                }
            }
        } catch (error) {
            console.error(error);
            // Revert on error
            setPost({ ...post, poll: previousPoll });
            toast.error("Failed to vote on poll");
        } finally {
            setIsVotingPoll(false);
        }
    };

    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.voteCount, 0);

    return (
        <div className="mb-3 p-4 rounded-xl bg-primary-50/50 dark:bg-primary-900/20 border border-(--border)">
            <div className="flex items-start gap-2 mb-3">
                <BarChart3 size={18} className="text-primary-600 mt-0.5" />
                <div className="flex-1">
                    <h4 className="font-semibold text-(--text) mb-1">{poll.question}</h4>
                    {poll.endsAt && (
                        <p className="text-xs text-(--text-muted)">
                            {isPollEnded
                                ? "Poll ended"
                                : `Ends ${formatDistanceToNow(new Date(poll.endsAt), { addSuffix: true })}`}
                        </p>
                    )}
                </div>
            </div>
            <div className="space-y-2">
                {poll.options.map((option) => {
                    const percentage = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;
                    const isUserVoted = poll.userVotes?.includes(option._id);

                    return (
                        <button
                            key={option._id}
                            onClick={() => handlePollVote(option._id)}
                            disabled={isVotingPoll || isPollEnded}
                            className={cn(
                                "relative w-full p-3 rounded-lg border transition-all text-left",
                                isUserVoted
                                    ? "border-primary-500 bg-primary-100/50 dark:bg-primary-900/30"
                                    : "border-(--border) hover:border-primary-300 dark:hover:border-primary-700",
                                (isVotingPoll || isPollEnded) && "cursor-not-allowed opacity-70"
                            )}
                        >
                            <div className="relative z-10 flex items-center justify-between">
                                <span className={cn("text-sm font-medium", isUserVoted && "text-primary-700 dark:text-primary-300")}>
                                    {option.text}
                                </span>
                                <span className="text-sm font-semibold text-(--text-muted)">
                                    {percentage}%
                                </span>
                            </div>
                            <div
                                className="absolute inset-0 bg-primary-200/30 dark:bg-primary-800/20 rounded-lg transition-all"
                                style={{ width: `${percentage}%` }}
                            />
                        </button>
                    );
                })}
            </div>
            <p className="text-xs text-(--text-muted) mt-2">
                {totalVotes} total votes
                {poll.allowMultipleVotes && " • Multiple votes allowed"}
                {isVotingPoll && (
                    <span className="ml-2">
                        <Loader2 size={12} className="inline animate-spin" />
                    </span>
                )}
            </p>
        </div>
    );
}

function CommentCard({ comment, postId }: { comment: Comment; postId: string }) {
    const [showReplies, setShowReplies] = useState(false);
    const [replies, setReplies] = useState<Comment[]>([]);
    const [isLoadingReplies, setIsLoadingReplies] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);

    const loadReplies = async () => {
        if (replies.length > 0) {
            setShowReplies(!showReplies);
            return;
        }

        try {
            setIsLoadingReplies(true);
            const { replies: fetchedReplies } = await commentsApi.getReplies(postId, comment._id, 1, 10);
            setReplies(fetchedReplies);
            setShowReplies(true);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load replies");
        } finally {
            setIsLoadingReplies(false);
        }
    };

    const handleSubmitReply = async () => {
        if (!replyText.trim() || isSubmittingReply) return;

        try {
            setIsSubmittingReply(true);
            const { comment: newReply } = await commentsApi.createComment(postId, {
                content: replyText,
                parentCommentId: comment._id,
            });

            setReplies((prev) => [...prev, newReply]);
            setReplyText("");
            setShowReplies(true);
            toast.success("Reply added");
        } catch (error) {
            console.error(error);
            toast.error("Failed to add reply");
        } finally {
            setIsSubmittingReply(false);
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <Avatar src={comment.userId.avatar} alt={comment.userId.firstName} size="sm" />
                <div className="flex-1 min-w-0">
                    <div className="bg-primary-50/50 dark:bg-primary-900/20 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">
                                {comment.userId.firstName} {comment.userId.lastName}
                            </span>
                            {comment.userId.verified && (
                                <VerifiedBadge size={12} />
                            )}
                            <span className="text-xs text-(--text-muted)">
                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                            </span>
                        </div>
                        <p className="text-sm text-(--text)">{comment.content}</p>
                    </div>

                    <div className="flex items-center gap-3 mt-1 px-2">
                        <button
                            onClick={() => setReplyText(`@${comment.userId.username} `)}
                            className="text-xs font-medium text-(--text-muted) hover:text-primary-600 transition-colors"
                        >
                            Reply
                        </button>
                        {comment.replyCount > 0 && (
                            <button
                                onClick={loadReplies}
                                disabled={isLoadingReplies}
                                className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-1"
                            >
                                {isLoadingReplies ? (
                                    <Loader2 size={12} className="animate-spin" />
                                ) : showReplies ? (
                                    <ChevronUp size={12} />
                                ) : (
                                    <ChevronDown size={12} />
                                )}
                                {comment.replyCount} {comment.replyCount === 1 ? "reply" : "replies"}
                            </button>
                        )}
                    </div>

                    {/* Reply Input */}
                    {replyText && (
                        <div className="flex gap-2 mt-2">
                            <input
                                type="text"
                                placeholder="Write a reply..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmitReply();
                                    }
                                    if (e.key === "Escape") {
                                        setReplyText("");
                                    }
                                }}
                                className={cn(
                                    "flex-1 px-3 py-1.5 rounded-lg text-sm",
                                    "bg-primary-50/80 dark:bg-primary-950/40",
                                    "border border-(--border)",
                                    "focus:border-primary-400 dark:focus:border-primary-500",
                                    "placeholder:text-(--text-muted)",
                                    "outline-none transition-all duration-200"
                                )}
                                autoFocus
                            />
                            <Button onClick={handleSubmitReply} disabled={!replyText.trim() || isSubmittingReply} size="sm">
                                {isSubmittingReply ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                            </Button>
                        </div>
                    )}

                    {/* Replies */}
                    {showReplies && replies.length > 0 && (
                        <div className="mt-3 space-y-2 pl-4 border-l-2 border-primary-200 dark:border-primary-800">
                            {replies.map((reply) => (
                                <div key={reply._id} className="flex gap-2">
                                    <Avatar src={reply.userId.avatar} alt={reply.userId.firstName} size="xs" />
                                    <div className="flex-1 min-w-0">
                                        <div className="bg-primary-50/30 dark:bg-primary-900/10 rounded-lg p-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-xs">
                                                    {reply.userId.firstName} {reply.userId.lastName}
                                                </span>
                                                <span className="text-xs text-(--text-muted)">
                                                    {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-(--text)">{reply.content}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
