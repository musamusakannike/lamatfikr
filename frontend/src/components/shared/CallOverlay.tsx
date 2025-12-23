"use client";

import {
    useCalls,
    StreamCall,
    CallContent,
    useStreamVideoClient,
    CallingState,
    RingingCall,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";

export const CallOverlay = () => {
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
                    <CallContent
                        onLeave={() => {
                            // The onLeave prop in CallContent doesn't automatically end the call for everyone or leave it in a way that clears it from local state immediately purely via this callback sometimes.
                            // But typically CallContent handles the UI transition.
                            // We rely on the hook updates to clear the overlay.
                        }}
                    />
                </div>
            )}
        </StreamCall>
    );
};
