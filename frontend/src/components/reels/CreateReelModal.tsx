"use client";

import { useState, useRef, useCallback } from "react";
import { X, Upload, Video, MapPin, Smile, Globe, Users, Lock, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import { reelsApi } from "@/lib/api/reels";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";

interface CreateReelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateReelModal({ isOpen, onClose, onSuccess }: CreateReelModalProps) {
  const { t } = useLanguage();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [feeling, setFeeling] = useState("");
  const [privacy, setPrivacy] = useState<"public" | "followers" | "private">("public");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateVideo = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      // Check file size (100MB max)
      if (file.size > 100 * 1024 * 1024) {
        toast.error(t("reels", "videoTooLarge"));
        resolve(false);
        return;
      }

      // Check file type
      if (!file.type.match(/video\/(mp4|quicktime|webm)/)) {
        toast.error(t("reels", "invalidVideoFormat"));
        resolve(false);
        return;
      }

      // Check duration
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > 60) {
          toast.error(t("reels", "videoTooLong"));
          resolve(false);
        } else {
          setVideoDuration(Math.floor(video.duration));
          resolve(true);
        }
      };
      video.onerror = () => {
        toast.error(t("reels", "invalidVideoFormat"));
        resolve(false);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const isValid = await validateVideo(file);

    if (isValid) {
      setVideoFile(file);
      const preview = URL.createObjectURL(file);
      setVideoPreview(preview);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    await handleFiles(e.dataTransfer.files);
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    await handleFiles(e.target.files);
  };

  const handleSubmit = async () => {
    if (!videoFile) {
      toast.error(t("reels", "selectVideo"));
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Upload video file
      const formData = new FormData();
      formData.append("file", videoFile);

      const uploadResponse = await apiClient.post<{ url: string }>(
        "/upload/media",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const progress = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
            setUploadProgress(progress);
          },
        }
      );

      // Create reel
      await reelsApi.createReel({
        videoUrl: uploadResponse.url,
        caption: caption.trim() || undefined,
        duration: videoDuration,
        privacy,
        location: location.trim() || undefined,
        feeling: feeling.trim() || undefined,
      });

      toast.success(t("reels", "reelPostedSuccess"));
      handleClose();
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to post reel";
      toast.error(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoFile(null);
    setVideoPreview(null);
    setVideoDuration(0);
    setCaption("");
    setLocation("");
    setFeeling("");
    setPrivacy("public");
    setUploadProgress(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-(--bg-card) rounded-2xl border border-(--border) w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-(--border)">
          <h2 className="text-xl font-bold">{t("reels", "createReel")}</h2>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="w-8 h-8 rounded-full hover:bg-(--bg-hover) flex items-center justify-center transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Video Upload/Preview */}
          {!videoPreview ? (
            <div
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
                dragActive
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                  : "border-(--border) hover:border-primary-300"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                onChange={handleChange}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                  <Video className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="text-lg font-medium mb-1">
                    {t("reels", "dragDropVideo")}
                  </p>
                  <p className="text-sm text-(--text-muted)">
                    {t("reels", "orClickToSelect")}
                  </p>
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload size={18} />
                  {t("reels", "selectVideo")}
                </Button>
                <p className="text-xs text-(--text-muted)">
                  {t("reels", "videoRequirements")}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative aspect-9/16 max-h-96 mx-auto bg-black rounded-xl overflow-hidden">
                <video
                  ref={videoRef}
                  src={videoPreview}
                  controls
                  className="w-full h-full object-contain"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  if (videoPreview) URL.revokeObjectURL(videoPreview);
                  setVideoFile(null);
                  setVideoPreview(null);
                  setVideoDuration(0);
                }}
                disabled={uploading}
                className="w-full gap-2"
              >
                <Upload size={18} />
                {t("reels", "changeVideo")}
              </Button>
            </div>
          )}

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("reels", "caption")}
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={t("reels", "addCaption")}
              disabled={uploading}
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 rounded-lg border border-(--border) bg-(--bg) focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
            <p className="text-xs text-(--text-muted) mt-1 text-right">
              {caption.length}/500
            </p>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <MapPin size={16} className="inline mr-1" />
              {t("reels", "location")}
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t("reels", "addLocation")}
              disabled={uploading}
              className="w-full px-3 py-2 rounded-lg border border-(--border) bg-(--bg) focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Feeling */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <Smile size={16} className="inline mr-1" />
              {t("reels", "feeling")}
            </label>
            <input
              type="text"
              value={feeling}
              onChange={(e) => setFeeling(e.target.value)}
              placeholder={t("reels", "addFeeling")}
              disabled={uploading}
              className="w-full px-3 py-2 rounded-lg border border-(--border) bg-(--bg) focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Privacy */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("reels", "privacy")}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setPrivacy("public")}
                disabled={uploading}
                className={cn(
                  "p-3 rounded-lg border transition-all",
                  privacy === "public"
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                    : "border-(--border) hover:border-primary-300"
                )}
              >
                <Globe size={20} className="mx-auto mb-1" />
                <p className="text-sm font-medium">{t("reels", "public")}</p>
              </button>
              <button
                onClick={() => setPrivacy("followers")}
                disabled={uploading}
                className={cn(
                  "p-3 rounded-lg border transition-all",
                  privacy === "followers"
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                    : "border-(--border) hover:border-primary-300"
                )}
              >
                <Users size={20} className="mx-auto mb-1" />
                <p className="text-sm font-medium">{t("reels", "followers")}</p>
              </button>
              <button
                onClick={() => setPrivacy("private")}
                disabled={uploading}
                className={cn(
                  "p-3 rounded-lg border transition-all",
                  privacy === "private"
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                    : "border-(--border) hover:border-primary-300"
                )}
              >
                <Lock size={20} className="mx-auto mb-1" />
                <p className="text-sm font-medium">{t("reels", "private")}</p>
              </button>
            </div>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-(--text-muted)">
                  {uploadProgress < 100
                    ? t("reels", "uploadingVideo")
                    : t("reels", "processingVideo")}
                </span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-(--bg-hover) rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-(--border)">
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            {t("common", "cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!videoFile || uploading}
            className="gap-2"
          >
            {uploading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {t("reels", "posting")}
              </>
            ) : (
              t("reels", "postReel")
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
