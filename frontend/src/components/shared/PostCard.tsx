"use client";

import { useState } from "react";
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
} from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { postsApi, type Post } from "@/lib/api/posts";
import { commentsApi, type Comment } from "@/lib/api/comments";
import toast from "react-hot-toast";

interface PostCardProps {
    post: Post;
    showAnnouncement?: boolean;
}

export function PostCard({ post: initialPost, showAnnouncement = false }: PostCardProps) {
    const [post, setPost] = useState(initialPost);
    const [isVoting, setIsVoting] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [commentPage, setCommentPage] = useState(1);
    const [hasMoreComments, setHasMoreComments] = useState(false);

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
                        <Avatar src={post.userId.avatar} alt={post.userId.firstName} size="md" />
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="font-semibold">
                                    {post.userId.firstName} {post.userId.lastName}
                                </span>
                                {post.userId.verified && (
                                    <svg className="w-4 h-4 text-primary-500" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                    </svg>
                                )}
                                {isAnnouncement && (
                                    <Badge variant="primary" size="sm" className="ml-1">
                                        <Megaphone size={10} className="mr-1" />
                                        Announcement
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-(--text-muted)">
                                <span>@{post.userId.username}</span>
                                <span>•</span>
                                <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                            </div>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-(--text-muted)">
                        <MoreHorizontal size={18} />
                    </Button>
                </div>

                {/* Content */}
                {post.contentText && <p className="text-(--text) mb-3 whitespace-pre-wrap">{post.contentText}</p>}

                {/* Images */}
                {images.length > 0 && (
                    <div
                        className={cn(
                            "rounded-xl overflow-hidden mb-3",
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
                                className={cn("w-full object-cover", images.length === 1 ? "max-h-96" : "h-48")}
                            />
                        ))}
                    </div>
                )}

                {/* Actions */}
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
        </Card>
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
                                <svg className="w-3 h-3 text-primary-500" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                </svg>
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
