"use client";

import { useState, useEffect } from "react";
import { Modal, Button, Card } from "@/components/ui";
import { featuredRoomsApi, FeaturedRoomStatusResponse } from "@/lib/api/featured-rooms";
import { getErrorMessage } from "@/lib/api";
import {
  Sparkles,
  Loader2,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface FeatureRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomName: string;
}

export function FeatureRoomModal({
  isOpen,
  onClose,
  roomId,
  roomName,
}: FeatureRoomModalProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [status, setStatus] = useState<FeaturedRoomStatusResponse | null>(null);
  const [error, setError] = useState("");
  const [days, setDays] = useState(7);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadStatus();
    }
  }, [isOpen, roomId]);

  const loadStatus = async () => {
    try {
      setStatusLoading(true);
      setError("");
      const response = await featuredRoomsApi.getRoomFeaturedStatus(roomId);
      setStatus(response);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setStatusLoading(false);
    }
  };

  const handleFeatureRoom = async () => {
    try {
      setProcessing(true);
      setError("");

      const response = await featuredRoomsApi.initiateFeaturedPayment(roomId, {
        days,
        currency: "USD",
      });

      window.location.href = response.redirectUrl;
    } catch (err) {
      setError(getErrorMessage(err));
      setProcessing(false);
    }
  };

  const handleCancelFeatured = async () => {
    if (!status?.activeFeatured) return;

    try {
      setLoading(true);
      setError("");
      await featuredRoomsApi.cancelFeaturedRoom(roomId, status.activeFeatured.id);
      await loadStatus();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const totalCost = status ? days * status.pricePerDay : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Feature Your Room" size="lg">
      <div className="p-6">
        {statusLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-primary-600" />
          </div>
        ) : (
          <>
            {status?.isFeatured && status.activeFeatured ? (
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle size={24} className="text-green-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                        Room is Currently Featured
                      </h3>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Your room is being displayed in the featured section
                      </p>
                    </div>
                  </div>
                </div>

                <Card className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-(--text-muted)">Started</span>
                      <span className="text-sm font-medium">
                        {new Date(status.activeFeatured.startDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-(--text-muted)">Expires</span>
                      <span className="text-sm font-medium">
                        {new Date(status.activeFeatured.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-(--text-muted)">Duration</span>
                      <span className="text-sm font-medium">{status.activeFeatured.days} days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-(--text-muted)">Amount Paid</span>
                      <span className="text-sm font-medium">
                        {status.activeFeatured.currency} {status.activeFeatured.amount}
                      </span>
                    </div>
                  </div>
                </Card>

                <Button
                  variant="outline"
                  className="w-full text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={handleCancelFeatured}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <XCircle size={16} className="mr-2" />
                      Cancel Featured Listing
                    </>
                  )}
                </Button>

                {status.history.length > 1 && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-sm mb-3">Previous Featured Periods</h4>
                    <div className="space-y-2">
                      {status.history.slice(1, 4).map((item) => (
                        <Card key={item._id} className="p-3">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-(--text-muted)" />
                              <span className="text-(--text-muted)">
                                {new Date(item.startDate).toLocaleDateString()} -{" "}
                                {new Date(item.endDate).toLocaleDateString()}
                              </span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                item.status === "expired"
                                  ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                                  : "bg-red-100 dark:bg-red-900/30 text-red-600"
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-linear-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Sparkles size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Feature Your Room</h3>
                      <p className="text-sm text-(--text-muted) mb-4">
                        Get more visibility by featuring your room at the top of the room list. Featured
                        rooms get up to 10x more views and engagement!
                      </p>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <TrendingUp size={20} className="text-yellow-600 mx-auto mb-1" />
                          <p className="text-xs text-(--text-muted)">More Visibility</p>
                        </div>
                        <div className="text-center">
                          <Sparkles size={20} className="text-yellow-600 mx-auto mb-1" />
                          <p className="text-xs text-(--text-muted)">Premium Placement</p>
                        </div>
                        <div className="text-center">
                          <TrendingUp size={20} className="text-yellow-600 mx-auto mb-1" />
                          <p className="text-xs text-(--text-muted)">More Members</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">
                    How many days would you like to feature your room?
                  </label>
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {[3, 7, 14, 30].map((d) => (
                      <button
                        key={d}
                        onClick={() => setDays(d)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          days === d
                            ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                            : "border-(--border) hover:border-primary-300"
                        }`}
                      >
                        <div className="text-lg font-bold">{d}</div>
                        <div className="text-xs text-(--text-muted)">days</div>
                      </button>
                    ))}
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm text-(--text-muted) mb-2">Or enter custom days (1-365)</label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={days}
                      onChange={(e) => setDays(Math.min(365, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-full px-4 py-2 rounded-lg border border-(--border) bg-(--bg) focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <Card className="p-4 bg-gradient-to-br from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 border-primary-200 dark:border-primary-800">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-(--text-muted)">Price per day</span>
                      <span className="text-sm font-medium">
                        ${status?.pricePerDay || 10}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-(--text-muted)">Duration</span>
                      <span className="text-sm font-medium">{days} days</span>
                    </div>
                    <div className="h-px bg-(--border)" />
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Total Cost</span>
                      <span className="text-2xl font-bold text-primary-600">
                        ${totalCost}
                      </span>
                    </div>
                  </div>
                </Card>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={onClose} disabled={processing}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={handleFeatureRoom}
                    disabled={processing || days < 1 || days > 365}
                  >
                    {processing ? (
                      <>
                        <Loader2 size={16} className="animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <DollarSign size={16} className="mr-2" />
                        Pay ${totalCost} & Feature Room
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-xs text-(--text-muted) text-center">
                  You will be redirected to a secure payment page to complete your transaction
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
