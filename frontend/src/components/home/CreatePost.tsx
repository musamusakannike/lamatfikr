"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Avatar, Button, Card, CardContent } from "@/components/ui";
import {
  Image as ImageIcon,
  Video,
  Mic,
  BarChart3,
  X,
  Plus,
  ChevronDown,
  Globe,
  Users,
  UserCheck,
  Lock,
  Smile,
  Play,
  Pause,
  Trash2,
  Send,
} from "lucide-react";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { useAuth } from "@/contexts/AuthContext";
import { uploadApi } from "@/lib/api/upload";
import { postsApi } from "@/lib/api/posts";
import type { CreatePostData } from "@/lib/api/posts";
import { useLanguage } from "@/contexts/LanguageContext"; // Added import statement

const DEFAULT_AVATAR = "/images/default-avatar.svg";

// Cross-browser compatible UUID generator
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Visibility options
// type VisibilityOption = "only_me" | "followers" | "following";

interface VisibilityState {
  only_me: boolean;
  followers: boolean;
  following: boolean;
}

// Poll option interface
interface PollOption {
  id: string;
  text: string;
}

// Attachment types
interface MediaAttachment {
  id: string;
  file: File;
  preview: string;
  type: "image" | "video";
}

interface AudioAttachment {
  id: string;
  blob: Blob;
  url: string;
  duration: number;
}

