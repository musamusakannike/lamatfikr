"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { StreamVideoClient, StreamVideo, User as StreamUser } from "@stream-io/video-react-sdk";
import { useAuth } from "@/contexts/AuthContext";
import { streamApi } from "@/lib/api/stream";

interface StreamClientContextType {
    client: StreamVideoClient | null;
}

const StreamClientContext = createContext<StreamClientContextType | undefined>(undefined);

export const StreamClientProvider = ({ children }: { children: ReactNode }) => {
    const [client, setClient] = useState<StreamVideoClient | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
        if (!apiKey) {
            console.error("Stream API Key missing. Please set NEXT_PUBLIC_STREAM_API_KEY in frontend env.");
            return;
        }

        let myClient: StreamVideoClient | null = null;

        const initClient = async () => {
            try {
                const { token } = await streamApi.getToken();

                // Use type assertion for the user ID if needed, ensuring it's a string
                const userId = user.id || (user as { _id?: string })._id;

                if (!userId) return;

                const streamUser: StreamUser = {
                    id: userId,
                    name: user.username || user.firstName,
                    image: user.avatar,
                };

                myClient = new StreamVideoClient({
                    apiKey,
                    user: streamUser,
                    token,
                });

                setClient(myClient);
            } catch (error) {
                console.error("Failed to connect to Stream Video", error);
            }
        };

        initClient();

        return () => {
            if (myClient) {
                myClient.disconnectUser();
                setClient(null);
            }
        };
    }, [user]);

    if (!client) return <>{children}</>;

    return (
        <StreamClientContext.Provider value={{ client }}>
            <StreamVideo client={client}>
                {children}
            </StreamVideo>
        </StreamClientContext.Provider>
    );
};

export const useStreamClientContext = () => {
    const context = useContext(StreamClientContext);
    return context;
}
