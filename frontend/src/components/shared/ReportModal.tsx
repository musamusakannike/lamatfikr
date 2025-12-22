"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { reportApi } from "@/lib/api/reports";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/lib/api";

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetType: "user" | "post" | "room";
    targetId: string;
}

export function ReportModal({ isOpen, onClose, targetType, targetId }: ReportModalProps) {
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) return;

        try {
            setIsSubmitting(true);
            await reportApi.createReport({ targetType, targetId, reason });
            toast.success("Report submitted successfully");
            onClose();
            setReason("");
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Report">
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Reason for report</label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full p-2 rounded-md border border-(--border) bg-(--bg) text-(--text) min-h-[100px]"
                        placeholder="Please provide details about your report..."
                        required
                        maxLength={1000}
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="danger" disabled={isSubmitting}>
                        {isSubmitting ? "Submitting..." : "Submit Report"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
