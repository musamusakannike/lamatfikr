"use client";

import { useEffect, useState } from "react";
import { apiClient, getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

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
        if (!confirm("Are you sure you want to delete this announcement?")) return;

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
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-(--text)">Announcements</h1>
                    <div className="text-sm text-(--text-muted) mt-1">
                        Manage platform announcements for users
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                >
                    {showForm ? "Cancel" : "Create Announcement"}
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
                        {editingId ? "Edit Announcement" : "Create New Announcement"}
                    </h2>

                    <div>
                        <label className="block text-sm font-medium text-(--text) mb-2">
                            Title
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                            maxLength={200}
                            className="w-full px-3 py-2 border border-(--border) rounded-lg bg-(--bg) text-(--text) focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Enter announcement title"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-(--text) mb-2">
                            Content
                        </label>
                        <textarea
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            required
                            maxLength={5000}
                            rows={6}
                            className="w-full px-3 py-2 border border-(--border) rounded-lg bg-(--bg) text-(--text) focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                            placeholder="Enter announcement content"
                        />
                        <div className="text-xs text-(--text-muted) mt-1">
                            {formData.content.length}/5000 characters
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-(--text) mb-2">
                                Priority
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
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-(--text) mb-2">
                                Status
                            </label>
                            <select
                                value={formData.isActive ? "active" : "inactive"}
                                onChange={(e) =>
                                    setFormData({ ...formData, isActive: e.target.value === "active" })
                                }
                                className="w-full px-3 py-2 border border-(--border) rounded-lg bg-(--bg) text-(--text) focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-4 py-2 border border-(--border) rounded-lg text-(--text) hover:bg-(--bg) transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {submitting ? "Saving..." : editingId ? "Update" : "Create"}
                        </button>
                    </div>
                </form>
            )}

            <div className="bg-(--bg-card) border border-(--border) rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-(--text-muted)">
                        Loading announcements...
                    </div>
                ) : announcements.length === 0 ? (
                    <div className="p-8 text-center text-(--text-muted)">
                        No announcements found. Create your first announcement!
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-(--bg)">
                                <tr className="text-(--text-muted)">
                                    <th className="px-4 py-3 text-left">Title</th>
                                    <th className="px-4 py-3 text-left">Content</th>
                                    <th className="px-4 py-3 text-center">Priority</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-center">Created</th>
                                    <th className="px-4 py-3 text-center">Actions</th>
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
                                                {announcement.priority}
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
                                                    ? "Deleted"
                                                    : announcement.isActive
                                                        ? "Active"
                                                        : "Inactive"}
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
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(announcement._id)}
                                                        className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg transition-colors"
                                                    >
                                                        Delete
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
                        Page {page} of {totalPages}
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
                            Previous
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
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
