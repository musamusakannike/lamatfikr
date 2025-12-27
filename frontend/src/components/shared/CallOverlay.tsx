"use client";

import {
    StreamCall,
    StreamTheme,
    CallControls,
    SpeakerLayout,
    CallParticipantsList,
    RingingCall,
    useCalls,
    CallingState,
} from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import { useStreamClientContext } from "@/contexts/StreamClientContext";

const ActiveCallUI = () => {
    return (
        <div className="fixed inset-0 z-50 bg-black">
            {/* Main video layout (auto handles 1:1, group, audio-only) */}
            <SpeakerLayout />

            {/* Right-side participants list */}
            <div className="absolute top-0 right-0 h-full">
                <CallParticipantsList onClose={() => { }} />
            </div>



            {/* Bottom controls (mic, camera, screen share, leave) */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
                <CallControls />
            </div>
        </div>
    );
};

const CallOverlayContent = () => {
    const calls = useCalls();

    const activeCall = calls.find((call) => {
        const state = call.state.callingState;
        return (
            state === CallingState.RINGING ||
            state === CallingState.JOINED ||
            state === CallingState.JOINING ||
            state === CallingState.RECONNECTING
        );
    });

    if (!activeCall) return null;

    return (
        <StreamCall call={activeCall}>
            <StreamTheme>
                {activeCall.state.callingState === CallingState.RINGING ? (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
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
