import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Play, Pause } from "lucide-react";

interface InstagramReelPlayerProps {
    videoUrl: string;
    thumbnailUrl?: string;
    isActive: boolean;
    isMuted: boolean;
    onPlayStateChange?: (playing: boolean) => void;
    onDoubleTap?: () => void;
    onSingleTap?: () => void;
    className?: string;
}

export function InstagramReelPlayer({
    videoUrl,
    thumbnailUrl,
    isActive,
    isMuted,
    onPlayStateChange,
    onDoubleTap,
    onSingleTap,
    className,
}: InstagramReelPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [progress, setProgress] = useState(0);
    const [showPlayIcon, setShowPlayIcon] = useState(false);
    const lastTapRef = useRef(0);
    const playIconTimeoutRef = useRef<NodeJS.Timeout>();

    // Handle active state changes
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        let isMounted = true;

        if (isActive) {
            video.currentTime = 0;
            const playPromise = video.play();

            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        if (isMounted) {
                            setIsPlaying(true);
                            onPlayStateChange?.(true);
                        }
                    })
                    .catch((error) => {
                        // Ignore AbortError - it's expected when component unmounts
                        if (error.name !== "AbortError" && isMounted) {
                            console.error("Error playing video:", error);
                            setIsPlaying(false);
                            onPlayStateChange?.(false);
                        }
                    });
            }
        } else {
            video.pause();
            video.currentTime = 0;
            setIsPlaying(false);
            setProgress(0);
            onPlayStateChange?.(false);
        }

        return () => {
            isMounted = false;
            // Pause video on cleanup to prevent play errors
            if (video) {
                video.pause();
            }
        };
    }, [isActive, onPlayStateChange]);

    // Handle mute state
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = isMuted;
        }
    }, [isMuted]);

    // Update progress
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const updateProgress = () => {
            const progress = (video.currentTime / video.duration) * 100;
            setProgress(progress);
        };

        const handleWaiting = () => setIsBuffering(true);
        const handleCanPlay = () => setIsBuffering(false);
        const handlePlaying = () => {
            setIsBuffering(false);
            setIsPlaying(true);
        };
        const handlePause = () => setIsPlaying(false);

        video.addEventListener("timeupdate", updateProgress);
        video.addEventListener("waiting", handleWaiting);
        video.addEventListener("canplay", handleCanPlay);
        video.addEventListener("playing", handlePlaying);
        video.addEventListener("pause", handlePause);

        return () => {
            video.removeEventListener("timeupdate", updateProgress);
            video.removeEventListener("waiting", handleWaiting);
            video.removeEventListener("canplay", handleCanPlay);
            video.removeEventListener("playing", handlePlaying);
            video.removeEventListener("pause", handlePause);
        };
    }, []);

    const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
            // Double tap
            onDoubleTap?.();
            lastTapRef.current = 0;
        } else {
            // Single tap - toggle play/pause
            lastTapRef.current = now;
            setTimeout(() => {
                if (lastTapRef.current === now) {
                    togglePlayPause();
                    onSingleTap?.();
                }
            }, DOUBLE_TAP_DELAY);
        }
    };

    const togglePlayPause = () => {
        const video = videoRef.current;
        if (!video) return;

        if (video.paused) {
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        setIsPlaying(true);
                        onPlayStateChange?.(true);
                    })
                    .catch((error) => {
                        // Ignore AbortError
                        if (error.name !== "AbortError") {
                            console.error("Error playing video:", error);
                        }
                    });
            }
        } else {
            video.pause();
            setIsPlaying(false);
            onPlayStateChange?.(false);
        }

        // Show play/pause icon briefly
        setShowPlayIcon(true);
        if (playIconTimeoutRef.current) {
            clearTimeout(playIconTimeoutRef.current);
        }
        playIconTimeoutRef.current = setTimeout(() => {
            setShowPlayIcon(false);
        }, 500);
    };

    return (
        <div className={cn("relative w-full h-full", className)} onClick={handleTap}>
            <video
                ref={videoRef}
                src={videoUrl}
                poster={thumbnailUrl}
                className="w-full h-full object-contain bg-black"
                loop
                playsInline
                preload={isActive ? "auto" : "metadata"}
            />

            {/* Buffering Indicator */}
            {isBuffering && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
            )}

            {/* Play/Pause Icon (shows briefly on tap) */}
            {showPlayIcon && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center animate-in fade-in zoom-in duration-200">
                        {isPlaying ? (
                            <Pause className="w-10 h-10 text-white" fill="white" />
                        ) : (
                            <Play className="w-10 h-10 text-white ml-1" fill="white" />
                        )}
                    </div>
                </div>
            )}

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20">
                <div
                    className="h-full bg-white transition-all duration-100"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
