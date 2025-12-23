"use client";

import {
    useCalls,
    StreamCall,
    useStreamVideoClient,
    CallingState,
    RingingCall,
    StreamTheme,
    SpeakerLayout,
    CallControls,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { useStreamClientContext } from "@/contexts/StreamClientContext";

const CallOverlayContent = () => {
    const client = useStreamVideoClient();
    const calls = useCalls();

    const incomingCall = calls.find((call) => call.state.callingState === CallingState.RINGING);
    const joinedCall = calls.find((call) => call.state.callingState === CallingState.JOINED);

    const activeCall = joinedCall || incomingCall;

    if (!client || !activeCall) return null;

    return (
        <StreamCall call={activeCall}>
            {activeCall.state.callingState === CallingState.RINGING ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <RingingCall />
                </div>
            ) : (
                <div className="fixed inset-0 z-50 bg-black">
                    <StreamTheme>
                        <div className="flex h-full w-full flex-col items-center justify-center">
                            <SpeakerLayout />
                            <div className="absolute bottom-4 z-50">
                                <CallControls onLeave={() => console.log("Call left")} />
                            </div>
                        </div>
                    </StreamTheme>
                </div>
            )}
        </StreamCall>
    );
};

export const CallOverlay = () => {
    const { client } = useStreamClientContext() || {};
    if (!client) return null;

    return <CallOverlayContent />;
};
