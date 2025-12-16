"use client";

import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui";
import { formatDistanceToNow } from "date-fns";
import type { Conversation } from "@/lib/api/messages";

interface ConversationListProps {
    conversations: Conversation[];
    currentUserId: string;
    selectedConversationId: string | null;
    onSelectConversation: (conversationId: string) => void;
}

export function ConversationList({
    conversations,
    currentUserId,
    selectedConversationId,
    onSelectConversation,
}: ConversationListProps) {
    return (
        <div className="divide-y divide-(--border)">
            {conversations.map((conversation) => {
                const otherParticipant = conversation.participants.find(
                    (p) => p._id !== currentUserId
                );

                if (!otherParticipant) return null;

                const isSelected = selectedConversationId === conversation._id;
                const lastMessage = conversation.lastMessageId;
                const hasUnread = (conversation.unreadCount || 0) > 0;

                return (
                    <button
                        key={conversation._id}
                        onClick={() => onSelectConversation(conversation._id)}
                        className={cn(
                            "w-full p-4 flex items-center gap-3 text-left transition-colors",
                            isSelected
                                ? "bg-primary-100 dark:bg-primary-900/40"
                                : "hover:bg-primary-50 dark:hover:bg-primary-900/20"
                        )}
                    >
                        <div className="relative">
                            <Avatar
                                src={otherParticipant.avatar}
                                alt={otherParticipant.firstName}
                                size="md"
                            />
                            {hasUnread && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
                                    {conversation.unreadCount! > 9 ? "9+" : conversation.unreadCount}
                                </span>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <span
                                    className={cn(
                                        "font-semibold truncate",
                                        hasUnread && "text-primary-600 dark:text-primary-400"
                                    )}
                                >
                                    {otherParticipant.firstName} {otherParticipant.lastName}
                                </span>
                                {lastMessage && (
                                    <span className="text-xs text-(--text-muted) shrink-0">
                                        {formatDistanceToNow(new Date(lastMessage.createdAt), {
                                            addSuffix: false,
                                        })}
                                    </span>
                                )}
                            </div>
                            <p
                                className={cn(
                                    "text-sm truncate",
                                    hasUnread
                                        ? "text-(--text) font-medium"
                                        : "text-(--text-muted)"
                                )}
                            >
                                {lastMessage ? (
                                    lastMessage.content ? (
                                        lastMessage.content
                                    ) : lastMessage.media && lastMessage.media.length > 0 ? (
                                        "📷 Photo"
                                    ) : (
                                        "No messages yet"
                                    )
                                ) : (
                                    "No messages yet"
                                )}
                            </p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
