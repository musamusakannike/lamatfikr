"use client";

import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { format, isToday, isYesterday } from "date-fns";
import { messagesApi, type Message, type Conversation } from "@/lib/api/messages";
import { getErrorMessage } from "@/lib/api";
import toast from "react-hot-toast";

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
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [messageText, setMessageText] = useState("");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

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
                setMessages(msgRes.messages);
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
    }, [conversationId]);

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

            setMessages((prev) => [...olderMessages, ...prev]);
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
        if (!messageText.trim() || isSending) return;

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
            content: messageText.trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // Optimistic update
        setMessages((prev) => [...prev, tempMessage]);
        setMessageText("");
        setIsSending(true);

        try {
            const { data: newMessage } = await messagesApi.sendMessage(conversationId, {
                content: messageText.trim(),
            });

            // Replace temp message with real one
            setMessages((prev) =>
                prev.map((m) => (m._id === tempId ? newMessage : m))
            );

            // Update conversation in parent
            if (conversation) {
                onConversationUpdate({
                    ...conversation,
                    lastMessageId: {
                        _id: newMessage._id,
                        content: newMessage.content,
                        media: newMessage.media,
                        senderId: newMessage.senderId,
                        createdAt: newMessage.createdAt,
                    },
                });
            }
        } catch (error) {
            // Remove temp message on error
            setMessages((prev) => prev.filter((m) => m._id !== tempId));
            console.error("Failed to send message:", error);
            toast.error("Failed to send message");
            setMessageText(messageText); // Restore message text
        } finally {
            setIsSending(false);
        }
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
                    <Button variant="ghost" size="icon" className="text-(--text-muted)">
                        <MoreVertical size={20} />
                    </Button>
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
                        <div key={message._id}>
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
                                        "max-w-[75%] rounded-2xl px-4 py-2",
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

                                    {/* Content */}
                                    {message.content && (
                                        <p className="whitespace-pre-wrap wrap-break-word">
                                            {message.content}
                                        </p>
                                    )}

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
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-(--text-muted) shrink-0">
                        <ImageIcon size={20} />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-(--text-muted) shrink-0">
                        <Smile size={20} />
                    </Button>

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
                        disabled={!messageText.trim() || isSending}
                        size="icon"
                        className="shrink-0"
                    >
                        {isSending ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <Send size={18} />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
