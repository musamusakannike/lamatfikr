"use client";

import { useState, useRef, useCallback } from "react";
import {
  X,
  Upload,
  Video,
  Loader2,
  Smile,
  Globe,
  Lock,
  Users
} from "lucide-react";
import { Modal, Button, Avatar } from "@/components/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useDropzone } from "react-dropzone";
import { uploadApi } from "@/lib/api/upload";
import { reelsApi } from "@/lib/api/reels";
import { cn } from "@/lib/utils";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import toast from "react-hot-toast";

interface CreateReelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReelCreated: () => void;
}

export function CreateReelModal({ isOpen, onClose, onReelCreated }: CreateReelModalProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [caption, setCaption] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [privacy, setPrivacy] = useState<"public" | "followers" | "me_only">("public");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        toast.error("Video file is too large (max 100MB)");
        return;
      }
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "video/*": [".mp4", ".mov", ".webm"],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleVideoLoaded = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleRemoveVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoFile(null);
    setVideoPreview(null);
    setDuration(0);
  };

  const insertEmoji = (emojiData: EmojiClickData) => {
    const emoji = emojiData.emoji;
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newCaption = caption.substring(0, start) + emoji + caption.substring(end);
      setCaption(newCaption);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    } else {
      setCaption((prev) => prev + emoji);
    }
    setShowEmojiPicker(false);
  };

  const handleSubmit = async () => {
    if (!videoFile) return;

    try {
      setIsSubmitting(true);

      // 1. Upload video
      // Note: Using a custom upload function or the existing one. 
      // Assuming uploadApi.uploadMedia supports tracking or just promise based.
      // For now, we'll use the basic uploadMedia.
      const uploadResult = await uploadApi.uploadMedia(videoFile, "reels");

      // 2. Create Reel
      await reelsApi.createReel({
        videoUrl: uploadResult.url,
        caption,
        duration,
        privacy,
      });

      toast.success(t("reels", "reelCreated"));
      handleClose();
      onReelCreated();
    } catch (error) {
      console.error("Failed to create reel:", error);
      toast.error(t("common", "somethingWentWrong"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCaption("");
    handleRemoveVideo();
    setPrivacy("public");
    setIsSubmitting(false);
    setShowEmojiPicker(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t("reels", "createReel")} size="lg">
      <div className="p-6">
        {/* Helper for video inputs */}
        {!videoFile ? (
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors h-64",
              isDragActive
                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                : "border-(--border) hover:border-primary-400 dark:hover:border-primary-600"
            )}
          >
            <input {...getInputProps()} />
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center mb-4 text-primary-600 dark:text-primary-400">
              <Video size={32} />
            </div>
            <p className="font-medium text-lg mb-1">{t("reels", "dragDropVideo")}</p>
            <p className="text-sm text-(--text-muted)">{t("reels", "videoSupportInfo")}</p>
            <Button variant="outline" className="mt-4 pointer-events-none">
              {t("reels", "selectFile")}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Video Preview */}
              <div className="relative w-full md:w-1/3 aspect-9/16 bg-black rounded-lg overflow-hidden shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <video
                  ref={videoRef}
                  src={videoPreview!}
                  className="w-full h-full object-cover"
                  controls
                  onLoadedMetadata={handleVideoLoaded}
                />
                <button
                  onClick={handleRemoveVideo}
                  className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Fields */}
              <div className="flex-1 space-y-4">
                {/* User Info */}
                <div className="flex items-center gap-3">
                  <Avatar
                    src={user?.avatar || "/images/default-avatar.svg"}
                    alt={user?.firstName || "User"}
                    size="sm"
                  />
                  <div>
                    <p className="font-medium text-sm">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <select
                      value={privacy}
                      onChange={(e) => setPrivacy(e.target.value as any)}
                      className="text-xs bg-transparent text-(--text-muted) border-none p-0 focus:ring-0 cursor-pointer hover:text-primary-500"
                    >
                      <option value="public">{t("common", "public")}</option>
                      <option value="followers">{t("common", "followers")}</option>
                      <option value="me_only">{t("common", "onlyMe")}</option>
                    </select>
                  </div>
                </div>

                {/* Caption */}
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder={t("reels", "writeCaption")}
                    className="w-full min-h-[100px] p-3 rounded-lg border border-(--border) bg-(--bg) focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    maxLength={2200}
                  />
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="absolute bottom-3 right-3 text-(--text-muted) hover:text-primary-500 transition-colors"
                  >
                    <Smile size={20} />
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute top-full right-0 mt-2 z-10 shadow-xl">
                      <EmojiPicker onEmojiClick={insertEmoji} width={300} height={400} />
                    </div>
                  )}
                </div>

                {/* Privacy Setting (Visual) */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setPrivacy("public")}
                    className={cn(
                      "flex-1 flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all",
                      privacy === "public" ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600" : "border-(--border) hover:bg-(--bg-muted) text-(--text-muted)"
                    )}
                  >
                    <Globe size={20} className="mb-1" />
                    <span className="text-xs font-medium">{t("common", "public")}</span>
                  </button>
                  <button
                    onClick={() => setPrivacy("followers")}
                    className={cn(
                      "flex-1 flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all",
                      privacy === "followers" ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600" : "border-(--border) hover:bg-(--bg-muted) text-(--text-muted)"
                    )}
                  >
                    <Users size={20} className="mb-1" />
                    <span className="text-xs font-medium">{t("common", "followers")}</span>
                  </button>
                  <button
                    onClick={() => setPrivacy("me_only")}
                    className={cn(
                      "flex-1 flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all",
                      privacy === "me_only" ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600" : "border-(--border) hover:bg-(--bg-muted) text-(--text-muted)"
                    )}
                  >
                    <Lock size={20} className="mb-1" />
                    <span className="text-xs font-medium">{t("common", "onlyMe")}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-4 border-t border-(--border)">
              <Button variant="ghost" onClick={handleClose} disabled={isSubmitting} className="mr-2">
                {t("common", "cancel")}
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" />
                    {t("common", "posting")}
                  </>
                ) : (
                  <>
                    <Upload size={18} className="mr-2" />
                    {t("common", "post")}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
