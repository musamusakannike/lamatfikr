"use client";

import { useEffect, useState } from "react";
import { apiClient, getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface Announcement {
    _id: string;
    title: string;
    content: string;
    priority: "low" | "medium" | "high";
    isActive: boolean;
    createdBy: {
        _id: string;
        firstName: string;
        lastName: string;
        username: string;
    };
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
}

interface AnnouncementsResponse {
    announcements: Announcement[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export default function AnnouncementsPage() {
    const { t, isRTL } = useLanguage();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        priority: "medium" as "low" | "medium" | "high",
        isActive: true,
    });
    const [submitting, setSubmitting] = useState(false);

    const limit = 20;

    useEffect(() => {
        loadAnnouncements();
    }, [page]);

    const loadAnnouncements = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.get<AnnouncementsResponse>(
                `/announcements/admin/all?page=${page}&limit=${limit}&includeDeleted=true`
            );
            setAnnouncements(res.announcements);
            setTotalPages(res.pagination.pages);
        } catch (e) {
            setError(getErrorMessage(e));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            if (editingId) {
                await apiClient.patch(`/announcements/${editingId}`, formData);
            } else {
                await apiClient.post("/announcements", formData);
            }
            setShowForm(false);
            setEditingId(null);
            setFormData({ title: "", content: "", priority: "medium", isActive: true });
            loadAnnouncements();
        } catch (e) {
            setError(getErrorMessage(e));
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (announcement: Announcement) => {
        setEditingId(announcement._id);
        setFormData({
            title: announcement.title,
            content: announcement.content,
            priority: announcement.priority,
            isActive: announcement.isActive,
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t("adminAnnouncements", "confirmDelete"))) return;

        try {
            await apiClient.delete(`/announcements/${id}`);
            loadAnnouncements();
        } catch (e) {
            setError(getErrorMessage(e));
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({ title: "", content: "", priority: "medium", isActive: true });
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "high":
                return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
            case "medium":
                return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
            case "low":
                return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
            default:
                return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
        }
    };

    return (
        <div className={cn("space-y-4", isRTL ? "text-right" : "text-left")}>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-(--text)">{t("adminAnnouncements", "title")}</h1>
                    <div className="text-sm text-(--text-muted) mt-1">
                        {t("adminAnnouncements", "subtitle")}
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                >
                    {showForm ? t("adminAnnouncements", "btnCancel") : t("adminAnnouncements", "createNew")}
                </button>
            </div>

            {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
                    {error}
                </div>
            )}

            {showForm && (
                <form
                    onSubmit={handleSubmit}
                    className="bg-(--bg-card) border border-(--border) rounded-xl p-6 space-y-4"
                >
                    <h2 className="text-lg font-bold text-(--text)">
                        {editingId ? t("adminAnnouncements", "editModalTitle") : t("adminAnnouncements", "createModalTitle")}
                    </h2>

                    <div>
                        <label className="block text-sm font-medium text-(--text) mb-2">
                            {t("adminAnnouncements", "formTitle")}
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                            maxLength={200}
                            className="w-full px-3 py-2 border border-(--border) rounded-lg bg-(--bg) text-(--text) focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder={t("adminAnnouncements", "formTitle")}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-(--text) mb-2">
                            {t("adminAnnouncements", "formMessage")}
                        </label>
                        <textarea
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            required
                            maxLength={5000}
                            rows={6}
                            className="w-full px-3 py-2 border border-(--border) rounded-lg bg-(--bg) text-(--text) focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                            placeholder={t("adminAnnouncements", "formMessage")}
                        />
                        <div className="text-xs text-(--text-muted) mt-1 text-right ltr:text-left">
                            {formData.content.length}/5000
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-(--text) mb-2">
                                {t("adminAnnouncements", "formPriority")}
                            </label>
                            <select
                                value={formData.priority}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        priority: e.target.value as "low" | "medium" | "high",
                                    })
                                }
                                className="w-full px-3 py-2 border border-(--border) rounded-lg bg-(--bg) text-(--text) focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="low">{t("adminAnnouncements", "priorityLow")}</option>
                                <option value="medium">{t("adminAnnouncements", "priorityMedium")}</option>
                                <option value="high">{t("adminAnnouncements", "priorityHigh")}</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-(--text) mb-2">
                                {t("adminAnnouncements", "formStatus")}
                            </label>
                            <select
                                value={formData.isActive ? "active" : "inactive"}
                                onChange={(e) =>
                                    setFormData({ ...formData, isActive: e.target.value === "active" })
                                }
                                className="w-full px-3 py-2 border border-(--border) rounded-lg bg-(--bg) text-(--text) focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="active">{t("adminAnnouncements", "statusActive")}</option>
                                <option value="inactive">{t("adminAnnouncements", "statusInactive")}</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-4 py-2 border border-(--border) rounded-lg text-(--text) hover:bg-(--bg) transition-colors"
                        >
                            {t("adminAnnouncements", "btnCancel")}
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {submitting ? t("adminAnnouncements", "btnSaving") : editingId ? t("adminAnnouncements", "btnUpdate") : t("adminAnnouncements", "btnCreate")}
                        </button>
                    </div>
                </form>
            )}

            <div className="bg-(--bg-card) border border-(--border) rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-(--text-muted)">
                        {t("adminAnnouncements", "loading")}
                    </div>
                ) : announcements.length === 0 ? (
                    <div className="p-8 text-center text-(--text-muted)">
                        {t("adminAnnouncements", "noData")}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-(--bg)">
                                <tr className="text-(--text-muted)">
                                    <th className={cn("px-4 py-3", isRTL ? "text-right" : "text-left")}>{t("adminAnnouncements", "colTitle")}</th>
                                    <th className={cn("px-4 py-3", isRTL ? "text-right" : "text-left")}>{t("adminAnnouncements", "colContent")}</th>
                                    <th className="px-4 py-3 text-center">{t("adminAnnouncements", "colPriority")}</th>
                                    <th className="px-4 py-3 text-center">{t("adminAnnouncements", "colStatus")}</th>
                                    <th className="px-4 py-3 text-center">{t("adminAnnouncements", "colDate")}</th>
                                    <th className="px-4 py-3 text-center">{t("adminAnnouncements", "colActions")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {announcements.map((announcement) => (
                                    <tr
                                        key={announcement._id}
                                        className={cn(
                                            "border-t border-(--border)",
                                            announcement.deletedAt && "opacity-50"
                                        )}
                                    >
                                        <td className="px-4 py-3 font-medium text-(--text)">
                                            {announcement.title}
                                        </td>
                                        <td className="px-4 py-3 text-(--text-muted) max-w-md">
                                            <div className="truncate">{announcement.content}</div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span
                                                className={cn(
                                                    "px-2 py-1 rounded-full text-xs font-medium",
                                                    getPriorityColor(announcement.priority)
                                                )}
                                            >
                                                {t("adminAnnouncements", `priority${announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}`)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span
                                                className={cn(
                                                    "px-2 py-1 rounded-full text-xs font-medium",
                                                    announcement.deletedAt
                                                        ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                                        : announcement.isActive
                                                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                                                )}
                                            >
                                                {announcement.deletedAt
                                                    ? t("adminAnnouncements", "statusDeleted")
                                                    : announcement.isActive
                                                        ? t("adminAnnouncements", "statusActive")
                                                        : t("adminAnnouncements", "statusInactive")}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center text-(--text-muted)">
                                            {new Date(announcement.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {!announcement.deletedAt && (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(announcement)}
                                                        className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg transition-colors"
                                                    >
                                                        {t("adminAnnouncements", "btnEdit")}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(announcement._id)}
                                                        className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg transition-colors"
                                                    >
                                                        {t("adminAnnouncements", "btnDelete")}
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-(--text-muted)">
                        {t("adminAnnouncements", "page")} {page} {t("adminAnnouncements", "of")} {totalPages}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className={cn(
                                "px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                                page === 1
                                    ? "border-(--border) text-(--text-muted) cursor-not-allowed opacity-50"
                                    : "border-(--border) text-(--text) hover:bg-(--bg) hover:border-primary-500"
                            )}
                        >
                            {t("adminAnnouncements", "paginationPrev")}
                        </button>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className={cn(
                                "px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                                page === totalPages
                                    ? "border-(--border) text-(--text-muted) cursor-not-allowed opacity-50"
                                    : "border-(--border) text-(--text) hover:bg-(--bg) hover:border-primary-500"
                            )}
                        >
                            {t("adminAnnouncements", "paginationNext")}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
