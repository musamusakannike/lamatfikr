"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Avatar, Button } from "@/components/ui";
import {
    ArrowLeft,
    Send,
    Loader2,
    MoreVertical,
    Image as ImageIcon,
    Smile,
    Phone,
    Video,
    X,
    MapPin,
    Mic,
    Camera,
    StopCircle,
    Flag,
    Ban,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import { format, isToday, isYesterday } from "date-fns";
import { messagesApi, type Message, type Conversation } from "@/lib/api/messages";
import { uploadApi } from "@/lib/api/upload";
import { getErrorMessage } from "@/lib/api";
import toast from "react-hot-toast";
import { useSocket } from "@/contexts/socket-context";
import { useChat } from "@/contexts/chat-context";
import { LocationPickerModal, type PickedLocation } from "@/components/shared/LocationPickerModal";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { BlockUserModal } from "@/components/shared/BlockUserModal";
import { ReportModal } from "@/components/shared/ReportModal";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";

interface ChatViewProps {
    conversationId: string;
    currentUserId: string;
    onBack: () => void;
    onConversationUpdate: (conversation: Conversation) => void;
}

export function ChatView({
    conversationId,
    currentUserId,
    onBack,
    onConversationUpdate,
}: ChatViewProps) {
    const { joinConversation, leaveConversation, sendTyping } = useSocket();
    const { addMessages } = useChat();
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [messageText, setMessageText] = useState("");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<Array<{ file: File; preview?: string }>>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const [reactingToMessageId, setReactingToMessageId] = useState<string | null>(null);
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);

    const [isRecordingAudio, setIsRecordingAudio] = useState(false);
    const [isRecordingVideo, setIsRecordingVideo] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);

    const [leafletMounted, setLeafletMounted] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const selectedImages = selectedFiles.filter((f) => f.file.type.startsWith("image/") && f.preview);

    const stopAnyRecording = () => {
        try {
            mediaRecorderRef.current?.stop();
        } catch {
            // ignore
        }
        mediaRecorderRef.current = null;
        mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
        setIsRecordingAudio(false);
        setIsRecordingVideo(false);
    };

    useEffect(() => {
        return () => {
            stopAnyRecording();
            selectedFiles.forEach((f) => {
                if (f.preview) URL.revokeObjectURL(f.preview);
            });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setLeafletMounted(true);
    }, []);

    const leafletMarkerIcon = useMemo(() => {
        const retina = (markerIcon2x as unknown as { src?: string })?.src ?? (markerIcon2x as unknown as string);
        const icon = (markerIcon as unknown as { src?: string })?.src ?? (markerIcon as unknown as string);
        const shadow = (markerShadow as unknown as { src?: string })?.src ?? (markerShadow as unknown as string);
        if (!icon) return undefined;
        return new L.Icon({
            iconRetinaUrl: retina || undefined,
            iconUrl: icon,
            shadowUrl: shadow || undefined,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
        });
    }, []);

    const getMessageId = (msg: Message) => (msg?._id ? String(msg._id) : "");

    const dedupeMessages = (list: Message[]) => {
        const map = new Map<string, Message>();
        for (const m of list) {
            const id = getMessageId(m);
            if (!id) continue;
            map.set(id, m);
        }
        return Array.from(map.values()).sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
    };

    const handleToggleReaction = async (messageId: string, emoji: string) => {
        try {
            await messagesApi.toggleReaction(conversationId, messageId, emoji);
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    const startRecording = async (mode: "audio" | "video") => {
        if (isRecordingAudio || isRecordingVideo) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia(
                mode === "video" ? { video: true, audio: true } : { audio: true }
            );
            mediaStreamRef.current = stream;

            const mimeType = mode === "video" ? "video/webm" : "audio/webm";
            const recorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = recorder;

            const chunks: BlobPart[] = [];
            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) chunks.push(e.data);
            };
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: mimeType });
                const ext = mode === "video" ? "webm" : "webm";
                const file = new File([blob], `${mode}-${Date.now()}.${ext}`, { type: mimeType });
                const preview = mode === "video" ? URL.createObjectURL(file) : undefined;
                setSelectedFiles((prev) => [...prev, { file, preview }].slice(0, 6));
                stopAnyRecording();
            };

            if (mode === "audio") setIsRecordingAudio(true);
            if (mode === "video") setIsRecordingVideo(true);
            recorder.start();
        } catch (err) {
            stopAnyRecording();
            toast.error(getErrorMessage(err));
        }
    };

    const otherParticipant = conversation?.participants.find(
        (p) => p._id !== currentUserId
    );

    // Fetch conversation and messages
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const [convRes, msgRes] = await Promise.all([
                    messagesApi.getConversation(conversationId),
                    messagesApi.getMessages(conversationId, 1, 50),
                ]);

                setConversation(convRes.conversation);
                setMessages(dedupeMessages(msgRes.messages));
                addMessages(conversationId, msgRes.messages.map(msg => ({
                    id: msg._id,
                    sender: {
                        _id: msg.senderId._id,
                        firstName: msg.senderId.firstName,
                        lastName: msg.senderId.lastName,
                        username: msg.senderId.username,
                        avatar: msg.senderId.avatar
                    },
                    content: msg.content,
                    media: msg.media,
                    createdAt: msg.createdAt
                })));
                setPage(1);
                setHasMore(msgRes.pagination.page < msgRes.pagination.pages);

                // Mark as read
                await messagesApi.markAsRead(conversationId);
            } catch (error) {
                console.error("Failed to fetch conversation:", error);
                toast.error(getErrorMessage(error));
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [conversationId, addMessages]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (!isLoadingMore) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isLoadingMore]);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, [conversationId]);

    // Join conversation room for real-time updates
    useEffect(() => {
        joinConversation(conversationId);
        return () => {
            leaveConversation(conversationId);
        };
    }, [conversationId, joinConversation, leaveConversation]);

    // Listen for real-time messages
    useEffect(() => {
        // Handled by chat context
    }, []);

    // Handle typing indicator
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (messageText.trim()) {
                sendTyping("conversation", conversationId, true);
            } else {
                sendTyping("conversation", conversationId, false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [messageText, conversationId, sendTyping]);

    const loadMoreMessages = async () => {
        if (isLoadingMore || !hasMore) return;

        try {
            setIsLoadingMore(true);
            const nextPage = page + 1;
            const { messages: olderMessages, pagination } = await messagesApi.getMessages(
                conversationId,
                nextPage,
                50
            );

            setMessages((prev) => dedupeMessages([...olderMessages, ...prev]));
            setPage(nextPage);
            setHasMore(pagination.page < pagination.pages);
        } catch (error) {
            console.error("Failed to load more messages:", error);
            toast.error("Failed to load more messages");
        } finally {
            setIsLoadingMore(false);
        }
    };

    const handleSendMessage = async () => {
        if ((!messageText.trim() && selectedFiles.length === 0) || isSending) return;

        const tempId = `temp-${Date.now()}`;
        const tempMessage: Message = {
            _id: tempId,
            conversationId,
            senderId: {
                _id: currentUserId,
                firstName: "",
                lastName: "",
                username: "",
            },
            content: messageText.trim() || undefined,
            media: selectedImages.map((img) => img.preview as string),
            attachments: selectedFiles
                .filter((f) => !f.file.type.startsWith("image/") && !!f.preview)
                .map((f) => ({ url: f.preview as string, type: f.file.type.startsWith("video/") ? "video" : "audio" })),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // Optimistic update
        setMessages((prev) => [...prev, tempMessage]);
        const savedMessageText = messageText;
        const savedFiles = [...selectedFiles];
        setMessageText("");
        setSelectedFiles([]);
        setIsSending(true);

        try {
            const uploadedMediaUrls: string[] = [];
            const uploadedAttachments: Array<{ url: string; type: "image" | "video" | "audio"; name?: string; size?: number }> = [];

            if (savedFiles.length > 0) {
                setIsUploading(true);
                for (const item of savedFiles) {
                    const result = await uploadApi.uploadMedia(item.file, "messages");
                    if (result.type === "image") {
                        uploadedMediaUrls.push(result.url);
                    } else {
                        uploadedAttachments.push({
                            url: result.url,
                            type: (result.type || (item.file.type.startsWith("video/") ? "video" : "audio")) as "video" | "audio",
                            name: item.file.name,
                            size: item.file.size,
                        });
                    }
                }
                setIsUploading(false);
            }

            const { data: newMessage } = await messagesApi.sendMessage(conversationId, {
                content: savedMessageText.trim() || undefined,
                media: uploadedMediaUrls.length > 0 ? uploadedMediaUrls : undefined,
                attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
            });

            // Replace temp message with real one
            setMessages((prev) =>
                dedupeMessages(prev.map((m) => (m._id === tempId ? newMessage : m)))
            );

            // Add to chat context for real-time sync
            addMessages(conversationId, [{
                id: newMessage._id,
                sender: {
                    _id: newMessage.senderId._id,
                    firstName: newMessage.senderId.firstName,
                    lastName: newMessage.senderId.lastName,
                    username: newMessage.senderId.username,
                    avatar: newMessage.senderId.avatar
                },
                content: newMessage.content,
                media: newMessage.media,
                attachments: newMessage.attachments,
                location: newMessage.location,
                reactions: newMessage.reactions,
                createdAt: newMessage.createdAt
            }]);

            // Update conversation in parent
            if (conversation) {
                onConversationUpdate({
                    ...conversation,
                    lastMessageId: {
                        _id: newMessage._id,
                        content: newMessage.content,
                        media: newMessage.media,
                        attachments: newMessage.attachments,
                        location: newMessage.location,
                        senderId: newMessage.senderId,
                        createdAt: newMessage.createdAt,
                    },
                });
            }

            savedFiles.forEach((f) => {
                if (f.preview) URL.revokeObjectURL(f.preview);
            });
        } catch (error) {
            // Remove temp message on error
            setMessages((prev) => prev.filter((m) => m._id !== tempId));
            console.error("Failed to send message:", error);
            toast.error("Failed to send message");
            setMessageText(savedMessageText); // Restore message text
            setSelectedFiles(savedFiles); // Restore files
        } finally {
            setIsSending(false);
            setIsUploading(false);
        }
    };

    const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const next = files.slice(0, Math.max(0, 6 - selectedFiles.length)).map((file) => {
            const needsPreview = file.type.startsWith("image/") || file.type.startsWith("video/");
            return {
                file,
                preview: needsPreview ? URL.createObjectURL(file) : undefined,
            };
        });
        setSelectedFiles((prev) => [...prev, ...next].slice(0, 6));
        e.target.value = "";
    };

    const removeSelectedFile = (index: number) => {
        setSelectedFiles((prev) => {
            const next = [...prev];
            const removed = next[index];
            if (removed?.preview) URL.revokeObjectURL(removed.preview);
            next.splice(index, 1);
            return next;
        });
    };

    const handleEmojiClick = (emojiData: EmojiClickData) => {
        const input = inputRef.current;
        if (input) {
            const start = input.selectionStart ?? messageText.length;
            const end = input.selectionEnd ?? messageText.length;
            const newText = messageText.slice(0, start) + emojiData.emoji + messageText.slice(end);
            setMessageText(newText);

            // Set cursor position after emoji
            requestAnimationFrame(() => {
                input.focus();
                const newPos = start + emojiData.emoji.length;
                input.setSelectionRange(newPos, newPos);
            });
        } else {
            setMessageText((prev) => prev + emojiData.emoji);
        }
        setShowEmojiPicker(false);
    };

    const formatMessageTime = (dateString: string) => {
        const date = new Date(dateString);
        return format(date, "h:mm a");
    };

    const formatDateSeparator = (dateString: string) => {
        const date = new Date(dateString);
        if (isToday(date)) return "Today";
        if (isYesterday(date)) return "Yesterday";
        return format(date, "MMMM d, yyyy");
    };

    const shouldShowDateSeparator = (currentMsg: Message, prevMsg?: Message) => {
        if (!prevMsg) return true;
        const currentDate = new Date(currentMsg.createdAt).toDateString();
        const prevDate = new Date(prevMsg.createdAt).toDateString();
        return currentDate !== prevDate;
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-primary-500" />
            </div>
        );
    }

    if (!conversation || !otherParticipant) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <p className="text-(--text-muted)">Conversation not found</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-(--border) flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                    className="md:hidden"
                >
                    <ArrowLeft size={20} />
                </Button>

                <Link href={`/user/${otherParticipant.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar
                        src={otherParticipant.avatar}
                        alt={otherParticipant.firstName}
                        size="md"
                    />
                    <div className="min-w-0">
                        <h2 className="font-semibold truncate">
                            {otherParticipant.firstName} {otherParticipant.lastName}
                        </h2>
                        <p className="text-sm text-(--text-muted) truncate">
                            @{otherParticipant.username}
                        </p>
                    </div>
                </Link>

                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="text-(--text-muted)">
                        <Phone size={20} />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-(--text-muted)">
                        <Video size={20} />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-(--text-muted)">
                                <MoreVertical size={20} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setShowReportModal(true)} className="text-red-500">
                                <Flag className="mr-2 h-4 w-4" />
                                Report User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setShowBlockModal(true)} className="text-red-500">
                                <Ban className="mr-2 h-4 w-4" />
                                Block User
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Messages */}
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
            >
                {/* Load More Button */}
                {hasMore && (
                    <div className="text-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={loadMoreMessages}
                            disabled={isLoadingMore}
                        >
                            {isLoadingMore ? (
                                <>
                                    <Loader2 size={16} className="mr-2 animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                "Load older messages"
                            )}
                        </Button>
                    </div>
                )}

                {messages.map((message, index) => {
                    const isOwnMessage = message.senderId._id === currentUserId;
                    const prevMessage = messages[index - 1];
                    const showDateSeparator = shouldShowDateSeparator(message, prevMessage);

                    return (
                        <div key={message._id || message.createdAt}>
                            {/* Date Separator */}
                            {showDateSeparator && (
                                <div className="flex items-center justify-center my-4">
                                    <span className="px-3 py-1 text-xs text-(--text-muted) bg-primary-100 dark:bg-primary-900/30 rounded-full">
                                        {formatDateSeparator(message.createdAt)}
                                    </span>
                                </div>
                            )}

                            {/* Message Bubble */}
                            <div
                                className={cn(
                                    "flex",
                                    isOwnMessage ? "justify-end" : "justify-start"
                                )}
                            >
                                <div
                                    className={cn(
                                        "max-w-[75%] rounded-2xl px-4 py-2 relative",
                                        isOwnMessage
                                            ? "bg-primary-500 text-white rounded-br-md"
                                            : "bg-primary-100 dark:bg-primary-900/40 text-(--text) rounded-bl-md"
                                    )}
                                >
                                    {/* Media */}
                                    {message.media && message.media.length > 0 && (
                                        <div className="mb-2 space-y-2">
                                            {message.media.map((url, i) => (
                                                <Image
                                                    key={i}
                                                    src={url}
                                                    alt="Media"
                                                    width={300}
                                                    height={200}
                                                    className="rounded-lg max-w-full"
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {/* Attachments */}
                                    {message.attachments && message.attachments.length > 0 && (
                                        <div className="mb-2 space-y-2">
                                            {message.attachments.map((att, i) => (
                                                <div key={`${att.url}-${i}`}>
                                                    {att.type === "video" ? (
                                                        <video src={att.url} controls className="max-w-full rounded-lg" />
                                                    ) : att.type === "audio" ? (
                                                        <audio src={att.url} controls className="w-full" />
                                                    ) : null}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Location */}
                                    {message.location && (
                                        <div
                                            className={cn(
                                                "mb-2 rounded-lg border overflow-hidden",
                                                isOwnMessage ? "border-white/30" : "border-(--border)"
                                            )}
                                        >
                                            <div className="h-36 w-full bg-(--bg)">
                                                {leafletMounted ? (
                                                    <MapContainer
                                                        center={[message.location.lat, message.location.lng]}
                                                        zoom={15}
                                                        scrollWheelZoom={false}
                                                        dragging={false}
                                                        doubleClickZoom={false}
                                                        zoomControl={false}
                                                        attributionControl={false}
                                                        className="h-full w-full"
                                                    >
                                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                                        <Marker
                                                            position={[message.location.lat, message.location.lng]}
                                                            icon={leafletMarkerIcon}
                                                        />
                                                    </MapContainer>
                                                ) : (
                                                    <div className="h-full w-full" />
                                                )}
                                            </div>
                                            <div className="p-2">
                                                <p className={cn("text-sm", isOwnMessage ? "text-white" : "text-(--text)")}>
                                                    {message.location.label || "Location"}
                                                </p>
                                                <p className={cn("text-xs", isOwnMessage ? "text-white/80" : "text-(--text-muted)")}>
                                                    {message.location.lat.toFixed(6)}, {message.location.lng.toFixed(6)}
                                                </p>
                                                <a
                                                    href={`https://www.google.com/maps?q=${message.location.lat},${message.location.lng}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className={cn(
                                                        "text-xs underline",
                                                        isOwnMessage ? "text-white/80" : "text-primary-600"
                                                    )}
                                                >
                                                    Open in Maps
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {/* Content */}
                                    {message.content && (
                                        <p className="whitespace-pre-wrap wrap-break-word">
                                            {message.content}
                                        </p>
                                    )}

                                    {/* Reactions */}
                                    {message.reactions && message.reactions.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {Array.from(
                                                message.reactions.reduce((acc, r) => {
                                                    acc.set(r.emoji, (acc.get(r.emoji) || 0) + 1);
                                                    return acc;
                                                }, new Map<string, number>())
                                            ).map(([emoji, count]) => (
                                                <button
                                                    key={emoji}
                                                    onClick={() => handleToggleReaction(message._id, emoji)}
                                                    className={cn(
                                                        "px-2 py-0.5 rounded-full text-xs",
                                                        isOwnMessage
                                                            ? "bg-white/20 text-white"
                                                            : "bg-(--bg-card) border border-(--border)"
                                                    )}
                                                >
                                                    {emoji} {count}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* React button */}
                                    <button
                                        onClick={() => {
                                            setReactingToMessageId(message._id);
                                            setShowReactionPicker(true);
                                        }}
                                        className={cn(
                                            "absolute -bottom-3",
                                            isOwnMessage ? "right-2" : "left-2",
                                            "p-1 rounded-full",
                                            isOwnMessage ? "bg-primary-600 text-white" : "bg-(--bg-card) border border-(--border)"
                                        )}
                                        aria-label="React"
                                    >
                                        <Smile size={14} />
                                    </button>

                                    {/* Time */}
                                    <p
                                        className={cn(
                                            "text-xs mt-1",
                                            isOwnMessage
                                                ? "text-white/70"
                                                : "text-(--text-muted)"
                                        )}
                                    >
                                        {formatMessageTime(message.createdAt)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}

                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-(--border)">
                {/* Image Previews */}
                {selectedFiles.length > 0 && (
                    <div className="flex gap-2 mb-3 flex-wrap">
                        {selectedFiles.map((item, index) => (
                            <div key={index} className="relative group">
                                {item.preview && item.file.type.startsWith("image/") ? (
                                    <Image
                                        src={item.preview}
                                        alt={`Selected ${index + 1}`}
                                        width={80}
                                        height={80}
                                        className="w-20 h-20 object-cover rounded-lg"
                                    />
                                ) : item.preview && item.file.type.startsWith("video/") ? (
                                    <video src={item.preview} className="w-20 h-20 object-cover rounded-lg" />
                                ) : (
                                    <div className="w-20 h-20 rounded-lg border border-(--border) bg-(--bg-card) flex items-center justify-center">
                                        <span className="text-xs text-(--text-muted)">
                                            {item.file.type.startsWith("audio/") ? "AUDIO" : "FILE"}
                                        </span>
                                    </div>
                                )}
                                <button
                                    onClick={() => removeSelectedFile(index)}
                                    className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-center gap-2">
                    {/* Image Upload Button */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*,audio/*"
                        multiple
                        onChange={handleFilesSelect}
                        className="hidden"
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "shrink-0",
                            selectedFiles.length > 0
                                ? "text-primary-600 dark:text-primary-400"
                                : "text-(--text-muted)"
                        )}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={selectedFiles.length >= 6}
                    >
                        <ImageIcon size={20} />
                    </Button>

                    {/* Record audio */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("shrink-0", isRecordingAudio ? "text-red-600" : "text-(--text-muted)")}
                        onClick={() => (isRecordingAudio ? stopAnyRecording() : startRecording("audio"))}
                    >
                        {isRecordingAudio ? <StopCircle size={20} /> : <Mic size={20} />}
                    </Button>

                    {/* Record video */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("shrink-0", isRecordingVideo ? "text-red-600" : "text-(--text-muted)")}
                        onClick={() => (isRecordingVideo ? stopAnyRecording() : startRecording("video"))}
                    >
                        {isRecordingVideo ? <StopCircle size={20} /> : <Camera size={20} />}
                    </Button>

                    {/* Location */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-(--text-muted)"
                        onClick={() => setShowLocationPicker(true)}
                    >
                        <MapPin size={20} />
                    </Button>

                    {/* Emoji Picker Button */}
                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "shrink-0",
                                showEmojiPicker
                                    ? "text-primary-600 dark:text-primary-400"
                                    : "text-(--text-muted)"
                            )}
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        >
                            <Smile size={20} />
                        </Button>

                        {showEmojiPicker && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowEmojiPicker(false)}
                                />
                                <div className="absolute left-0 bottom-full mb-2 z-20">
                                    <EmojiPicker
                                        onEmojiClick={handleEmojiClick}
                                        height={350}
                                        width={320}
                                        searchPlaceHolder="Search emoji..."
                                        lazyLoadEmojis={true}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Type a message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        className={cn(
                            "flex-1 px-4 py-2 rounded-full text-sm",
                            "bg-primary-50/80 dark:bg-primary-950/40",
                            "border border-(--border)",
                            "focus:border-primary-400 dark:focus:border-primary-500",
                            "placeholder:text-(--text-muted)",
                            "outline-none transition-all duration-200"
                        )}
                    />

                    <Button
                        onClick={handleSendMessage}
                        disabled={(!messageText.trim() && selectedFiles.length === 0) || isSending || isUploading}
                        size="icon"
                        className="shrink-0"
                    >
                        {isSending || isUploading ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <Send size={18} />
                        )}
                    </Button>
                </div>
            </div>

            <LocationPickerModal
                isOpen={showLocationPicker}
                onClose={() => setShowLocationPicker(false)}
                title="Send location"
                onConfirm={async (loc: PickedLocation) => {
                    try {
                        await messagesApi.sendMessage(conversationId, { location: loc });
                    } catch (err) {
                        toast.error(getErrorMessage(err));
                    }
                }}
            />

            {showReactionPicker && reactingToMessageId && (
                <div className="fixed inset-0 z-50 flex items-end justify-center p-4">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setShowReactionPicker(false)} />
                    <div className="relative bg-(--bg-card) border border-(--border) rounded-xl overflow-hidden">
                        <EmojiPicker
                            onEmojiClick={(e) => {
                                handleToggleReaction(reactingToMessageId, e.emoji);
                                setShowReactionPicker(false);
                                setReactingToMessageId(null);
                            }}
                            height={350}
                            width={320}
                            lazyLoadEmojis={true}
                        />
                    </div>
                </div>
            )}
            {otherParticipant && (
                <>
                    <BlockUserModal
                        isOpen={showBlockModal}
                        onClose={() => setShowBlockModal(false)}
                        userId={otherParticipant._id}
                        username={otherParticipant.username}
                        onBlockSuccess={() => {
                            onBack();
                        }}
                    />
                    <ReportModal
                        isOpen={showReportModal}
                        onClose={() => setShowReportModal(false)}
                        targetType="user"
                        targetId={otherParticipant._id}
                    />
                </>
            )}
        </div>
    );
}
