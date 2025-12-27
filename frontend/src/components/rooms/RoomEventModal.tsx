"use client";

import React, { useEffect, useState } from "react";
import { X, Video, Radio, Users } from "lucide-react";
import { Modal, Button } from "@/components/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import { useStreamClientContext } from "@/contexts/StreamClientContext";
import { StreamCall, CallControls, SpeakerLayout, LivestreamLayout } from "@stream-io/video-react-sdk";
import { cn } from "@/lib/utils";

interface RoomEventModalProps {
  event: {
    id: string;
    type: "livestream" | "video_call" | "space";
    status: string;
    streamCallId: string;
    startedBy?: {
      _id: string;
      username: string;
      firstName?: string;
      lastName?: string;
      avatar?: string;
    };
    createdAt: string;
  };
  roomId: string;
  isOpen: boolean;
  onClose: () => void;
  onEndEvent: (eventId: string) => void;
}

export function RoomEventModal({ event, roomId, isOpen, onClose, onEndEvent }: RoomEventModalProps) {
  const { t } = useLanguage();
  const streamContext = useStreamClientContext();
  const client = streamContext?.client || null;
  const [call, setCall] = useState<any>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    if (!client || !isOpen) return;

    const initializeCall = async () => {
      try {
        let callType: string;
        if (event.type === "livestream") {
          callType = "livestream";
        } else if (event.type === "video_call") {
          callType = "default";
        } else {
          callType = "audio_room";
        }

        const newCall = client.call(callType, event.streamCallId);
        await newCall.join();
        setCall(newCall);
        setHasJoined(true);
        setIsJoining(false);
      } catch (err) {
        console.error("Failed to join call:", err);
        setIsJoining(false);
      }
    };

    if (isOpen && !call && client) {
      setIsJoining(true);
      initializeCall();
    }

    return () => {
      if (call) {
        call.leave().catch(console.error);
        setCall(null);
        setHasJoined(false);
      }
    };
  }, [client, isOpen, event.streamCallId, event.type]);

  const handleLeave = async () => {
    if (call) {
      await call.leave();
      setCall(null);
      setHasJoined(false);
    }
    onClose();
  };

  const handleEnd = async () => {
    if (call) {
      await call.leave();
      setCall(null);
      setHasJoined(false);
    }
    onEndEvent(event.id);
    onClose();
  };

  if (!isOpen) return null;

  const getEventTitle = () => {
    switch (event.type) {
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
    <Modal isOpen={isOpen} onClose={handleLeave} title={getEventTitle()} size="full">
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {isJoining ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-(--text-muted)">{t("common", "loading")}...</p>
            </div>
          </div>
        ) : hasJoined && call && client ? (
          <div className="flex-1 relative bg-black">
            <StreamCall call={call}>
              {event.type === "livestream" && <LivestreamLayout />}
              {event.type === "video_call" && <SpeakerLayout />}
              {event.type === "space" && <SpeakerLayout />}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                <CallControls onLeave={handleLeave} />
              </div>
            </StreamCall>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-(--text-muted) mb-4">{t("common", "errorLoading")}</p>
              <Button onClick={handleLeave}>{t("common", "close")}</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

