"use client";

import { useState, useEffect, useCallback } from "react";
import { reelsApi, type Reel } from "@/lib/api/reels";
import { Loader2, X } from "lucide-react";
import { getErrorMessage } from "@/lib/api";
import { InstagramReelsViewer } from "@/components/reels/InstagramReelsViewer";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";

export default function ReelDetailPage() {
    const router = useRouter();
    const params = useParams();
    const reelId = params.reelId as string;

    const [reel, setReel] = useState<Reel | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchReel = useCallback(async () => {
        if (!reelId) return;

        try {
            setLoading(true);
            setError(null);
            const response = await reelsApi.getReel(reelId);
            setReel(response.reel);
        } catch (err) {
            setError(getErrorMessage(err));
            toast.error(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [reelId]);

    useEffect(() => {
        if (!reelId) {
            setError("Invalid reel ID");
            setLoading(false);
            return;
        }
        fetchReel();
    }, [reelId, fetchReel]);

    const handleClose = () => {
        router.back();
    };

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-black">
                <Loader2 className="w-12 h-12 animate-spin text-white" />
            </div>
        );
    }

    if (error || !reel) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white p-6">
                <p className="text-lg mb-4">{error || "Reel not found"}</p>
                <button
                    onClick={handleClose}
                    className="px-6 py-2 bg-white text-black rounded-full font-semibold hover:bg-white/90 transition-colors"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="relative h-screen w-full bg-black overflow-hidden">
            {/* Close Button */}
            <button
                onClick={handleClose}
                className="fixed top-4 left-4 z-50 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-black/70 transition-all text-white"
                aria-label="Close"
            >
                <X className="w-6 h-6" />
            </button>

            {/* Instagram Reels Viewer with single reel */}
            <InstagramReelsViewer
                initialReels={[reel]}
                initialIndex={0}
                hasMore={false}
            />
        </div>
    );
}
