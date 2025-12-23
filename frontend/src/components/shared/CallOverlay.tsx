"use client";

import { useState, useEffect } from "react";
import {
    useCalls,
    StreamCall,
    useStreamVideoClient,
    CallingState,
    RingingCall,
    StreamTheme,
    useCallStateHooks,
    ParticipantView,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { useStreamClientContext } from "@/contexts/StreamClientContext";
import { Video, VideoOff, Mic, MicOff, PhoneOff, Loader2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const ActiveCallUI = () => {
    const { useCallCallingState, useParticipants, useLocalParticipant, useRemoteParticipants, useCall } = useCallStateHooks();
    const callingState = useCallCallingState();
    const participants = useParticipants();
    const localParticipant = useLocalParticipant();
    const remoteParticipants = useRemoteParticipants();
    const call = useCall();

    const [isMicOn, setIsMicOn] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [callDuration, setCallDuration] = useState(0);

    // Track call duration
    useEffect(() => {
        if (callingState === CallingState.JOINED) {
            const interval = setInterval(() => {
                setCallDuration((prev) => prev + 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [callingState]);

    // Initialize camera/mic state
    useEffect(() => {
        if (call) {
            setIsMicOn(call.microphone.state.status !== "disabled");
            setIsCameraOn(call.camera.state.status !== "disabled");
        }
    }, [call]);

    const toggleMic = async () => {
        if (!call) return;
        try {
            if (isMicOn) {
                await call.microphone.disable();
            } else {
                await call.microphone.enable();
            }
            setIsMicOn(!isMicOn);
        } catch (error) {
            console.error("Failed to toggle microphone:", error);
        }
    };

    const toggleCamera = async () => {
        if (!call) return;
        try {
            if (isCameraOn) {
                await call.camera.disable();
            } else {
                await call.camera.enable();
            }
            setIsCameraOn(!isCameraOn);
        } catch (error) {
            console.error("Failed to toggle camera:", error);
        }
    };

    const leaveCall = async () => {
        if (!call) return;
        try {
            await call.leave();
        } catch (error) {
            console.error("Failed to leave call:", error);
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    if (callingState === CallingState.JOINING) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900">
                <div className="text-center">
                    <Loader2 size={48} className="animate-spin text-white mx-auto mb-4" />
                    <p className="text-white text-lg font-medium">Joining call...</p>
                </div>
            </div>
        );
    }

    const isVideoCall = call?.camera.state.status !== "disabled" || remoteParticipants.some(
        (p) => p.publishedTracks.some(track => track === "video")
    );

    return (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 to-transparent p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-white">
                            <Users size={20} />
                            <span className="font-medium">{participants.length} participant{participants.length !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                    <div className="text-white font-mono text-sm bg-black/30 px-3 py-1 rounded-full">
                        {formatDuration(callDuration)}
                    </div>
                </div>
            </div>

            {/* Participants Grid */}
            <div className="h-full w-full p-4 pt-20 pb-32">
                {remoteParticipants.length === 0 ? (
                    // Only local participant - waiting for others
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                            <div className="mb-8">
                                {localParticipant && (
                                    <div className="w-full max-w-2xl mx-auto aspect-video rounded-2xl overflow-hidden shadow-2xl border-4 border-primary-500/30">
                                        <ParticipantView
                                            participant={localParticipant}
                                            ParticipantViewUI={null}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-center gap-2 text-white/70">
                                <Loader2 size={20} className="animate-spin" />
                                <p className="text-lg">Waiting for others to join...</p>
                            </div>
                        </div>
                    </div>
                ) : remoteParticipants.length === 1 ? (
                    // 1-on-1 call layout
                    <div className="h-full grid grid-cols-1 gap-4">
                        {/* Remote participant - main view */}
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gray-800">
                            <ParticipantView
                                participant={remoteParticipants[0]}
                                ParticipantViewUI={null}
                            />
                            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg">
                                <p className="text-white font-medium">
                                    {remoteParticipants[0].name || remoteParticipants[0].userId}
                                </p>
                            </div>
                        </div>

                        {/* Local participant - picture-in-picture */}
                        {localParticipant && (
                            <div className="absolute top-24 right-4 w-48 aspect-video rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 bg-gray-800">
                                <ParticipantView
                                    participant={localParticipant}
                                    ParticipantViewUI={null}
                                />
                                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs">
                                    <p className="text-white font-medium">You</p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    // Group call - grid layout
                    <div className={cn(
                        "h-full grid gap-4",
                        remoteParticipants.length + 1 <= 2 ? "grid-cols-1 md:grid-cols-2" :
                            remoteParticipants.length + 1 <= 4 ? "grid-cols-2" :
                                "grid-cols-2 md:grid-cols-3"
                    )}>
                        {/* Local participant */}
                        {localParticipant && (
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gray-800 aspect-video">
                                <ParticipantView
                                    participant={localParticipant}
                                    ParticipantViewUI={null}
                                />
                                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg">
                                    <p className="text-white font-medium">You</p>
                                </div>
                            </div>
                        )}

                        {/* Remote participants */}
                        {remoteParticipants.map((participant) => (
                            <div key={participant.sessionId} className="relative rounded-2xl overflow-hidden shadow-2xl bg-gray-800 aspect-video">
                                <ParticipantView
                                    participant={participant}
                                    ParticipantViewUI={null}
                                />
                                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg">
                                    <p className="text-white font-medium">
                                        {participant.name || participant.userId}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <div className="flex items-center justify-center gap-4">
                    {/* Microphone Toggle */}
                    <button
                        onClick={toggleMic}
                        className={cn(
                            "p-4 rounded-full transition-all duration-200 shadow-lg",
                            isMicOn
                                ? "bg-gray-700 hover:bg-gray-600 text-white"
                                : "bg-red-500 hover:bg-red-600 text-white"
                        )}
                        aria-label={isMicOn ? "Mute" : "Unmute"}
                    >
                        {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
                    </button>

                    {/* Camera Toggle (only for video calls) */}
                    {isVideoCall && (
                        <button
                            onClick={toggleCamera}
                            className={cn(
                                "p-4 rounded-full transition-all duration-200 shadow-lg",
                                isCameraOn
                                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                                    : "bg-red-500 hover:bg-red-600 text-white"
                            )}
                            aria-label={isCameraOn ? "Turn off camera" : "Turn on camera"}
                        >
                            {isCameraOn ? <Video size={24} /> : <VideoOff size={24} />}
                        </button>
                    )}

                    {/* Leave Call */}
                    <button
                        onClick={leaveCall}
                        className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200 shadow-lg"
                        aria-label="Leave call"
                    >
                        <PhoneOff size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const CallOverlayContent = () => {
    const client = useStreamVideoClient();
    const calls = useCalls();

    const incomingCall = calls.find((call) => call.state.callingState === CallingState.RINGING);
    const joinedCall = calls.find((call) => call.state.callingState === CallingState.JOINED);

    const activeCall = joinedCall || incomingCall;

    if (!client || !activeCall) return null;

    return (
        <StreamCall call={activeCall}>
            <StreamTheme>
                {activeCall.state.callingState === CallingState.RINGING ? (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
                        <RingingCall />
                    </div>
                ) : (
                    <ActiveCallUI />
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
