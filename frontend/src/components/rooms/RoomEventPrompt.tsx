"use client";

import React, { useState, useEffect } from "react";
import { X, Video, Radio, Users } from "lucide-react";
import { Button } from "@/components/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import { roomsApi } from "@/lib/api/rooms";
import { cn } from "@/lib/utils";
import { RoomEventModal } from "./RoomEventModal";

interface RoomEventPromptProps {
  roomId: string;
  isPaidRoom: boolean;
  isMember: boolean;
}

interface RoomEvent {
  id: string;
  type: "livestream" | "video_call" | "space";
  status: string;
  streamCallId: string;
  startedBy: {
    _id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  createdAt: string;
}

export function RoomEventPrompt({ roomId, isPaidRoom, isMember }: RoomEventPromptProps) {
  const { t } = useLanguage();
  const [activeEvents, setActiveEvents] = useState<RoomEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<RoomEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [dismissedEvents, setDismissedEvents] = useState<Set<string>>(new Set());

  const loadEvents = async () => {
    if (!isPaidRoom || !isMember) return;
    try {
      const response = await roomsApi.getEvents(roomId);
      setActiveEvents(
        response.events
          .filter((e) => e.status === "active")
          .map((e) => ({
            id: e.id,
            type: e.type as "livestream" | "video_call" | "space",
            status: e.status,
            streamCallId: e.streamCallId,
            startedBy: e.startedBy,
            createdAt: e.createdAt,
          }))
      );
    } catch (err) {
      console.error("Failed to load events:", err);
    }
  };

  useEffect(() => {
    loadEvents();
    const interval = setInterval(loadEvents, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [roomId, isPaidRoom, isMember]);

  const handleJoinEvent = (event: RoomEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleDismiss = (eventId: string) => {
    setDismissedEvents((prev) => new Set([...prev, eventId]));
  };

  const handleEndEvent = async (eventId: string) => {
    try {
      await roomsApi.endEvent(roomId, eventId);
      setActiveEvents((prev) => prev.filter((e) => e.id !== eventId));
      if (selectedEvent?.id === eventId) {
        setShowEventModal(false);
        setSelectedEvent(null);
      }
    } catch (err) {
      console.error("Failed to end event:", err);
    }
  };

  if (!isPaidRoom || !isMember || activeEvents.length === 0) return null;

  const visibleEvents = activeEvents.filter((e) => !dismissedEvents.has(e.id));
  if (visibleEvents.length === 0) return null;

  const getEventIcon = (type: string) => {
    switch (type) {
      case "livestream":
        return <Video size={20} className="text-red-500" />;
      case "video_call":
        return <Video size={20} className="text-blue-500" />;
      case "space":
        return <Radio size={20} className="text-purple-500" />;
      default:
        return <Users size={20} />;
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case "livestream":
        return t("rooms", "activeLivestream");
      case "video_call":
        return t("rooms", "activeVideoCall");
      case "space":
        return t("rooms", "activeSpace");
      default:
        return "";
    }
  };

  const getEventMessage = (type: string) => {
    switch (type) {
      case "livestream":
        return t("rooms", "livestreamStarted");
      case "video_call":
        return t("rooms", "videoCallStarted");
      case "space":
        return t("rooms", "spaceStarted");
      default:
        return "";
    }
  };

  return (
    <>
      <div className="space-y-2 px-4 pt-4">
        {visibleEvents.map((event) => (
          <div
            key={event.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800"
          >
            {getEventIcon(event.type)}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-(--text)">{getEventLabel(event.type)}</p>
              <p className="text-xs text-(--text-muted)">{getEventMessage(event.type)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="primary" onClick={() => handleJoinEvent(event)}>
                {t("rooms", `join${event.type === "livestream" ? "Livestream" : event.type === "video_call" ? "VideoCall" : "Space"}`)}
              </Button>
              <button
                onClick={() => handleDismiss(event.id)}
                className="p-1 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded transition-colors"
              >
                <X size={16} className="text-(--text-muted)" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showEventModal && selectedEvent && (
        <RoomEventModal
          event={selectedEvent}
          roomId={roomId}
          isOpen={showEventModal}
          onClose={() => {
            setShowEventModal(false);
            setSelectedEvent(null);
          }}
          onEndEvent={handleEndEvent}
        />
      )}
    </>
  );
}

