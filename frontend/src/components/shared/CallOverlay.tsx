"use client";

import { useState, useEffect } from "react";
import {
    StreamCall,
    StreamTheme,
    CallControls,
    SpeakerLayout,
    CallParticipantsList,
    RingingCall,
    useCalls,
    CallingState,
    useCallStateHooks,
} from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import { useStreamClientContext } from "@/contexts/StreamClientContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { X } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

const ActiveCallUI = ({ callType, call }: { callType: "default" | "audio_room"; call: any }) => {
    const { useParticipants, useCallCallingState } = useCallStateHooks();
    const participants = useParticipants();
    const callingState = useCallCallingState();
    const { t } = useLanguage();
    const [showParticipants, setShowParticipants] = useState(false);

    const isAudioOnly = callType === "audio_room";
    const participantCount = participants.length;

    return (
        <div className="fixed inset-0 z-50 bg-black">
            {/* Main video/audio layout */}
            <SpeakerLayout />

            {/* Top bar with call info and participants toggle */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "w-3 h-3 rounded-full",
                                callingState === CallingState.JOINED ? "bg-green-500" : "bg-yellow-500"
                            )} />
                            <span className="text-white text-sm font-medium">
                                {callingState === CallingState.JOINED
                                    ? t("messages", "callConnected")
                                    : t("messages", "callConnecting")}
                            </span>
                        </div>
                        {participantCount > 0 && (
                            <span className="text-white/70 text-sm">
                                {participantCount} {t("messages", "participants")}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {participantCount > 1 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowParticipants(!showParticipants)}
                                className="text-white hover:bg-white/20"
                            >
                                {t("messages", "participants")} ({participantCount})
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Participants list sidebar */}
            {showParticipants && participantCount > 1 && (
                <>
                    <div
                        className="absolute inset-0 bg-black/50 z-20"
                        onClick={() => setShowParticipants(false)}
                    />
                    <div className="absolute top-0 right-0 h-full w-80 bg-black/95 z-30 border-l border-white/10">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                            <h3 className="text-white font-semibold">{t("messages", "participants")}</h3>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowParticipants(false)}
                                className="text-white hover:bg-white/20"
                            >
                                <X size={20} />
                            </Button>
                        </div>
                        <div className="p-4">
                            <CallParticipantsList onClose={() => setShowParticipants(false)} />
                        </div>
                    </div>
                </>
            )}

            {/* Bottom controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-10">
                <div className="max-w-4xl mx-auto">
                    <CallControls />
                </div>
            </div>
        </div>
    );
};

const CallOverlayContent = () => {
    const { t } = useLanguage();
    const calls = useCalls();
    const [callType, setCallType] = useState<"default" | "audio_room">("default");

    const activeCall = calls.find((call) => {
        const state = call.state.callingState;
        return (
            state === CallingState.RINGING ||
            state === CallingState.JOINED ||
            state === CallingState.JOINING ||
            state === CallingState.RECONNECTING
        );
    });

    useEffect(() => {
        if (activeCall) {
            // Determine call type from call ID or call settings
            const callId = activeCall.id;
            const isAudioRoom = activeCall.type === "audio_room" || callId.includes("audio");
            setCallType(isAudioRoom ? "audio_room" : "default");
        }
    }, [activeCall]);

    if (!activeCall) return null;

    return (
        <StreamCall call={activeCall}>
            <StreamTheme>
                {activeCall.state.callingState === CallingState.RINGING ? (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
                        <div className="text-center">
                            <RingingCall />
                        </div>
                    </div>
                ) : (
                    <ActiveCallUI callType={callType} call={activeCall} />
                )}
            </StreamTheme>
        </StreamCall>
    );
};

export const CallOverlay = () => {
    const { client } = useStreamClientContext() || {};

    if (!client) return null;

    return <CallOverlayContent />;
};
