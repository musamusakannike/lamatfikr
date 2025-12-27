"use client";

import React, { useState, useEffect } from "react";
import { Video, Radio, Users, X } from "lucide-react";
import { Button } from "@/components/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import { roomsApi } from "@/lib/api/rooms";
import { getErrorMessage } from "@/lib/api";
import toast from "react-hot-toast";
import { RoomEventModal } from "./RoomEventModal";

interface RoomEventControlsProps {
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

export function RoomEventControls({ roomId, isPaidRoom, isMember }: RoomEventControlsProps) {
  const { t } = useLanguage();
  const [activeEvents, setActiveEvents] = useState<RoomEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<RoomEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);

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
    const interval = setInterval(loadEvents, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [roomId, isPaidRoom, isMember]);

  // Listen for socket events
  useEffect(() => {
    // This will be handled by the parent component's socket listeners
    // which will trigger a reload of events
  }, []);

  const handleStartEvent = async (type: "livestream" | "video_call" | "space") => {
    if (!isPaidRoom || !isMember) {
      toast.error(t("rooms", "eventOnlyPaidRooms"));
      return;
    }

    setIsLoading(true);
    try {
      const response = await roomsApi.startEvent(roomId, type);
      setActiveEvents((prev) => [
        ...prev,
        {
          id: response.event.id,
          type: response.event.type as "livestream" | "video_call" | "space",
          status: response.event.status,
          streamCallId: response.event.streamCallId,
          startedBy: { _id: response.event.startedBy, username: "" },
          createdAt: response.event.createdAt,
        },
      ]);
      toast.success(response.message);
      // Open the event modal
      setSelectedEvent({
        id: response.event.id,
        type: response.event.type as "livestream" | "video_call" | "space",
        status: response.event.status,
        streamCallId: response.event.streamCallId,
        startedBy: { _id: response.event.startedBy, username: "" },
        createdAt: response.event.createdAt,
      });
      setShowEventModal(true);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinEvent = (event: RoomEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleEndEvent = async (eventId: string) => {
    try {
      await roomsApi.endEvent(roomId, eventId);
      setActiveEvents((prev) => prev.filter((e) => e.id !== eventId));
      toast.success(t("rooms", "eventEnded"));
      if (selectedEvent?.id === eventId) {
        setShowEventModal(false);
        setSelectedEvent(null);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (!isPaidRoom || !isMember) return null;

  const getEventIcon = (type: string) => {
    switch (type) {
      case "livestream":
        return <Video size={18} />;
      case "video_call":
        return <Video size={18} />;
      case "space":
        return <Radio size={18} />;
      default:
        return <Users size={18} />;
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case "livestream":
        return t("rooms", "livestream");
      case "video_call":
        return t("rooms", "videoCall");
      case "space":
        return t("rooms", "space");
      default:
        return "";
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 px-2">
        {/* Active Events Display */}
        {activeEvents.length > 0 && (
          <div className="flex items-center gap-2">
            {activeEvents.map((event) => (
              <button
                key={event.id}
                onClick={() => handleJoinEvent(event)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors text-sm font-medium"
              >
                {getEventIcon(event.type)}
                <span>{getEventLabel(event.type)}</span>
              </button>
            ))}
          </div>
        )}

        {/* Start Event Buttons */}
        <div className="flex items-center gap-1 border-l border-(--border) pl-2 ml-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleStartEvent("livestream")}
            disabled={isLoading || activeEvents.some((e) => e.type === "livestream")}
            className="gap-1.5 text-sm"
            title={t("rooms", "startLivestream")}
          >
            <Video size={16} />
            <span className="hidden sm:inline">{t("rooms", "startLivestream")}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleStartEvent("video_call")}
            disabled={isLoading || activeEvents.some((e) => e.type === "video_call")}
            className="gap-1.5 text-sm"
            title={t("rooms", "startVideoCall")}
          >
            <Video size={16} />
            <span className="hidden sm:inline">{t("rooms", "startVideoCall")}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleStartEvent("space")}
            disabled={isLoading || activeEvents.some((e) => e.type === "space")}
            className="gap-1.5 text-sm"
            title={t("rooms", "startSpace")}
          >
            <Radio size={16} />
            <span className="hidden sm:inline">{t("rooms", "startSpace")}</span>
          </Button>
        </div>
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

