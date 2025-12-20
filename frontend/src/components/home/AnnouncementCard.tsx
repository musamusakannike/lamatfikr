"use client";

import { Avatar } from "@/components/ui";
import { Megaphone, AlertCircle, Info } from "lucide-react";
import { type Announcement } from "@/lib/api/announcements";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface AnnouncementCardProps {
    announcement: Announcement;
}

export function AnnouncementCard({ announcement }: AnnouncementCardProps) {
    const getPriorityConfig = (priority: string) => {
        switch (priority) {
            case "high":
                return {
                    icon: AlertCircle,
                    bgColor: "bg-red-50 dark:bg-red-900/20",
                    borderColor: "border-red-200 dark:border-red-800",
                    iconColor: "text-red-600 dark:text-red-400",
                    badgeColor: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
                };
            case "medium":
                return {
                    icon: Megaphone,
                    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
                    borderColor: "border-yellow-200 dark:border-yellow-800",
                    iconColor: "text-yellow-600 dark:text-yellow-400",
                    badgeColor: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
                };
            case "low":
                return {
                    icon: Info,
                    bgColor: "bg-blue-50 dark:bg-blue-900/20",
                    borderColor: "border-blue-200 dark:border-blue-800",
                    iconColor: "text-blue-600 dark:text-blue-400",
                    badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
                };
            default:
                return {
                    icon: Megaphone,
                    bgColor: "bg-gray-50 dark:bg-gray-900/20",
                    borderColor: "border-gray-200 dark:border-gray-800",
                    iconColor: "text-gray-600 dark:text-gray-400",
                    badgeColor: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
                };
        }
    };

    const config = getPriorityConfig(announcement.priority);
    const Icon = config.icon;

    return (
        <div
            className={cn(
                "rounded-xl border p-6 shadow-sm",
                config.bgColor,
                config.borderColor
            )}
        >
            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", config.badgeColor)}>
                    <Icon className={cn("w-6 h-6", config.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-(--text)">{announcement.title}</h3>
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium uppercase", config.badgeColor)}>
                            {announcement.priority}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-(--text-muted)">
                        <Avatar
                            src={announcement.createdBy.avatar}
                            alt={`${announcement.createdBy.firstName} ${announcement.createdBy.lastName}`}
                            className="w-5 h-5"
                        />
                        <span>
                            {announcement.createdBy.firstName} {announcement.createdBy.lastName}
                        </span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-(--text) whitespace-pre-wrap">{announcement.content}</p>
            </div>

            {/* Admin Badge */}
            <div className="mt-4 pt-4 border-t border-(--border)">
                <div className="flex items-center gap-2 text-xs text-(--text-muted)">
                    <Megaphone className="w-4 h-4" />
                    <span>Official Announcement from Admin Team</span>
                </div>
            </div>
        </div>
    );
}
