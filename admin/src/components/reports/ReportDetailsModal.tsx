"use client";

import { useState } from "react";
import { X, Mail, Flag, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiClient, getErrorMessage } from "@/lib/api";
import type { AdminReport } from "@/types/admin-reports";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

interface ReportDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    report: AdminReport | null;
    onReplySuccess: () => void;
}

export default function ReportDetailsModal({ isOpen, onClose, report, onReplySuccess }: ReportDetailsModalProps) {
    const { t, isRTL } = useLanguage();
    const [replyMessage, setReplyMessage] = useState("");
    const [isSending, setIsSending] = useState(false);

    if (!isOpen || !report) return null;

    const handleReply = async () => {
        if (!replyMessage.trim()) return;

        setIsSending(true);
        try {
            await apiClient.post(`/reports/${report._id}/reply`, {
                message: replyMessage,
            });
            toast.success(t("adminReports", "replySentSuccess"));
            setReplyMessage("");
            onReplySuccess();
            onClose();
        } catch (error) {
            toast.error(getErrorMessage(error) || t("adminReports", "replySentError"));
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className={cn(
                "relative z-10 w-full max-w-lg overflow-hidden rounded-xl bg-(--bg-card) shadow-xl border border-(--border) animate-in fade-in zoom-in-95 duration-200",
                isRTL ? "text-right" : "text-left"
            )}>
                <div className="absolute right-4 top-4 rtl:right-auto rtl:left-4">
                    <button
                        type="button"
                        className="rounded-md bg-(--bg-card) text-(--text-muted) hover:text-(--text) focus:outline-none"
                        onClick={onClose}
                    >
                        <span className="sr-only">Close</span>
                        <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-red-100 text-red-600 rounded-full dark:bg-red-900/20">
                            <Flag size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold leading-6 text-(--text)">
                                {t("adminReports", "reportDetailsTitle")}
                            </h3>
                            <p className="text-sm text-(--text-muted)">ID: {report._id}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Reporter Info */}
                        <div className="bg-(--bg-muted) p-4 rounded-lg">
                            <h4 className="text-xs font-semibold uppercase text-(--text-muted) mb-2">{t("adminReports", "reporter")}</h4>
                            <div className="flex items-center gap-2">
                                <div className="font-medium text-(--text)">{report.reporterId.firstName} {report.reporterId.lastName}</div>
                                <div className="text-sm text-(--text-muted)">(@{report.reporterId.username})</div>
                            </div>
                        </div>

                        {/* Report Reason */}
                        <div>
                            <h4 className="text-xs font-semibold uppercase text-(--text-muted) mb-2">{t("adminReports", "reason")}</h4>
                            <div className="p-3 border border-(--border) rounded-lg bg-(--bg) text-sm text-(--text)">
                                {report.reason}
                            </div>
                        </div>

                        {/* Target Info */}
                        <div>
                            <h4 className="text-xs font-semibold uppercase text-(--text-muted) mb-2">{t("adminReports", "target")}</h4>
                            <div className="flex items-center gap-2 text-sm text-(--text)">
                                <span className="px-2 py-0.5 rounded-md bg-(--bg-muted) border border-(--border) uppercase text-xs font-medium">
                                    {report.targetType}
                                </span>
                                <span>ID: {report.targetId}</span>
                            </div>
                        </div>

                        <div className="border-t border-(--border) my-4"></div>

                        {/* Reply Form */}
                        <div>
                            <h4 className="text-sm font-medium text-(--text) mb-2 flex items-center gap-2">
                                <Mail size={16} />
                                {t("adminReports", "replyViaEmail")}
                            </h4>
                            <textarea
                                rows={4}
                                className="w-full px-3 py-2 rounded-lg border border-(--border) bg-(--bg) text-(--text) text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                                placeholder={t("adminReports", "replyPlaceholder")}
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                            />
                            <div className="mt-4 flex justify-end gap-2">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 border border-(--border) hover:bg-(--bg-muted) text-(--text) text-sm font-medium rounded-lg transition-colors"
                                >
                                    {t("common", "cancel")}
                                </button>
                                <button
                                    onClick={handleReply}
                                    disabled={isSending || !replyMessage.trim()}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isSending && <Loader2 size={16} className="animate-spin" />}
                                    {isSending ? t("adminReports", "sending") : t("adminReports", "sendReply")}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
