"use client";

import { useEffect, useState } from "react";
import {
    Search,
    LayoutList,
    Mail,
    MoreVertical,
    Calendar,
    Flag,
    ChevronLeft,
    ChevronRight,
    Filter,
    CheckCircle,
    Clock,
    Archive
} from "lucide-react";
import { apiClient, getErrorMessage } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type { AdminReportsListResponse, AdminReport } from "@/types/admin-reports";
import ReportDetailsModal from "./ReportDetailsModal";
import { Loader2 } from "lucide-react";

export default function ReportsTable() {
    const { t, isRTL } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AdminReportsListResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    const fetchReports = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.get<AdminReportsListResponse>(`/reports?page=${page}`);
            setData(res);
        } catch (e) {
            setError(getErrorMessage(e));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [page]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "open": return <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium dark:bg-blue-900/20 dark:text-blue-300 flex items-center gap-1"><Flag size={10} /> Open</span>;
            case "resolved": return <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium dark:bg-green-900/20 dark:text-green-300 flex items-center gap-1"><CheckCircle size={10} /> Resolved</span>;
            case "rejected": return <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium dark:bg-gray-800 dark:text-gray-300 flex items-center gap-1"><Archive size={10} /> Rejected</span>;
            default: return status;
        }
    };

    return (
        <div className={cn("space-y-6", isRTL ? "text-right" : "text-left")}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-(--bg-card) p-4 rounded-xl border border-(--border) shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-(--text) flex items-center gap-2">
                        {t("adminReports", "title")}
                        <span className="text-sm font-normal text-(--text-muted) bg-(--bg) px-2 py-0.5 rounded-full border border-(--border)">
                            {data?.pagination.total || 0}
                        </span>
                    </h1>
                </div>
            </div>

            {loading && !data && (
                <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-primary-500" /></div>
            )}

            {!loading && !error && data && (
                <div className="rounded-xl border border-(--border) bg-(--bg-card) overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-(--bg-muted) border-b border-(--border)">
                                <tr className="text-(--text-muted) uppercase text-xs font-semibold">
                                    <th className={cn("px-5 py-4", isRTL ? "text-right" : "text-left")}>{t("adminReports", "reporter")}</th>
                                    <th className={cn("px-5 py-4", isRTL ? "text-right" : "text-left")}>{t("adminReports", "target")}</th>
                                    <th className={cn("px-5 py-4", isRTL ? "text-right" : "text-left")}>{t("adminReports", "reason")}</th>
                                    <th className={cn("px-5 py-4", isRTL ? "text-right" : "text-left")}>{t("adminReports", "status")}</th>
                                    <th className={cn("px-5 py-4", isRTL ? "text-right" : "text-left")}>{t("adminReports", "created")}</th>
                                    <th className="px-5 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-(--border)">
                                {data.reports.map(report => (
                                    <tr key={report._id} className="hover:bg-(--bg-muted)/50 group">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                                                    {report.reporterId.avatar && <img src={report.reporterId.avatar} className="w-full h-full object-cover" />}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-(--text)">{report.reporterId.firstName} {report.reporterId.lastName}</div>
                                                    <div className="text-xs text-(--text-muted)">@{report.reporterId.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="text-xs font-mono bg-(--bg-muted) px-2 py-1 rounded inline-block">
                                                {report.targetType}: {report.targetId.substring(0, 8)}...
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 max-w-xs truncate text-(--text-muted)">
                                            {report.reason}
                                        </td>
                                        <td className="px-5 py-4">
                                            {getStatusBadge(report.status)}
                                        </td>
                                        <td className="px-5 py-4 text-xs text-(--text-muted)">
                                            {new Date(report.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <button
                                                onClick={() => { setSelectedReport(report); setDetailsOpen(true); }}
                                                className="p-2 hover:bg-(--bg-muted) rounded-lg transition-colors"
                                            >
                                                <LayoutList size={18} className="text-(--text-muted)" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <ReportDetailsModal
                isOpen={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                report={selectedReport}
                onReplySuccess={() => fetchReports()}
            />
        </div>
    );
}
