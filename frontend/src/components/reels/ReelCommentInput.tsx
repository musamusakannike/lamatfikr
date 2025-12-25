"use client";

import { useState, useRef } from "react";
import { Send, Smile, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { reelsApi } from "@/lib/api/reels";
import { cn } from "@/lib/utils";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import toast from "react-hot-toast";

interface ReelCommentInputProps {
    reelId: string;
    onCommentPosted: () => void;
}

export function ReelCommentInput({ reelId, onCommentPosted }: ReelCommentInputProps) {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleEmojiClick = (emojiData: EmojiClickData) => {
        const emoji = emojiData.emoji;
        const textarea = textareaRef.current;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newComment = comment.substring(0, start) + emoji + comment.substring(end);
            setComment(newComment);
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
                textarea.focus();
            }, 0);
        } else {
            setComment((prev) => prev + emoji);
        }
        setShowEmojiPicker(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim() || isSubmitting) return;

        try {
            setIsSubmitting(true);
            await reelsApi.createComment(reelId, {
                content: comment.trim(),
            });
            toast.success(t("reels", "commentPosted"));
            setComment("");
            onCommentPosted();
        } catch (error) {
            console.error("Failed to post comment:", error);
            toast.error(t("reels", "commentFailed"));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) return null;

    return (
        <div className="relative">
            <form onSubmit={handleSubmit} className="flex items-end gap-2 p-3 bg-black/50 backdrop-blur-md border-t border-white/10">
                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder={t("reels", "writeComment")}
                        className="w-full px-4 py-2 pr-10 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none max-h-24"
                        rows={1}
                        maxLength={2200}
                        disabled={isSubmitting}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                        disabled={isSubmitting}
                    >
                        <Smile size={20} />
                    </button>
                </div>
                <button
                    type="submit"
                    disabled={!comment.trim() || isSubmitting}
                    className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                        comment.trim() && !isSubmitting
                            ? "bg-primary-600 text-white hover:bg-primary-700"
                            : "bg-white/10 text-white/30 cursor-not-allowed"
                    )}
                >
                    {isSubmitting ? (
                        <Loader2 size={20} className="animate-spin" />
                    ) : (
                        <Send size={20} />
                    )}
                </button>
            </form>

            {showEmojiPicker && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowEmojiPicker(false)}
                    />
                    <div className="absolute bottom-full right-0 mb-2 z-50 shadow-2xl">
                        <EmojiPicker onEmojiClick={handleEmojiClick} width={300} height={400} />
                    </div>
                </>
            )}
        </div>
    );
}
