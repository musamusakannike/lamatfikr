"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { profileApi } from "@/lib/api/profile";

export function LocationUpdater() {
    const { isAuthenticated, user } = useAuth();
    const hasUpdatedCallback = useRef<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated || !user?.id) return;

        // Prevent multiple updates for the same user in the same session
        if (hasUpdatedCallback.current === user.id) return;

        if (!("geolocation" in navigator)) {
            console.warn("Geolocation is not supported by this browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    // If user changed while getting position, abort
                    if (hasUpdatedCallback.current === user.id) return;

                    const { latitude, longitude } = position.coords;

                    await profileApi.updateProfile({
                        location: {
                            type: "Point",
                            coordinates: [longitude, latitude], // GeoJSON is [long, lat]
                        },
                    });

                    hasUpdatedCallback.current = user.id;
                    // console.log("Location updated successfully");
                } catch (error) {
                    console.error("Failed to update location:", error);
                }
            },
            (error) => {
                console.warn("Error getting location:", error.message);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    }, [isAuthenticated, user?.id]);

    return null;
}
