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
    onBlockSuccess?: () => void;
}

export function BlockUserModal({ isOpen, onClose, userId, username, onBlockSuccess }: BlockUserModalProps) {
    const [isBlocking, setIsBlocking] = useState(false);

    const handleBlock = async () => {
        try {
            setIsBlocking(true);
            await socialApi.blockUser(userId);
            toast.success(`Blocked @${username}`);
            onBlockSuccess?.();
            onClose();
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setIsBlocking(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Block @${username}?`}>
            <div className="p-4 space-y-4">
                <p>Are you sure you want to block this user? They will no longer be able to message you or see your profile.</p>
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button variant="danger" onClick={handleBlock} disabled={isBlocking}>
                        {isBlocking ? "Blocking..." : "Block User"}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
