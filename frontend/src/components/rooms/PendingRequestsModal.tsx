"use client";

import { useState, useEffect, useCallback } from "react";
import { Modal, Button } from "@/components/ui";
import { roomsApi } from "@/lib/api/rooms";
import { getErrorMessage } from "@/lib/api";
import {
  Loader2,
  Check,
  X,
  User,
  Clock,
  ExternalLink,
  UserCircle,
  Crown,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface PendingRequest {
  id: string;
  user: {
    _id: string;
    username: string;
    displayName?: string;
    avatar?: string;
  };
  requestedAt: string;
}

interface PendingRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomName: string;
  isPaidRoom?: boolean;
  onRequestHandled?: () => void;
}

export function PendingRequestsModal({
  isOpen,
  onClose,
  roomId,
  roomName,
  isPaidRoom = false,
  onRequestHandled,
}: PendingRequestsModalProps) {
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await roomsApi.getPendingRequests(roomId);
      setRequests(response.requests);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    if (isOpen) {
      loadRequests();
    }
  }, [isOpen, loadRequests]);

  const handleRequest = async (memberId: string, action: "approve" | "reject") => {
    try {
      setProcessingId(memberId);
      await roomsApi.handleMembershipRequest(roomId, memberId, action);
      setRequests((prev) => prev.filter((r) => r.id !== memberId));
      onRequestHandled?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pending Requests" size="md">
      <div className="p-4">
        {/* Header Info */}
        <div className="mb-4 p-3 bg-(--bg) rounded-lg">
          <p className="text-sm text-(--text-muted)">
            Manage membership requests for <span className="font-semibold text-(--text)">{roomName}</span>
          </p>
          {isPaidRoom && (
            <div className="flex items-center gap-2 mt-2 text-xs text-yellow-600 dark:text-yellow-400">
              <Crown size={14} />
              <span>This is a paid room. Approved users will need to complete payment to join.</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-primary-500" />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-(--text-muted)">
            <UserCircle size={48} className="mb-3 opacity-50" />
            <p className="text-sm">No pending requests</p>
            <p className="text-xs mt-1">New requests will appear here</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {requests.map((request) => (
              <div
                key={request.id}
                className="flex items-center gap-3 p-3 bg-(--bg) rounded-lg border border-(--border)"
              >
                {/* User Avatar */}
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-(--bg-secondary) shrink-0">
                  {request.user.avatar ? (
                    <Image
                      src={request.user.avatar}
                      alt={request.user.username}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User size={24} className="text-(--text-muted)" />
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-(--text) truncate">
                      {request.user.displayName || request.user.username}
                    </p>
                    <Link
                      href={`/profile/${request.user.username}`}
                      target="_blank"
                      className="text-primary-500 hover:text-primary-600 transition-colors"
                      title="View profile"
                    >
                      <ExternalLink size={14} />
                    </Link>
                  </div>
                  <p className="text-sm text-(--text-muted) truncate">
                    @{request.user.username}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-(--text-muted) mt-1">
                    <Clock size={12} />
                    <span>Requested {formatDate(request.requestedAt)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleRequest(request.id, "approve")}
                    disabled={processingId === request.id}
                    className="gap-1"
                  >
                    {processingId === request.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Check size={14} />
                    )}
                    Approve
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleRequest(request.id, "reject")}
                    disabled={processingId === request.id}
                    className="gap-1 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 dark:border-red-800 dark:hover:border-red-700"
                  >
                    <X size={14} />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-(--border)">
          <Button variant="secondary" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
