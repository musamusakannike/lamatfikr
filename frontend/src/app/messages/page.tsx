"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar, Sidebar } from "@/components/layout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Card, CardContent, Button, Avatar } from "@/components/ui";
import {
    MessageCircle,
    Loader2,
    Search,
    ArrowLeft,
} from "lucide-react";
import { messagesApi, type Conversation } from "@/lib/api/messages";
import { getErrorMessage } from "@/lib/api";
import toast from "react-hot-toast";
import { ConversationList } from "@/components/messages/ConversationList";
import { ChatView } from "@/components/messages/ChatView";

export default function MessagesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user: currentUser, isAuthenticated, isLoading: authLoading } = useAuth();
    const { isRTL, t } = useLanguage();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Get conversation ID from URL params
    const conversationIdFromUrl = searchParams.get("conversation");

    useEffect(() => {
        if (conversationIdFromUrl) {
            setSelectedConversationId(conversationIdFromUrl);
        }
    }, [conversationIdFromUrl]);

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/auth/login");
        }
    }, [authLoading, isAuthenticated, router]);

    // Fetch conversations
    useEffect(() => {
        const fetchConversations = async () => {
            if (!isAuthenticated) return;

            try {
                setIsLoadingConversations(true);
                const { conversations: fetchedConversations } = await messagesApi.getConversations();
                setConversations(fetchedConversations);
            } catch (error) {
                console.error("Failed to fetch conversations:", error);
                toast.error(getErrorMessage(error));
            } finally {
                setIsLoadingConversations(false);
            }
        };

        fetchConversations();
    }, [isAuthenticated]);

    const handleSelectConversation = useCallback((conversationId: string) => {
        setSelectedConversationId(conversationId);
        router.push(`/messages?conversation=${conversationId}`, { scroll: false });
    }, [router]);

    const handleBackToList = useCallback(() => {
        setSelectedConversationId(null);
        router.push("/messages", { scroll: false });
    }, [router]);

    const handleConversationUpdate = useCallback((updatedConversation: Conversation) => {
        setConversations((prev) =>
            prev.map((c) => (c._id === updatedConversation._id ? updatedConversation : c))
        );
    }, []);

    const filteredConversations = conversations.filter((conv) => {
        if (!searchQuery) return true;
        const otherParticipant = conv.participants.find((p) => p._id !== currentUser?.id);
        if (!otherParticipant) return false;
        const fullName = `${otherParticipant.firstName} ${otherParticipant.lastName}`.toLowerCase();
        return fullName.includes(searchQuery.toLowerCase()) ||
            otherParticipant.username.toLowerCase().includes(searchQuery.toLowerCase());
    });

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-primary-500" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen">
            <Navbar
                onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
                isSidebarOpen={sidebarOpen}
            />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className={cn("pt-16", isRTL ? "lg:pr-64" : "lg:pl-64")}>
                <div className="h-[calc(100vh-4rem)] flex">
                    {/* Conversation List - Hidden on mobile when conversation is selected */}
                    <div
                        className={cn(
                            "w-full md:w-80 lg:w-96 border-r border-(--border) flex flex-col",
                            selectedConversationId && "hidden md:flex"
                        )}
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-(--border)">
                            <h1 className="text-xl font-bold mb-4">{t("messages", "title")}</h1>
                            <div className="relative">
                                <Search
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)"
                                />
                                <input
                                    type="text"
                                    placeholder={t("messages", "searchConversations")}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={cn(
                                        "w-full pl-10 pr-4 py-2 rounded-lg text-sm",
                                        "bg-primary-50/80 dark:bg-primary-950/40",
                                        "border border-(--border)",
                                        "focus:border-primary-400 dark:focus:border-primary-500",
                                        "placeholder:text-(--text-muted)",
                                        "outline-none transition-all duration-200"
                                    )}
                                />
                            </div>
                        </div>

                        {/* Conversation List */}
                        <div className="flex-1 overflow-y-auto">
                            {isLoadingConversations ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 size={24} className="animate-spin text-primary-500" />
                                </div>
                            ) : filteredConversations.length > 0 ? (
                                <ConversationList
                                    conversations={filteredConversations}
                                    currentUserId={currentUser?.id || ""}
                                    selectedConversationId={selectedConversationId}
                                    onSelectConversation={handleSelectConversation}
                                />
                            ) : (
                                <div className="p-8 text-center">
                                    <MessageCircle size={48} className="mx-auto text-(--text-muted) mb-4" />
                                    <p className="text-(--text-muted)">
                                        {searchQuery ? t("messages", "noConversationsFound") : t("messages", "noMessagesYet")}
                                    </p>
                                    <p className="text-sm text-(--text-muted) mt-2">
                                        {t("messages", "startConversationHint")}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chat View */}
                    <div
                        className={cn(
                            "flex-1 flex flex-col",
                            !selectedConversationId && "hidden md:flex"
                        )}
                    >
                        {selectedConversationId ? (
                            <ChatView
                                conversationId={selectedConversationId}
                                currentUserId={currentUser?.id || ""}
                                onBack={handleBackToList}
                                onConversationUpdate={handleConversationUpdate}
                            />
                        ) : (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center">
                                    <MessageCircle size={64} className="mx-auto text-(--text-muted) mb-4" />
                                    <h2 className="text-xl font-semibold mb-2">{t("messages", "yourMessages")}</h2>
                                    <p className="text-(--text-muted)">
                                        {t("messages", "selectConversation")}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
