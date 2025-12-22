"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { socialApi } from "@/lib/api/social";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/lib/api";

interface BlockUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    username: string;
    isBlocked: boolean;
    onSuccess?: (isBlocked: boolean) => void;
}

export function BlockUserModal({ isOpen, onClose, userId, username, isBlocked, onSuccess }: BlockUserModalProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleAction = async () => {
        try {
            setIsLoading(true);
            if (isBlocked) {
                await socialApi.unblockUser(userId);
                toast.success(`Unblocked @${username}`);
                onSuccess?.(false);
            } else {
                await socialApi.blockUser(userId);
                toast.success(`Blocked @${username}`);
                onSuccess?.(true);
            }
            onClose();
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    const title = isBlocked ? `Unblock @${username}?` : `Block @${username}?`;
    const message = isBlocked
        ? "Are you sure you want to unblock this user? They will be able to see your profile and message you again."
        : "Are you sure you want to block this user? They will no longer be able to message you or see your profile.";
    const buttonText = isLoading
        ? (isBlocked ? "Unblocking..." : "Blocking...")
        : (isBlocked ? "Unblock User" : "Block User");
    const variant = isBlocked ? "primary" : "danger";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="p-4 space-y-4">
                <p>{message}</p>
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button variant={variant} onClick={handleAction} disabled={isLoading}>
                        {buttonText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
