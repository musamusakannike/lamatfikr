"use client";

import { useState, useEffect, useCallback } from "react";
import { Modal, Button, Card } from "@/components/ui";
import { roomsApi, InviteLink } from "@/lib/api/rooms";
import { getErrorMessage } from "@/lib/api";
import {
  Copy,
  Check,
  Trash2,
  Plus,
  Loader2,
  Link as LinkIcon,
  Clock,
  Users,
  Share2,
} from "lucide-react";

interface InviteLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  isPrivate: boolean;
}

export function InviteLinkModal({
  isOpen,
  onClose,
  roomId,
  isPrivate,
}: InviteLinkModalProps) {
  const [inviteLinks, setInviteLinks] = useState<InviteLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expiresIn, setExpiresIn] = useState<number | null>(null);
  const [maxUses, setMaxUses] = useState<number | null>(null);

  const loadInviteLinks = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await roomsApi.getInviteLinks(roomId);
      setInviteLinks(response.inviteLinks);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    if (isOpen && isPrivate) {
      loadInviteLinks();
    }
  }, [isOpen, isPrivate, loadInviteLinks]);

  const handleGenerateLink = async () => {
    try {
      setGenerating(true);
      setError("");
      const response = await roomsApi.generateInviteLink(roomId, {
        expiresIn: expiresIn || undefined,
        maxUses: maxUses || undefined,
      });
      setInviteLinks([response.inviteLink, ...inviteLinks]);
      setShowForm(false);
      setExpiresIn(null);
      setMaxUses(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyLink = (shareUrl: string, linkId: string) => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(linkId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRevokeLink = async (linkId: string) => {
    if (!confirm("Are you sure you want to revoke this invite link?")) return;

    try {
      setError("");
      await roomsApi.revokeInviteLink(roomId, linkId);
      setInviteLinks(inviteLinks.filter((link) => link.id !== linkId));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const formatExpiration = (expiresAt: string | null | undefined) => {
    if (!expiresAt) return "Never";
    const date = new Date(expiresAt);
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    if (diff < 0) return "Expired";

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  if (!isPrivate) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Share Room" size="md">
        <div className="p-6 text-center">
          <p className="text-(--text-muted)">
            Invite links are only available for private rooms.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Private Room" size="lg">
      <div className="p-6 space-y-6">
        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Generate New Link Section */}
        {!showForm ? (
          <Button
            onClick={() => setShowForm(true)}
            variant="primary"
            className="w-full"
          >
            <Plus size={18} />
            Generate New Invite Link
          </Button>
        ) : (
          <Card className="p-4 space-y-4 bg-(--bg-secondary)">
            <h3 className="font-semibold text-(--text)">Create Invite Link</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-(--text) mb-2">
                  Expiration Time (optional)
                </label>
                <select
                  value={expiresIn || ""}
                  onChange={(e) =>
                    setExpiresIn(e.target.value ? Number(e.target.value) : null)
                  }
                  className="w-full px-3 py-2 rounded-lg border border-(--border) bg-(--bg) text-(--text) focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Never expires</option>
                  <option value={3600}>1 hour</option>
                  <option value={86400}>1 day</option>
                  <option value={604800}>1 week</option>
                  <option value={2592000}>30 days</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-(--text) mb-2">
                  Max Uses (optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={maxUses || ""}
                  onChange={(e) =>
                    setMaxUses(e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder="Unlimited"
                  className="w-full px-3 py-2 rounded-lg border border-(--border) bg-(--bg) text-(--text) placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleGenerateLink}
                disabled={generating}
                variant="primary"
                className="flex-1"
              >
                {generating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <LinkIcon size={18} />
                    Generate
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  setShowForm(false);
                  setExpiresIn(null);
                  setMaxUses(null);
                }}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Invite Links List */}
        <div>
          <h3 className="font-semibold text-(--text) mb-3">Active Links</h3>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-(--text-muted)" />
            </div>
          ) : inviteLinks.length === 0 ? (
            <p className="text-(--text-muted) text-sm text-center py-6">
              No invite links yet. Create one to share with others.
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {inviteLinks.map((link) => (
                <Card
                  key={link.id}
                  className="p-4 space-y-3 bg-(--bg-secondary) border border-(--border)"
                >
                  {/* Link Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LinkIcon size={16} className="text-primary-500" />
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          link.isActive
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {link.isActive ? "Active" : "Revoked"}
                      </span>
                    </div>
                    <span className="text-xs text-(--text-muted)">
                      {new Date(link.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Share URL */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={link.shareUrl}
                      readOnly
                      className="flex-1 px-3 py-2 rounded-lg border border-(--border) bg-(--bg) text-(--text) text-sm font-mono"
                    />
                    <button
                      onClick={() => handleCopyLink(link.shareUrl, link.id)}
                      className="p-2 rounded-lg hover:bg-(--bg-secondary) transition-colors"
                      title="Copy link"
                    >
                      {copiedId === link.id ? (
                        <Check size={18} className="text-green-500" />
                      ) : (
                        <Copy size={18} className="text-(--text-muted)" />
                      )}
                    </button>
                  </div>

                  {/* Link Stats */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    {link.maxUses && (
                      <div className="flex items-center gap-1 text-(--text-muted)">
                        <Users size={14} />
                        <span>
                          {link.usedCount} / {link.maxUses} uses
                        </span>
                      </div>
                    )}
                    {link.expiresAt && (
                      <div className="flex items-center gap-1 text-(--text-muted)">
                        <Clock size={14} />
                        <span>Expires in {formatExpiration(link.expiresAt)}</span>
                      </div>
                    )}
                  </div>

                  {/* Revoke Button */}
                  {link.isActive && (
                    <button
                      onClick={() => handleRevokeLink(link.id)}
                      className="w-full px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} />
                      Revoke Link
                    </button>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Share Instructions */}
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex gap-3">
            <Share2 size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-200">
              <p className="font-semibold mb-1">How to share:</p>
              <p>
                Copy the invite link and share it with people you want to invite. They can join
                directly without needing approval.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </Modal>
  );
}
