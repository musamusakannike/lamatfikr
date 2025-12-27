"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Avatar, Button, Modal } from "@/components/ui";
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
  Plus,
  Clock,
  Flag,
  Ban,
  Edit2,
  Trash2,
  MoreHorizontal,
  Eye,
  EyeOff,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import { format, isToday, isYesterday } from "date-fns";
import {
  messagesApi,
  type Message,
  type Conversation,
  type MessageAttachment,
  type MessageLocation,
} from "@/lib/api/messages";

import { socialApi } from "@/lib/api/social";
import { uploadApi } from "@/lib/api/upload";
import { getErrorMessage } from "@/lib/api";
import toast from "react-hot-toast";
import { useSocket } from "@/contexts/socket-context";
import { useChat } from "@/contexts/chat-context";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  LocationPickerModal,
  type PickedLocation,
} from "@/components/shared/LocationPickerModal";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { BlockUserModal } from "@/components/shared/BlockUserModal";
import { ViewOnceModal } from "./ViewOnceModal";
import { ReportModal } from "@/components/shared/ReportModal";
import { useStreamClientContext } from "@/contexts/StreamClientContext";
import {
  StreamCall,
  CallControls,
  SpeakerLayout,
} from "@stream-io/video-react-sdk";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

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
  const { socket, joinConversation, leaveConversation, sendTyping } =
    useSocket();
  const { t } = useLanguage();
  const streamContext = useStreamClientContext();
  const streamClient = streamContext?.client || null;
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
  const [selectedFiles, setSelectedFiles] = useState<
    Array<{ file: File; preview?: string }>
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [reactingToMessageId, setReactingToMessageId] = useState<string | null>(
    null
  );
  const [isBlocked, setIsBlocked] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  // const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showMobileOptions, setShowMobileOptions] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isViewOnce, setIsViewOnce] = useState(false);

  const [showDisappearingMessagesModal, setShowDisappearingMessagesModal] =
    useState(false);
  const [customDuration, setCustomDuration] = useState("");
  const [customUnit, setCustomUnit] = useState<"hours" | "days">("hours");

  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Conversation event state
  const [activeEvent, setActiveEvent] = useState<{
    id: string;
    type: "video_call" | "audio_call";
    status: string;
    streamCallId?: string;
    startedBy?: string;
    createdAt: string;
  } | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [call, setCall] = useState<any>(null);
  const [isJoiningCall, setIsJoiningCall] = useState(false);
  const [hasJoinedCall, setHasJoinedCall] = useState(false);

  const [leafletMounted, setLeafletMounted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedImages = selectedFiles.filter(
    (f) => f.file.type.startsWith("image/") && f.preview
  );

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
    const retina =
      (markerIcon2x as unknown as { src?: string })?.src ??
      (markerIcon2x as unknown as string);
    const icon =
      (markerIcon as unknown as { src?: string })?.src ??
      (markerIcon as unknown as string);
    const shadow =
      (markerShadow as unknown as { src?: string })?.src ??
      (markerShadow as unknown as string);
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
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
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
        const file = new File([blob], `${mode}-${Date.now()}.${ext}`, {
          type: mimeType,
        });
        const preview =
          mode === "video" ? URL.createObjectURL(file) : undefined;
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

  const handleStartCall = async (video: boolean) => {
    if (!streamClient || !otherParticipant) {
      toast.error(t("messages", "cannotStartCall"));
      return;
    }

    try {
      const eventType = video ? "video_call" : "audio_call";
      const loadingMessage = video
        ? t("messages", "startingVideoCall")
        : t("messages", "startingAudioCall");
      toast.loading(loadingMessage, { id: "call-start", duration: 5000 });

      // Request permissions before starting
      if (video) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          stream.getTracks().forEach((track) => track.stop());
        } catch (permError) {
          toast.error(t("messages", "cameraPermissionDenied"), {
            id: "call-start",
          });
          return;
        }
      } else {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          stream.getTracks().forEach((track) => track.stop());
        } catch (permError) {
          toast.error(t("messages", "microphonePermissionDenied"), {
            id: "call-start",
          });
          return;
        }
      }

      // Start event via backend API
      const response = await messagesApi.startEvent(conversationId, eventType);

      // Set active event and open modal
      setActiveEvent({
        id: response.event.id,
        type: eventType,
        status: response.event.status,
        streamCallId: response.event.streamCallId,
        startedBy: response.event.startedBy,
        createdAt: response.event.createdAt,
      });
      setShowEventModal(true);

      toast.success(response.message, { id: "call-start", duration: 2000 });
    } catch (error) {
      console.error("Failed to start call", error);
      let errorMessage = t("messages", "callStartFailed");

      if (error instanceof Error) {
        if (
          error.message.includes("permission") ||
          error.message.includes("Permission")
        ) {
          errorMessage = video
            ? t("messages", "cameraPermissionDenied")
            : t("messages", "microphonePermissionDenied");
        } else if (error.message.includes("NotAllowedError")) {
          errorMessage = t("messages", "deviceAccessDenied");
        } else if (error.message.includes("NotFoundError")) {
          errorMessage = t("messages", "deviceNotFound");
        } else if (error.message.includes("NotReadableError")) {
          errorMessage = t("messages", "deviceInUse");
        }
      }

      toast.error(errorMessage, { id: "call-start", duration: 4000 });
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
        const [convRes, msgRes, eventsRes] = await Promise.all([
          messagesApi.getConversation(conversationId),
          messagesApi.getMessages(conversationId, 1, 50),
          messagesApi.getEvents(conversationId).catch(() => ({ events: [] })),
        ]);

        setConversation(convRes.conversation);
        setMessages(dedupeMessages(msgRes.messages));
        addMessages(
          conversationId,
          msgRes.messages.map((msg) => ({
            id: msg._id,
            sender: {
              _id: msg.senderId._id,
              firstName: msg.senderId.firstName,
              lastName: msg.senderId.lastName,
              username: msg.senderId.username,
              avatar: msg.senderId.avatar,
            },
            content: msg.content,
            media: msg.media,
            createdAt: msg.createdAt,
          }))
        );
        setPage(1);
        setHasMore(msgRes.pagination.page < msgRes.pagination.pages);

        // Set active event if any
        const activeEvents = eventsRes.events.filter(
          (e) => e.status === "active"
        );
        if (activeEvents.length > 0) {
          const event = activeEvents[0];
          setActiveEvent({
            id: event.id,
            type: event.type as "video_call" | "audio_call",
            status: event.status,
            streamCallId: event.streamCallId,
            startedBy:
              typeof event.startedBy === "string"
                ? event.startedBy
                : event.startedBy._id,
            createdAt: event.createdAt,
          });
        }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, addMessages]);

  // Update conversation state when real-time update received
  useEffect(() => {
    if (conversation) {
      onConversationUpdate(conversation);
    }
  }, [conversation, onConversationUpdate]);

  const handleUpdateDisappearingMessages = async (duration: number | null) => {
    try {
      await messagesApi.updateSettings(conversationId, {
        disappearingMessagesDuration: duration,
      });

      setConversation((prev) =>
        prev ? { ...prev, disappearingMessagesDuration: duration } : null
      );
      onConversationUpdate({
        ...conversation!,
        disappearingMessagesDuration: duration,
      });

      toast.success(t("common", "save"));
      setShowDisappearingMessagesModal(false);
    } catch (error) {
      console.error("Failed to update settings:", error);
      toast.error(getErrorMessage(error));
    }
  };

  const getDurationLabel = (duration: number | null) => {
    if (!duration) return t("common", "off");
    if (duration === 24 * 60 * 60 * 1000) return t("common", "hours24");
    if (duration === 3 * 24 * 60 * 60 * 1000) return t("common", "days3");
    if (duration === 7 * 24 * 60 * 60 * 1000) return t("common", "days7");

    const hours = Math.floor(duration / (60 * 60 * 1000));
    if (hours < 24) return `${hours} ${t("common", "hours")}`;
    const days = Math.floor(hours / 24);
    return `${days} ${t("common", "days")}`;
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (!isLoadingMore) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoadingMore]);

  useEffect(() => {
    if (otherParticipant) {
      socialApi
        .checkFollowStatus(otherParticipant._id)
        .then((res) => setIsBlocked(res.isBlocked))
        .catch(console.error);
    }
  }, [otherParticipant]);

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

  // Join call when event modal opens
  useEffect(() => {
    if (!streamClient || !showEventModal || !activeEvent?.streamCallId) return;

    const initializeCall = async () => {
      try {
        setIsJoiningCall(true);
        // Always use "default" call type for DMs as standardized in backend
        const callType = "default";
        if (!activeEvent.streamCallId) {
          throw new Error("Stream call ID is missing");
        }
        const newCall = streamClient.call(callType, activeEvent.streamCallId);

        // Configure devices before joining
        if (activeEvent.type === "audio_call") {
          await newCall.camera.disable();
          await newCall.microphone.enable();
        } else {
          await newCall.camera.enable();
          await newCall.microphone.enable();
        }

        await newCall.join({ create: true });
        setCall(newCall);
        setHasJoinedCall(true);
        setIsJoiningCall(false);
      } catch (err) {
        console.error("Failed to join call:", err);
        toast.error(t("messages", "callStartFailed") || "Failed to join call");
        setIsJoiningCall(false);
        setShowEventModal(false);
      }
    };

    initializeCall();

    return () => {
      if (call) {
        call.leave().catch(console.error);
        setCall(null);
        setHasJoinedCall(false);
      }
    };
  }, [
    streamClient,
    showEventModal,
    activeEvent?.streamCallId,
    activeEvent?.type,
  ]);

  const handleLeaveCall = async () => {
    if (call) {
      await call.leave();
      setCall(null);
      setHasJoinedCall(false);
    }
    setShowEventModal(false);
  };

  const handleEndCall = async () => {
    if (!activeEvent) return;
    try {
      await messagesApi.endEvent(conversationId, activeEvent.id);
      if (call) {
        await call.leave();
        setCall(null);
        setHasJoinedCall(false);
      }
      setActiveEvent(null);
      setShowEventModal(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // Listen for real-time messages
  useEffect(() => {
    if (!socket) return;

    interface MessageUpdatedData {
      conversationId: string;
      messageId: string;
      content: string;
      editedAt: string;
    }

    const handleMessageUpdated = (data: MessageUpdatedData) => {
      if (data.conversationId !== conversationId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m._id === data.messageId
            ? { ...m, content: data.content, editedAt: data.editedAt }
            : m
        )
      );
    };

    interface MessageDeletedData {
      conversationId: string;
      messageId: string;
    }

    const handleMessageDeleted = (data: MessageDeletedData) => {
      if (data.conversationId !== conversationId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m._id === data.messageId
            ? { ...m, deletedAt: new Date().toISOString() } // Soft delete visual
            : m
        )
      );
    };

    socket.on("message:updated", handleMessageUpdated);
    socket.on("message:deleted", handleMessageDeleted);

    // Listen for conversation events
    const handleEventStarted = (data: {
      conversationId: string;
      eventId: string;
      type: string;
      startedBy: string;
      streamCallId: string;
    }) => {
      if (data.conversationId !== conversationId) return;
      setActiveEvent({
        id: data.eventId,
        type: data.type as "video_call" | "audio_call",
        status: "active",
        streamCallId: data.streamCallId,
        startedBy: data.startedBy,
        createdAt: new Date().toISOString(),
      });
      setShowEventModal(true);
    };

    const handleEventEnded = (data: {
      conversationId: string;
      eventId: string;
      type: string;
    }) => {
      if (data.conversationId !== conversationId) return;
      if (activeEvent?.id === data.eventId) {
        setActiveEvent(null);
        setShowEventModal(false);
        if (call) {
          call.leave().catch(console.error);
          setCall(null);
          setHasJoinedCall(false);
        }
      }
    };

    socket.on("conversation:event:started", handleEventStarted);
    socket.on("conversation:event:ended", handleEventEnded);

    return () => {
      socket.off("message:updated", handleMessageUpdated);
      socket.off("message:deleted", handleMessageDeleted);
      socket.off("conversation:event:started", handleEventStarted);
      socket.off("conversation:event:ended", handleEventEnded);
    };
  }, [socket, conversationId, activeEvent, call]);

  const handleEditClick = (msg: Message) => {
    setEditingMessageId(msg._id);
    setEditContent(msg.content || "");
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent("");
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!editContent.trim()) return;
    try {
      await messagesApi.editMessage(conversationId, messageId, editContent);
      setEditingMessageId(null);
      setEditContent("");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (
      !confirm(
        t("common", "deleteConfirm") ||
          "Are you sure you want to delete this message?"
      )
    )
      return;
    try {
      await messagesApi.deleteMessage(conversationId, messageId);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const [viewOnceModalOpen, setViewOnceModalOpen] = useState(false);
  const [viewOnceContent, setViewOnceContent] = useState<{
    content?: string;
    media?: string[];
    attachments?: MessageAttachment[];
    location?: MessageLocation;
  } | null>(null);

  const handleViewOnceMessage = async (messageId: string) => {
    try {
      const { data } = await messagesApi.markAsViewed(
        conversationId,
        messageId
      );
      // Show content in modal temporarily
      setViewOnceContent(data);
      setViewOnceModalOpen(true);
      // Mark message as expired in local state
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, isExpired: true } : m))
      );
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleCloseViewOnceModal = () => {
    setViewOnceModalOpen(false);
    setViewOnceContent(null);
  };

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
      const { messages: olderMessages, pagination } =
        await messagesApi.getMessages(conversationId, nextPage, 50);

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
    if ((!messageText.trim() && selectedFiles.length === 0) || isSending)
      return;

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
        .map((f) => ({
          url: f.preview as string,
          type: f.file.type.startsWith("video/") ? "video" : "audio",
        })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isViewOnce: isViewOnce,
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
      const uploadedAttachments: Array<{
        url: string;
        type: "image" | "video" | "audio";
        name?: string;
        size?: number;
      }> = [];

      if (savedFiles.length > 0) {
        setIsUploading(true);
        for (const item of savedFiles) {
          const result = await uploadApi.uploadMedia(item.file, "messages");
          if (result.type === "image") {
            uploadedMediaUrls.push(result.url);
          } else {
            uploadedAttachments.push({
              url: result.url,
              type: (result.type ||
                (item.file.type.startsWith("video/") ? "video" : "audio")) as
                | "video"
                | "audio",
              name: item.file.name,
              size: item.file.size,
            });
          }
        }
        setIsUploading(false);
      }

      const { data: newMessage } = await messagesApi.sendMessage(
        conversationId,
        {
          content: savedMessageText.trim() || undefined,
          media: uploadedMediaUrls.length > 0 ? uploadedMediaUrls : undefined,
          attachments:
            uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
          isViewOnce: isViewOnce,
        }
      );

      if (isViewOnce) setIsViewOnce(false);

      // Replace temp message with real one
      setMessages((prev) =>
        dedupeMessages(prev.map((m) => (m._id === tempId ? newMessage : m)))
      );

      // Add to chat context for real-time sync
      addMessages(conversationId, [
        {
          id: newMessage._id,
          sender: {
            _id: newMessage.senderId._id,
            firstName: newMessage.senderId.firstName,
            lastName: newMessage.senderId.lastName,
            username: newMessage.senderId.username,
            avatar: newMessage.senderId.avatar,
          },
          content: newMessage.content,
          media: newMessage.media,
          attachments: newMessage.attachments,
          location: newMessage.location,
          reactions: newMessage.reactions,
          createdAt: newMessage.createdAt,
        },
      ]);

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
    const next = files
      .slice(0, Math.max(0, 6 - selectedFiles.length))
      .map((file) => {
        const needsPreview =
          file.type.startsWith("image/") || file.type.startsWith("video/");
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
      const newText =
        messageText.slice(0, start) + emojiData.emoji + messageText.slice(end);
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
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-3 md:p-4 border-b border-(--border) flex items-center gap-2 md:gap-3 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="md:hidden shrink-0 h-8 w-8"
        >
          <ArrowLeft size={18} />
        </Button>

        <Link
          href={`/user/${otherParticipant.username}`}
          className="flex items-center gap-2 md:gap-3 flex-1 min-w-0"
        >
          <Avatar
            src={otherParticipant.avatar}
            alt={otherParticipant.firstName}
            size="md"
            className="shrink-0 h-9 w-9 md:h-10 md:w-10"
          />
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold truncate text-sm md:text-base">
              {otherParticipant.firstName} {otherParticipant.lastName}
            </h2>
            <p className="text-xs md:text-sm text-(--text-muted) truncate">
              {conversation?.disappearingMessagesDuration ? (
                <span className="flex items-center gap-1 text-primary-500">
                  <Clock size={10} className="md:hidden" />
                  <Clock size={12} className="hidden md:inline" />
                  <span className="text-xs">
                    {getDurationLabel(
                      conversation.disappearingMessagesDuration
                    )}
                  </span>
                </span>
              ) : (
                `@${otherParticipant.username}`
              )}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="text-(--text-muted) hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors h-8 w-8 md:h-10 md:w-10"
            onClick={() => handleStartCall(false)}
            title={t("messages", "startingAudioCall")}
            aria-label={t("messages", "startingAudioCall")}
          >
            <Phone size={18} className="md:hidden" />
            <Phone size={20} className="hidden md:block" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-(--text-muted) hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors h-8 w-8 md:h-10 md:w-10"
            onClick={() => handleStartCall(true)}
            title={t("messages", "startingVideoCall")}
            aria-label={t("messages", "startingVideoCall")}
          >
            <Video size={18} className="md:hidden" />
            <Video size={20} className="hidden md:block" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-(--text-muted) h-8 w-8 md:h-10 md:w-10"
              >
                <MoreVertical size={18} className="md:hidden" />
                <MoreVertical size={20} className="hidden md:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setShowDisappearingMessagesModal(true)}
              >
                <Clock className="mr-2 h-4 w-4" />
                {t("common", "disappearingMessages")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowReportModal(true)}
                className="text-red-500"
              >
                <Flag className="mr-2 h-4 w-4" />
                {t("reportModal", "reportUser")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowBlockModal(true)}
                className={isBlocked ? "text-primary-500" : "text-red-500"}
              >
                <Ban className="mr-2 h-4 w-4" />
                {isBlocked
                  ? t("blockModal", "confirmUnblock")
                  : t("blockModal", "confirmBlock")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog
        open={showDisappearingMessagesModal}
        onOpenChange={setShowDisappearingMessagesModal}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common", "disappearingMessages")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Button
                variant={
                  conversation?.disappearingMessagesDuration === null
                    ? "primary"
                    : "outline"
                }
                className="justify-start"
                onClick={() => handleUpdateDisappearingMessages(null)}
              >
                {t("common", "off")}
              </Button>
              <Button
                variant={
                  conversation?.disappearingMessagesDuration ===
                  24 * 60 * 60 * 1000
                    ? "primary"
                    : "outline"
                }
                className="justify-start"
                onClick={() =>
                  handleUpdateDisappearingMessages(24 * 60 * 60 * 1000)
                }
              >
                {t("common", "hours24")}
              </Button>
              <Button
                variant={
                  conversation?.disappearingMessagesDuration ===
                  3 * 24 * 60 * 60 * 1000
                    ? "primary"
                    : "outline"
                }
                className="justify-start"
                onClick={() =>
                  handleUpdateDisappearingMessages(3 * 24 * 60 * 60 * 1000)
                }
              >
                {t("common", "days3")}
              </Button>
              <Button
                variant={
                  conversation?.disappearingMessagesDuration ===
                  7 * 24 * 60 * 60 * 1000
                    ? "primary"
                    : "outline"
                }
                className="justify-start"
                onClick={() =>
                  handleUpdateDisappearingMessages(7 * 24 * 60 * 60 * 1000)
                }
              >
                {t("common", "days7")}
              </Button>

              <div className="pt-4 border-t border-(--border)">
                <Label className="mb-2 block">{t("common", "custom")}</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={customDuration}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCustomDuration(e.target.value)
                    }
                    placeholder={t("common", "durationPlaceholder")}
                    min="1"
                  />
                  <select
                    className="h-10 px-3 py-2 rounded-md border border-input bg-background"
                    value={customUnit}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setCustomUnit(e.target.value as "hours" | "days")
                    }
                  >
                    <option value="hours">{t("common", "hours")}</option>
                    <option value="days">{t("common", "days")}</option>
                  </select>
                  <Button
                    onClick={() => {
                      const val = parseInt(customDuration);
                      if (val > 0) {
                        const ms =
                          val *
                          (customUnit === "hours"
                            ? 60 * 60 * 1000
                            : 24 * 60 * 60 * 1000);
                        handleUpdateDisappearingMessages(ms);
                      }
                    }}
                  >
                    {t("common", "setTimer")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-4 space-y-3 md:space-y-4"
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
          const showDateSeparator = shouldShowDateSeparator(
            message,
            prevMessage
          );

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
                    "max-w-[85%] sm:max-w-[80%] md:max-w-[75%] rounded-2xl px-3 py-2 md:px-4 relative group",
                    isOwnMessage
                      ? "bg-primary-500 text-white rounded-br-md"
                      : "bg-primary-100 dark:bg-primary-900/40 text-(--text) rounded-bl-md"
                  )}
                >
                  {/* View Once Logic */}
                  {message.isViewOnce &&
                  !message.content &&
                  (!message.media || message.media.length === 0) &&
                  (!message.attachments || message.attachments.length === 0) &&
                  !message.location ? (
                    <div className="flex items-center gap-3 p-2 min-w-[200px]">
                      <div className="bg-white/20 p-2 rounded-full">
                        <EyeOff
                          size={24}
                          className={
                            isOwnMessage ? "text-white" : "text-primary-600"
                          }
                        />
                      </div>
                      <div className="flex flex-col">
                        <span
                          className={cn(
                            "font-medium text-sm",
                            isOwnMessage
                              ? "text-white"
                              : "text-gray-900 dark:text-gray-100"
                          )}
                        >
                          {t("common", "viewOnceMessage") ||
                            "View Once Message"}
                        </span>
                        {isOwnMessage ? (
                          <span className={cn("text-xs", "text-white/70")}>
                            {t("common", "sent") || "Sent"}
                          </span>
                        ) : message.isExpired ? (
                          <span className="text-xs text-gray-500 italic">
                            {t("common", "opened") || "Opened"}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleViewOnceMessage(message._id)}
                            className={cn(
                              "text-xs underline text-left",
                              "text-primary-600 dark:text-primary-400"
                            )}
                          >
                            {t("common", "tapToView") || "Tap to view"}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
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
                              className="rounded-lg max-w-full h-auto"
                            />
                          ))}
                        </div>
                      )}

                      {/* Attachments */}
                      {message.attachments &&
                        message.attachments.length > 0 && (
                          <div className="mb-2 space-y-2">
                            {message.attachments.map((att, i) => (
                              <div key={`${att.url}-${i}`}>
                                {att.type === "video" ? (
                                  <video
                                    src={att.url}
                                    controls
                                    className="max-w-full rounded-lg"
                                  />
                                ) : att.type === "audio" ? (
                                  <audio
                                    src={att.url}
                                    controls
                                    className="w-full"
                                  />
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
                            isOwnMessage
                              ? "border-white/30"
                              : "border-(--border)"
                          )}
                        >
                          <div className="h-36 w-full bg-(--bg)">
                            {leafletMounted ? (
                              <MapContainer
                                center={[
                                  message.location.lat,
                                  message.location.lng,
                                ]}
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
                                  position={[
                                    message.location.lat,
                                    message.location.lng,
                                  ]}
                                  icon={leafletMarkerIcon}
                                />
                              </MapContainer>
                            ) : (
                              <div className="h-full w-full" />
                            )}
                          </div>
                          <div className="p-2">
                            <p
                              className={cn(
                                "text-sm",
                                isOwnMessage ? "text-white" : "text-(--text)"
                              )}
                            >
                              {message.location.label || "Location"}
                            </p>
                            <p
                              className={cn(
                                "text-xs",
                                isOwnMessage
                                  ? "text-white/80"
                                  : "text-(--text-muted)"
                              )}
                            >
                              {message.location.lat.toFixed(6)},{" "}
                              {message.location.lng.toFixed(6)}
                            </p>
                            <a
                              href={`https://www.google.com/maps?q=${message.location.lat},${message.location.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className={cn(
                                "text-xs underline",
                                isOwnMessage
                                  ? "text-white/80"
                                  : "text-primary-600"
                              )}
                            >
                              Open in Maps
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Content */}
                      {/* Content */}
                      {editingMessageId === message._id ? (
                        <div className="flex flex-col gap-2 min-w-[200px]">
                          <Input
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className={cn(
                              "h-8 text-sm",
                              isOwnMessage
                                ? "bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                : "bg-white border-gray-200 text-black"
                            )}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSaveEdit(message._id);
                              }
                              if (e.key === "Escape") handleCancelEdit();
                            }}
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 text-xs px-2"
                              onClick={handleCancelEdit}
                            >
                              {t("common", "cancel")}
                            </Button>
                            <Button
                              size="sm"
                              variant={isOwnMessage ? "secondary" : "primary"}
                              className="h-6 text-xs px-2"
                              onClick={() => handleSaveEdit(message._id)}
                            >
                              {t("common", "save")}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        message.content && (
                          <p className="whitespace-pre-wrap break-words text-sm md:text-base">
                            {message.content}
                            {message.editedAt && (
                              <span className="text-[10px] opacity-70 ml-1 italic whitespace-nowrap">
                                (edited)
                              </span>
                            )}
                          </p>
                        )
                      )}
                    </>
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
                          onClick={() =>
                            handleToggleReaction(message._id, emoji)
                          }
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
                      isOwnMessage
                        ? "bg-primary-600 text-white"
                        : "bg-(--bg-card) border border-(--border)"
                    )}
                    aria-label="React"
                  >
                    <Smile size={14} />
                  </button>

                  {/* Action Menu */}
                  {isOwnMessage &&
                    !message.deletedAt &&
                    editingMessageId !== message._id && (
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/20 rounded-full"
                            >
                              <MoreHorizontal size={14} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {/* Check 1 hour limit */}
                            {Date.now() -
                              new Date(message.createdAt).getTime() <
                              60 * 60 * 1000 && (
                              <DropdownMenuItem
                                onClick={() => handleEditClick(message)}
                              >
                                <Edit2 size={14} className="mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDeleteMessage(message._id)}
                              className="text-red-500 hover:text-red-600 focus:text-red-600"
                            >
                              <Trash2 size={14} className="mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}

                  {/* Time */}
                  <p
                    className={cn(
                      "text-xs mt-1",
                      isOwnMessage ? "text-white/70" : "text-(--text-muted)"
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
      <div className="p-3 md:p-4 border-t border-(--border) shrink-0">
        {/* Image Previews */}
        {selectedFiles.length > 0 && (
          <div className="flex gap-2 mb-2 md:mb-3 flex-wrap overflow-x-auto">
            {selectedFiles.map((item, index) => (
              <div key={index} className="relative group shrink-0">
                {item.preview && item.file.type.startsWith("image/") ? (
                  <Image
                    src={item.preview}
                    alt={`Selected ${index + 1}`}
                    width={64}
                    height={64}
                    className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg"
                  />
                ) : item.preview && item.file.type.startsWith("video/") ? (
                  <video
                    src={item.preview}
                    className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg border border-(--border) bg-(--bg-card) flex items-center justify-center">
                    <span className="text-[10px] md:text-xs text-(--text-muted) text-center px-1">
                      {item.file.type.startsWith("audio/") ? "AUDIO" : "FILE"}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => removeSelectedFile(index)}
                  className="absolute -top-1 -right-1 md:-top-2 md:-right-2 p-1 rounded-full bg-red-500 text-white opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-md"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5 md:gap-2 relative">
          {/* Mobile Options Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden shrink-0 text-(--text-muted) h-9 w-9"
            onClick={() => setShowMobileOptions(!showMobileOptions)}
          >
            {showMobileOptions ? <X size={20} /> : <Plus size={20} />}
          </Button>

          {/* Mobile Options Modal/Menu */}
          {showMobileOptions && (
            <>
              <div
                className="fixed inset-0 z-10 bg-black/20 md:hidden"
                onClick={() => setShowMobileOptions(false)}
              />
              <div className="absolute bottom-14 left-0 bg-(--bg-card) border border-(--border) rounded-2xl shadow-2xl md:hidden z-20 overflow-hidden animate-in slide-in-from-bottom-4 fade-in-20 duration-200">
                <div className="p-2 border-b border-(--border) bg-primary-50/50 dark:bg-primary-900/20">
                  <p className="text-xs font-medium text-(--text-muted) px-2">
                    Attach Content
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-1 p-2">
                  {/* Image Upload */}
                  <button
                    className={cn(
                      "flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl transition-colors",
                      selectedFiles.length > 0
                        ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30"
                        : "text-(--text-muted) hover:bg-primary-50/50 dark:hover:bg-primary-900/20",
                      selectedFiles.length >= 6 &&
                        "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => {
                      if (selectedFiles.length < 6) {
                        fileInputRef.current?.click();
                        setShowMobileOptions(false);
                      }
                    }}
                    disabled={selectedFiles.length >= 6}
                  >
                    <ImageIcon size={22} />
                    <span className="text-[10px] font-medium">Photo</span>
                  </button>

                  {/* Record audio */}
                  <button
                    className={cn(
                      "flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl transition-colors",
                      isRecordingAudio
                        ? "text-red-600 bg-red-50 dark:bg-red-900/30"
                        : "text-(--text-muted) hover:bg-primary-50/50 dark:hover:bg-primary-900/20"
                    )}
                    onClick={() => {
                      if (isRecordingAudio) stopAnyRecording();
                      else startRecording("audio");
                      setShowMobileOptions(false);
                    }}
                  >
                    {isRecordingAudio ? (
                      <StopCircle size={22} />
                    ) : (
                      <Mic size={22} />
                    )}
                    <span className="text-[10px] font-medium">
                      {isRecordingAudio ? "Stop" : "Audio"}
                    </span>
                  </button>

                  {/* Record video */}
                  <button
                    className={cn(
                      "flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl transition-colors",
                      isRecordingVideo
                        ? "text-red-600 bg-red-50 dark:bg-red-900/30"
                        : "text-(--text-muted) hover:bg-primary-50/50 dark:hover:bg-primary-900/20"
                    )}
                    onClick={() => {
                      if (isRecordingVideo) stopAnyRecording();
                      else startRecording("video");
                      setShowMobileOptions(false);
                    }}
                  >
                    {isRecordingVideo ? (
                      <StopCircle size={22} />
                    ) : (
                      <Camera size={22} />
                    )}
                    <span className="text-[10px] font-medium">
                      {isRecordingVideo ? "Stop" : "Video"}
                    </span>
                  </button>

                  {/* Location */}
                  <button
                    className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl text-(--text-muted) hover:bg-primary-50/50 dark:hover:bg-primary-900/20 transition-colors"
                    onClick={() => {
                      setShowLocationPicker(true);
                      setShowMobileOptions(false);
                    }}
                  >
                    <MapPin size={22} />
                    <span className="text-[10px] font-medium">Location</span>
                  </button>

                  {/* Emoji */}
                  <button
                    className={cn(
                      "flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl transition-colors",
                      showEmojiPicker
                        ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30"
                        : "text-(--text-muted) hover:bg-primary-50/50 dark:hover:bg-primary-900/20"
                    )}
                    onClick={() => {
                      setShowEmojiPicker(!showEmojiPicker);
                      setShowMobileOptions(false);
                    }}
                  >
                    <Smile size={22} />
                    <span className="text-[10px] font-medium">Emoji</span>
                  </button>

                  {/* View Once */}
                  <button
                    className={cn(
                      "flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl transition-colors",
                      isViewOnce
                        ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30"
                        : "text-(--text-muted) hover:bg-primary-50/50 dark:hover:bg-primary-900/20"
                    )}
                    onClick={() => {
                      setIsViewOnce(!isViewOnce);
                      setShowMobileOptions(false);
                    }}
                  >
                    {isViewOnce ? <Eye size={22} /> : <EyeOff size={22} />}
                    <span className="text-[10px] font-medium">View Once</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Image Upload Button (Desktop) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,audio/*"
            multiple
            onChange={handleFilesSelect}
            className="hidden"
          />
          <div className="hidden md:flex items-center gap-2">
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

            {/* Record audio (Desktop) */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "shrink-0",
                isRecordingAudio ? "text-red-600" : "text-(--text-muted)"
              )}
              onClick={() =>
                isRecordingAudio ? stopAnyRecording() : startRecording("audio")
              }
            >
              {isRecordingAudio ? <StopCircle size={20} /> : <Mic size={20} />}
            </Button>

            {/* Record video (Desktop) */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "shrink-0",
                isRecordingVideo ? "text-red-600" : "text-(--text-muted)"
              )}
              onClick={() =>
                isRecordingVideo ? stopAnyRecording() : startRecording("video")
              }
            >
              {isRecordingVideo ? (
                <StopCircle size={20} />
              ) : (
                <Camera size={20} />
              )}
            </Button>

            {/* Location (Desktop) */}
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-(--text-muted)"
              onClick={() => setShowLocationPicker(true)}
            >
              <MapPin size={20} />
            </Button>

            {/* Emoji Picker Button (Desktop) */}
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

            {/* View Once Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "shrink-0",
                isViewOnce
                  ? "text-primary-600 dark:text-primary-400"
                  : "text-(--text-muted)"
              )}
              onClick={() => setIsViewOnce(!isViewOnce)}
              title="View Once"
            >
              {isViewOnce ? <Eye size={20} /> : <EyeOff size={20} />}
            </Button>
          </div>

          {showEmojiPicker && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowEmojiPicker(false)}
              />
              <div className="absolute left-0 md:left-auto bottom-full mb-2 z-20">
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  height={350}
                  width={Math.min(320, window.innerWidth - 32)}
                  searchPlaceHolder="Search emoji..."
                  lazyLoadEmojis={true}
                />
              </div>
            </>
          )}

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
              "flex-1 min-w-0 px-3 md:px-4 py-2 rounded-full text-sm",
              "bg-primary-50/80 dark:bg-primary-950/40",
              "border border-(--border)",
              "focus:border-primary-400 dark:focus:border-primary-500",
              "placeholder:text-(--text-muted)",
              "outline-none transition-all duration-200"
            )}
          />

          <Button
            onClick={handleSendMessage}
            disabled={
              (!messageText.trim() && selectedFiles.length === 0) ||
              isSending ||
              isUploading
            }
            size="icon"
            className="shrink-0 h-9 w-9 md:h-10 md:w-10"
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
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowReactionPicker(false)}
          />
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
            isBlocked={isBlocked}
            onSuccess={(blocked) => {
              setIsBlocked(blocked);
              if (blocked) onBack();
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

      <ViewOnceModal
        isOpen={viewOnceModalOpen}
        onClose={handleCloseViewOnceModal}
        content={viewOnceContent?.content}
        media={viewOnceContent?.media}
        attachments={viewOnceContent?.attachments}
        location={viewOnceContent?.location}
      />

      {/* Conversation Event Modal (Video/Audio Call) */}
      {activeEvent && (
        <Modal
          isOpen={showEventModal}
          onClose={handleLeaveCall}
          title={
            activeEvent.type === "video_call"
              ? t("messages", "videoCall") || "Video Call"
              : t("messages", "audioCall") || "Audio Call"
          }
          size="full"
        >
          <div className="flex flex-col h-[calc(100vh-8rem)]">
            {isJoiningCall ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-(--text-muted)">
                    {t("common", "loading")}...
                  </p>
                </div>
              </div>
            ) : hasJoinedCall && call && streamClient ? (
              <div className="flex-1 relative bg-black opacity-80">
                <StreamCall call={call}>
                  <SpeakerLayout />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                    <CallControls onLeave={handleLeaveCall} />
                  </div>
                </StreamCall>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-(--text-muted) mb-4">
                    {t("common", "errorLoading")}
                  </p>
                  <Button onClick={handleLeaveCall}>
                    {t("common", "close")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