// Visibility option component
function VisibilityCheckbox({
  label,
  icon: Icon,
  checked,
  onChange,
  description,
}: {
  label: string;
  icon: React.ElementType;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description: string;
}) {
  return (
    <label
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
        checked
          ? "bg-primary-100 dark:bg-primary-900/50 border-2 border-primary-500"
          : "bg-(--bg) border-2 border-(--border) hover:border-primary-300"
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <div
        className={cn(
          "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
          checked
            ? "bg-primary-600 border-primary-600"
            : "border-(--border) bg-(--bg-card)"
        )}
      >
        {checked && (
          <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
            <path
              d="M10 3L4.5 8.5L2 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <Icon
        size={20}
        className={cn(
          checked ? "text-primary-600 dark:text-primary-400" : "text-(--text-muted)"
        )}
      />
      <div className="flex-1">
        <span
          className={cn(
            "font-medium text-sm",
            checked ? "text-primary-700 dark:text-primary-300" : "text-(--text)"
          )}
        >
          {label}
        </span>
        <p className="text-xs text-(--text-muted)">{description}</p>
      </div>
    </label>
  );
}

// Poll creator component
function PollCreator({
  question,
  onQuestionChange,
  options,
  onOptionsChange,
  onRemove,
}: {
  question: string;
  onQuestionChange: (question: string) => void;
  options: PollOption[];
  onOptionsChange: (options: PollOption[]) => void;
  onRemove: () => void;
}) {
  const addOption = () => {
    if (options.length < 4) {
      onOptionsChange([
        ...options,
        { id: generateId(), text: "" },
      ]);
    }
  };

  const updateOption = (id: string, text: string) => {
    onOptionsChange(
      options.map((opt) => (opt.id === id ? { ...opt, text } : opt))
    );
  };

  const removeOption = (id: string) => {
    if (options.length > 2) {
      onOptionsChange(options.filter((opt) => opt.id !== id));
    }
  };

  return (
    <div className="bg-primary-50 dark:bg-primary-900/30 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-primary-600 dark:text-primary-400" />
          <span className="font-medium text-sm">Create Poll</span>
        </div>
        <button
          onClick={onRemove}
          className="p-1 rounded-full hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
        >
          <X size={16} className="text-(--text-muted)" />
        </button>
      </div>

      {/* Poll Question */}
      <div>
        <input
          type="text"
          value={question}
          onChange={(e) => onQuestionChange(e.target.value)}
          placeholder="Ask a question..."
          className="w-full px-3 py-2 rounded-lg bg-(--bg-card) border border-(--border) text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Poll Options */}
      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={option.id} className="flex items-center gap-2">
            <span className="text-sm text-(--text-muted) w-6">{index + 1}.</span>
            <input
              type="text"
              value={option.text}
              onChange={(e) => updateOption(option.id, e.target.value)}
              placeholder={`Option ${index + 1}`}
              className="flex-1 px-3 py-2 rounded-lg bg-(--bg-card) border border-(--border) text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {options.length > 2 && (
              <button
                onClick={() => removeOption(option.id)}
                className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-(--text-muted) hover:text-red-500 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {options.length < 4 && (
        <button
          onClick={addOption}
          className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
        >
          <Plus size={16} />
          Add option
        </button>
      )}
    </div>
  );
}

// Audio recorder component
function AudioRecorder({
  onRecordingComplete,
  existingRecording,
  onRemoveRecording,
}: {
  onRecordingComplete: (blob: Blob, duration: number) => void;
  existingRecording: AudioAttachment | null;
  onRemoveRecording: () => void;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        onRecordingComplete(audioBlob, recordingTime);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const togglePlayback = () => {
    if (!existingRecording) return;

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (existingRecording) {
    return (
      <div className="bg-primary-50 dark:bg-primary-900/30 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlayback}
              className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition-colors"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <div>
              <p className="text-sm font-medium">Voice Recording</p>
              <p className="text-xs text-(--text-muted)">
                {formatTime(existingRecording.duration)}
              </p>
            </div>
            <audio
              ref={audioRef}
              src={existingRecording.url}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          </div>
          <button
            onClick={onRemoveRecording}
            className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-(--text-muted) hover:text-red-500 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-primary-50 dark:bg-primary-900/30 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mic
            size={20}
            className={cn(
              isRecording ? "text-red-500 animate-pulse" : "text-primary-600 dark:text-primary-400"
            )}
          />
          <span className="font-medium text-sm">
            {isRecording ? `Recording... ${formatTime(recordingTime)}` : "Record Audio"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isRecording ? (
            <Button size="sm" variant="danger" onClick={stopRecording}>
              Stop
            </Button>
          ) : (
            <Button size="sm" variant="primary" onClick={startRecording}>
              Start Recording
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Media preview component
function MediaPreview({
  attachments,
  onRemove,
}: {
  attachments: MediaAttachment[];
  onRemove: (id: string) => void;
}) {
  if (attachments.length === 0) return null;

  return (
    <div
      className={cn(
        "grid gap-2 rounded-xl overflow-hidden",
        attachments.length === 1
          ? "grid-cols-1"
          : attachments.length === 2
            ? "grid-cols-2"
            : attachments.length === 3
              ? "grid-cols-2"
              : "grid-cols-2"
      )}
    >
      {attachments.map((attachment, index) => (
        <div
          key={attachment.id}
          className={cn(
            "relative group",
            attachments.length === 3 && index === 0 && "row-span-2"
          )}
        >
          {attachment.type === "image" ? (
            <Image
              src={attachment.preview}
              alt="Attachment preview"
              width={400}
              height={300}
              className={cn(
                "w-full object-cover rounded-lg",
                attachments.length === 1 ? "max-h-80" : "h-40"
              )}
            />
          ) : (
            <div className="relative">
              <video
                src={attachment.preview}
                className={cn(
                  "w-full object-cover rounded-lg",
                  attachments.length === 1 ? "max-h-80" : "h-40"
                )}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                  <Play size={24} className="text-white ml-1" />
                </div>
              </div>
            </div>
          )}
          <button
            onClick={() => onRemove(attachment.id)}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

interface CreatePostProps {
  onClose?: () => void;
  inModal?: boolean;
}

export function CreatePost({ onClose, inModal = false }: CreatePostProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [visibility, setVisibility] = useState<VisibilityState>({
    only_me: false,
    followers: false,
    following: false,
  });
  const [mediaAttachments, setMediaAttachments] = useState<MediaAttachment[]>([]);
  const [audioAttachment, setAudioAttachment] = useState<AudioAttachment | null>(null);
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<PollOption[]>([
    { id: generateId(), text: "" },
    { id: generateId(), text: "" },
  ]);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newAttachments: MediaAttachment[] = acceptedFiles
      .filter((file) => file.type.startsWith("image/") || file.type.startsWith("video/"))
      .slice(0, 4 - mediaAttachments.length)
      .map((file) => ({
        id: generateId(),
        file,
        preview: URL.createObjectURL(file),
        type: file.type.startsWith("image/") ? "image" : "video",
      }));

    setMediaAttachments((prev) => [...prev, ...newAttachments].slice(0, 4));
  }, [mediaAttachments.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "video/*": [".mp4", ".webm", ".mov"],
    },
    noClick: true,
    noKeyboard: true,
  });

  const handleMediaButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onDrop(files);
    e.target.value = "";
  };

  const removeMediaAttachment = (id: string) => {
    setMediaAttachments((prev) => {
      const attachment = prev.find((a) => a.id === id);
      if (attachment) {
        URL.revokeObjectURL(attachment.preview);
      }
      return prev.filter((a) => a.id !== id);
    });
  };

  const handleAudioRecordingComplete = (blob: Blob, duration: number) => {
    const url = URL.createObjectURL(blob);
    setAudioAttachment({
      id: generateId(),
      blob,
      url,
      duration,
    });
    setShowAudioRecorder(false);
  };

  const removeAudioAttachment = () => {
    if (audioAttachment) {
      URL.revokeObjectURL(audioAttachment.url);
      setAudioAttachment(null);
    }
  };

  const togglePoll = () => {
    setShowPoll(!showPoll);
    if (!showPoll) {
      setPollQuestion("");
      setPollOptions([
        { id: generateId(), text: "" },
        { id: generateId(), text: "" },
      ]);
    }
  };

  const { t } = useLanguage();

  const getVisibilityLabel = () => {
    const selected: string[] = [];
    if (visibility.only_me) selected.push(t("home", "onlyMe"));
    if (visibility.followers) selected.push(t("home", "followers"));
    if (visibility.following) selected.push(t("home", "peopleIFollow"));

    if (selected.length === 0) return t("home", "selectVisibility");
    if (selected.length === 1) return selected[0];
    return `${selected.length} ${t("home", "groupsSelected")}`;
  };

  const getVisibilityIcon = () => {
    if (visibility.only_me && !visibility.followers && !visibility.following) {
      return <Lock size={16} />;
    }
    if (visibility.followers && visibility.following) {
      return <Globe size={16} />;
    }
    if (visibility.followers) {
      return <Users size={16} />;
    }
    if (visibility.following) {
      return <UserCheck size={16} />;
    }
    return <Globe size={16} />;
  };

  const handleSubmit = async () => {
    if (!content.trim() && mediaAttachments.length === 0 && !audioAttachment && !showPoll) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Upload media files
      const uploadedMedia: Array<{
        type: "image" | "video" | "audio" | "voice_note" | "file";
        url: string;
        thumbnail?: string;
        size?: number;
        duration?: number;
      }> = [];

      // Upload images and videos
      for (const attachment of mediaAttachments) {
        try {
          const result = await uploadApi.uploadMedia(attachment.file, "posts");
          uploadedMedia.push({
            type: attachment.type,
            url: result.url,
            size: attachment.file.size,
          });
        } catch (error) {
          console.error("Failed to upload media:", error);
          throw new Error(`Failed to upload ${attachment.type}`);
        }
      }

      // Upload audio if present
      if (audioAttachment) {
        try {
          const audioFile = new File([audioAttachment.blob], "voice-note.webm", {
            type: "audio/webm",
          });
          const result = await uploadApi.uploadMedia(audioFile, "posts");
          uploadedMedia.push({
            type: "voice_note",
            url: result.url,
            duration: audioAttachment.duration,
          });
        } catch (error) {
          console.error("Failed to upload audio:", error);
          throw new Error("Failed to upload voice note");
        }
      }

      // Step 2: Map visibility to privacy
      let privacy: "public" | "followers" | "friends" | "friends_only" | "me_only" = "public";

      if (visibility.only_me) {
        privacy = "me_only";
      } else if (visibility.followers && visibility.following) {
        privacy = "public";
      } else if (visibility.followers) {
        privacy = "followers";
      } else if (visibility.following) {
        privacy = "friends";
      }

      // Step 3: Prepare post data
      const postData: CreatePostData = {
        contentText: content.trim() || undefined,
        privacy,
        media: uploadedMedia.length > 0 ? uploadedMedia : undefined,
        poll: showPoll
          ? {
            question: pollQuestion.trim() || "Poll",
            options: pollOptions.filter((o) => o.text.trim()).map((o) => o.text),
            allowMultipleVotes: false,
          }
          : undefined,
      };

      // Step 4: Create post
      await postsApi.createPost(postData);

      // Step 5: Reset form
      setContent("");
      setMediaAttachments([]);
      setAudioAttachment(null);
      setShowPoll(false);
      setPollQuestion("");
      setPollOptions([
        { id: generateId(), text: "" },
        { id: generateId(), text: "" },
      ]);
      setIsSubmitting(false);

      // Close modal if in modal mode
      if (inModal && onClose) {
        onClose();
      }

      // TODO: Optionally trigger feed refresh or show success notification
      console.log("Post created successfully!");
    } catch (error) {
      console.error("Failed to create post:", error);
      setIsSubmitting(false);
      // TODO: Show error notification to user
      alert(error instanceof Error ? error.message : "Failed to create post. Please try again.");
    }
  };

  const hasContent =
    content.trim() ||
    mediaAttachments.length > 0 ||
    audioAttachment ||
    (showPoll && pollQuestion.trim() && pollOptions.some((o) => o.text.trim()));

  const insertEmojiAtCursor = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent((prev) => prev + emoji);
      return;
    }

    const start = textarea.selectionStart ?? content.length;
    const end = textarea.selectionEnd ?? content.length;
    const nextValue = content.slice(0, start) + emoji + content.slice(end);
    const nextCursorPos = start + emoji.length;

    setContent(nextValue);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextCursorPos, nextCursorPos);
    });
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    insertEmojiAtCursor(emojiData.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <Card className={cn(inModal && "border-0 shadow-none")}>
      <CardContent className={cn("p-4", inModal && "p-0")}>
        <div {...getRootProps()} className="relative">
          {/* Drag overlay */}
          {isDragActive && (
            <div className="absolute inset-0 bg-primary-100/90 dark:bg-primary-900/90 rounded-xl border-2 border-dashed border-primary-500 flex items-center justify-center z-10">
              <div className="text-center">
                <ImageIcon size={40} className="mx-auto text-primary-600 dark:text-primary-400 mb-2" />
                <p className="font-medium text-primary-700 dark:text-primary-300">
                  Drop your media here
                </p>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <Avatar
              src={user?.avatar || DEFAULT_AVATAR}
              alt={user?.firstName || "User"}
              size="md"
            />
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t("home", "whatsOnMind")}
                className="w-full resize-none bg-transparent text-(--text) placeholder:text-(--text-muted) focus:outline-none text-base min-h-[80px]"
                rows={3}
              />
            </div>
          </div>

          {/* Media Preview */}
          {mediaAttachments.length > 0 && (
            <div className="mb-3">
              <MediaPreview
                attachments={mediaAttachments}
                onRemove={removeMediaAttachment}
              />
            </div>
          )}

          {/* Audio Recorder / Recording */}
          {(showAudioRecorder || audioAttachment) && (
            <div className="mb-3">
              <AudioRecorder
                onRecordingComplete={handleAudioRecordingComplete}
                existingRecording={audioAttachment}
                onRemoveRecording={removeAudioAttachment}
              />
            </div>
          )}

          {/* Poll Creator */}
          {showPoll && (
            <div className="mb-3">
              <PollCreator
                question={pollQuestion}
                onQuestionChange={setPollQuestion}
                options={pollOptions}
                onOptionsChange={setPollOptions}
                onRemove={() => setShowPoll(false)}
              />
            </div>
          )}

          {/* Hidden file input */}
          <input
            {...getInputProps()}
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Actions Bar */}
          <div className="flex items-center justify-between pt-3 border-t border-(--border)">
            {/* Attachment buttons */}
            <div className="flex items-center gap-1">
              <div className="relative">
                <button
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    showEmojiPicker
                      ? "text-primary-600 bg-primary-100 dark:bg-primary-900/50"
                      : "text-(--text-muted) hover:bg-primary-100 dark:hover:bg-primary-900/50 hover:text-primary-600"
                  )}
                  title="Add emoji"
                  type="button"
                >
                  <Smile size={20} />
                </button>

                {showEmojiPicker && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowEmojiPicker(false)}
                    />
                    <div className="absolute left-0 bottom-full mb-2 z-20 bg-(--bg-card) rounded-xl border border-(--border) shadow-lg p-2">
                      <EmojiPicker
                        onEmojiClick={handleEmojiClick}
                        height={350}
                        width={320}
                        searchPlaceHolder="Search"
                        lazyLoadEmojis={true}
                      />
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={handleMediaButtonClick}
                disabled={mediaAttachments.length >= 4}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  mediaAttachments.length >= 4
                    ? "text-(--text-muted) opacity-50 cursor-not-allowed"
                    : "text-(--text-muted) hover:bg-primary-100 dark:hover:bg-primary-900/50 hover:text-primary-600"
                )}
                title="Add images"
              >
                <ImageIcon size={20} />
              </button>
              <button
                onClick={handleMediaButtonClick}
                disabled={mediaAttachments.length >= 4}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  mediaAttachments.length >= 4
                    ? "text-(--text-muted) opacity-50 cursor-not-allowed"
                    : "text-(--text-muted) hover:bg-primary-100 dark:hover:bg-primary-900/50 hover:text-primary-600"
                )}
                title="Add video"
              >
                <Video size={20} />
              </button>
              <button
                onClick={() => {
                  if (!audioAttachment) {
                    setShowAudioRecorder(!showAudioRecorder);
                  }
                }}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  audioAttachment || showAudioRecorder
                    ? "text-primary-600 bg-primary-100 dark:bg-primary-900/50"
                    : "text-(--text-muted) hover:bg-primary-100 dark:hover:bg-primary-900/50 hover:text-primary-600"
                )}
                title="Record audio"
              >
                <Mic size={20} />
              </button>
              <button
                onClick={togglePoll}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  showPoll
                    ? "text-primary-600 bg-primary-100 dark:bg-primary-900/50"
                    : "text-(--text-muted) hover:bg-primary-100 dark:hover:bg-primary-900/50 hover:text-primary-600"
                )}
                title="Create poll"
              >
                <BarChart3 size={20} />
              </button>
            </div>

            {/* Visibility & Post button */}
            <div className="flex items-center gap-2">
              {/* Visibility dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowVisibilityDropdown(!showVisibilityDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-(--text-muted) hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
                >
                  {getVisibilityIcon()}
                  <span className="hidden sm:inline">{getVisibilityLabel()}</span>
                  <ChevronDown
                    size={14}
                    className={cn(
                      "transition-transform",
                      showVisibilityDropdown && "rotate-180"
                    )}
                  />
                </button>

                {/* Dropdown */}
                {showVisibilityDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowVisibilityDropdown(false)}
                    />
                    <div className="absolute right-0 bottom-full mb-2 w-72 bg-(--bg-card) rounded-xl border border-(--border) shadow-lg z-20 p-3 space-y-2">
                      <p className="text-sm font-medium mb-2">Who can see this post?</p>
                      <VisibilityCheckbox
                        label="Only me"
                        icon={Lock}
                        checked={visibility.only_me}
                        onChange={(checked) =>
                          setVisibility((prev) => ({ ...prev, only_me: checked }))
                        }
                        description="Only you can see this post"
                      />
                      <VisibilityCheckbox
                        label="Followers"
                        icon={Users}
                        checked={visibility.followers}
                        onChange={(checked) =>
                          setVisibility((prev) => ({ ...prev, followers: checked }))
                        }
                        description="People who follow you"
                      />
                      <VisibilityCheckbox
                        label="People I follow"
                        icon={UserCheck}
                        checked={visibility.following}
                        onChange={(checked) =>
                          setVisibility((prev) => ({ ...prev, following: checked }))
                        }
                        description="People you follow"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Post button */}
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmit}
                disabled={!hasContent || isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                Post
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
