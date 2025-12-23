import React, { useEffect, useState, useRef } from "react";
import { Modal } from "@/components/ui";
import { X, Eye } from "lucide-react";
import Image from "next/image";
import type { MessageAttachment, MessageLocation } from "@/lib/api/messages";

interface ViewOnceModalProps {
  isOpen: boolean;
  onClose: () => void;
  content?: string;
  media?: string[];
  attachments?: MessageAttachment[];
  location?: MessageLocation;
}

export function ViewOnceModal({
  isOpen,
  onClose,
  content,
  media,
  attachments,
  location,
}: ViewOnceModalProps) {
  const TIMER_DURATION = 30;
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Reset timer when modal opens
    let currentTime = TIMER_DURATION;
    setTimeLeft(currentTime);

    timerRef.current = setInterval(() => {
      currentTime -= 1;
      setTimeLeft(currentTime);
      
      if (currentTime <= 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        onClose();
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isOpen, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="lg">
      <div className="relative">
        {/* Header with timer */}
        <div className="flex items-center justify-between p-4 border-b border-(--border)">
          <div className="flex items-center gap-2">
            <Eye size={20} className="text-primary-600" />
            <span className="font-semibold text-(--text)">View Once Message</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30">
              <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                {timeLeft}s
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-(--bg) flex items-center justify-center transition-colors"
            >
              <X size={20} className="text-(--text-muted)" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Media */}
          {media && media.length > 0 && (
            <div className="mb-4 space-y-2">
              {media.map((url, index) => (
                <div key={index} className="relative rounded-lg overflow-hidden">
                  <Image
                    src={url}
                    alt={`Media ${index + 1}`}
                    width={600}
                    height={400}
                    className="w-full h-auto object-contain max-h-96"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Attachments */}
          {attachments && attachments.length > 0 && (
            <div className="mb-4 space-y-2">
              {attachments.map((attachment, index) => (
                <div key={index} className="rounded-lg overflow-hidden">
                  {attachment.type === "video" && (
                    <video
                      src={attachment.url}
                      controls
                      className="w-full max-h-96"
                    />
                  )}
                  {attachment.type === "audio" && (
                    <audio src={attachment.url} controls className="w-full" />
                  )}
                  {attachment.type === "image" && (
                    <Image
                      src={attachment.url}
                      alt={attachment.name || "Attachment"}
                      width={600}
                      height={400}
                      className="w-full h-auto object-contain max-h-96"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Text Content */}
          {content && (
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-(--text) whitespace-pre-wrap wrap-break-word">
                {content}
              </p>
            </div>
          )}

          {/* Location */}
          {location && (
            <div className="mt-4 p-4 rounded-lg bg-(--bg) border border-(--border)">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-(--text)">
                  Location Shared
                </span>
              </div>
              <p className="text-sm text-(--text-muted)">
                {location.label || `${location.lat}, ${location.lng}`}
              </p>
            </div>
          )}

          {/* Warning */}
          <div className="mt-6 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ This message will disappear when you close this window or after {timeLeft} seconds.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
